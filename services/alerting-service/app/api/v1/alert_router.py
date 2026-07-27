import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import structlog

from app.database import DbSession
from app.models.alert import Alert

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["alerts"])

class AlertDetail(BaseModel):
    id: uuid.UUID
    warehouse_id: uuid.UUID
    reconciliation_id: Optional[uuid.UUID] = None
    observation_id: Optional[uuid.UUID] = None
    bin_id: Optional[uuid.UUID] = None
    sku: Optional[str] = None
    alert_type: str
    severity: str
    status: str
    title: str
    description: Optional[str] = None
    expected_value: Optional[str] = None
    observed_value: Optional[str] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    auto_resolvable: bool = False
    rescan_requested: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    warehouse_id: uuid.UUID
    reconciliation_id: Optional[uuid.UUID] = None
    observation_id: Optional[uuid.UUID] = None
    bin_id: Optional[uuid.UUID] = None
    sku: Optional[str] = None
    alert_type: str
    severity: str
    title: str
    description: Optional[str] = None
    expected_value: Optional[str] = None
    observed_value: Optional[str] = None
    auto_resolvable: bool = False

@router.get("/alerts", response_model=List[AlertDetail])
async def list_alerts(session: DbSession):
    result = await session.execute(
        select(Alert).order_by(desc(Alert.created_at)).limit(100)
    )
    return result.scalars().all()

@router.get("/alerts/{id}", response_model=AlertDetail)
async def get_alert(id: str, session: DbSession):
    alert = await session.get(Alert, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/alerts/{id}/acknowledge", response_model=AlertDetail)
async def acknowledge_alert(id: str, session: DbSession):
    alert = await session.get(Alert, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(tz=timezone.utc)
    # fake user
    alert.acknowledged_by = "11111111-1111-1111-1111-111111111111"
    await session.commit()
    await session.refresh(alert)
    return alert

class ResolveRequest(BaseModel):
    notes: Optional[str] = None

@router.post("/alerts/{id}/resolve", response_model=AlertDetail)
async def resolve_alert(id: str, payload: ResolveRequest = Body(...), session: DbSession = Depends()):
    alert = await session.get(Alert, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(tz=timezone.utc)
    alert.resolution_notes = payload.notes
    alert.resolved_by = "22222222-2222-2222-2222-222222222222"
    await session.commit()
    await session.refresh(alert)
    return alert

@router.post("/alerts/{id}/escalate", response_model=AlertDetail)
async def escalate_alert(id: str, session: DbSession):
    alert = await session.get(Alert, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.severity = "CRITICAL"
    await session.commit()
    await session.refresh(alert)
    return alert

class AssignRequest(BaseModel):
    user_id: str

@router.post("/alerts/{id}/assign", response_model=AlertDetail)
async def assign_alert(id: str, payload: AssignRequest = Body(...), session: DbSession = Depends()):
    alert = await session.get(Alert, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.acknowledged_by = payload.user_id
    alert.status = "ACKNOWLEDGED"
    await session.commit()
    await session.refresh(alert)
    return alert

@router.post("/alerts", response_model=AlertDetail)
async def create_alert(payload: AlertCreate, session: DbSession):
    alert = Alert(
        id=str(uuid.uuid4()),
        warehouse_id=str(payload.warehouse_id),
        reconciliation_id=str(payload.reconciliation_id) if payload.reconciliation_id else None,
        observation_id=str(payload.observation_id) if payload.observation_id else None,
        bin_id=str(payload.bin_id) if payload.bin_id else None,
        sku=payload.sku,
        alert_type=payload.alert_type,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        expected_value=payload.expected_value,
        observed_value=payload.observed_value,
        auto_resolvable=payload.auto_resolvable,
        status="OPEN"
    )
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    return alert
