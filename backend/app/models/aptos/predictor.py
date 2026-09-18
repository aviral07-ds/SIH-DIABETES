"""APTOS inference using the repository's trained model and quality pipeline."""

from io import BytesIO
import json
from pathlib import Path
import sys
from typing import Any
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image


MODEL_DIR = Path(__file__).resolve().parent
MODEL_PATH = MODEL_DIR / "best_aptos_model.keras"
CONFIG_PATH = MODEL_DIR / "config.json"
CLASS_NAMES = {0: "No DR", 1: "Mild DR", 2: "Moderate DR", 3: "Severe DR", 4: "Proliferative DR"}


def _quality_pipeline():
    """Load the existing, tested APTOS quality pipeline in source and Docker layouts."""
    try:
        from .image_quality.pipeline import process_image
        return process_image
    except ImportError:
        legacy_root = Path(__file__).resolve().parents[4] / "aptos final"
        if str(legacy_root) not in sys.path:
            sys.path.insert(0, str(legacy_root))
        from image_quality.pipeline import process_image
        return process_image


@lru_cache(maxsize=1)
def _model():
    import tensorflow as tf
    if not MODEL_PATH.is_file():
        raise RuntimeError("APTOS model artifact is missing from the deployment image.")
    return tf.keras.models.load_model(MODEL_PATH, compile=False)


def _preprocess(image_bgr: np.ndarray, target_size: int = 224) -> np.ndarray:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    coords = cv2.findNonZero(cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)[1])
    cropped = image_bgr if coords is None else image_bgr[
        cv2.boundingRect(coords)[1]:cv2.boundingRect(coords)[1] + cv2.boundingRect(coords)[3],
        cv2.boundingRect(coords)[0]:cv2.boundingRect(coords)[0] + cv2.boundingRect(coords)[2],
    ]
    height, width = cropped.shape[:2]
    scale = min(target_size / width, target_size / height)
    resized = cv2.resize(cropped, (int(width * scale), int(height * scale)))
    canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    y, x = (target_size - resized.shape[0]) // 2, (target_size - resized.shape[1]) // 2
    canvas[y:y + resized.shape[0], x:x + resized.shape[1]] = resized
    return cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB).astype(np.float32)


def predict(image_bytes: bytes) -> dict[str, Any]:
    """Assess image quality then return the exact APTOS model prediction contract."""
    decoded = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None:
        raise ValueError("Unable to decode the uploaded image.")
    # PIL verifies format and protects us from accepting arbitrary non-image uploads.
    Image.open(BytesIO(image_bytes)).verify()
    quality_result = _quality_pipeline()(decoded)
    quality = quality_result.to_dict()
    quality_response = {
        "status": quality["quality_status"], "quality_score": quality["quality_score"],
        "focus_score": quality["focus_score"], "illumination_score": quality["illumination_score"],
        "field_of_view_score": quality["field_of_view_score"], "enhancement_applied": quality["enhancement_applied"],
        "enhancements": quality["enhancements_used"], "recapture_required": quality["recapture_required"],
        "recapture_feedback": quality["recapture_feedback"],
    }
    if quality_response["recapture_required"]:
        return {"image_quality": quality_response, "prediction": None}
    model = _model()
    probabilities = model.predict(np.expand_dims(_preprocess(quality_result.processed_image), axis=0), verbose=0)[0]
    predicted_class = int(np.argmax(probabilities))
    threshold = float(json.loads(CONFIG_PATH.read_text(encoding="utf-8")).get("threshold", 0.42))
    referable_probability = float(np.sum(probabilities[2:5]))
    return {
        "image_quality": quality_response,
        "prediction": {
            "predicted_class": predicted_class, "predicted_label": CLASS_NAMES[predicted_class],
            "confidence": round(float(probabilities[predicted_class]) * 100, 2),
            "class_probabilities": {CLASS_NAMES[index]: round(float(value) * 100, 2) for index, value in enumerate(probabilities)},
            "referable_probability": round(referable_probability * 100, 2), "referable_threshold": threshold,
            "referable": referable_probability >= threshold,
            "referable_label": "Referable DR" if referable_probability >= threshold else "Non-Referable DR",
        },
    }
