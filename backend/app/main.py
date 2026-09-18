"""ASGI entry point for Render and local deployment."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.routes import router as prediction_router
from app.core.config import settings

app = FastAPI(title="SIH Diabetes AI API", description="Unified diabetic-retinopathy inference API", version="1.0.0")

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["POST"],
        allow_headers=["Content-Type", "X-API-Key"],
    )

app.include_router(health_router)
app.include_router(prediction_router, prefix="/api")


@app.get("/", tags=["health"])
def root() -> dict:
    return {"status": "running", "service": "SIH Diabetes AI API", "models": ["APTOS", "IDRiD", "DRIVE"]}
