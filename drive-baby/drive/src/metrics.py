"""Evaluation metrics for DRIVE vessel segmentation."""

import numpy as np
import torch
from torch.utils.data import DataLoader


def compute_metrics(
    predictions: np.ndarray,
    targets: np.ndarray,
    threshold: float = 0.5,
) -> dict:
    """Compute standard binary segmentation metrics.

    Args:
        predictions: Predicted probabilities or logits.
        targets: Binary ground-truth masks.
        threshold: Threshold for converting probabilities to binary predictions.

    Returns:
        Dictionary of metric names to float values.
    """
    predictions = np.asarray(predictions)
    targets = np.asarray(targets)

    if predictions.ndim == 4:
        predictions = predictions.squeeze(1)
    if targets.ndim == 4:
        targets = targets.squeeze(1)

    if predictions.dtype != bool and np.issubdtype(predictions.dtype, np.floating):
        predictions = predictions >= threshold

    predictions = predictions.astype(bool)
    targets = targets.astype(bool)

    tp = np.logical_and(predictions, targets).sum()
    tn = np.logical_and(~predictions, ~targets).sum()
    fp = np.logical_and(predictions, ~targets).sum()
    fn = np.logical_and(~predictions, targets).sum()

    dice = 2 * tp / (2 * tp + fp + fn + 1e-8)
    iou = tp / (tp + fp + fn + 1e-8)
    sensitivity = tp / (tp + fn + 1e-8)
    specificity = tn / (tn + fp + 1e-8)
    accuracy = (tp + tn) / (tp + tn + fp + fn + 1e-8)
    precision = tp / (tp + fp + 1e-8)

    return {
        "dice": float(dice),
        "iou": float(iou),
        "sensitivity": float(sensitivity),
        "specificity": float(specificity),
        "accuracy": float(accuracy),
        "precision": float(precision),
    }


def evaluate_loader(
    model,
    data_loader: DataLoader,
    device: torch.device,
    threshold: float = 0.5,
) -> dict:
    """Evaluate a model on a full DataLoader.

    Args:
        model: Trained PyTorch model.
        data_loader: DataLoader providing (images, masks) tuples.
        device: Device to run inference on.
        threshold: Probability threshold for binary prediction.

    Returns:
        Dictionary of averaged metrics.
    """
    model.eval()

    all_predictions = []
    all_targets = []

    with torch.no_grad():
        for images, masks in data_loader:
            images = images.to(device)
            masks = masks.to(device)
            logits = model(images)
            probabilities = torch.sigmoid(logits)

            all_predictions.append(probabilities.cpu().numpy())
            all_targets.append(masks.cpu().numpy())

    predictions = np.concatenate(all_predictions, axis=0)
    targets = np.concatenate(all_targets, axis=0)

    return compute_metrics(predictions, targets, threshold=threshold)


def evaluate_single_image(
    model,
    image: torch.Tensor,
    mask: torch.Tensor,
    device: torch.device,
    threshold: float = 0.5,
) -> dict:
    """Evaluate a model on a single image-mask pair.

    Args:
        model: Trained PyTorch model.
        image: Input image tensor of shape (1, C, H, W).
        mask: Ground-truth mask tensor of shape (1, H, W).
        device: Device to run inference on.
        threshold: Probability threshold for binary prediction.

    Returns:
        Dictionary of metrics.
    """
    model.eval()
    with torch.no_grad():
        image = image.to(device)
        mask = mask.to(device)
        logits = model(image)
        probabilities = torch.sigmoid(logits)

    return compute_metrics(
        probabilities.cpu().numpy(),
        mask.cpu().numpy(),
        threshold=threshold,
    )


def print_metrics(metrics: dict, prefix: str = "") -> None:
    """Pretty-print evaluation metrics."""
    print(f"\n{prefix} Metrics:")
    print("-" * 40)
    for key, value in metrics.items():
        print(f"  {key:>15}: {value:.4f}")
    print()