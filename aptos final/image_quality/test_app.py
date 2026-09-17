"""Tests for app.py configuration and helper functions.

These tests do NOT require TensorFlow or the model file.
They verify:
    - Threshold alignment (loaded from config file, not hardcoded)
    - CORS configuration (allow_credentials=False with wildcard origins)
    - Helper function behavior (validation, integrity checks)
    - Batch predict endpoint structure
"""

import json
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

# Set up path so imports work
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Mock TensorFlow before importing app
sys.modules['tensorflow'] = MagicMock()
sys.modules['tensorflow.keras'] = MagicMock()
sys.modules['tensorflow.keras.models'] = MagicMock()

import numpy as np
from fastapi.testclient import TestClient
from fastapi import HTTPException

# Import app after mocking tensorflow
import app as app_module
from app import (
    app,
    _validate_upload,
    _validate_image_integrity,
    REFERABLE_THRESHOLD,
    CLASS_NAMES,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS,
)


# ============================================================
# Threshold alignment tests
# ============================================================

def test_threshold_matches_config_file():
    """REFERABLE_THRESHOLD must match aptos_model_config.json."""
    config_path = ROOT / "aptos_model_config.json"
    with open(config_path) as f:
        config = json.load(f)
    assert REFERABLE_THRESHOLD == config["threshold"], \
        f"Threshold mismatch: app={REFERABLE_THRESHOLD}, config={config['threshold']}"


def test_threshold_is_0_42():
    """The config file specifies threshold 0.42."""
    assert REFERABLE_THRESHOLD == 0.42


# ============================================================
# CORS configuration tests
# ============================================================

def test_cors_wildcard_no_credentials():
    """CORS must not allow credentials with wildcard origins (per spec)."""
    cors_middleware = None
    for middleware in app.user_middleware:
        if hasattr(middleware, 'cls') and 'CORS' in str(middleware.cls):
            cors_middleware = middleware
            break

    if cors_middleware is None:
        pytest.skip("CORS middleware not found via user_middleware")

    kwargs = cors_middleware.kwargs
    assert kwargs.get("allow_origins") == ["*"]
    assert kwargs.get("allow_credentials") is False, \
        "allow_credentials must be False when allow_origins is ['*']"


# ============================================================
# Helper function tests
# ============================================================

def test_validate_upload_accepts_valid_extensions():
    """Valid extensions should pass validation."""
    for ext in ALLOWED_EXTENSIONS:
        mock_file = type('MockFile', (), {'filename': f'test{ext}'})()
        result = _validate_upload(mock_file)
        assert result == ext


def test_validate_upload_rejects_missing_filename():
    """Missing filename should raise HTTPException."""
    mock_file = type('MockFile', (), {'filename': None})()
    with pytest.raises(HTTPException) as exc_info:
        _validate_upload(mock_file)
    assert exc_info.value.status_code == 400


def test_validate_upload_rejects_invalid_extension():
    """Invalid extensions should raise HTTPException."""
    mock_file = type('MockFile', (), {'filename': 'test.bmp'})()
    with pytest.raises(HTTPException) as exc_info:
        _validate_upload(mock_file)
    assert exc_info.value.status_code == 400
    assert "Unsupported" in exc_info.value.detail


def test_validate_image_integrity_accepts_valid_image():
    """A valid PNG image should pass integrity check."""
    import cv2
    import tempfile
    img = np.zeros((10, 10, 3), dtype=np.uint8)
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
        cv2.imwrite(f.name, img)
        with open(f.name, 'rb') as rf:
            contents = rf.read()
        os.unlink(f.name)

    _validate_image_integrity(contents)  # Should not raise


def test_validate_image_integrity_rejects_corrupt_data():
    """Corrupt image data should raise HTTPException."""
    with pytest.raises(HTTPException) as exc_info:
        _validate_image_integrity(b"not an image")
    assert exc_info.value.status_code == 400
    assert "corrupt" in exc_info.value.detail.lower()


# ============================================================
# API endpoint tests
# ============================================================

@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    """Health check endpoint should return online status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["model_loaded"] in (True, False)


def test_model_info_endpoint(client):
    """Model info endpoint should return correct metadata."""
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "EfficientNetB0"
    assert data["dataset"] == "APTOS 2019"
    assert data["referable_threshold"] == REFERABLE_THRESHOLD
    # JSON serializes int keys as strings
    assert "0" in data["classes"]
    assert "4" in data["classes"]
    assert data["classes"]["0"] == "No DR"
    assert data["classes"]["4"] == "Proliferative DR"


def test_predict_requires_auth(client):
    """Predict endpoint should require API key."""
    response = client.post("/api/predict")
    assert response.status_code == 401
    assert "Missing API key" in response.json()["detail"]


def test_predict_rejects_invalid_api_key(client):
    """Invalid API key should be rejected."""
    response = client.post(
        "/api/predict",
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 403
    assert "Invalid API key" in response.json()["detail"]


def test_batch_predict_requires_auth(client):
    """Batch predict endpoint should require API key."""
    response = client.post("/api/batch-predict")
    assert response.status_code == 401


def test_batch_predict_rejects_too_many_images(client):
    """Batch predict should reject more than 10 images."""
    files = [("images", (f"test{i}.png", b"fake", "image/png")) for i in range(11)]
    response = client.post(
        "/api/batch-predict",
        headers={"X-API-Key": "change-me-in-production"},
        files=files,
    )
    assert response.status_code == 400
    assert "Maximum 10 images" in response.json()["detail"]


# ============================================================
# Configuration tests
# ============================================================

def test_class_names_complete():
    """All 5 DR classes must be defined."""
    assert len(CLASS_NAMES) == 5
    assert CLASS_NAMES[0] == "No DR"
    assert CLASS_NAMES[1] == "Mild DR"
    assert CLASS_NAMES[2] == "Moderate DR"
    assert CLASS_NAMES[3] == "Severe DR"
    assert CLASS_NAMES[4] == "Proliferative DR"


def test_file_size_limit():
    """Max file size should be 10 MB."""
    assert MAX_FILE_SIZE == 10 * 1024 * 1024


def test_allowed_extensions():
    """Only JPG, JPEG, PNG should be allowed."""
    assert ".jpg" in ALLOWED_EXTENSIONS
    assert ".jpeg" in ALLOWED_EXTENSIONS
    assert ".png" in ALLOWED_EXTENSIONS
    assert ".bmp" not in ALLOWED_EXTENSIONS
    assert ".tiff" not in ALLOWED_EXTENSIONS