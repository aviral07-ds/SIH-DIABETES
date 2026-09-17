"""Training script for DRIVE retinal blood vessel segmentation.

Usage:
    python -m src.train --epochs 50 --batch-size 2
    python -m src.train --help
"""

import argparse
import os
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn

from .config import DriveConfig
from .dataset import create_dataloaders
from .losses import CombinedLoss
from .logging_utils import setup_logging
from .model import UNet
from .metrics import evaluate_loader

logger = setup_logging()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train U-Net for DRIVE vessel segmentation."
    )
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to training data directory (default: ../dataset/training).",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=None,
        help="Number of training epochs.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Batch size.",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=None,
        help="Learning rate.",
    )
    parser.add_argument(
        "--weight-decay",
        type=float,
        default=None,
        help="Weight decay for Adam optimizer.",
    )
    parser.add_argument(
        "--checkpoint-dir",
        type=str,
        default=None,
        help="Directory to save checkpoints.",
    )
    parser.add_argument(
        "--checkpoint-name",
        type=str,
        default=None,
        help="Checkpoint filename.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed.",
    )
    parser.add_argument(
        "--early-stop-patience",
        type=int,
        default=None,
        help="Epochs to wait before early stopping.",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Device to use (cuda, cuda:0, cpu).",
    )
    parser.add_argument(
        "--use-augmentation",
        action="store_true",
        default=None,
        help="Enable data augmentation.",
    )
    return parser.parse_args()


def train(config: Optional[DriveConfig] = None, **kwargs) -> str:
    """Run the training loop.

    Args:
        config: DriveConfig instance. If None, defaults are used.
        **kwargs: Override config values (e.g., epochs=100).

    Returns:
        Path to the best checkpoint.
    """
    config = config or DriveConfig()
    train_cfg = config.training

    # Apply overrides
    for key, value in kwargs.items():
        if value is not None and hasattr(train_cfg, key):
            object.__setattr__(train_cfg, key, value)

    # Determine device
    device_str = kwargs.get("device")
    if device_str:
        device = torch.device(device_str)
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Using device: %s", device)

    # Data
    data_dir = kwargs.get("data") or train_cfg.data_dir
    image_dir = os.path.join(data_dir, train_cfg.image_subdir)
    mask_dir = os.path.join(data_dir, train_cfg.mask_subdir)

    logger.info("Loading data from: %s", data_dir)
    train_loader, val_loader, dataset_size = create_dataloaders(
        image_dir=image_dir,
        mask_dir=mask_dir,
        batch_size=train_cfg.batch_size,
        val_split=0.2,
        image_size=train_cfg.image_size,
        num_workers=train_cfg.num_workers,
        seed=train_cfg.seed,
    )
    logger.info(
        "Dataset: %d samples (train=%d, val=%d)",
        dataset_size,
        len(train_loader.dataset),
        len(val_loader.dataset),
    )

    # Model
    model = UNet(
        in_channels=train_cfg.in_channels,
        out_channels=train_cfg.out_channels,
    ).to(device)

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info("Model parameters: %d total, %d trainable", total_params, trainable_params)

    # Loss, optimizer, scheduler
    criterion = CombinedLoss(bce_weight=1.0, dice_weight=1.0)
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=train_cfg.learning_rate,
        weight_decay=train_cfg.weight_decay,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5, verbose=True
    )

    # Checkpoint directory
    checkpoint_dir = kwargs.get("checkpoint_dir") or train_cfg.checkpoint_dir
    checkpoint_dir = Path(checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    best_checkpoint_path = checkpoint_dir / train_cfg.checkpoint_name

    # Training loop
    best_val_loss = float("inf")
    epochs_since_improvement = 0

    for epoch in range(1, train_cfg.epochs + 1):
        # Training phase
        model.train()
        train_loss = 0.0
        train_batches = 0

        for images, masks in train_loader:
            images = images.to(device)
            masks = masks.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            train_batches += 1

        avg_train_loss = train_loss / max(train_batches, 1)

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_batches = 0
        with torch.no_grad():
            for images, masks in val_loader:
                images = images.to(device)
                masks = masks.to(device)
                logits = model(images)
                loss = criterion(logits, masks)
                val_loss += loss.item()
                val_batches += 1

        avg_val_loss = val_loss / max(val_batches, 1)
        scheduler.step(avg_val_loss)

        logger.info(
            "Epoch %03d/%03d | train_loss=%.4f | val_loss=%.4f | lr=%.2e",
            epoch,
            train_cfg.epochs,
            avg_train_loss,
            avg_val_loss,
            optimizer.param_groups[0]["lr"],
        )

        # Checkpointing
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            epochs_since_improvement = 0
            torch.save(model.state_dict(), best_checkpoint_path)
            logger.info("Saved best checkpoint: %s", best_checkpoint_path)
        else:
            epochs_since_improvement += 1
            if epochs_since_improvement >= train_cfg.early_stop_patience:
                logger.info(
                    "Early stopping triggered after %d epochs without improvement.",
                    train_cfg.early_stop_patience,
                )
                break

    logger.info("Training complete. Best checkpoint: %s", best_checkpoint_path)
    return str(best_checkpoint_path)


def main() -> None:
    """Entry point for command-line training."""
    args = parse_args()
    config = DriveConfig()
    train(
        config,
        data=args.data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        weight_decay=args.weight_decay,
        checkpoint_dir=args.checkpoint_dir,
        checkpoint_name=args.checkpoint_name,
        seed=args.seed,
        early_stop_patience=args.early_stop_patience,
        device=args.device,
    )


if __name__ == "__main__":
    main()