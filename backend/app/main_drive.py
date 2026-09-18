"""ASGI entry point for the DRIVE-only service."""

from app.model_app import create_model_app
from app.services.drive_service import predict_drive

app = create_model_app("DRIVE", "DRIVE vessel-segmentation API", predict_drive)
