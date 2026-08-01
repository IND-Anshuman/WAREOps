import json
import uuid
import httpx
from typing import List, Optional
from datetime import datetime, timezone
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import DbSession
from app.config import get_settings
from app.models.observation import Observation
from app.schemas.observation import ObservationIngest, ObservationBatch, ObservationResponse, ObservationListResponse
from app.repositories.observation_repo import ObservationRepository

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/v1")

async def _process_post_commit_actions(obs: Observation, redis_client, db: AsyncSession):
    """Publish raw telemetry to Redis and run SKU reconciliation check."""
    # 1. Publish observation.raw to Redis channel
    raw_payload = {
        "event_type": "observation.raw",
        "observation_id": str(obs.id),
        "mission_id": str(obs.mission_id) if obs.mission_id else None,
        "robot_id": str(obs.robot_id),
        "warehouse_id": str(obs.warehouse_id),
        "bin_id": str(obs.bin_id) if obs.bin_id else None,
        "bin_code": obs.bin_code,
        "sku": obs.decoded_qr,
        "decoded_qr": obs.decoded_qr,
        "confidence": float(obs.detection_confidence) if obs.detection_confidence is not None else None,
        "detection_confidence": float(obs.detection_confidence) if obs.detection_confidence is not None else None,
        "frame_blur_score": float(obs.frame_blur_score) if obs.frame_blur_score is not None else None,
        "image_url": obs.image_url,
        "robot_coord_x": float(obs.robot_coord_x) if obs.robot_coord_x is not None else None,
        "robot_coord_y": float(obs.robot_coord_y) if obs.robot_coord_y is not None else None,
        "robot_coord_z": float(obs.robot_coord_z) if obs.robot_coord_z is not None else None,
        "observed_at": obs.observed_at.isoformat() if obs.observed_at else None,
        "status": obs.status
    }
    if redis_client:
        try:
            await redis_client.publish("observation.raw", json.dumps(raw_payload))
        except Exception as exc:
            logger.error("redis_publish_raw_error", error=str(exc))

    # 2. Reconciliation check: compare decoded_qr against expected SKU
    settings = get_settings()
    expected_sku = None

    if obs.bin_id:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{settings.TOPOLOGY_SERVICE_URL}/api/v1/bins/{obs.bin_id}")
                if res.status_code == 200:
                    bin_data = res.json()
                    expected_sku = bin_data.get("qr_code")
        except Exception as exc:
            logger.debug("topology_fetch_bin_failed", bin_id=str(obs.bin_id), error=str(exc))

    if not expected_sku and obs.bin_id:
        try:
            sql = text("SELECT qr_code FROM bins WHERE id = :b_id UNION SELECT sku FROM inventory WHERE bin_id = :b_id LIMIT 1")
            db_res = await db.execute(sql, {"b_id": str(obs.bin_id)})
            row = db_res.fetchone()
            if row:
                expected_sku = row[0]
        except Exception as exc:
            logger.debug("db_fetch_expected_sku_failed", error=str(exc))

    observed_sku = obs.decoded_qr
    if expected_sku and observed_sku:
        is_match = (expected_sku == observed_sku)
    elif not expected_sku and not observed_sku:
        is_match = True
    else:
        is_match = False

    now_iso = datetime.now(timezone.utc).isoformat()

    if is_match:
        verified_payload = {
            "event_type": "inventory.reconciliation.verified",
            "observation_id": str(obs.id),
            "warehouse_id": str(obs.warehouse_id),
            "bin_id": str(obs.bin_id) if obs.bin_id else None,
            "bin_code": obs.bin_code,
            "sku": observed_sku or expected_sku,
            "expected_sku": expected_sku,
            "timestamp": now_iso
        }
        if redis_client:
            try:
                await redis_client.publish("inventory.reconciliation.verified", json.dumps(verified_payload))
            except Exception as exc:
                logger.error("redis_publish_verified_error", error=str(exc))
    else:
        mismatch_payload = {
            "event_type": "inventory.reconciliation.mismatch",
            "observation_id": str(obs.id),
            "warehouse_id": str(obs.warehouse_id),
            "bin_id": str(obs.bin_id) if obs.bin_id else None,
            "bin_code": obs.bin_code,
            "observed_sku": observed_sku,
            "expected_sku": expected_sku,
            "timestamp": now_iso
        }
        if redis_client:
            try:
                await redis_client.publish("inventory.reconciliation.mismatch", json.dumps(mismatch_payload))
            except Exception as exc:
                logger.error("redis_publish_mismatch_error", error=str(exc))

        alert_payload = {
            "warehouse_id": str(obs.warehouse_id),
            "observation_id": str(obs.id),
            "bin_id": str(obs.bin_id) if obs.bin_id else None,
            "sku": observed_sku or expected_sku,
            "alert_type": "MISPLACED" if observed_sku else "MISSING",
            "severity": "HIGH",
            "title": f"SKU Mismatch at Bin {obs.bin_code or obs.bin_id}",
            "description": f"Expected SKU '{expected_sku}', observed SKU '{observed_sku}'",
            "expected_value": expected_sku or "EMPTY",
            "observed_value": observed_sku or "EMPTY",
            "auto_resolvable": False
        }
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(f"{settings.ALERTING_SERVICE_URL}/api/v1/alerts", json=alert_payload)
        except Exception as exc:
            logger.error("alerting_service_post_failed", error=str(exc))

@router.post("/observations", response_model=ObservationResponse)
async def create_observation(
    observation_data: ObservationIngest, 
    request: Request,
    db: DbSession
):
    repo = ObservationRepository(db)
    new_obs = await repo.create_observation(observation_data.model_dump(exclude={"image_b64"}))
    await db.commit()
    await db.refresh(new_obs)

    redis_client = getattr(request.app.state, "redis", None)
    await _process_post_commit_actions(new_obs, redis_client, db)
    return new_obs

@router.post("/observations/batch", response_model=List[ObservationResponse])
async def create_observation_batch(
    batch: ObservationBatch,
    request: Request,
    db: DbSession
):
    repo = ObservationRepository(db)
    created_list = []

    for item in batch.observations:
        obs_dict = item.model_dump(exclude={"image_b64"})
        if not obs_dict.get("robot_id") and batch.robot_id:
            obs_dict["robot_id"] = batch.robot_id
        if not obs_dict.get("warehouse_id") and batch.warehouse_id:
            obs_dict["warehouse_id"] = batch.warehouse_id
        if not obs_dict.get("mission_id") and batch.mission_id:
            obs_dict["mission_id"] = batch.mission_id

        obs = await repo.create_observation(obs_dict)
        created_list.append(obs)

    await db.commit()

    redis_client = getattr(request.app.state, "redis", None)
    for obs in created_list:
        await _process_post_commit_actions(obs, redis_client, db)

    return created_list

@router.get("/observations", response_model=ObservationListResponse)
async def list_observations(
    warehouse_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: DbSession = None
):
    repo = ObservationRepository(db)
    items, total = await repo.get_observations_by_warehouse(warehouse_id=warehouse_id, skip=skip, limit=limit)
    return ObservationListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/observations/{id}", response_model=ObservationResponse)
async def get_observation(
    id: uuid.UUID, 
    db: DbSession = None
):
    repo = ObservationRepository(db)
    obs = await repo.get_observation_by_id(id)
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs

