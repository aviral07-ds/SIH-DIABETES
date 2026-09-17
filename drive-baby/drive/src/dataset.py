"""Dataset and preprocessing utilities for DRIVE segmentation."""

import warnings
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset


def read_gray(path: str, dtype: np.dtype = np.float32) -> np.ndarray:
    """Read an image as grayscale.

    Args:
        path: Path to the image file.
        dtype: Desired numpy dtype.

    Returns:
        Grayscale image array.
    """
    image = Image.open(path)
    if image.mode != "L":
        image = image.convert("L")
    return np.array(image, dtype=dtype)


def preprocess(
    image: np.ndarray,
    size: Tuple[int, int] = (512, 512),
    normalize: bool = True,
) -> torch.Tensor:
    """Resize and optionally normalize an image.

    Args:
        image: Input grayscale image as numpy array.
        size: Target size (height, width).
        normalize: If True, divide by 255.0.

    Returns:
        Tensor of shape (1, H, W).
    """
    if image.dtype != np.uint8:
        image = np.clip(image, 0, 255).astype(np.uint8)
    pil_image = Image.fromarray(image)
    resized = pil_image.resize(size, Image.Resampling.BILINEAR)
    array = np.asarray(resized, dtype=np.float32)
    if normalize:
        array = array / 255.0
    return torch.from_numpy(array).unsqueeze(0)


def preprocess_mask(
    mask: np.ndarray,
    size: Tuple[int, int] = (512, 512),
    threshold: int = 0,
) -> torch.Tensor:
    """Resize and binarize a ground-truth mask.

    Args:
        mask: Ground-truth mask as numpy array.
        size: Target size (height, width).
        threshold: Pixel values above this are considered vessel.

    Returns:
        Binary tensor of shape (1, H, W).
    """
    if mask.dtype != np.uint8:
        mask = np.clip(mask, 0, 255).astype(np.uint8)
    pil_mask = Image.fromarray(mask)
    resized = pil_mask.resize(size, Image.Resampling.NEAREST)
    array = np.asarray(resized)
    binary = (array > threshold).astype(np.float32)
    return torch.from_numpy(binary).unsqueeze(0)


def get_mask_path(
    image_path: Path,
    mask_dir: Path,
    stem_patterns: Optional[Tuple[str, ...]] = None,
) -> Optional[Path]:
    """Find the ground-truth mask for a given image.

    The DRIVE dataset uses several naming conventions. This function
    tries the common patterns in order.

    Args:
        image_path: Path to the input image.
        mask_dir: Directory containing ground-truth masks.
        stem_patterns: Custom patterns to try. Defaults to common DRIVE patterns.

    Returns:
        Path to the mask if found, otherwise None.
    """
    if stem_patterns is None:
        stem_patterns = ("_manual1", "")
    suffixes = (".gif", ".png", ".tif", ".tiff", ".jpg", ".jpeg")
    stem = image_path.stem
    for pattern in stem_patterns:
        for suffix in suffixes:
            candidate = mask_dir / f"{stem}{pattern}{suffix}"
            if candidate.exists():
                return candidate
    return None


class DRIVEDataset(Dataset):
    """PyTorch Dataset for DRIVE training images and ground-truth masks.

    Args:
        image_dir: Directory containing input images.
        mask_dir: Directory containing ground-truth vessel masks.
        size: Target image size (height, width).
        image_extensions: Allowed image file extensions.
    """

    def __init__(
        self,
        image_dir: str,
        mask_dir: str,
        size: Tuple[int, int] = (512, 512),
        image_extensions: Tuple[str, ...] = (".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp"),
    ):
        self.image_dir = Path(image_dir)
        self.mask_dir = Path(mask_dir)
        self.size = size

        if not self.image_dir.is_dir():
            raise FileNotFoundError(f"Image directory not found: {image_dir}")
        if not self.mask_dir.is_dir():
            raise FileNotFoundError(f"Mask directory not found: {mask_dir}")

        self.images = sorted(
            path for path in self.image_dir.iterdir()
            if path.is_file() and path.suffix.lower() in image_extensions
        )
        if not self.images:
            raise FileNotFoundError(f"No images found in {image_dir}")

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        image_path = self.images[idx]
        mask_path = get_mask_path(image_path, self.mask_dir)
        if mask_path is None:
            warnings.warn(f"No ground truth found for {image_path.name}; skipping.")
            return self.__getitem__((idx + 1) % len(self))

        image = read_gray(str(image_path))
        mask = read_gray(str(mask_path))

        image_tensor = preprocess(image, self.size)
        mask_tensor = preprocess_mask(mask, self.size)
        return image_tensor, mask_tensor


def create_dataloaders(
    image_dir: str,
    mask_dir: str,
    batch_size: int = 2,
    val_split: float = 0.2,
    image_size: Tuple[int, int] = (512, 512),
    num_workers: int = 4,
    seed: int = 42,
):
    """Create training and validation DataLoaders with a random split.

    Args:
        image_dir: Directory containing training images.
        mask_dir: Directory containing ground-truth masks.
        batch_size: Batch size.
        val_split: Fraction of data to use for validation.
        image_size: Target image size.
        num_workers: Number of DataLoader workers.
        seed: Random seed for reproducible splits.

    Returns:
        Tuple of (train_loader, val_loader, dataset_size).
    """
    from torch.utils.data import DataLoader, random_split

    dataset = DRIVEDataset(image_dir, mask_dir, size=image_size)
    val_count = max(1, int(val_split * len(dataset)))
    train_count = len(dataset) - val_count

    generator = torch.Generator().manual_seed(seed)
    train_subset, val_subset = random_split(
        dataset, [train_count, val_count], generator=generator
    )

    train_loader = DataLoader(
        train_subset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )
    val_loader = DataLoader(
        val_subset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    return train_loader, val_loader, len(dataset)