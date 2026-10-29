import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
from app.seeds.init_data import seed_database
from app.api.v1.router import api_router
import app.models  # Ensure all models are registered with Base metadata

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("apkhunter")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing APK Hunter Grid Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database initialized and seed data verified successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
    finally:
        db.close()
    yield
    logger.info("APK Hunter Grid Backend shutting down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Discord Prospect Intelligence & Community Discovery Platform API for IPTV, Reseller Panels, and Streaming Apps.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "version": "1.0.0"
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "description": "Discord Prospect Intelligence Platform API",
        "docs_url": "/docs",
        "health_check": "/health"
    }
