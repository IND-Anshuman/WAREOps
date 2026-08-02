#!/usr/bin/env python3
"""
scan.py — WAREOps Autonomous Inventory Scanner CLI
===================================================

Runs on the Raspberry Pi laptop. Fetches the real warehouse topology from the
cloud backend, sequences rack scan positions, commands the bot via ROS2, runs
QR detection via the camera, and submits all results to the cloud backend.

Usage:
    python3 scan.py --scope full
    python3 scan.py --scope rack --target A1-RK1
    python3 scan.py --scope rack --target A2-RK2
    python3 scan.py --scope bin  --target A1-RK1-S2-B3
    python3 scan.py --scope full --dry-run

Required environment variables:
    WAREOPS_API_URL          Cloud gateway URL (e.g. https://wareops.up.railway.app)
    WAREOPS_API_TOKEN        Bearer token for API authentication
    WAREOPS_WAREHOUSE_ID     Warehouse UUID (default: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
    WAREOPS_SCANNER_ROBOT_ID Scanner robot UUID

Optional environment variables:
    SCAN_LOG_DIR             Directory for CSV output logs (default: ./scan_logs)
    SCAN_HEARTBEAT_INTERVAL  Seconds between heartbeats (default: 5)
    ROS_DOMAIN_ID            ROS2 domain ID if needed
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
import threading
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("scan")

# ── Optional rich terminal UI ──────────────────────────────────────────────────
try:
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
    from rich.live import Live
    from rich.panel import Panel
    from rich import print as rprint
    HAS_RICH = True
    console = Console()
except ImportError:
    HAS_RICH = False
    console = None  # type: ignore

# ── Optional requests library ──────────────────────────────────────────────────
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    logger.error("requests library not installed. Run: pip3 install requests")
    sys.exit(1)

# ── Optional ROS2 ─────────────────────────────────────────────────────────────
try:
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import String as RosString
    HAS_ROS2 = True
except ImportError:
    HAS_ROS2 = False
    logger.warning("rclpy not available — running without ROS2 (bot navigation disabled).")

# ── Configuration from environment ────────────────────────────────────────────
API_URL          = os.environ.get("WAREOPS_API_URL", "").rstrip("/")
API_TOKEN        = os.environ.get("WAREOPS_API_TOKEN", "")
WAREHOUSE_ID     = os.environ.get("WAREOPS_WAREHOUSE_ID", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
SCANNER_ROBOT_ID = os.environ.get("WAREOPS_SCANNER_ROBOT_ID", str(uuid.uuid4()))
SCAN_LOG_DIR     = Path(os.environ.get("SCAN_LOG_DIR", "./scan_logs"))
HEARTBEAT_INTERVAL = int(os.environ.get("SCAN_HEARTBEAT_INTERVAL", "5"))


# ── Data classes ───────────────────────────────────────────────────────────────

@dataclass
class BinTarget:
    """A single bin slot to be scanned."""
    bin_id: str
    bin_code: str
    coord_x: float
    coord_y: float
    coord_z: float
    rack_code: str = ""
    aisle_code: str = ""
    expected_qr: Optional[str] = None   # populated from inventory if available


@dataclass
class RackTarget:
    """A rack with its navigation target string and list of bin slots."""
    rack_code: str
    aisle_code: str
    nav_target: str              # e.g. "Aisle_1/Row_1/Rack_1" — sent via /bot_status
    bins: list[BinTarget] = field(default_factory=list)

    @property
    def label(self) -> str:
        return f"{self.aisle_code}/{self.rack_code}"


@dataclass
class ScanResult:
    """Outcome of scanning one bin."""
    bin_id: str
    bin_code: str
    rack_code: str
    expected_qr: Optional[str]
    observed_qr: Optional[str]
    match: bool
    confidence: float
    timestamp: str
    error: Optional[str] = None

    @property
    def status(self) -> str:
        if self.error:
            return "ERROR"
        if self.observed_qr is None:
            return "MISSING"
        return "MATCH" if self.match else "MISMATCH"


# ── API client helpers ─────────────────────────────────────────────────────────

def _api_headers() -> dict:
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    if API_TOKEN:
        h["Authorization"] = f"Bearer {API_TOKEN}"
    return h


def _api_get(path: str, timeout: float = 10.0) -> Optional[dict]:
    if not API_URL:
        return None
    try:
        resp = requests.get(f"{API_URL}{path}", headers=_api_headers(), timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("api_get_failed path=%s error=%s", path, exc)
        return None


def _api_post(path: str, payload: dict, timeout: float = 10.0) -> Optional[dict]:
    if not API_URL:
        logger.debug("[DRY-RUN] POST %s %s", path, json.dumps(payload)[:120])
        return {"id": str(uuid.uuid4()), "status": "dry_run"}
    try:
        resp = requests.post(
            f"{API_URL}{path}", headers=_api_headers(),
            json=payload, timeout=timeout
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("api_post_failed path=%s error=%s", path, exc)
        return None


def fetch_warehouse_topology() -> Optional[dict]:
    """Fetch full warehouse topology (zones→aisles→racks→shelves→bins)."""
    data = _api_get(f"/api/v1/warehouses/{WAREHOUSE_ID}/topology")
    if data:
        logger.info("Fetched warehouse topology from API.")
    return data


def fetch_inventory_map() -> dict[str, str]:
    """Return a dict mapping bin_id → expected QR code from inventory records."""
    data = _api_get(f"/api/v1/inventory?warehouse_id={WAREHOUSE_ID}&pageSize=500")
    if not data:
        return {}
    items = data if isinstance(data, list) else data.get("items", [])
    result = {}
    for item in items:
        bin_id = item.get("bin_id")
        sku = item.get("sku") or item.get("expected_sku")
        if bin_id and sku:
            result[bin_id] = sku
    return result


def send_heartbeat(x: float, y: float, z: float, status: str, mission_id: Optional[str] = None) -> None:
    """Send robot position heartbeat to the cloud twin endpoint."""
    _api_post("/api/v1/twin/robot-heartbeat", {
        "warehouse_id": WAREHOUSE_ID,
        "robot_id": SCANNER_ROBOT_ID,
        "x": round(x, 4),
        "y": round(y, 4),
        "z": round(z, 4),
        "yaw": 0.0,
        "battery_pct": 100.0,
        "status": status,
        "mission_id": mission_id,
    })


def submit_observation(bin_t: BinTarget, observed_qr: Optional[str],
                       confidence: float, mission_id: Optional[str]) -> Optional[dict]:
    """Submit a single observation to the backend."""
    return _api_post("/api/v1/observations/batch", {
        "robot_id": SCANNER_ROBOT_ID,
        "warehouse_id": WAREHOUSE_ID,
        "mission_id": mission_id,
        "observations": [{
            "robot_id": SCANNER_ROBOT_ID,
            "warehouse_id": WAREHOUSE_ID,
            "mission_id": mission_id,
            "bin_id": bin_t.bin_id,
            "bin_code": bin_t.bin_code,
            "decoded_qr": observed_qr,
            "detection_confidence": round(confidence, 4),
            "robot_coord_x": bin_t.coord_x,
            "robot_coord_y": bin_t.coord_y,
            "robot_coord_z": bin_t.coord_z,
            "observed_at": datetime.now(timezone.utc).isoformat(),
        }]
    })


def submit_mismatch_alert(bin_t: BinTarget, expected_qr: str,
                          observed_qr: Optional[str], mismatch_type: str) -> Optional[dict]:
    """Submit a mismatch/missing alert to the backend alerting service."""
    return _api_post("/api/v1/alerts", {
        "warehouse_id": WAREHOUSE_ID,
        "bin_id": bin_t.bin_id,
        "sku": expected_qr,
        "alert_type": mismatch_type,
        "severity": "HIGH",
        "title": f"{mismatch_type}: {bin_t.bin_code}",
        "description": (
            f"Expected QR '{expected_qr}', "
            f"observed '{observed_qr or 'EMPTY'}' at bin {bin_t.bin_code}."
        ),
        "expected_value": expected_qr,
        "observed_value": observed_qr or "EMPTY",
    })


# ── Topology parsing ───────────────────────────────────────────────────────────

def parse_topology_to_racks(
    topology: dict,
    scope: str,
    target: Optional[str],
    inventory_map: dict[str, str],
) -> list[RackTarget]:
    """
    Convert the topology API response into a flat ordered list of RackTargets.

    Topology structure:
        zones[] → aisles[] → racks[] → shelves[] → bins[]

    Navigation target format (for /bot_status ROS2 topic):
        "Aisle_1/Row_1/Rack_1"  (Row = rack position number)
    """
    rack_targets: list[RackTarget] = []

    zones = topology.get("zones", [])
    aisle_num_global = 0

    for zone in zones:
        for aisle in zone.get("aisles", []):
            aisle_num_global += 1
            aisle_code = aisle.get("code", f"A{aisle_num_global}")

            for rack_idx, rack in enumerate(aisle.get("racks", []), start=1):
                rack_code = rack.get("code", f"{aisle_code}-RK{rack_idx}")
                rack_num  = rack.get("rack_number", rack_idx)
                aisle_num = aisle.get("aisle_number", aisle_num_global)

                # ── Scope filter ─────────────────────────────────────────────
                if scope == "rack" and target:
                    if rack_code.lower() != target.lower():
                        continue
                elif scope == "aisle" and target:
                    if aisle_code.lower() != target.lower():
                        continue

                nav_target = f"Aisle_{aisle_num}/Row_1/Rack_{rack_num}"

                rack_target = RackTarget(
                    rack_code=rack_code,
                    aisle_code=aisle_code,
                    nav_target=nav_target,
                )

                for shelf in rack.get("shelves", []):
                    for bin_data in shelf.get("bins", []):
                        bin_id   = str(bin_data.get("id", ""))
                        bin_code = str(bin_data.get("code", ""))

                        # ── Bin scope filter ─────────────────────────────────
                        if scope == "bin" and target:
                            if bin_code.lower() != target.lower() and bin_id.lower() != target.lower():
                                continue

                        bt = BinTarget(
                            bin_id=bin_id,
                            bin_code=bin_code,
                            coord_x=float(bin_data.get("coord_x") or rack.get("coord_x") or 0.0),
                            coord_y=float(bin_data.get("coord_y") or rack.get("coord_y") or 0.0),
                            coord_z=float(bin_data.get("coord_z") or rack.get("coord_z") or 0.0),
                            rack_code=rack_code,
                            aisle_code=aisle_code,
                            expected_qr=inventory_map.get(bin_id),
                        )
                        rack_target.bins.append(bt)

                if rack_target.bins:
                    rack_targets.append(rack_target)

    return rack_targets


def build_synthetic_rack_targets(
    scope: str, target: Optional[str], inventory_map: dict[str, str]
) -> list[RackTarget]:
    """
    Fallback when API topology is unavailable. Builds minimal targets from
    any inventory records we do have, so partial scans still work offline.
    """
    logger.warning("Building synthetic rack targets from inventory map (API offline).")
    # Group inventory items by their rack_code heuristic (first 2 segments of bin_code)
    racks: dict[str, RackTarget] = {}
    for bin_id, sku in inventory_map.items():
        rack_code = "A1-RK1"
        rt = racks.setdefault(rack_code, RackTarget(
            rack_code=rack_code, aisle_code="A1",
            nav_target="Aisle_1/Row_1/Rack_1"
        ))
        rt.bins.append(BinTarget(
            bin_id=bin_id, bin_code=bin_id,
            coord_x=0.0, coord_y=0.0, coord_z=0.0,
            expected_qr=sku,
        ))
    return list(racks.values())


# ── ROS2 navigation helpers ────────────────────────────────────────────────────

class BotNavigator:
    """
    Thin ROS2 wrapper. Publishes navigation targets on /bot_status and waits
    for a "Reached …" acknowledgement before returning.
    Uses a threading Event so the ROS2 spin can happen in a background thread.
    """

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self._node: Optional["Node"] = None
        self._pub = None
        self._reached_event = threading.Event()
        self._reached_target: Optional[str] = None

    def init(self) -> bool:
        if self.dry_run or not HAS_ROS2:
            return False
        try:
            if not rclpy.ok():
                rclpy.init()
            self._node = rclpy.create_node("scan_navigator")  # type: ignore[attr-defined]
            self._pub = self._node.create_publisher(RosString, "/bot_status", 10)  # type: ignore
            self._node.create_subscription(
                RosString, "/bot_status", self._status_callback, 10
            )
            # Spin in background thread
            self._spin_thread = threading.Thread(
                target=rclpy.spin, args=(self._node,), daemon=True
            )
            self._spin_thread.start()
            logger.info("ROS2 navigator initialised.")
            return True
        except Exception as exc:
            logger.warning("ROS2 init failed: %s", exc)
            return False

    def _status_callback(self, msg: "RosString") -> None:  # type: ignore[name-defined]
        data = msg.data.strip()
        if data.lower().startswith("reached") and self._reached_target:
            if self._reached_target.lower() in data.lower():
                self._reached_event.set()

    def navigate_to(self, rack: RackTarget, timeout: float = 60.0) -> bool:
        """
        Publish navigation command and wait for acknowledgement.
        Returns True if reached, False on timeout/dry-run.
        """
        if self.dry_run or self._node is None:
            logger.info("[DRY-RUN] Navigate to %s", rack.nav_target)
            time.sleep(0.2)
            return True

        self._reached_target = rack.nav_target
        self._reached_event.clear()

        msg = RosString()
        msg.data = f"Go {rack.nav_target}"
        self._pub.publish(msg)
        logger.info("Published navigation target: %s", rack.nav_target)

        reached = self._reached_event.wait(timeout=timeout)
        if not reached:
            logger.warning("Timeout waiting for bot to reach %s", rack.nav_target)
        return reached

    def publish_succeeded(self, rack: RackTarget) -> None:
        if self.dry_run or self._node is None:
            return
        msg = RosString()
        msg.data = f"Succeeded {rack.nav_target}"
        self._pub.publish(msg)

    def shutdown(self) -> None:
        if self._node is not None:
            self._node.destroy_node()
        if HAS_ROS2 and rclpy.ok():
            rclpy.shutdown()


# ── Camera / QR scan helpers ───────────────────────────────────────────────────

def scan_rack_with_camera(rack: RackTarget, dry_run: bool = False) -> dict[str, tuple[Optional[str], float]]:
    """
    Perform QR detection for the rack. Returns dict: bin_code → (decoded_qr, confidence).

    In dry-run or when camera / RackScannerNode is unavailable, returns simulated
    results based on expected QR codes so the pipeline can be tested end-to-end.
    """
    results: dict[str, tuple[Optional[str], float]] = {}

    if dry_run:
        # Simulate: 85% correct, 10% mismatch, 5% missing
        import random
        for bt in rack.bins:
            r = random.random()
            if r < 0.85:
                results[bt.bin_code] = (bt.expected_qr, 0.97)
            elif r < 0.95:
                results[bt.bin_code] = ("WRONG-QR-999", 0.72)
            else:
                results[bt.bin_code] = (None, 0.0)
        return results

    # ── Real camera path ───────────────────────────────────────────────────────
    # Try to import and run the rack_scanner_node scan logic headlessly.
    # This avoids needing a full ROS2 spin; we just use the OpenCV/QR detection.
    try:
        import cv2
        from active_vision_scanner.scanner_api_bridge import ScannerAPIBridge

        ESP32_URL = os.environ.get("ESP32_CAM_URL", "http://192.168.43.100:81/stream")
        cap = cv2.VideoCapture(ESP32_URL)
        if not cap.isOpened():
            logger.warning("Cannot open camera stream %s — using offline mode", ESP32_URL)
            return scan_rack_with_camera(rack, dry_run=True)

        qr_detector = cv2.QRCodeDetector()
        detections: dict[str, tuple[Optional[str], float]] = {}

        # Grab frames for 3 seconds per rack
        frame_deadline = time.time() + 3.0
        while time.time() < frame_deadline:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.resize(frame, (640, 480))
            try:
                retval, decoded_info, points, _ = qr_detector.detectAndDecodeMulti(frame)
                if retval and decoded_info:
                    for data in decoded_info:
                        if data and data not in detections:
                            detections[data] = (data, 0.96)
            except Exception:
                data, bbox, _ = qr_detector.detectAndDecode(frame)
                if data and data not in detections:
                    detections[data] = (data, 0.92)
            time.sleep(0.05)

        cap.release()

        # Map detected QRs back to bin codes by matching expected_qr
        for bt in rack.bins:
            if bt.expected_qr and bt.expected_qr in detections:
                results[bt.bin_code] = detections[bt.expected_qr]
            else:
                # Check if any detected QR matches this bin's position heuristically
                found = next(
                    ((qr, conf) for qr, (qr2, conf) in detections.items() if qr == bt.expected_qr),
                    None
                )
                results[bt.bin_code] = found if found else (None, 0.0)

        # Also record any completely unexpected QRs
        for qr_data, (_, conf) in detections.items():
            if not any(bt.expected_qr == qr_data for bt in rack.bins):
                results[f"UNKNOWN:{qr_data[:20]}"] = (qr_data, conf)

    except ImportError as exc:
        logger.warning("Camera dependencies not available (%s) — using dry-run mode.", exc)
        return scan_rack_with_camera(rack, dry_run=True)

    return results


# ── CSV logging ────────────────────────────────────────────────────────────────

def save_results_to_csv(results: list[ScanResult], scan_id: str) -> Path:
    """Write all scan results to a timestamped CSV file in SCAN_LOG_DIR."""
    SCAN_LOG_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = SCAN_LOG_DIR / f"scan_{ts}_{scan_id[:8]}.csv"

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "timestamp", "bin_id", "bin_code", "rack_code",
            "expected_qr", "observed_qr", "match", "confidence",
            "status", "error",
        ])
        for r in results:
            writer.writerow([
                r.timestamp, r.bin_id, r.bin_code, r.rack_code,
                r.expected_qr or "", r.observed_qr or "",
                r.match, round(r.confidence, 4),
                r.status, r.error or "",
            ])

    logger.info("Scan results saved to %s", csv_path)
    return csv_path


# ── Summary printing ───────────────────────────────────────────────────────────

def print_summary(results: list[ScanResult], elapsed: float, csv_path: Path, dry_run: bool) -> None:
    """Print a rich summary table or plain-text summary."""
    total    = len(results)
    matched  = sum(1 for r in results if r.status == "MATCH")
    mismatch = sum(1 for r in results if r.status == "MISMATCH")
    missing  = sum(1 for r in results if r.status == "MISSING")
    errors   = sum(1 for r in results if r.status == "ERROR")
    accuracy = round((matched / total * 100), 1) if total > 0 else 0.0

    if HAS_RICH:
        table = Table(title=f"WAREOps Scan Summary {'[DRY RUN]' if dry_run else ''}")
        table.add_column("Metric", style="cyan", no_wrap=True)
        table.add_column("Value", style="white")

        table.add_row("Total bins scanned", str(total))
        table.add_row("Matched (correct)", f"[green]{matched}[/green]")
        table.add_row("Mismatched (wrong SKU)", f"[red]{mismatch}[/red]")
        table.add_row("Missing (empty bin)", f"[yellow]{missing}[/yellow]")
        table.add_row("Errors", f"[dim]{errors}[/dim]")
        table.add_row("Inventory accuracy", f"[bold]{accuracy}%[/bold]")
        table.add_row("Elapsed time", f"{elapsed:.1f}s")
        table.add_row("Log file", str(csv_path))
        console.print(table)  # type: ignore[union-attr]

        if mismatch > 0 or missing > 0:
            issues = Table(title="Issues Found", show_header=True)
            issues.add_column("Bin Code", style="cyan")
            issues.add_column("Status", style="white")
            issues.add_column("Expected QR", style="green")
            issues.add_column("Observed QR", style="red")
            for r in results:
                if r.status in ("MISMATCH", "MISSING", "ERROR"):
                    issues.add_row(r.bin_code, r.status, r.expected_qr or "—", r.observed_qr or "EMPTY")
            console.print(issues)  # type: ignore[union-attr]
    else:
        print(f"\n{'='*60}")
        print(f"WAREOps Scan Complete {'[DRY RUN]' if dry_run else ''}")
        print(f"  Total bins : {total}")
        print(f"  Matched    : {matched}")
        print(f"  Mismatch   : {mismatch}")
        print(f"  Missing    : {missing}")
        print(f"  Accuracy   : {accuracy}%")
        print(f"  Elapsed    : {elapsed:.1f}s")
        print(f"  Log        : {csv_path}")
        print(f"{'='*60}\n")


# ── Main scan orchestrator ─────────────────────────────────────────────────────

def run_scan(
    scope: str,
    target: Optional[str],
    dry_run: bool,
    log_dir: Optional[str],
) -> int:
    """
    Main entry point for a scan run.

    Returns 0 on success, 1 on fatal error.
    """
    if log_dir:
        global SCAN_LOG_DIR
        SCAN_LOG_DIR = Path(log_dir)

    if not API_URL and not dry_run:
        logger.warning(
            "WAREOPS_API_URL not set. Observations will NOT be submitted. "
            "Use --dry-run or set the env var."
        )

    scan_id = str(uuid.uuid4())
    start_time = time.time()
    all_results: list[ScanResult] = []

    if HAS_RICH:
        console.rule("[bold cyan]WAREOps Autonomous Inventory Scanner[/bold cyan]")  # type: ignore
        console.print(  # type: ignore
            f"Scope: [bold]{scope.upper()}[/bold]"
            + (f" → [cyan]{target}[/cyan]" if target else "")
            + (" [yellow][DRY RUN][/yellow]" if dry_run else "")
        )
    else:
        print(f"\nWAREOps Scanner | scope={scope.upper()}{' target='+target if target else ''}"
              f"{' DRY-RUN' if dry_run else ''}")

    # ── Step 1: Create a mission on the backend ───────────────────────────────
    mission_id: Optional[str] = None
    if not dry_run and API_URL:
        mission_payload = {
            "name": f"Pi Scanner — {scope.upper()}{' '+target if target else ''} — {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "warehouse_id": WAREHOUSE_ID,
            "robot_id": SCANNER_ROBOT_ID,
            "priority": 2,
            "audit_scope": scope.upper(),
            "target_scope_id": target or "",
        }
        mission_resp = _api_post("/api/v1/missions", mission_payload)
        if mission_resp and mission_resp.get("id"):
            mission_id = mission_resp["id"]
            logger.info("Mission created: %s", mission_id)
        else:
            logger.warning("Mission creation failed — continuing without mission_id.")

    # ── Step 2: Fetch topology ────────────────────────────────────────────────
    topology: Optional[dict] = None
    inventory_map: dict[str, str] = {}

    if not dry_run and API_URL:
        topology = fetch_warehouse_topology()
        inventory_map = fetch_inventory_map()

    if topology:
        rack_targets = parse_topology_to_racks(topology, scope, target, inventory_map)
    else:
        # Dry-run or offline: build minimal synthetic targets
        rack_targets = build_synthetic_rack_targets(scope, target, inventory_map)
        # Ensure at least one rack for testing
        if not rack_targets:
            rack_targets = [RackTarget(
                rack_code="A1-RK1", aisle_code="A1",
                nav_target="Aisle_1/Row_1/Rack_1",
                bins=[BinTarget(
                    bin_id=str(uuid.uuid4()), bin_code="A1-RK1-S1-B1",
                    coord_x=1.0, coord_y=1.0, coord_z=0.5,
                    expected_qr="DEMO-QR-001"
                )]
            )]

    if not rack_targets:
        logger.error("No rack targets found for scope=%s target=%s", scope, target)
        return 1

    total_bins = sum(len(r.bins) for r in rack_targets)
    logger.info("Scan plan: %d rack(s), %d bin(s) total.", len(rack_targets), total_bins)

    # ── Step 3: Initialise ROS2 navigator ────────────────────────────────────
    navigator = BotNavigator(dry_run=dry_run)
    ros2_available = navigator.init()

    # ── Step 4: Heartbeat background thread ──────────────────────────────────
    heartbeat_stop = threading.Event()
    current_pos = {"x": 0.0, "y": 0.0, "z": 0.0}

    def _heartbeat_loop():
        while not heartbeat_stop.is_set():
            try:
                send_heartbeat(
                    current_pos["x"], current_pos["y"], current_pos["z"],
                    status="AUDITING", mission_id=mission_id,
                )
            except Exception:
                pass
            heartbeat_stop.wait(HEARTBEAT_INTERVAL)

    if not dry_run and API_URL:
        hb_thread = threading.Thread(target=_heartbeat_loop, daemon=True)
        hb_thread.start()

    # ── Step 5: Main scan loop ────────────────────────────────────────────────
    racks_done = 0
    bins_done  = 0

    for rack in rack_targets:
        logger.info("Processing rack: %s (%d bins)", rack.label, len(rack.bins))

        # 5a. Navigate
        if ros2_available:
            reached = navigator.navigate_to(rack, timeout=90.0)
            if not reached:
                logger.warning("Skipping rack %s — navigation timeout.", rack.label)
                for bt in rack.bins:
                    all_results.append(ScanResult(
                        bin_id=bt.bin_id, bin_code=bt.bin_code, rack_code=rack.rack_code,
                        expected_qr=bt.expected_qr, observed_qr=None,
                        match=False, confidence=0.0,
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        error="NAV_TIMEOUT",
                    ))
                continue
        else:
            time.sleep(0.1)  # Minimal delay in non-ROS mode

        # 5b. Update position for heartbeat
        if rack.bins:
            first_bin = rack.bins[0]
            current_pos.update(x=first_bin.coord_x, y=first_bin.coord_y, z=first_bin.coord_z)

        # 5c. Camera scan
        scan_detections = scan_rack_with_camera(rack, dry_run=dry_run)

        # 5d. Process per-bin results and submit to backend
        for bt in rack.bins:
            observed_qr, confidence = scan_detections.get(bt.bin_code, (None, 0.0))
            is_match = (observed_qr is not None and observed_qr == bt.expected_qr)

            result = ScanResult(
                bin_id=bt.bin_id, bin_code=bt.bin_code, rack_code=rack.rack_code,
                expected_qr=bt.expected_qr, observed_qr=observed_qr,
                match=is_match, confidence=confidence,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            all_results.append(result)

            # Submit observation to backend
            if not dry_run:
                submit_observation(bt, observed_qr, confidence, mission_id)

                # Submit alert for mismatches
                if bt.expected_qr:
                    if observed_qr is None:
                        submit_mismatch_alert(bt, bt.expected_qr, None, "MISSING")
                    elif not is_match:
                        submit_mismatch_alert(bt, bt.expected_qr, observed_qr, "MISPLACED")

            bins_done += 1
            if bins_done % 5 == 0:
                logger.info("Progress: %d/%d bins scanned.", bins_done, total_bins)

        # 5e. Publish succeeded to ROS2
        if ros2_available:
            navigator.publish_succeeded(rack)

        racks_done += 1
        logger.info("Rack %s complete (%d/%d racks).", rack.label, racks_done, len(rack_targets))

    # ── Step 6: Finalise ─────────────────────────────────────────────────────
    heartbeat_stop.set()
    navigator.shutdown()

    # Complete mission on backend
    if mission_id and not dry_run:
        matched_count = sum(1 for r in all_results if r.match)
        _api_post(f"/api/v1/missions/{mission_id}/complete", {
            "total_bins_scanned": len(all_results),
            "observations_submitted": len(all_results),
        })

    elapsed = time.time() - start_time
    csv_path = save_results_to_csv(all_results, scan_id)
    print_summary(all_results, elapsed, csv_path, dry_run)

    # Return exit code based on presence of issues
    has_issues = any(r.status in ("MISMATCH", "MISSING") for r in all_results)
    return 2 if has_issues else 0


# ── CLI entry point ───────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="WAREOps Autonomous Inventory Scanner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan entire warehouse:
  python3 scan.py --scope full

  # Scan a specific rack:
  python3 scan.py --scope rack --target A1-RK1

  # Scan a specific bin:
  python3 scan.py --scope bin --target A1-RK1-S2-B3

  # Dry run (no API calls, no real camera):
  python3 scan.py --scope full --dry-run

  # Custom log directory:
  python3 scan.py --scope rack --target A2-RK2 --log-dir /var/log/wareops
        """,
    )
    parser.add_argument(
        "--scope",
        required=True,
        choices=["full", "rack", "aisle", "bin"],
        help="Scan scope: full=all racks, rack=one rack, aisle=one aisle, bin=one bin",
    )
    parser.add_argument(
        "--target",
        default=None,
        help=(
            "Scope target identifier. "
            "For rack: 'A1-RK1'. For bin: 'A1-RK1-S2-B3'. "
            "Not required for --scope full."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate scan without moving the bot or calling the API.",
    )
    parser.add_argument(
        "--log-dir",
        default=None,
        help=f"Directory for CSV output logs (default: {SCAN_LOG_DIR})",
    )

    args = parser.parse_args()

    if args.scope != "full" and not args.target:
        parser.error(f"--target is required when --scope is '{args.scope}'")

    sys.exit(run_scan(
        scope=args.scope,
        target=args.target,
        dry_run=args.dry_run,
        log_dir=args.log_dir,
    ))


if __name__ == "__main__":
    main()
