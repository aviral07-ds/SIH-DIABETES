"""Evaluation script for DRIVE vessel segmentation.

Usage:
    python -m src.evaluate --data ../dataset/test --model ../models/best_model.pth
    python -m src.evaluate --help
"""

import argparse
import os
from pathlib import Path

import torch

from .config import DriveConfig
from .dataset import DRIVEDataset, create_dataloaders
from .logging_utils import setup_logging
from .metrics import evaluate_loader, print_metrics
from .model import build_unet

logger = setup_logging()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate U-Net on the DRIVE test set."
    )
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to test data directory.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Path to the model checkpoint.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Batch size for evaluation.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=None,
        help="Probability threshold for vessel classification.",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Device to use (cuda, cuda:0, cpu).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to save metrics as JSON.",
    )
    return parser.parse_args()


def evaluate(
    config: DriveConfig = None,
    data_dir: str = None,
    model_path: str = None,
    batch_size: int = None,
    threshold: float = None,
    device: torch.device = None,
    output_path: str = None,
) -> dict:
    """Run evaluation on the test set.

    Args:
        config: DriveConfig instance.
        data_dir: Path to test data directory.
        model_path: Path to model checkpoint.
        batch_size: Batch size.
        threshold: Probability threshold.
        device: Device to use.
        output_path: Optional path to save metrics as JSON.

    Returns:
        Dictionary of evaluation metrics.
    """
    config = config or DriveConfig()
    inference_cfg = config.inference
    train_cfg = config.training

    # Determine device
    if device is None:
        device_str = "cuda" if torch.cuda.is_available() else "cpu"
        device = torch.device(device_str)
    logger.info("Using device: %s", device)

    # Data
    test_dir = data_dir or "../dataset/test"
    image_dir = os.path.join(test_dir, "images")
    mask_dir = os.path.join(test_dir, "1st_manual")

    if not Path(image_dir).is_dir():
        raise FileNotFoundError(f"Test image directory not found: {image_dir}")

    logger.info("Loading test data from: %s", test_dir)

    # Use the full dataset (no split) for test evaluation
    test_dataset = DRIVEDataset(
        image_dir=image_dir,
        mask_dir=mask_dir,
        size=train_cfg.image_size,
    )

    test_loader = torch.utils.data.DataLoader(
        test_dataset,
        batch_size=batch_size or train_cfg.batch_size,
        shuffle=False,
        num_workers=train_cfg.num_workers,
        pin_memory=True,
    )

    logger.info("Test dataset: %d samples", len(test_dataset))

    # Load model
    checkpoint_path = model_path or inference_cfg.model_path
    if not Path(checkpoint_path).exists():
        raise FileNotFoundError(f"Model checkpoint not found: {checkpoint_path}")

    model = build_unet(
        in_channels=train_cfg.in_channels,
        out_channels=train_cfg.out_channels,
        pretrained_path=checkpoint_path,
        device=str(device),
    )
    model.eval()

    # Evaluate
    logger.info("Evaluating model...")
    metrics = evaluate_loader(
        model,
        test_loader,
        device=device,
        threshold=threshold or inference_cfg.threshold,
    )

    print_metrics(metrics, prefix="Test")

    # Save metrics if requested
    if output_path:
        import json
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(metrics, f, indent=2)
        logger.info("Saved metrics to: %s", output_path)

    return metrics


def main() -> None:
    """Entry point for command-line evaluation."""
    args = parse_args()
    evaluate(
        config=DriveConfig(),
        data_dir=args.data,
        model_path=args.model,
        batch_size=args.batch_size,
        threshold=args.threshold,
        device=torch.device(args.device) if args.device else None,
        output_path=args.output,
    )


if __name__ == "__main__":
    main()