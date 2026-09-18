from app.models.drive.predictor import predict


def predict_drive(image_bytes: bytes) -> dict:
    return {"model": "DRIVE", "task": "vessel_segmentation", "result": predict(image_bytes)}
