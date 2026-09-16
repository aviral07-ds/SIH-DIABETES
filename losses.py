"""
Loss functions for IDRiD Multi-Label Retinal Lesion Segmentation.
Combines BCEWithLogitsLoss and Dice Loss to handle severe class imbalance.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class DiceLoss(nn.Module):
    """
    Multilabel Dice Loss across 4 lesion channels.
    Calculates Dice Loss independently per channel and averages over channels and batch.
    """
    def __init__(self, smooth=1e-5):
        super(DiceLoss, self).__init__()
        self.smooth = smooth

    def forward(self, logits, targets):
        """
        logits: (B, C, H, W) raw outputs before sigmoid
        targets: (B, C, H, W) binary ground truth [0.0, 1.0]
        """
        probs = torch.sigmoid(logits)
        
        # Flatten spatial dimensions
        probs_flat = probs.view(probs.size(0), probs.size(1), -1)
        targets_flat = targets.view(targets.size(0), targets.size(1), -1)
        
        intersection = (probs_flat * targets_flat).sum(dim=-1)
        cardinality = (probs_flat * probs_flat).sum(dim=-1) + (targets_flat * targets_flat).sum(dim=-1)
        
        dice = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)
        dice_loss = 1.0 - dice
        
        return dice_loss.mean()


class CombinedLoss(nn.Module):
    """
    Weighted Combination of BCE with Logits + Dice Loss.
    """
    def __init__(self, bce_weight=1.0, dice_weight=1.0, pos_weight=None):
        super(CombinedLoss, self).__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.bce = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        self.dice = DiceLoss()

    def forward(self, logits, targets):
        bce_loss = self.bce(logits, targets)
        dice_loss = self.dice(logits, targets)
        total_loss = self.bce_weight * bce_loss + self.dice_weight * dice_loss
        return total_loss, bce_loss, dice_loss


if __name__ == "__main__":
    criterion = CombinedLoss()
    logits = torch.randn(2, 4, 128, 128)
    targets = (torch.rand(2, 4, 128, 128) > 0.8).float()
    loss, bce, dice = criterion(logits, targets)
    print(f"Loss test -> Total: {loss.item():.4f}, BCE: {bce.item():.4f}, Dice: {dice.item():.4f}")
