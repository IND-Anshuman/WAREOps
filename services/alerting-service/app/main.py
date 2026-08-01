from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import structlog
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app.database import create_all_tables, dispose_engine, Base
from app.api.v1.alert_router import router as alert_router
from app.models.alert import Base

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("alerting_service.startup")
    # Create tables using alembic-style create_all
    await create_all_tables()
    yield
    logger.info("alerting_service.shutdown")
    await dispose_engine()

app = FastAPI(
    title="Alerting Service",
    description="Lightweight service to expose alerts via REST API.",
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

app.include_router(alert_router)

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "alerting-service"}

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
