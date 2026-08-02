#!/usr/bin/env python3
"""
ssh_proxy.py — WAREOps SSH relay proxy for Raspberry Pi remote control.

Runs on the Pi laptop alongside remote_shell.py. Connects to the WAREOps
cloud gateway via Socket.IO and listens for execute_command events that start
with the __SSH_CONNECT__ magic prefix. When one arrives it opens a real SSH
session using paramiko and relays all stdin/stdout/stderr bidirectionally
through Socket.IO command_output events, so the admin browser terminal shows
live SSH session output.

Regular commands (no __SSH_CONNECT__ prefix) that arrive while an SSH session
is active are forwarded into that session's channel as keystrokes.

Usage:
    python3 -m active_vision_scanner.ssh_proxy
    # or
    python3 ssh_proxy.py

Required environment variables:
    WAREOPS_API_URL          Cloud gateway URL
    WAREOPS_API_TOKEN        Bearer token (optional, for authenticated WS)
    WAREOPS_WAREHOUSE_ID     Warehouse UUID for Socket.IO room

Optional environment variables:
    SSH_PROXY_MAX_SESSIONS   Max simultaneous SSH sessions (default: 5)
    SSH_PROXY_IDLE_TIMEOUT   Seconds before idle session is closed (default: 300)
"""

from __future__ import annotations

import os
import re
import sys
import threading
import time
import logging
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ssh_proxy")

# ── Dependency checks ──────────────────────────────────────────────────────────
try:
    import socketio
except ImportError:
    logger.error("python-socketio[client] not installed. Run: pip3 install 'python-socketio[client]'")
    sys.exit(1)

try:
    import paramiko
except ImportError:
    logger.error("paramiko not installed. Run: pip3 install paramiko")
    sys.exit(1)

