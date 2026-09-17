"""
Training Pipeline for IDRiD Retinal Lesion Segmentation Model (PyTorch + U-Net).
"""

import os
import json
import argparse
import time
import numpy as np
import torch
from torch.utils.data import DataLoader, random_split

from dataset import discover_idrid_pairs, IDRiDDataset, generate_synthetic_idrid_dataset
from model import UNet
from losses import CombinedLoss
from metrics import calculate_metrics_per_class, print_metrics_table

def select_device():
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print("Using GPU: NVIDIA CUDA")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("Using GPU: Apple Silicon (MPS)")
    else:
        device = torch.device("cpu")
        print("Using CPU")
    return device


def train_model(args):
    device = select_device()
    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Dataset Setup
    if not os.path.exists(args.dataset_dir) or len(os.listdir(args.dataset_dir)) == 0:
        print(f"Dataset path {args.dataset_dir} empty or missing. Generating synthetic sample dataset...")
        generate_synthetic_idrid_dataset(args.dataset_dir, num_samples=args.num_samples, img_size=(args.img_size, args.img_size))

    pairs = discover_idrid_pairs(args.dataset_dir)
    if len(pairs) == 0:
        print(f"No valid image-mask pairs found in {args.dataset_dir}. Generating synthetic dataset...")
        generate_synthetic_idrid_dataset(args.dataset_dir, num_samples=args.num_samples, img_size=(args.img_size, args.img_size))
        pairs = discover_idrid_pairs(args.dataset_dir)

    print(f"Total dataset samples: {len(pairs)}")

    # Split dataset (80% train, 20% validation)
    val_size = max(1, int(len(pairs) * args.val_ratio))
    train_size = len(pairs) - val_size
    generator = torch.Generator().manual_seed(args.seed)
    train_pairs, val_pairs = random_split(pairs, [train_size, val_size], generator=generator)

    train_ds = IDRiDDataset(train_pairs, img_size=(args.img_size, args.img_size), use_clahe=True)
    val_ds = IDRiDDataset(val_pairs, img_size=(args.img_size, args.img_size), use_clahe=True)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # 2. Model & Optimizer
    model = UNet(n_channels=3, n_classes=4, base_c=args.base_c).to(device)
    criterion = CombinedLoss(bce_weight=1.0, dice_weight=1.0)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)

    best_val_dice = 0.0
    history = {"epochs": [], "train_loss": [], "val_loss": [], "metrics": []}

    print("\nStarting Training...")
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        # Training Phase
        model.train()
        running_train_loss = 0.0
        running_bce = 0.0
        running_dice = 0.0

        for images, targets, _, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss, bce, dice = criterion(logits, targets)

            loss.backward()
            optimizer.step()

            running_train_loss += loss.item() * images.size(0)
            running_bce += bce.item() * images.size(0)
            running_dice += dice.item() * images.size(0)

        epoch_train_loss = running_train_loss / train_size

        # Validation Phase
        model.eval()
        running_val_loss = 0.0
        all_preds = []
        all_targets = []

        with torch.no_grad():
            for images, targets, _, _ in val_loader:
                images = images.to(device)
                targets = targets.to(device)

                logits = model(images)
                loss, _, _ = criterion(logits, targets)

                running_val_loss += loss.item() * images.size(0)
                
                probs = torch.sigmoid(logits)
                all_preds.append(probs.cpu())
                all_targets.append(targets.cpu())

        epoch_val_loss = running_val_loss / val_size

        # Concatenate predictions for metrics calculation
        val_preds_cat = torch.cat(all_preds, dim=0)
        val_targets_cat = torch.cat(all_targets, dim=0)
        
        metrics = calculate_metrics_per_class(val_preds_cat, val_targets_cat, threshold=args.threshold)
        val_mean_dice = metrics["Mean"]["dice"]

        scheduler.step(val_mean_dice)

        # Logging
        print(f"Epoch [{epoch:02d}/{args.epochs:02d}] | Train Loss: {epoch_train_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | Val Mean Dice: {val_mean_dice:.4f}")

        history["epochs"].append(epoch)
        history["train_loss"].append(float(epoch_train_loss))
        history["val_loss"].append(float(epoch_val_loss))
        history["metrics"].append(metrics)

        # Save Checkpoints
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "val_mean_dice": val_mean_dice,
            "metrics": metrics,
            "args": vars(args)
        }

        # Save latest checkpoint
        torch.save(checkpoint, os.path.join(args.output_dir, "checkpoint.pth"))

        # Save best model checkpoint
        if val_mean_dice >= best_val_dice:
            best_val_dice = val_mean_dice
            torch.save(checkpoint, os.path.join(args.output_dir, "best_model.pth"))
            print(f"  --> Saved new best model checkpoint! Val Mean Dice: {best_val_dice:.4f}")

    total_time = time.time() - start_time
    print(f"\nTraining completed in {total_time/60:.2f} minutes. Best Val Mean Dice: {best_val_dice:.4f}")

    # Save history json
    history_file = os.path.join(args.output_dir, "history.json")
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)

    # Print final validation metrics table
    print("\nFinal Validation Metrics Table (Best Model):")
    best_checkpoint = torch.load(os.path.join(args.output_dir, "best_model.pth"), map_location="cpu")
    print_metrics_table(best_checkpoint["metrics"])

    return best_checkpoint


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train IDRiD Retinal Lesion Segmentation Model")
    parser.add_argument("--dataset-dir", type=str, default="./data/idrid", help="Path to IDRiD dataset directory")
    parser.add_argument("--output-dir", type=str, default="./checkpoints", help="Directory to save checkpoints")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=1e-3, help="Initial learning rate")
    parser.add_argument("--img-size", type=int, default=256, help="Input image dimension (H=W)")
    parser.add_argument("--base-c", type=int, default=32, help="U-Net base channel count")
    parser.add_argument("--threshold", type=float, default=0.5, help="Probability threshold for binarization")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation set ratio")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--num-samples", type=int, default=25, help="Number of synthetic samples if generated")

    args = parser.parse_args()
    train_model(args)
