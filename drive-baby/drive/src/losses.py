"""Loss functions for DRIVE segmentation."""

import torch
import torch.nn as nn
import torch.nn.functional as F


def dice_loss(
    logits: torch.Tensor,
    target: torch.Tensor,
    eps: float = 1e-6,
    reduction: str = "mean",
) -> torch.Tensor:
    """Soft Dice loss computed from logits.

    Args:
        logits: Model output logits of shape (B, C, H, W).
        target: Binary ground-truth of shape (B, C, H, W).
        eps: Smoothing factor to avoid division by zero.
        reduction: 'mean', 'sum', or 'none'.

    Returns:
        Dice loss value.
    """
    prob = torch.sigmoid(logits)
    intersection = (prob * target).sum(dim=(2, 3))
    cardinality = prob.sum(dim=(2, 3)) + target.sum(dim=(2, 3))
    dice = (2 * intersection + eps) / (cardinality + eps)
    loss = 1.0 - dice
    if reduction == "mean":
        return loss.mean()
    elif reduction == "sum":
        return loss.sum()
    return loss


def focal_loss(
    logits: torch.Tensor,
    target: torch.Tensor,
    alpha: float = 0.25,
    gamma: float = 2.0,
    reduction: str = "mean",
) -> torch.Tensor:
    """Focal loss for imbalanced binary segmentation.

    Args:
        logits: Model output logits.
        target: Binary ground-truth.
        alpha: Weighting factor for the positive class.
        gamma: Focusing parameter.
        reduction: Reduction method.

    Returns:
        Focal loss value.
    """
    probs = torch.sigmoid(logits)
    probs = probs.clamp(min=1e-7, max=1.0 - 1e-7)
    pos_loss = -alpha * (1 - probs) ** gamma * target * probs.log()
    neg_loss = -(1 - alpha) * probs ** gamma * (1 - target) * (1 - probs).log()
    loss = pos_loss + neg_loss
    if reduction == "mean":
        return loss.mean()
    elif reduction == "sum":
        return loss.sum()
    return loss


class CombinedLoss(nn.Module):
    """Combined BCE + Dice loss with optional focal weighting.

    Args:
        bce_weight: Weight for the binary cross-entropy term.
        dice_weight: Weight for the Dice term.
        use_focal: If True, use focal loss instead of BCE.
        alpha: Focal loss alpha parameter.
        gamma: Focal loss gamma parameter.
        eps: Dice smoothing factor.
    """

    def __init__(
        self,
        bce_weight: float = 1.0,
        dice_weight: float = 1.0,
        use_focal: bool = False,
        alpha: float = 0.25,
        gamma: float = 2.0,
        eps: float = 1e-6,
    ):
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.use_focal = use_focal
        self.alpha = alpha
        self.gamma = gamma
        self.eps = eps

        if use_focal:
            self.bce = lambda logits, targets: focal_loss(
                logits, targets, alpha=self.alpha, gamma=self.gamma
            )
        else:
            self.bce = nn.BCEWithLogitsLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        bce_loss = self.bce(logits, targets)
        dice = dice_loss(logits, targets, eps=self.eps)
        return self.bce_weight * bce_loss + self.dice_weight * dice