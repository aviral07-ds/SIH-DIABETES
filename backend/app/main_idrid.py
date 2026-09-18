"""ASGI entry point for the IDRiD-only service."""

from app.model_app import create_model_app
from app.services.idrid_service import predict_idrid

app = create_model_app("IDRiD", "IDRiD lesion-segmentation API", predict_idrid)
