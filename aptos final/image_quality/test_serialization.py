"""Tests for the QualityResult.to_dict() JSON serialization fix.

Verifies that processed_image (a NumPy array) is NOT included in to_dict(),
since it is not JSON-serializable and would break API responses.
"""

import json

import cv2
import numpy as np

from image_quality.pipeline import process_image
from image_quality.quality_assessment import QualityStatus


def _make_fundus(radius=105, value=105, noise=12):
    rng = np.random.default_rng(7)
    image = np.zeros((256, 256, 3), dtype=np.uint8)
    yy, xx = np.ogrid[:256, :256]
    mask = (xx - 128) ** 2 + (yy - 128) ** 2 <= radius ** 2
    texture = np.clip(value + rng.normal(0, noise, mask.sum()), 0, 255).astype(np.uint8)
    for channel in range(3):
        image[:, :, channel][mask] = texture
    cv2.circle(image, (128, 128), radius // 3, (145, 75, 55), 2)
    return image


def test_to_dict_excludes_numpy_array():
    """processed_image (NumPy array) must not appear in to_dict()."""
    result = process_image(_make_fundus())
    data = result.to_dict()
    assert "processed_image" not in data, "processed_image should be excluded from to_dict()"
    assert "processed_image_path" not in data, "processed_image_path should be excluded from to_dict()"


def test_to_dict_is_json_serializable():
    """The full to_dict() output must be serializable to JSON."""
    result = process_image(_make_fundus())
    data = result.to_dict()
    serialized = json.dumps(data, default=str)
    assert serialized is not None
    # Round-trip to ensure no data loss
    deserialized = json.loads(serialized)
    assert deserialized["quality_status"] == data["quality_status"]


def test_to_dict_contains_expected_keys():
    """to_dict() must include all scalar metadata fields."""
    result = process_image(_make_fundus())
    data = result.to_dict()
    expected_keys = {
        "quality_score", "focus_score", "illumination_score",
        "field_of_view_score", "quality_status", "focus_measure",
        "retinal_area_ratio", "underexposure", "overexposure",
        "uneven_illumination", "insufficient_field_of_view",
        "severely_cropped", "enhancement_applied",
        "enhancements_used", "recapture_required", "recapture_feedback",
    }
    actual_keys = set(data.keys())
    missing = expected_keys - actual_keys
    assert not missing, f"Missing keys in to_dict(): {missing}"
    # Ensure no numpy arrays leaked
    for key, value in data.items():
        assert not isinstance(value, np.ndarray), f"Key '{key}' has non-serializable type {type(value)}"


def test_processed_image_still_accessible():
    """The processed image must still be accessible via the QualityResult object."""
    result = process_image(_make_fundus())
    assert result.processed_image is not None
    assert isinstance(result.processed_image, np.ndarray)
    assert result.processed_image.ndim == 3  # BGR image


def test_to_dict_after_enhancement():
    """to_dict() must work correctly after borderline enhancement."""
    image = _make_fundus(value=75, noise=9)
    yy, xx = np.ogrid[:256, :256]
    fundus_mask = (xx - 128) ** 2 + (yy - 128) ** 2 <= 105 ** 2
    gradient = np.tile(np.linspace(0, 100, 256, dtype=np.uint8), (256, 1))
    image[fundus_mask] = np.clip(image[fundus_mask].astype(np.int16) + gradient[fundus_mask, None], 0, 255)

    result = process_image(image)
    data = result.to_dict()

    # Must be JSON-serializable
    json.dumps(data, default=str)

    # Must not contain numpy arrays
    assert "processed_image" not in data
    assert "processed_image_path" not in data

    # Enhancement metadata must be present
    assert "enhancement_applied" in data
    assert "enhancements_used" in data
    assert isinstance(data["enhancements_used"], list)