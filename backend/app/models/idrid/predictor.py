"""IDRiD lesion inference preserving the existing CLAHE and normalization pipeline."""

from functools import lru_cache
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
import torch

from .model import UNet

MODEL_PATH = Path(__file__).resolve().parent / "best_model.pth"
LESION_TYPES = ("MA", "HE", "EX", "SE")
LESION_NAMES = {"MA": "Microaneurysms (MA)", "HE": "Hemorrhages (HE)", "EX": "Hard Exudates (EX)", "SE": "Soft Exudates (SE)"}


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.is_file():
        raise RuntimeError("IDRiD model checkpoint is missing from the deployment image.")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(MODEL_PATH, map_location=device, weights_only=False)
    model = UNet(base_c=checkpoint.get("args", {}).get("base_c", 32)).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, checkpoint.get("args", {}), device


def _clahe(image_bgr: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    lightness, green_red, blue_yellow = cv2.split(lab)
    enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(lightness)
    return cv2.cvtColor(cv2.merge((enhanced, green_red, blue_yellow)), cv2.COLOR_LAB2RGB)


def predict(image_bytes: bytes, threshold: float = 0.5) -> dict:
    Image.open(BytesIO(image_bytes)).verify()
    image_bgr = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError("Unable to decode the uploaded image.")
    height, width = image_bgr.shape[:2]
    model, args, device = _load_model()
    size = int(args.get("img_size", 256))
    rgb = _clahe(image_bgr)
    resized = cv2.resize(rgb, (size, size), interpolation=cv2.INTER_LINEAR)
    tensor = torch.from_numpy(resized.transpose(2, 0, 1)).float().div(255.0)
    tensor = (tensor - torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)) / torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    with torch.no_grad():
        probabilities = torch.sigmoid(model(tensor.unsqueeze(0).to(device))).squeeze(0).cpu().numpy()
    retina_pixels = int(np.sum(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) > 10))
    if retina_pixels == 0:
        retina_pixels = height * width
    lesions = {}
    for index, code in enumerate(LESION_TYPES):
        mask = cv2.resize((probabilities[index] > threshold).astype(np.uint8), (width, height), interpolation=cv2.INTER_NEAREST)
        pixels = int(mask.sum())
        lesions[code] = {"name": LESION_NAMES[code], "detected": bool(pixels), "pixel_count": pixels, "area_percentage": round(pixels / retina_pixels * 100, 4)}
    return {"input_size": [width, height], "threshold": threshold, "lesions": lesions}
