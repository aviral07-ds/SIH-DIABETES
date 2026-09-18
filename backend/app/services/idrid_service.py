from app.models.idrid.predictor import predict


def predict_idrid(image_bytes: bytes) -> dict:
    return {"model": "IDRiD", "task": "lesion_segmentation", "result": predict(image_bytes)}
