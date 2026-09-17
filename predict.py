"""
Inference script for IDRiD Retinal Lesion Segmentation.
Loads trained UNet checkpoint, preprocesses fundus image, predicts 4 lesion classes,
calculates surface area occupied, and generates color-coded lesion overlay.
"""

import os
import argparse
import numpy as np
import cv2
from PIL import Image
import torch

from model import UNet
from dataset import apply_clahe, LESION_TYPES

# Color definitions for multi-lesion overlay (RGB)
LESION_COLORS_RGB = {
    "MA": (255, 0, 0),      # Microaneurysms: Bright Red
    "HE": (200, 0, 100),    # Hemorrhages: Deep Red / Magenta
    "EX": (255, 255, 0),    # Hard Exudates: Yellow
    "SE": (0, 255, 255)     # Soft Exudates: Cyan
}

LESION_NAMES_FULL = {
    "MA": "Microaneurysms (MA)",
    "HE": "Hemorrhages (HE)",
    "EX": "Hard Exudates (EX)",
    "SE": "Soft Exudates (SE)"
}

def load_prediction_model(checkpoint_path, device):
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")
        
    checkpoint = torch.load(checkpoint_path, map_location=device)
    args = checkpoint.get("args", {})
    base_c = args.get("base_c", 32)
    
    model = UNet(n_channels=3, n_classes=4, base_c=base_c).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, args


def create_color_overlay(img_rgb, binary_masks, alpha=0.5):
    """
    Creates a composite multi-lesion color-coded overlay image.
    img_rgb: (H, W, 3) uint8 numpy array
    binary_masks: (4, H, W) uint8 numpy array [0, 1]
    """
    overlay = img_rgb.copy().astype(np.float32)
    color_mask = np.zeros_like(img_rgb, dtype=np.float32)
    has_lesion = np.zeros(img_rgb.shape[:2], dtype=bool)

    for i, code in enumerate(LESION_TYPES):
        mask_i = binary_masks[i] > 0
        if np.any(mask_i):
            color = LESION_COLORS_RGB[code]
            color_mask[mask_i] = color
            has_lesion[mask_i] = True

    # Blend color mask onto original image where lesions are present
    overlay[has_lesion] = (1 - alpha) * overlay[has_lesion] + alpha * color_mask[has_lesion]
    return np.clip(overlay, 0, 255).astype(np.uint8)


def predict_single_image(model, image_path, device, img_size=(256, 256), threshold=0.5, use_clahe=True):
    """
    Predicts lesion segmentation for a single image file.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Unable to read image at: {image_path}")

    orig_h, orig_w = img_bgr.shape[:2]

    if use_clahe:
        enhanced_rgb = apply_clahe(img_bgr)
    else:
        enhanced_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Resize for UNet
    resized_rgb = cv2.resize(enhanced_rgb, img_size, interpolation=cv2.INTER_LINEAR)
    
    # Normalization
    img_tensor = torch.from_numpy(resized_rgb.transpose(2, 0, 1)).float() / 255.0
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img_tensor = (img_tensor - mean) / std
    img_tensor = img_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(img_tensor)
        probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()

    # Binary masks at original resolution & resized resolution
    binary_masks_resized = (probs > threshold).astype(np.uint8)
    binary_masks_orig = np.zeros((4, orig_h, orig_w), dtype=np.uint8)

    # Estimate fundus retina area (non-black pixels)
    gray_orig = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    retina_pixel_count = np.sum(gray_orig > 10)
    if retina_pixel_count == 0:
        retina_pixel_count = orig_h * orig_w

    lesion_stats = {}

    for i, code in enumerate(LESION_TYPES):
        m_orig = cv2.resize(binary_masks_resized[i], (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
        binary_masks_orig[i] = m_orig
        
        px_count = int(np.sum(m_orig))
        area_pct = (px_count / retina_pixel_count) * 100.0
        
        lesion_stats[code] = {
            "name": LESION_NAMES_FULL[code],
            "detected": bool(px_count > 0),
            "pixel_count": px_count,
            "area_percentage": float(area_pct)
        }

    orig_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    overlay_orig = create_color_overlay(orig_rgb, binary_masks_orig, alpha=0.55)

    return {
        "probabilities": probs,
        "binary_masks_resized": binary_masks_resized,
        "binary_masks_orig": binary_masks_orig,
        "orig_rgb": orig_rgb,
        "enhanced_rgb": enhanced_rgb,
        "overlay_orig": overlay_orig,
        "lesion_stats": lesion_stats
    }


def main():
    parser = argparse.ArgumentParser(description="Predict retinal lesions for a fundus image")
    parser.add_argument("--image", type=str, required=True, help="Path to input fundus image")
    parser.add_argument("--checkpoint", type=str, default="./checkpoints/best_model.pth", help="Model checkpoint path")
    parser.add_argument("--output-dir", type=str, default="./output_predictions", help="Output directory to save results")
    parser.add_argument("--threshold", type=float, default=0.5, help="Detection confidence threshold")
    parser.add_argument("--img-size", type=int, default=256, help="Input size for UNet")

    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"))
    print(f"Loading checkpoint: {args.checkpoint} on {device}")
    model, model_args = load_prediction_model(args.checkpoint, device)

    os.makedirs(args.output_dir, exist_ok=True)
    res = predict_single_image(model, args.image, device, img_size=(args.img_size, args.img_size), threshold=args.threshold)

    print("\n--- Lesion Segmentation Results ---")
    for code, stats in res["lesion_stats"].items():
        status = "DETECTED" if stats["detected"] else "Clean"
        print(f"  {stats['name']:<25}: {status:<8} | Pixels: {stats['pixel_count']:<6} | Retinal Area: {stats['area_percentage']:.2f}%")

    base_name = os.path.splitext(os.path.basename(args.image))[0]
    overlay_save_path = os.path.join(args.output_dir, f"{base_name}_overlay.png")
    cv2.imwrite(overlay_save_path, cv2.cvtColor(res["overlay_orig"], cv2.COLOR_RGB2BGR))
    print(f"\nSaved color-coded lesion overlay to: {overlay_save_path}")


if __name__ == "__main__":
    main()
