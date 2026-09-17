"""
Dataset loader, auto-matching logic, CLAHE preprocessing, and sample generator for IDRiD.
"""

import os
import glob
import re
import argparse
import numpy as np
import cv2
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader

# Class order: 0: MA, 1: HE, 2: EX, 3: SE
LESION_TYPES = ["MA", "HE", "EX", "SE"]
LESION_NAMES = {
    "MA": ["microaneurysm", "1. microaneurysm", "1. ma"],
    "HE": ["haemorrhage", "hemorrhage", "2. haemorrhage", "2. hemorrhage", "2. he"],
    "EX": ["hard exudate", "3. hard exudate", "3. ex"],
    "SE": ["soft exudate", "4. soft exudate", "4. se"]
}

def apply_clahe(img_bgr):
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization)
    to the Green channel of a BGR fundus image to highlight lesions.
    Returns RGB image with enhanced Green channel.
    """
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(img_lab)
    
    # CLAHE on L channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    
    limg = cv2.merge((cl, a, b))
    enhanced_bgr = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
    return enhanced_rgb


def discover_idrid_pairs(dataset_dir):
    """
    Automatically inspects dataset_dir and pairs images with ground truth lesion masks.
    Supports official IDRiD structure, flat structure, or subfolders.
    """
    image_paths = []
    exts = ('*.jpg', '*.jpeg', '*.png', '*.tif', '*.tiff', '*.JPG', '*.PNG')
    
    img_dirs = []
    for root, dirs, files in os.walk(dataset_dir):
        if any(keyword in root.lower() for keyword in ['original', 'images', 'train', 'test', 'img']):
            if not any(k in root.lower() for k in ['groundtruth', 'mask', 'microaneurysm', 'exudates', 'haemorrhages']):
                if any(f.lower().endswith(('.jpg', '.jpeg', '.png', '.tif')) for f in files):
                    img_dirs.append(root)

    if not img_dirs:
        img_dirs = [dataset_dir]

    for d in img_dirs:
        for ext in exts:
            image_paths.extend(glob.glob(os.path.join(d, ext)))

    image_paths = sorted(list(set(image_paths)))
    image_paths = [p for p in image_paths if not any(k in p.lower() for k in ['groundtruth', 'mask', 'microaneurysm', 'exudates', 'haemorrhages', '_ma.', '_he.', '_ex.', '_se.'])]

    print(f"Found {len(image_paths)} candidate fundus images in {dataset_dir}")

    paired_data = []
    
    # Find all mask files (exclude original images directory)
    all_mask_files = []
    for root, dirs, files in os.walk(dataset_dir):
        # Must be in groundtruth dir or have mask keywords
        root_l = root.lower()
        if 'groundtruth' in root_l or 'mask' in root_l or any(k in root_l for k in ['microaneurysm', 'haemorrhage', 'hemorrhage', 'exudate']):
            for f in files:
                if f.lower().endswith(('.tif', '.tiff', '.png', '.jpg', '.jpeg')):
                    all_mask_files.append(os.path.join(root, f))
        else:
            for f in files:
                f_l = f.lower()
                if any(f_l.endswith(f"_{code.lower()}{ext}") for code in LESION_TYPES for ext in ['.tif', '.tiff', '.png', '.jpg', '.jpeg']):
                    all_mask_files.append(os.path.join(root, f))

    for img_path in image_paths:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        match = re.search(r'(IDRiD_\d+|\d+)', base_name, re.IGNORECASE)
        img_id = match.group(1) if match else base_name

        masks_dict = {"MA": None, "HE": None, "EX": None, "SE": None}

        for mask_file in all_mask_files:
            mask_base = os.path.basename(mask_file)
            mask_dir = os.path.dirname(mask_file).lower()
            
            # Check if mask belongs to this image ID
            if img_id.lower() in mask_base.lower():
                for lesion_code, aliases in LESION_NAMES.items():
                    if any(alias in mask_dir for alias in aliases) or f"_{lesion_code.lower()}." in mask_base.lower() or f"_{lesion_code.lower()}_" in mask_base.lower():
                        masks_dict[lesion_code] = mask_file

        paired_data.append({
            "image_path": img_path,
            "id": img_id,
            "masks": masks_dict
        })

    return paired_data


class IDRiDDataset(Dataset):
    """
    PyTorch Dataset for IDRiD Multi-Label Lesion Segmentation.
    """
    def __init__(self, data_pairs, img_size=(256, 256), transform=None, use_clahe=True):
        self.data_pairs = data_pairs
        self.img_size = img_size
        self.transform = transform
        self.use_clahe = use_clahe

    def __len__(self):
        return len(self.data_pairs)

    def __getitem__(self, idx):
        item = self.data_pairs[idx]
        img_path = item["image_path"]
        
        # Load image
        img_bgr = cv2.imread(img_path)
        if img_bgr is None:
            raise ValueError(f"Could not load image at {img_path}")
            
        if self.use_clahe:
            img_rgb = apply_clahe(img_bgr)
        else:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        img_rgb = cv2.resize(img_rgb, self.img_size, interpolation=cv2.INTER_LINEAR)
        H, W = self.img_size

        # Multi-channel mask (4, H, W)
        multi_mask = np.zeros((4, H, W), dtype=np.float32)

        for i, l_code in enumerate(LESION_TYPES):
            mask_path = item["masks"][l_code]
            if mask_path and os.path.exists(mask_path):
                m_img = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
                if m_img is not None:
                    m_resized = cv2.resize(m_img, self.img_size, interpolation=cv2.INTER_NEAREST)
                    multi_mask[i] = (m_resized > 127).astype(np.float32)
            # If mask_path is None, multi_mask[i] remains all zeros

        # Convert image to tensor (3, H, W), normalized to [0, 1]
        img_tensor = torch.from_numpy(img_rgb.transpose(2, 0, 1)).float() / 255.0
        # Standard ImageNet normalization
        mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
        img_tensor = (img_tensor - mean) / std

        mask_tensor = torch.from_numpy(multi_mask).float()

        return img_tensor, mask_tensor, item["id"], img_rgb


def generate_synthetic_idrid_dataset(output_dir, num_samples=30, img_size=(512, 512)):
    """
    Generates synthetic IDRiD dataset simulating realistic fundus images and lesion masks
    (Microaneurysms, Hemorrhages, Hard Exudates, Soft Exudates).
    """
    print(f"Generating synthetic IDRiD dataset in: {output_dir}")
    images_dir = os.path.join(output_dir, "1. Original Images", "a. Training Set")
    os.makedirs(images_dir, exist_ok=True)

    gt_root = os.path.join(output_dir, "2. Groundtruths", "a. Training Set")
    lesion_dirs = {
        "MA": os.path.join(gt_root, "1. Microaneurysms"),
        "HE": os.path.join(gt_root, "2. Haemorrhages"),
        "EX": os.path.join(gt_root, "3. Hard Exudates"),
        "SE": os.path.join(gt_root, "4. Soft Exudates")
    }

    for d in lesion_dirs.values():
        os.makedirs(d, exist_ok=True)

    H, W = img_size

    for idx in range(1, num_samples + 1):
        img_id = f"IDRiD_{idx:02d}"
        
        # Create fundus background (black outer, orange/red circle)
        img = np.zeros((H, W, 3), dtype=np.uint8)
        center = (W // 2, H // 2)
        radius = int(min(H, W) * 0.45)
        
        # Draw fundus retina circle
        cv2.circle(img, center, radius, (15, 60, 180), -1) # BGR: orange-red
        
        # Add subtle fundus texture/gradient
        Y, X = np.ogrid[:H, :W]
        dist_from_center = np.sqrt((X - center[0])**2 + (Y - center[1])**2)
        mask_circle = dist_from_center <= radius
        
        # Optic Disc (bright yellow circle)
        optic_center = (int(center[0] + radius * 0.4), int(center[1] - radius * 0.1))
        cv2.circle(img, optic_center, int(radius * 0.15), (160, 230, 255), -1)
        
        # Retinal blood vessels (dark red branching lines)
        for _ in range(6):
            pts = np.array([
                optic_center,
                (optic_center[0] + np.random.randint(-150, 150), optic_center[1] + np.random.randint(-150, 150)),
                (center[0] + np.random.randint(-200, 200), center[1] + np.random.randint(-200, 200))
            ], np.int32)
            cv2.polylines(img, [pts], False, (10, 20, 100), thickness=np.random.randint(2, 6))

        # Initialize lesion binary masks
        ma_mask = np.zeros((H, W), dtype=np.uint8)
        he_mask = np.zeros((H, W), dtype=np.uint8)
        ex_mask = np.zeros((H, W), dtype=np.uint8)
        se_mask = np.zeros((H, W), dtype=np.uint8)

        # 1. Microaneurysms (MA): small tiny red dots (radius 2-4)
        num_ma = np.random.randint(5, 20)
        for _ in range(num_ma):
            rx = int(center[0] + np.random.uniform(-0.7, 0.7) * radius)
            ry = int(center[1] + np.random.uniform(-0.7, 0.7) * radius)
            if np.sqrt((rx - center[0])**2 + (ry - center[1])**2) < radius * 0.85:
                r_ma = np.random.randint(2, 5)
                cv2.circle(img, (rx, ry), r_ma, (5, 10, 80), -1)
                cv2.circle(ma_mask, (rx, ry), r_ma, 255, -1)

        # 2. Hemorrhages (HE): larger blotchy dark red spots
        num_he = np.random.randint(2, 8)
        for _ in range(num_he):
            rx = int(center[0] + np.random.uniform(-0.7, 0.7) * radius)
            ry = int(center[1] + np.random.uniform(-0.7, 0.7) * radius)
            if np.sqrt((rx - center[0])**2 + (ry - center[1])**2) < radius * 0.85:
                r_he = np.random.randint(8, 18)
                cv2.circle(img, (rx, ry), r_he, (5, 5, 60), -1)
                cv2.circle(he_mask, (rx, ry), r_he, 255, -1)

        # 3. Hard Exudates (EX): bright yellow sharp flecks
        num_ex = np.random.randint(4, 15)
        for _ in range(num_ex):
            rx = int(center[0] + np.random.uniform(-0.7, 0.7) * radius)
            ry = int(center[1] + np.random.uniform(-0.7, 0.7) * radius)
            if np.sqrt((rx - center[0])**2 + (ry - center[1])**2) < radius * 0.85:
                r_ex = np.random.randint(3, 8)
                cv2.circle(img, (rx, ry), r_ex, (50, 240, 255), -1) # BGR Yellow
                cv2.circle(ex_mask, (rx, ry), r_ex, 255, -1)

        # 4. Soft Exudates (SE): fluffy pale white cotton wool spots
        num_se = np.random.randint(1, 5)
        for _ in range(num_se):
            rx = int(center[0] + np.random.uniform(-0.7, 0.7) * radius)
            ry = int(center[1] + np.random.uniform(-0.7, 0.7) * radius)
            if np.sqrt((rx - center[0])**2 + (ry - center[1])**2) < radius * 0.85:
                r_se = np.random.randint(12, 25)
                cv2.circle(img, (rx, ry), r_se, (200, 220, 240), -1) # Pale white
                cv2.circle(se_mask, (rx, ry), r_se, 255, -1)

        # Save fundus image
        img_file = os.path.join(images_dir, f"{img_id}.jpg")
        cv2.imwrite(img_file, img)

        # Save masks (.tif)
        cv2.imwrite(os.path.join(lesion_dirs["MA"], f"{img_id}_MA.tif"), ma_mask)
        cv2.imwrite(os.path.join(lesion_dirs["HE"], f"{img_id}_HE.tif"), he_mask)
        cv2.imwrite(os.path.join(lesion_dirs["EX"], f"{img_id}_EX.tif"), ex_mask)
        cv2.imwrite(os.path.join(lesion_dirs["SE"], f"{img_id}_SE.tif"), se_mask)

    print(f"Successfully generated {num_samples} synthetic IDRiD images and 4-class ground truth masks!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate-sample", action="store_true", help="Generate synthetic IDRiD sample dataset")
    parser.add_argument("--output-dir", type=str, default="./data/idrid_sample", help="Target output folder")
    args = parser.parse_args()

    if args.generate_sample or not os.path.exists(args.output_dir):
        generate_synthetic_idrid_dataset(args.output_dir)

    pairs = discover_idrid_pairs(args.output_dir)
    print(f"Sample pair 0: {pairs[0]}")
    ds = IDRiDDataset(pairs)
    img_t, mask_t, img_id, raw_rgb = ds[0]
    print(f"Loaded tensor shape: {img_t.shape}, Mask shape: {mask_t.shape}, ID: {img_id}")
