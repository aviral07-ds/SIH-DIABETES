"""Authentication and rate limiting for the DR Screening API.

Provides:
    - API key verification via X-API-Key header
    - Rate limiting via slowapi
    - Optional JWT support for future expansion
"""

import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# API key configuration
API_KEY = os.environ.get("API_KEY", "change-me-in-production")
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# Rate limiter (per-IP, 60 requests per minute by default)
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


def verify_api_key(api_key: Optional[str] = None) -> str:
    """Verify the API key provided in the X-API-Key header.

    Args:
        api_key: The API key value from the request header.

    Returns:
        The verified API key.

    Raises:
        HTTPException: If the API key is missing or invalid.
    """
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-API-Key header.",
        )
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key.",
        )
    return api_key


def get_current_user(api_key: Optional[str] = Depends(API_KEY_HEADER)) -> dict:
    """Dependency that returns the authenticated user context."""
    key = verify_api_key(api_key)
    return {"api_key": key, "authenticated": True}


def setup_rate_limiting(app):
    """Attach rate limiting middleware to a FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)


def _rate_limit_exceeded_handler(request, exc: RateLimitExceeded):
    """Return a JSON response when rate limit is exceeded."""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )