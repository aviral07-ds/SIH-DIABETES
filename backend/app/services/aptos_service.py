from app.models.aptos.predictor import predict


def predict_aptos(image_bytes: bytes) -> dict:
    return {"model": "APTOS", "task": "diabetic_retinopathy_classification", "result": predict(image_bytes)}
