from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MissionCreate(BaseModel):
    name: str
    warehouse_id: str
    robot_id: Optional[str] = None
    priority: int = 5
    audit_scope: str
    target_scope_id: str
    description: Optional[str] = None

class MissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    warehouse_id: str
    robot_id: Optional[str] = None
    status: str
    priority: int
    name: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    total_bins_target: int
    total_bins_scanned: int
    coverage_pct: float
    audit_scope: str
    target_scope_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MissionUpdate(BaseModel):
    status: Optional[str] = None
    failure_reason: Optional[str] = None

class RobotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    serial_number: str
    name: Optional[str] = None
    model: Optional[str] = None
    warehouse_id: str
    status: str
    battery_pct: float
    firmware_version: Optional[str] = None
    last_heartbeat: Optional[datetime] = None
    current_coord_x: Optional[float] = None
    current_coord_y: Optional[float] = None
    current_coord_z: Optional[float] = None
    current_yaw: Optional[float] = None
    active_mission_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
