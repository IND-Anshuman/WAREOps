from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import Optional
from app.database import DbSession
from app.schemas.observation import ObservationIngest, ObservationResponse, ObservationListResponse
from app.repositories.observation_repo import ObservationRepository

router = APIRouter(prefix="/api/v1")

@router.post("/observations", response_model=ObservationResponse)
async def create_observation(
    observation_data: ObservationIngest, 
    db: DbSession
):
    repo = ObservationRepository(db)
    new_obs = await repo.create_observation(observation_data.model_dump(exclude={"image_b64"}))
    return new_obs

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
