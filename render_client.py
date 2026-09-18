"""Server-side client for the independently deployed model services."""

import mimetypes
import os
from pathlib import Path

from dotenv import load_dotenv
import requests

load_dotenv()

SERVICES = {
    "aptos": {
        "url": os.getenv("APTOS_API_URL", "").rstrip("/"),
        "key": os.getenv("APTOS_API_KEY", ""),
        "endpoint": "/api/predict/aptos",
    },
    "idrid": {
        "url": os.getenv("IDRID_API_URL", "").rstrip("/"),
        "key": os.getenv("IDRID_API_KEY", ""),
        "endpoint": "/api/predict/idrid",
    },
    "drive": {
        "url": os.getenv("DRIVE_API_URL", "").rstrip("/"),
        "key": os.getenv("DRIVE_API_KEY", ""),
        "endpoint": "/api/predict/drive",
    },
}


def _service(model: str) -> dict[str, str]:
    try:
        return SERVICES[model.lower()]
    except KeyError as error:
        raise ValueError(f"Unknown model service: {model}") from error


def is_configured(model: str = "idrid") -> bool:
    """Return whether one model service has a URL and API key configured."""
    service = _service(model)
    return bool(service["url"] and service["key"])


def predict(image_path: str, model: str = "idrid") -> dict:
    """Send an image to one model service without exposing its API key."""
    service = _service(model)
    if not is_configured(model):
        prefix = model.upper()
        raise RuntimeError(f"Set {prefix}_API_URL and {prefix}_API_KEY in .env before using Render inference.")
    mime_type = mimetypes.guess_type(image_path)[0] or "application/octet-stream"
    with Path(image_path).open("rb") as image_file:
        response = requests.post(
            f"{service['url']}{service['endpoint']}",
            headers={"X-API-Key": service["key"]},
            files={"file": (Path(image_path).name, image_file, mime_type)},
            timeout=(10, 180),
        )
    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError(f"Render returned HTTP {response.status_code}, not JSON.") from error
    if not response.ok:
        raise RuntimeError(payload.get("detail", f"Render returned HTTP {response.status_code}."))
    return payload
