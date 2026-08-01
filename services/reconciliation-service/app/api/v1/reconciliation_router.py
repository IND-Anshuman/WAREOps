from fastapi import APIRouter, Depends, HTTPException, Query, Body
import structlog
import uuid
from typing import List, Optional
from pydantic import BaseModel

from app.database import DbSession
from app.repositories.reconciliation_repo import ReconciliationRepository
from app.schemas.reconciliation import (
    AlertCreate,
    AlertDetail,
    AlertFilters,
    AlertListResponse,
    AlertUpdateRequest,
    DashboardStats,
    InventoryResponse,
    ReconciliationResultResponse,
    RescanResponse,
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1", tags=["reconciliation"])

# Hardcoded fallback warehouse ID
DEFAULT_WAREHOUSE_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")

def get_repo(session: DbSession) -> ReconciliationRepository:
    return ReconciliationRepository(session)

@router.get("/alerts", response_model=List[AlertDetail])
async def list_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    warehouse_id: Optional[uuid.UUID] = Query(None),
    repo: ReconciliationRepository = Depends(get_repo)
):
    """List alerts with optional severity and status filters."""
    filters = AlertFilters(severity=severity, status=status)
    items, total = await repo.get_alerts(filters=filters, warehouse_id=warehouse_id or DEFAULT_WAREHOUSE_ID)
    return items

@router.get("/alerts/{id}", response_model=AlertDetail)
async def get_alert(id: str, repo: ReconciliationRepository = Depends(get_repo)):
    try:
        alert_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    alert = await repo.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/alerts/{id}/acknowledge", response_model=AlertDetail)
async def acknowledge_alert(id: str, repo: ReconciliationRepository = Depends(get_repo)):
    try:
        alert_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    update_req = AlertUpdateRequest(status="ACKNOWLEDGED")
    alert = await repo.update_alert(alert_id, update_req)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

class ResolveRequest(BaseModel):
    notes: Optional[str] = None

@router.post("/alerts/{id}/resolve", response_model=AlertDetail)
async def resolve_alert(
    id: str, 
    payload: ResolveRequest = Body(...),
    repo: ReconciliationRepository = Depends(get_repo)
):
    try:
        alert_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    # We use a dummy user id for resolved_by for now
    resolved_by = uuid.UUID("22222222-2222-2222-2222-222222222222")
    alert = await repo.resolve_alert(alert_id, resolved_by=resolved_by, notes=payload.notes)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/alerts/{id}/escalate", response_model=AlertDetail)
async def escalate_alert(id: str, repo: ReconciliationRepository = Depends(get_repo)):
    try:
        alert_id = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    # Custom update for severity - we need to fetch and set since update_alert doesn't take severity directly
    # Wait, update_alert uses AlertUpdateRequest which doesn't have severity. We will use the repo.
    alert = await repo.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.severity = "CRITICAL"
    await repo._session.commit()
    await repo._session.refresh(alert)
    return alert

class AssignRequest(BaseModel):
    user_id: str

@router.post("/alerts/{id}/assign", response_model=AlertDetail)
async def assign_alert(
    id: str, 
    payload: AssignRequest = Body(...),
    repo: ReconciliationRepository = Depends(get_repo)
):
    try:
        alert_id = uuid.UUID(id)
        # assign doesn't exist on AlertUpdateRequest directly but we could use acknowledged_by or just set it
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")
    
    alert = await repo.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # The alert model doesn't explicitly have 'assigned_to', but it has 'acknowledged_by' or 'resolved_by'
    # We will just map assign to acknowledged_by for now since the Alert model has acknowledged_by
    try:
        user_uuid = uuid.UUID(payload.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    update_req = AlertUpdateRequest(acknowledged_by=user_uuid, status="ACKNOWLEDGED")
    alert = await repo.update_alert(alert_id, update_req)
    return alert

@router.post("/alerts", response_model=AlertDetail)
async def create_alert(
    payload: AlertCreate,
    repo: ReconciliationRepository = Depends(get_repo)
):
    alert = await repo.create_alert(payload)
    return alert

@router.get("/inventory", response_model=List[InventoryResponse])
async def list_inventory(
    warehouse_id: Optional[uuid.UUID] = Query(None),
    repo: ReconciliationRepository = Depends(get_repo)
):
    items, total = await repo.get_inventory_by_warehouse(warehouse_id or DEFAULT_WAREHOUSE_ID)
    return items

@router.get("/inventory/search", response_model=List[InventoryResponse])
async def search_inventory(
    q: str = Query(...),
    zone: Optional[str] = Query(None),
    warehouse_id: Optional[uuid.UUID] = Query(None),
    repo: ReconciliationRepository = Depends(get_repo)
):
    # Simply list all and filter in memory for now, as search is not in repo
    items, total = await repo.get_inventory_by_warehouse(warehouse_id or DEFAULT_WAREHOUSE_ID)
    
    results = []
    q_lower = q.lower()
    for item in items:
        if q_lower in item.sku.lower() or (item.lot_number and q_lower in item.lot_number.lower()):
            results.append(item)
            
    return results

@router.get("/reconciliation/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    warehouse_id: Optional[uuid.UUID] = Query(None),
    repo: ReconciliationRepository = Depends(get_repo)
):
    stats = await repo.get_dashboard_stats(warehouse_id or DEFAULT_WAREHOUSE_ID)
    return stats

@router.post("/inventory/bins/{id}/rescan", response_model=RescanResponse)
async def request_bin_rescan(
    id: str,
    repo: ReconciliationRepository = Depends(get_repo),
):
    """Create a targeted SCHEDULED rescan mission for a specific bin."""
    return await repo.create_rescan_mission(bin_id_or_code=id)

@router.post("/alerts/{id}/request-rescan", response_model=RescanResponse)
async def request_alert_rescan(
    id: str,
    repo: ReconciliationRepository = Depends(get_repo),
):
    """Request a rescan for an alert's bin, marking alert rescan requested and scheduling a mission."""
    return await repo.create_alert_rescan_mission(alert_id=id)

