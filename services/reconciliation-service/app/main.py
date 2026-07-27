from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import structlog
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException

from app.config import get_settings
from app.database import init_db, close_db, Base, _engine
from app.api.v1.reconciliation_router import router as reconciliation_router
from app.models.reconciliation import Base

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("reconciliation_service.startup")
    await init_db(settings)
    
    # Create tables
    from app.database import _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield
    
    logger.info("reconciliation_service.shutdown")
    await close_db()

app = FastAPI(
    title="Reconciliation Service",
    description="Service for managing inventory reconciliation and alerts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

app.include_router(reconciliation_router)

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "reconciliation-service"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("validation_error", errors=exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=settings.DEBUG,
    )
