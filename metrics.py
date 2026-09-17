"""
Evaluation Metrics for IDRiD Retinal Lesion Segmentation.
Computes Dice Score (F1), IoU (Jaccard), Precision, and Recall per lesion class.
"""

import torch
import numpy as np

CLASS_NAMES = ["Microaneurysms (MA)", "Hemorrhages (HE)", "Hard Exudates (EX)", "Soft Exudates (SE)"]
CLASS_KEYS = ["MA", "HE", "EX", "SE"]

def calculate_metrics_per_class(pred_masks, target_masks, threshold=0.5, eps=1e-7):
    """
    Computes per-class evaluation metrics.
    pred_masks: torch.Tensor or np.ndarray of shape (N, C, H, W) probabilities or logits
    target_masks: torch.Tensor or np.ndarray of shape (N, C, H, W) binary [0, 1]
    
    Returns dict mapping class key ('MA', 'HE', 'EX', 'SE') to metrics dict.
    """
    if isinstance(pred_masks, torch.Tensor):
        if pred_masks.is_cuda or pred_masks.is_mps:
            pred_masks = pred_masks.cpu()
        if (pred_masks < 0).any() or (pred_masks > 1).any():
            pred_masks = torch.sigmoid(pred_masks)
        pred_binary = (pred_masks > threshold).numpy().astype(np.uint8)
    else:
        pred_binary = (pred_masks > threshold).astype(np.uint8)
        
    if isinstance(target_masks, torch.Tensor):
        if target_masks.is_cuda or target_masks.is_mps:
            target_masks = target_masks.cpu()
        target_binary = target_masks.numpy().astype(np.uint8)
    else:
        target_binary = target_masks.astype(np.uint8)

    num_classes = target_binary.shape[1]
    results = {}

    for c in range(num_classes):
        key = CLASS_KEYS[c] if c < len(CLASS_KEYS) else f"Class_{c}"
        name = CLASS_NAMES[c] if c < len(CLASS_NAMES) else f"Class_{c}"
        
        p = pred_binary[:, c, :, :]
        t = target_binary[:, c, :, :]
        
        tp = np.sum((p == 1) & (t == 1))
        fp = np.sum((p == 1) & (t == 0))
        fn = np.sum((p == 0) & (t == 1))
        tn = np.sum((p == 0) & (t == 0))
        
        dice = (2.0 * tp + eps) / (2.0 * tp + fp + fn + eps)
        iou = (tp + eps) / (tp + fp + fn + eps)
        precision = (tp + eps) / (tp + fp + eps)
        recall = (tp + eps) / (tp + fn + eps)
        
        results[key] = {
            "name": name,
            "dice": float(dice),
            "iou": float(iou),
            "precision": float(precision),
            "recall": float(recall),
            "tp": int(tp),
            "fp": int(fp),
            "fn": int(fn),
            "tn": int(tn),
            "gt_pixel_count": int(np.sum(t == 1)),
            "pred_pixel_count": int(np.sum(p == 1))
        }

    # Also compute overall mean metrics
    mean_dice = np.mean([results[k]["dice"] for k in results])
    mean_iou = np.mean([results[k]["iou"] for k in results])
    mean_precision = np.mean([results[k]["precision"] for k in results])
    mean_recall = np.mean([results[k]["recall"] for k in results])

    results["Mean"] = {
        "name": "Mean / Overall",
        "dice": float(mean_dice),
        "iou": float(mean_iou),
        "precision": float(mean_precision),
        "recall": float(mean_recall)
    }

    return results


def print_metrics_table(metrics_dict):
    """Prints formatted ASCII table of metrics for console and logs."""
    header = f"{'Class':<22} | {'Dice Score':<10} | {'IoU':<10} | {'Precision':<10} | {'Recall':<10}"
    divider = "-" * len(header)
    print("\n" + divider)
    print(header)
    print(divider)
    for key, m in metrics_dict.items():
        if key == "Mean":
            print(divider)
        print(f"{m['name']:<22} | {m['dice']:<10.4f} | {m['iou']:<10.4f} | {m['precision']:<10.4f} | {m['recall']:<10.4f}")
    print(divider + "\n")


if __name__ == "__main__":
    p = np.random.rand(4, 4, 128, 128)
    t = (np.random.rand(4, 4, 128, 128) > 0.8).astype(np.uint8)
    res = calculate_metrics_per_class(p, t)
    print_metrics_table(res)
