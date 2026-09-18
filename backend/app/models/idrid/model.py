"""U-Net architecture used by the exported IDRiD checkpoint."""

import torch
import torch.nn as nn
import torch.nn.functional as functional


class DoubleConv(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, mid_channels: int | None = None):
        super().__init__()
        mid_channels = mid_channels or out_channels
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels), nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
        )

    def forward(self, value):
        return self.double_conv(value)


class Down(nn.Module):
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.maxpool_conv = nn.Sequential(nn.MaxPool2d(2), DoubleConv(in_channels, out_channels))

    def forward(self, value):
        return self.maxpool_conv(value)


class Up(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, bilinear: bool = True):
        super().__init__()
        self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True) if bilinear else nn.ConvTranspose2d(in_channels, in_channels // 2, 2, 2)
        self.conv = DoubleConv(in_channels, out_channels, in_channels // 2) if bilinear else DoubleConv(in_channels, out_channels)

    def forward(self, lower, skip):
        lower = self.up(lower)
        lower = functional.pad(lower, [
            (skip.size(3) - lower.size(3)) // 2, skip.size(3) - lower.size(3) - (skip.size(3) - lower.size(3)) // 2,
            (skip.size(2) - lower.size(2)) // 2, skip.size(2) - lower.size(2) - (skip.size(2) - lower.size(2)) // 2,
        ])
        return self.conv(torch.cat([skip, lower], dim=1))


class UNet(nn.Module):
    def __init__(self, n_channels: int = 3, n_classes: int = 4, base_c: int = 32, bilinear: bool = True):
        super().__init__()
        factor = 2 if bilinear else 1
        self.inc = DoubleConv(n_channels, base_c)
        self.down1, self.down2 = Down(base_c, base_c * 2), Down(base_c * 2, base_c * 4)
        self.down3, self.down4 = Down(base_c * 4, base_c * 8), Down(base_c * 8, base_c * 16 // factor)
        self.up1 = Up(base_c * 16, base_c * 8 // factor, bilinear)
        self.up2, self.up3, self.up4 = Up(base_c * 8, base_c * 4 // factor, bilinear), Up(base_c * 4, base_c * 2 // factor, bilinear), Up(base_c * 2, base_c, bilinear)
        self.outc = nn.Conv2d(base_c, n_classes, 1)

    def forward(self, value):
        first = self.inc(value)
        second = self.down1(first)
        third = self.down2(second)
        fourth = self.down3(third)
        bottom = self.down4(fourth)
        value = self.up1(bottom, fourth)
        value = self.up2(value, third)
        value = self.up3(value, second)
        return self.outc(self.up4(value, first))
