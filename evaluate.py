"""
Evaluation and Visualization script for IDRiD Retinal Lesion Segmentation.
Computes per-class Dice, IoU, Precision, Recall and generates side-by-side comparison grids.
"""

import os
import json
import argparse
import numpy as np
import cv2
import matplotlib.pyplot as plt
import torch
from torch.utils.data import DataLoader

from dataset import discover_idrid_pairs, IDRiDDataset, LESION_TYPES
from model import UNet
from predict import create_color_overlay, LESION_COLORS_RGB
from metrics import calculate_metrics_per_class, print_metrics_table

def evaluate_dataset(args):
    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"))
    print(f"Running evaluation on device: {device}")

    # Load Model
    checkpoint = torch.load(args.checkpoint, map_location=device)
    base_c = checkpoint.get("args", {}).get("base_c", 32)
    model = UNet(n_channels=3, n_classes=4, base_c=base_c).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Discover Dataset
    pairs = discover_idrid_pairs(args.dataset_dir)
    print(f"Found {len(pairs)} dataset samples for evaluation.")
    
    val_ds = IDRiDDataset(pairs, img_size=(args.img_size, args.img_size), use_clahe=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    all_preds = []
    all_targets = []
    sample_visuals = []

    with torch.no_grad():
        for images, targets, ids, raw_rgbs in val_loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.sigmoid(logits).cpu()

            all_preds.append(probs)
            all_targets.append(targets.cpu())

            # Store first few samples for plotting
            if len(sample_visuals) < args.max_vis_samples:
                for b in range(images.size(0)):
                    if len(sample_visuals) < args.max_vis_samples:
                        sample_visuals.append({
                            "id": ids[b],
                            "raw_rgb": raw_rgbs[b].numpy(),
                            "pred_prob": probs[b].numpy(),
                            "gt_target": targets[b].numpy()
                        })

    all_preds_cat = torch.cat(all_preds, dim=0)
    all_targets_cat = torch.cat(all_targets, dim=0)

    metrics = calculate_metrics_per_class(all_preds_cat, all_targets_cat, threshold=args.threshold)
    print_metrics_table(metrics)

    # Save metrics to json
    os.makedirs(args.output_dir, exist_ok=True)
    json_path = os.path.join(args.output_dir, "evaluation_metrics.json")
    with open(json_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved evaluation metrics to: {json_path}")

    # Generate Visualizations Grid
    vis_dir = os.path.join(args.output_dir, "visualizations")
    os.makedirs(vis_dir, exist_ok=True)

    for item in sample_visuals:
        img_id = item["id"]
        raw_rgb = item["raw_rgb"]
        pred_binary = (item["pred_prob"] > args.threshold).astype(np.uint8)
        gt_binary = item["gt_target"].astype(np.uint8)

        gt_overlay = create_color_overlay(raw_rgb, gt_binary, alpha=0.5)
        pred_overlay = create_color_overlay(raw_rgb, pred_binary, alpha=0.5)

        fig, axes = plt.subplots(1, 4, figsize=(20, 5))
        axes[0].imshow(raw_rgb)
        axes[0].set_title(f"Original Fundus ({img_id})")
        axes[0].axis("off")

        axes[1].imshow(gt_overlay)
        axes[1].set_title("Ground Truth Overlay")
        axes[1].axis("off")

        axes[2].imshow(pred_overlay)
        axes[2].set_title("Model Prediction Overlay")
        axes[2].axis("off")

        # Difference / Comparison
        diff_img = np.zeros_like(raw_rgb)
        diff_img[..., 0] = gt_binary.sum(axis=0) * 128 # GT red
        diff_img[..., 1] = pred_binary.sum(axis=0) * 128 # Pred green
        axes[3].imshow(diff_img)
        axes[3].set_title("GT (Red) vs Pred (Green)")
        axes[3].axis("off")

        plt.tight_layout()
        save_path = os.path.join(vis_dir, f"{img_id}_comparison.png")
        plt.savefig(save_path, bbox_inches="tight", dpi=150)
        plt.close()

    print(f"Saved {len(sample_visuals)} visualization comparison grids to: {vis_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate IDRiD Retinal Lesion Model")
    parser.add_argument("--dataset-dir", type=str, default="./data/idrid_sample", help="Dataset directory")
    parser.add_argument("--checkpoint", type=str, default="./checkpoints/best_model.pth", help="Checkpoint file")
    parser.add_argument("--output-dir", type=str, default="./eval_results", help="Output directory")
    parser.add_argument("--threshold", type=float, default=0.5, help="Binarization threshold")
    parser.add_argument("--img-size", type=int, default=256, help="Image size")
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size")
    parser.add_argument("--max-vis-samples", type=int, default=5, help="Number of visualization samples to generate")

    args = parser.parse_args()
    evaluate_dataset(args)