# ── Configuration ──────────────────────────────────────────────────────────────
API_URL      = os.environ.get("WAREOPS_API_URL", "").rstrip("/")
API_TOKEN    = os.environ.get("WAREOPS_API_TOKEN", "")
WAREHOUSE_ID = os.environ.get("WAREOPS_WAREHOUSE_ID", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
MAX_SESSIONS = int(os.environ.get("SSH_PROXY_MAX_SESSIONS", "5"))
IDLE_TIMEOUT = int(os.environ.get("SSH_PROXY_IDLE_TIMEOUT", "300"))

# Magic prefix that triggers SSH connect (must match AdminOverview.tsx)
_SSH_CONNECT_PREFIX = "__SSH_CONNECT__"


# ── SSH session manager ────────────────────────────────────────────────────────

class SSHSession:
    """
    Wraps a single paramiko SSH channel with its relay thread.
    All output from the SSH channel is forwarded to the Socket.IO client.
    """

    def __init__(self, session_id: str, emit_fn):
        self.session_id    = session_id
        self._emit         = emit_fn
        self._client: Optional[paramiko.SSHClient] = None
        self._channel: Optional[paramiko.Channel] = None
        self._relay_thread: Optional[threading.Thread] = None
        self._active       = False
        self._last_activity = time.time()

    def connect(self, host: str, username: str, password: str, port: int = 22) -> bool:
        """Open SSH connection and invoke a PTY shell."""
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(
                hostname=host,
                port=port,
                username=username,
                password=password if password else None,
                timeout=15,
                look_for_keys=True,
                allow_agent=True,
            )
            channel = client.invoke_shell(term="xterm-256color", width=120, height=40)
            channel.setblocking(False)

            self._client  = client
            self._channel = channel
            self._active  = True

            # Start relay thread
            self._relay_thread = threading.Thread(
                target=self._relay_output_loop,
                daemon=True,
                name=f"ssh-relay-{self.session_id[:8]}",
            )
            self._relay_thread.start()

            logger.info("SSH session opened: %s@%s (id=%s)", username, host, self.session_id[:8])
            return True

        except paramiko.AuthenticationException:
            self._emit_output(f"\r\n[ssh_proxy] Authentication failed for {username}@{host}\r\n", is_error=True)
            return False
        except paramiko.SSHException as exc:
            self._emit_output(f"\r\n[ssh_proxy] SSH error: {exc}\r\n", is_error=True)
            return False
        except Exception as exc:
            self._emit_output(f"\r\n[ssh_proxy] Connection failed: {exc}\r\n", is_error=True)
            return False

    def send(self, data: str) -> None:
        """Send keystrokes to the SSH channel."""
        if self._channel and self._active:
            try:
                self._channel.send(data + "\n")
                self._last_activity = time.time()
            except Exception as exc:
                logger.warning("SSH send failed: %s", exc)

    def close(self, reason: str = "closed") -> None:
        """Close the SSH session gracefully."""
        self._active = False
        if self._channel:
            try:
                self._channel.close()
            except Exception:
                pass
        if self._client:
            try:
                self._client.close()
            except Exception:
                pass
        self._emit_output(f"\r\n[ssh_proxy] Session {reason}.\r\n")
        logger.info("SSH session closed: %s (%s)", self.session_id[:8], reason)

    @property
    def is_idle_timeout(self) -> bool:
        return (time.time() - self._last_activity) > IDLE_TIMEOUT

    def _relay_output_loop(self) -> None:
        """Read bytes from SSH channel and forward via Socket.IO emit_fn."""
        while self._active:
            try:
                if self._channel and self._channel.recv_ready():
                    data = self._channel.recv(4096).decode("utf-8", errors="replace")
                    if data:
                        self._emit_output(data)
                        self._last_activity = time.time()

                if self._channel and self._channel.recv_stderr_ready():
                    data = self._channel.recv_stderr(4096).decode("utf-8", errors="replace")
                    if data:
                        self._emit_output(data, is_error=True)

                if self._channel and self._channel.closed:
                    self._active = False
                    self._emit_output("\r\n[ssh_proxy] Remote side closed the connection.\r\n")
                    break

                time.sleep(0.04)
            except Exception as exc:
                if self._active:
                    logger.warning("SSH relay error: %s", exc)
                break
        self._active = False

    def _emit_output(self, text: str, is_error: bool = False) -> None:
        try:
            self._emit({
                "warehouse_id": WAREHOUSE_ID,
                "id": self.session_id,
                "output": text if not is_error else "",
                "error": text if is_error else "",
                "status": 0,
            })
        except Exception as exc:
            logger.warning("emit_output failed: %s", exc)


# ── Session registry ───────────────────────────────────────────────────────────

class SessionRegistry:
    """Thread-safe registry of active SSH sessions."""

    def __init__(self):
        self._sessions: dict[str, SSHSession] = {}
        self._lock = threading.Lock()
        # Background idle-cleanup thread
        self._cleanup_thread = threading.Thread(
            target=self._cleanup_loop, daemon=True, name="ssh-cleanup"
        )
        self._cleanup_thread.start()

    def add(self, session: SSHSession) -> None:
        with self._lock:
            if len(self._sessions) >= MAX_SESSIONS:
                # Evict the oldest idle session
                oldest_id = next(iter(self._sessions))
                self._sessions[oldest_id].close("evicted (max sessions reached)")
                del self._sessions[oldest_id]
            self._sessions[session.session_id] = session

    def get(self, session_id: str) -> Optional[SSHSession]:
        with self._lock:
            return self._sessions.get(session_id)

    def remove(self, session_id: str) -> None:
        with self._lock:
            sess = self._sessions.pop(session_id, None)
            if sess:
                sess.close("removed")

    def _cleanup_loop(self) -> None:
        while True:
            time.sleep(30)
            with self._lock:
                timed_out = [sid for sid, s in self._sessions.items() if s.is_idle_timeout]
            for sid in timed_out:
                logger.info("Closing idle SSH session: %s", sid[:8])
                self.remove(sid)


_registry = SessionRegistry()


# ── Parse __SSH_CONNECT__ command ──────────────────────────────────────────────

def parse_ssh_connect(command: str) -> tuple[str, str, str, int]:
    """
    Parse __SSH_CONNECT__user@host[:port]:password into components.
    Returns (host, username, password, port).
    """
    rest = command[len(_SSH_CONNECT_PREFIX):]

    # Format: user@host[:port]:password  OR  user@host[:port]
    # We split on the last ':' for password if there are 3+ ':' separated fields
    # after removing the user@host part.
    # Regex: user@host[:port][:password]
    m = re.match(r"^([^@]+)@([^:]+)(?::(\d+))?(?::(.*))?$", rest)
    if not m:
        # Minimal fallback: treat everything as user@host
        parts = rest.split("@", 1)
        username = parts[0] if len(parts) > 1 else "pi"
        host     = parts[1] if len(parts) > 1 else rest
        return host.strip(), username.strip(), "", 22

    username = m.group(1).strip()
    host     = m.group(2).strip()
    port     = int(m.group(3)) if m.group(3) else 22
    password = (m.group(4) or "").strip()
    return host, username, password, port


# ── Socket.IO client ──────────────────────────────────────────────────────────

def make_socket_client() -> socketio.Client:
    headers = {}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"

    sio = socketio.Client(
        logger=False,
        engineio_logger=False,
        reconnection=True,
        reconnection_attempts=0,   # retry forever
        reconnection_delay=2,
        reconnection_delay_max=30,
        headers=headers,
    )

    @sio.event(namespace="/digital-twin")
    def connect():
        logger.info("ssh_proxy connected to %s", API_URL)
        sio.emit("join_warehouse", {"warehouse_id": WAREHOUSE_ID}, namespace="/digital-twin")

    @sio.event(namespace="/digital-twin")
    def disconnect():
        logger.warning("ssh_proxy disconnected — will reconnect automatically.")

    @sio.event(namespace="/digital-twin")
    def execute_command(data: dict):
        if not isinstance(data, dict):
            return

        command   = data.get("command", "")
        cmd_id    = data.get("id", "")
        wh_id     = data.get("warehouse_id", "")

        # Only handle commands addressed to our warehouse
        if wh_id and wh_id != WAREHOUSE_ID:
            return

        def _emit(payload: dict):
            try:
                sio.emit("command_output", payload, namespace="/digital-twin")
            except Exception as exc:
                logger.warning("emit failed: %s", exc)

        # ── Handle SSH connect request ─────────────────────────────────────
        if command.startswith(_SSH_CONNECT_PREFIX):
            host, username, password, port = parse_ssh_connect(command)
            logger.info("SSH connect request: %s@%s:%d (session=%s)", username, host, port, cmd_id[:8])

            session = SSHSession(session_id=cmd_id, emit_fn=_emit)
            _emit({
                "warehouse_id": WAREHOUSE_ID,
                "id": cmd_id,
                "output": f"\r\n[ssh_proxy] Connecting to {username}@{host}:{port}...\r\n",
                "error": "",
                "status": 0,
            })

            ok = session.connect(host, username, password, port)
            if ok:
                _registry.add(session)
                _emit({
                    "warehouse_id": WAREHOUSE_ID,
                    "id": cmd_id,
                    "output": f"[ssh_proxy] Connected. ({username}@{host})\r\n",
                    "error": "",
                    "status": 0,
                })
            else:
                _emit({
                    "warehouse_id": WAREHOUSE_ID,
                    "id": cmd_id,
                    "output": "",
                    "error": f"[ssh_proxy] Failed to connect to {username}@{host}:{port}\r\n",
                    "status": 1,
                })
            return

        # ── Handle close SSH session ─────────────────────────────────────────
        if command.strip() == "__SSH_DISCONNECT__":
            _registry.remove(cmd_id)
            return

        # ── Forward command to existing SSH session (if any) ─────────────────
        existing = _registry.get(cmd_id)
        if existing:
            existing.send(command)
            return

        # ── Not an SSH command — let remote_shell.py handle it ───────────────
        # (We don't process non-SSH commands here; remote_shell.py runs separately)
        logger.debug("ssh_proxy ignoring non-SSH command: %s", command[:60])

    return sio


# ── Main entry point ──────────────────────────────────────────────────────────

def main() -> None:
    if not API_URL:
        logger.error("WAREOPS_API_URL is not set. Cannot connect.")
        sys.exit(1)

    logger.info("WAREOps SSH Proxy starting...")
    logger.info("  API URL      : %s", API_URL)
    logger.info("  Warehouse ID : %s", WAREHOUSE_ID)
    logger.info("  Max sessions : %d", MAX_SESSIONS)
    logger.info("  Idle timeout : %ds", IDLE_TIMEOUT)

    sio = make_socket_client()

    while True:
        try:
            if not sio.connected:
                logger.info("Connecting to Socket.IO at %s ...", API_URL)
                sio.connect(
                    API_URL,
                    namespaces=["/digital-twin"],
                    socketio_path="/socket.io",
                    transports=["websocket", "polling"],
                )
            time.sleep(1)
        except Exception as exc:
            logger.warning("Connection failed: %s — retrying in 5s...", exc)
            time.sleep(5)


if __name__ == "__main__":
    main()
