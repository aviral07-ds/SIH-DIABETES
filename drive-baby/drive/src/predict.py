"""Inference script for DRIVE vessel segmentation.

Usage:
    python -m src.predict --image ../dataset/test/images/01_test.tif
    python -m src.predict --image input.png --output pred.png --threshold 0.5
"""

import argparse
import os
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from PIL import Image

from .config import DriveConfig
from .dataset import preprocess, read_gray
from .logging_utils import setup_logging
from .model import build_unet

logger = setup_logging()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Predict vessel segmentation for a single fundus image."
    )
    parser.add_argument(
        "--image",
        type=str,
        required=True,
        help="Path to the input image.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to save the predicted vessel mask.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Path to the model checkpoint.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=None,
        help="Probability threshold for vessel classification (0-1).",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Device to use (cuda, cuda:0, cpu).",
    )
    parser.add_argument(
        "--save-overlay",
        action="store_true",
        help="Also save an overlay of the prediction on the input image.",
    )
    return parser.parse_args()


def load_model(
    model_path: str,
    device: torch.device,
    in_channels: int = 1,
    out_channels: int = 1,
):
    """Load a U-Net checkpoint and return an eval-mode model."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model checkpoint not found: {model_path}")

    model = build_unet(
        in_channels=in_channels,
        out_channels=out_channels,
        pretrained_path=model_path,
        device=str(device),
    )
    model.eval()
    return model


def predict_vessel_mask(
    model,
    image: np.ndarray,
    image_size: tuple = (512, 512),
    threshold: float = 0.5,
    device: torch.device = torch.device("cpu"),
) -> np.ndarray:
    """Run inference and return a binary vessel mask.

    Args:
        model: Trained U-Net model.
        image: Input grayscale image as numpy array.
        image_size: Target size for resizing.
        threshold: Probability threshold for vessel classification.
        device: Device to run inference on.

    Returns:
        Binary vessel mask as uint8 numpy array (0 or 255).
    """
    tensor = preprocess(image, size=image_size).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.sigmoid(logits)[0, 0].cpu().numpy()

    mask = (probabilities >= threshold).astype(np.uint8) * 255
    return mask


def save_mask(mask: np.ndarray, output_path: str) -> None:
    """Save a binary mask as an image file."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask).save(output_path)
    logger.info("Saved mask: %s", output_path)


def save_overlay(
    original_image: np.ndarray,
    mask: np.ndarray,
    output_path: str,
    alpha: float = 0.5,
) -> None:
    """Save an overlay of the mask on the original image."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Resize mask to match original if needed
    if mask.shape != original_image.shape:
        mask_img = Image.fromarray(mask)
        mask_resized = mask_img.resize(
            (original_image.shape[1], original_image.shape[0]),
            Image.Resampling.NEAREST,
        )
        mask = np.array(mask_resized)

    # Create colored overlay (red for vessels)
    overlay = np.stack([original_image] * 3, axis=-1).astype(np.float32)
    overlay[..., 0] = np.where(mask > 0, overlay[..., 0] * (1 - alpha) + 255 * alpha, overlay[..., 0])
    overlay = np.clip(overlay, 0, 255).astype(np.uint8)

    Image.fromarray(overlay).save(output_path)
    logger.info("Saved overlay: %s", output_path)


def main() -> None:
    """Entry point for command-line inference."""
    args = parse_args()
    config = DriveConfig()

    # Determine device
    device_str = args.device
    if device_str:
        device = torch.device(device_str)
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Using device: %s", device)

    # Load model
    model_path = args.model or config.inference.model_path
    model = load_model(model_path, device)

    # Load and preprocess image
    if not os.path.exists(args.image):
        raise FileNotFoundError(f"Input image not found: {args.image}")

    original_image = read_gray(args.image)
    logger.info("Loaded image: %s (shape=%s)", args.image, original_image.shape)

    # Predict
    threshold = args.threshold if args.threshold is not None else config.inference.threshold
    mask = predict_vessel_mask(
        model,
        original_image,
        image_size=config.inference.image_size,
        threshold=threshold,
        device=device,
    )

    # Save results
    output_path = args.output or os.path.join(
        config.inference.output_dir,
        f"{Path(args.image).stem}_prediction.png",
    )
    save_mask(mask, output_path)

    if args.save_overlay:
        overlay_path = str(Path(output_path).with_suffix("_overlay.png"))
        save_overlay(original_image, mask, overlay_path)


if __name__ == "__main__":
    main()