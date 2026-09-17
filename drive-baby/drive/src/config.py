"""Configuration for DRIVE retinal blood vessel segmentation."""

from dataclasses import dataclass, field
from typing import Tuple


@dataclass(frozen=True)
class TrainingConfig:
    """Hyperparameters and paths for training."""

    # Data
    data_dir: str = "dataset/training"
    image_subdir: str = "images"
    mask_subdir: str = "mask"
    image_size: Tuple[int, int] = (512, 512)

    # Training
    epochs: int = 50
    batch_size: int = 2
    learning_rate: float = 1e-4
    weight_decay: float = 1e-5
    num_workers: int = 4
    seed: int = 42

    # Model
    in_channels: int = 1
    out_channels: int = 1

    # Checkpoint
    checkpoint_dir: str = "../models"
    checkpoint_name: str = "best_model.pth"

    # Early stopping
    early_stop_patience: int = 10

    # Augmentation
    use_augmentation: bool = True
    random_flip_p: float = 0.5
    random_rotate_p: float = 0.3
    random_brightness_p: float = 0.3
    random_contrast_p: float = 0.3


@dataclass(frozen=True)
class InferenceConfig:
    """Configuration for inference."""

    model_path: str = "../models/best_model.pth"
    output_dir: str = "../outputs/predictions"
    threshold: float = 0.5
    image_size: Tuple[int, int] = (512, 512)


@dataclass(frozen=True)
class QualityConfig:
    """Image quality thresholds for DRIVE images."""

    min_image_mean: float = 15.0
    max_image_mean: float = 240.0
    min_image_std: float = 5.0
    blur_laplacian_threshold: float = 35.0


@dataclass(frozen=True)
class DriveConfig:
    """Top-level configuration aggregating all sub-configs."""

    training: TrainingConfig = field(default_factory=TrainingConfig)
    inference: InferenceConfig = field(default_factory=InferenceConfig)
    quality: QualityConfig = field(default_factory=QualityConfig)


def load_config() -> DriveConfig:
    """Load configuration from environment variables or defaults."""
    return DriveConfig()