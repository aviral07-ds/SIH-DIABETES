"""Run the quality pipeline on real APTOS images from a directory.

By default the script looks for images in ``test_images/`` relative to the
project root. Pass ``--directory`` (or ``--image`` for a single file) to
override this behaviour.

Example::

    python -m image_quality.test_real_aptos
    python -m image_quality.test_real_aptos --directory /path/to/aptos_images
    python -m image_quality.test_real_aptos --image /path/to/single_image.png
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from image_quality.pipeline import process_image  # noqa: E402

IMAGE_EXTENSIONS = {".bmp", ".jpeg", ".jpg", ".png", ".tif", ".tiff"}


def _iter_images(directory: Path) -> list[Path]:
    return sorted(
        path for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def _print_result(image_path: Path, data: dict) -> None:
    print("\n" + "=" * 60)
    print("QUALITY RESULT")
    print("=" * 60)
    print(f"Image: {image_path}")
    print(f"Quality status: {data.get('quality_status')}")
    print(f"Overall quality score: {data.get('quality_score')}")
    print(f"Focus score: {data.get('focus_score')}")
    print(
        "Focus status:",
        "acceptable" if data.get("focus_score", 0.0) >= 0.52 else "needs attention",
    )
    print(f"Illumination score: {data.get('illumination_score')}")
    print(
        "Illumination status:",
        "needs attention" if (
            data.get("underexposure")
            or data.get("overexposure")
            or data.get("uneven_illumination")
        ) else "acceptable",
    )
    print(f"Field-of-view score: {data.get('field_of_view_score')}")
    print(
        "Field-of-view status:",
        "needs attention" if (
            data.get("insufficient_field_of_view")
            or data.get("severely_cropped")
        ) else "acceptable",
    )
    print(f"Enhancement applied: {data.get('enhancement_applied', False)}")
    print(f"Enhancements: {data.get('enhancements_used', [])}")
    print(f"Recapture required: {data.get('recapture_required', False)}")
    print(f"Recapture feedback: {data.get('recapture_feedback')}")
    print(f"Raw focus measure: {data.get('focus_measure')}")


def _process_single(image_path: Path) -> int:
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    result = process_image(str(image_path))
    _print_result(image_path, result.to_dict())
    return 0


def _process_directory(directory: Path) -> int:
    images = _iter_images(directory)
    if not images:
        print(f"No supported images found in: {directory}", file=sys.stderr)
        return 1

    print(f"Processing {len(images)} image(s) in: {directory}")
    for image_path in images:
        try:
            result = process_image(str(image_path))
            _print_result(image_path, result.to_dict())
        except (OSError, ValueError) as error:
            print(f"Skipping {image_path.name}: {error}", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run the quality pipeline on real APTOS images."
    )
    parser.add_argument(
        "--image",
        type=Path,
        help="Single image file to process.",
    )
    parser.add_argument(
        "--directory",
        type=Path,
        default=ROOT / "test_images",
        help="Directory of images to process (default: test_images/).",
    )
    args = parser.parse_args()

    if args.image:
        return _process_single(args.image)
    if not args.directory.is_dir():
        parser.error(f"Not a directory: {args.directory}")
    return _process_directory(args.directory)


if __name__ == "__main__":
    raise SystemExit(main())