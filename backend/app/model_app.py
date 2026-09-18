"""Factory for a single-model FastAPI deployment."""

from collections.abc import Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.model_routes import create_prediction_router
from app.core.config import settings


def create_model_app(model_name: str, description: str, predictor: Callable[[bytes], dict]) -> FastAPI:
    app = FastAPI(
        title=f"SIH Diabetes {model_name} API",
        description=description,
        version="1.0.0",
    )
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.cors_origins),
            allow_credentials=False,
            allow_methods=["POST"],
            allow_headers=["Content-Type", "X-API-Key"],
        )

    app.include_router(create_prediction_router(model_name, predictor), prefix="/api")

    @app.get("/health", tags=["health"])
    def health() -> dict:
        return {"status": "healthy", "service": f"SIH Diabetes {model_name} API", "model": model_name}

    @app.get("/", tags=["health"])
    def root() -> dict:
        return {"status": "running", "service": f"SIH Diabetes {model_name} API", "models": [model_name]}

    return app
