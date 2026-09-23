"""ASGI entry point for the APTOS-only service."""

from app.api.doctor_routes import doctor_router
from app.model_app import create_model_app
from app.services.aptos_service import predict_aptos

app = create_model_app("APTOS", "APTOS diabetic-retinopathy classification API", predict_aptos)
app.include_router(doctor_router, prefix="/api")
