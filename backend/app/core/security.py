"""API-key protection for inference endpoints."""

import secrets

from fastapi import Header, HTTPException, status

from .config import settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Require the Render-provided API key; never fall back to a committed secret."""
    if not settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference is unavailable until API_KEY is configured.",
        )
    if not x_api_key or not secrets.compare_digest(x_api_key, settings.api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")
