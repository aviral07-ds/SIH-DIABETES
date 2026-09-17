# DRIVE Retinal Blood Vessel Segmentation

U-Net baseline for retinal blood-vessel segmentation on the DRIVE dataset.

## Pipeline
Fundus image -> preprocessing -> U-Net -> vessel probability -> binary vessel mask.

## Dataset
Download DRIVE separately from the official DRIVE project. Do NOT commit the dataset to GitHub.

Expected:
dataset/training/images/
dataset/training/1st_manual/
dataset/test/images/

The training `1st_manual` files are the vessel ground truth.

## Install
```bash
pip install -r requirements.txt
```

## Train
From `drive/src`:
```bash
python train.py --epochs 50 --batch-size 2
```

The best checkpoint is saved to `drive/models/best_model.pth`.

## Predict
```bash
python predict.py --image ../dataset/test/images/01_test.tif
```

## Notes
This is a baseline research/demo implementation. For stronger results, add patch-based training, augmentation, FOV masking, CLAHE/green-channel experiments, and evaluation on the official test set.
