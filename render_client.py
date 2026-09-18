"""Server-side client for the deployed SIH Diabetes FastAPI service."""

import mimetypes
import os
from pathlib import Path

from dotenv import load_dotenv
import requests

load_dotenv()

API_URL = os.getenv("RENDER_API_URL", "").rstrip("/")
API_KEY = os.getenv("RENDER_API_KEY", "")
API_ENDPOINT = os.getenv("RENDER_API_ENDPOINT", "/api/predict/all")


def is_configured() -> bool:
    return bool(API_URL and API_KEY)


def predict(image_path: str) -> dict:
    """Send one image to Render without exposing the API key to the browser."""
    if not is_configured():
        raise RuntimeError("Set RENDER_API_URL and RENDER_API_KEY in .env before using Render inference.")
    endpoint = API_ENDPOINT if API_ENDPOINT.startswith("/") else f"/{API_ENDPOINT}"
    mime_type = mimetypes.guess_type(image_path)[0] or "application/octet-stream"
    with Path(image_path).open("rb") as image_file:
        response = requests.post(
            f"{API_URL}{endpoint}",
            headers={"X-API-Key": API_KEY},
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
