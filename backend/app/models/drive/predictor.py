"""DRIVE vessel segmentation using a checkpoint trained by drive-baby/drive."""

from functools import lru_cache
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

from .model import UNet

MODEL_PATH = Path(__file__).resolve().parent / "best_model.pth"
IMAGE_SIZE = (512, 512)


@lru_cache(maxsize=1)
def _load_model():
    import torch

    if not MODEL_PATH.is_file():
        raise RuntimeError(
            "DRIVE inference is unavailable: add a validated best_model.pth checkpoint to backend/app/models/drive."
        )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = UNet().to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=True))
    model.eval()
    return model, device


def predict(image_bytes: bytes, threshold: float = 0.5) -> dict:
    """Return vessel-mask summary metrics for a retinal image."""
    import torch

    with Image.open(BytesIO(image_bytes)) as source:
        grayscale = source.convert("L")
        input_width, input_height = grayscale.size
        resized = grayscale.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
    inputs = torch.from_numpy(np.asarray(resized, dtype=np.float32) / 255.0).unsqueeze(0).unsqueeze(0)
    model, device = _load_model()
    with torch.no_grad():
        probabilities = torch.sigmoid(model(inputs.to(device)))[0, 0].cpu().numpy()
    mask = probabilities >= threshold
    vessel_pixels = int(mask.sum())
    total_pixels = int(mask.size)
    return {
        "input_size": [input_width, input_height],
        "model_input_size": list(IMAGE_SIZE),
        "threshold": threshold,
        "vessel_pixels": vessel_pixels,
        "vessel_area_percentage": round(vessel_pixels / total_pixels * 100, 4),
    }
