"""
remote_shell.py — Remote execution listener for the active vision scanner.
Connects to the WAREOps Gateway via Socket.IO and listens for commands.
"""

import os
import time
import uuid
import subprocess
import logging

try:
    import socketio
except ImportError:
    print("python-socketio[client] required. Install with: pip install \"python-socketio[client]\"")
    exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("remote_shell")

API_URL = os.environ.get("WAREOPS_API_URL", "http://localhost:8080")
# The Socket.IO endpoint is usually on the API gateway path or the ws port
# WAREOps API Gateway routes /socket.io/ to digital-twin-sync
WAREHOUSE_ID = os.environ.get("WAREOPS_WAREHOUSE_ID", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")

sio = socketio.Client(logger=False, engineio_logger=False)

@sio.event(namespace="/digital-twin")
def connect():
    logger.info(f"Connected to {API_URL}. Joining warehouse {WAREHOUSE_ID}...")
    sio.emit("join_warehouse", {"warehouse_id": WAREHOUSE_ID}, namespace="/digital-twin")

@sio.event(namespace="/digital-twin")
def disconnect():
    logger.info("Disconnected from server.")

@sio.event(namespace="/digital-twin")
def execute_command(data):
    """
    Handle remote command execution request.
    Expected data: {"command": "ls -l", "id": "cmd-uuid", "warehouse_id": "..."}

    NOTE: Commands starting with __SSH_CONNECT__ are handled by ssh_proxy.py,
    not here. This shell handles plain OS commands only.
    """
    command = data.get("command")
    cmd_id = data.get("id")
    
    if not command:
        return

    # SSH connect commands are handled by ssh_proxy.py — skip here
    if command.startswith("__SSH_CONNECT__") or command.startswith("__SSH_DISCONNECT__"):
        return

    logger.info(f"Executing command: {command}")
    
    try:
        # User requested shell code execution
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=60
        )
        output = result.stdout
        error = result.stderr
        status = result.returncode
    except subprocess.TimeoutExpired:
        output = ""
        error = "Command timed out after 60 seconds."
        status = -1
    except Exception as e:
        output = ""
        error = str(e)
        status = -1

    # Send result back
    sio.emit("command_output", {
        "warehouse_id": WAREHOUSE_ID,
        "id": cmd_id,
        "output": output,
        "error": error,
        "status": status
    }, namespace="/digital-twin")

def main():
    logger.info(f"Starting remote shell listener connecting to {API_URL}")
    while True:
        try:
            if not sio.connected:
                sio.connect(API_URL, namespaces=["/digital-twin"], socketio_path="/socket.io")
            time.sleep(1)
        except Exception as e:
            logger.warning(f"Connection failed: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()
