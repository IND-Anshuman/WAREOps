from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.mission import Mission, Robot
from app.schemas.mission import MissionCreate, MissionResponse, MissionUpdate, RobotResponse

router = APIRouter(prefix="/api/v1")

@router.get("/missions", response_model=List[MissionResponse])
async def list_missions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).order_by(Mission.created_at.desc()))
    return result.scalars().all()

@router.post("/missions", response_model=MissionResponse)
async def create_mission(mission: MissionCreate, db: AsyncSession = Depends(get_db)):
    new_mission = Mission(**mission.model_dump())
    db.add(new_mission)
    await db.commit()
    await db.refresh(new_mission)
    return new_mission

@router.get("/missions/{id}", response_model=MissionResponse)
async def get_mission(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).filter(Mission.id == id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission

@router.post("/missions/{id}/start", response_model=MissionResponse)
async def start_mission(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).filter(Mission.id == id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission.status = 'IN_PROGRESS'
    mission.started_at = datetime.utcnow()
    await db.commit()
    await db.refresh(mission)
    return mission

@router.post("/missions/{id}/pause", response_model=MissionResponse)
async def pause_mission(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).filter(Mission.id == id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission.status = 'SCHEDULED'
    await db.commit()
    await db.refresh(mission)
    return mission

@router.post("/missions/{id}/complete", response_model=MissionResponse)
async def complete_mission(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).filter(Mission.id == id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission.status = 'COMPLETED'
    mission.completed_at = datetime.utcnow()
    mission.coverage_pct = 100.0
    await db.commit()
    await db.refresh(mission)
    return mission

@router.post("/missions/{id}/cancel", response_model=MissionResponse)
async def cancel_mission(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).filter(Mission.id == id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission.status = 'CANCELLED'
    await db.commit()
    await db.refresh(mission)
    return mission

@router.get("/robots", response_model=List[RobotResponse])
async def list_robots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Robot).order_by(Robot.created_at.desc()))
    return result.scalars().all()

@router.get("/robots/{id}", response_model=RobotResponse)
async def get_robot(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Robot).filter(Robot.id == id))
    robot = result.scalar_one_or_none()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return robot
