import contextlib
import structlog
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from app.config import get_settings
from app.database import init_db, close_db, Base
from app.api.v1.observation_router import router as observation_router
import app.database as db_module

logger = structlog.get_logger(__name__)
settings = get_settings()

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", service=settings.SERVICE_NAME)
    await init_db(settings)
    if db_module._engine:
        async with db_module._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await close_db()
    logger.info("shutdown", service=settings.SERVICE_NAME)

app = FastAPI(title="Observation Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc))
    return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.SERVICE_NAME}

app.include_router(observation_router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
