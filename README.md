# IDRiD Retinal Lesion Segmentation Model (SIH26038)

> **PyTorch U-Net Multi-Label Pixel-Level Segmentation System for Retinal Lesions in Indian Diabetic Retinopathy Image Dataset (IDRiD)**

---

## 📌 Project Overview
Diabetic Retinopathy (DR) is a leading cause of vision impairment worldwide. Early detection requires accurate localization of subtle microvascular lesions from fundus photography. This repository provides an end-to-end, production-ready deep learning solution for **SIH26038** to perform multi-label pixel-level segmentation of 4 primary DR lesion types:

1. **Microaneurysms (MA)**: Tiny red vascular dilations
2. **Hemorrhages (HE)**: Deep red retinal bleeding spots
3. **Hard Exudates (EX)**: Bright yellow lipid deposits with sharp boundaries
4. **Soft Exudates (SE)**: Pale cotton-wool spots (nerve fiber layer micro-infarctions)
5. **Background Retina**: Normal fundus tissue

---

## 🛠️ Key Features
- **Auto Dataset Matching**: Automatically scans official IDRiD directory layout (`Original Images/` and `Groundtruths/`), mapping fundus images to class-specific mask files (`.tif`, `.png`, `.jpg`). Handles missing mask files by generating empty channels.
- **Fundus Preprocessing**: Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) on the green channel to enhance subtle microvascular details.
- **PyTorch U-Net Architecture**: Modular 4-level U-Net with skip connections, batch normalization, and configurable base channels.
- **Combined Dice + BCE Loss**: Tailored loss function \(L_{total} = L_{BCE} + L_{Dice}\) designed to handle extreme foreground/background class imbalance (lesions take < 1% of total pixels).
- **Strict Per-Class Metrics**: Computes **Dice Score (F1)**, **Intersection over Union (IoU)**, **Precision**, and **Recall** per lesion class.
- **Color-Coded Multi-Lesion Overlay**: Generates multi-channel visual overlays (Red: MA, Deep Red: HE, Yellow: EX, Cyan: SE) onto original fundus images.
- **CLI Inference Tool (`predict.py`)**: Predicts new images, calculates pixel counts, and estimates retinal surface area percentage occupied by lesions.
- **Interactive Streamlit Web UI (`app.py`)**: Sleek dashboard for live fundus image upload, preprocessing visualization, segmentation inference, individual mask toggling, and DR risk scoring.

---

## 📁 Repository Structure
```
idrid-retinal-lesion-segmentation/
├── dataset.py         # IDRiD loader, auto-matcher, CLAHE, synthetic sample generator
├── model.py           # PyTorch U-Net neural network architecture
├── losses.py          # Multilabel Dice Loss + BCE Combined Loss
├── metrics.py         # Per-class metrics calculation (Dice, IoU, Precision, Recall)
├── train.py           # Training pipeline, train/val split, GPU support, checkpointing
├── predict.py         # Standalone CLI prediction & overlay generation
├── evaluate.py        # Dataset evaluation & visual grid generation
├── app.py             # Streamlit Web Application interface
├── requirements.txt   # Dependency specifications
└── README.md          # Comprehensive documentation for SIH26038
```

---

## 🚀 Installation & Setup

### 1. Environment Setup
```bash
# Clone repository or navigate to directory
cd idrid-retinal-lesion-segmentation

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate   # On Windows

# Install dependencies
pip install -r requirements.txt
```

---

## 📊 Dataset Setup & Sample Generator

### Option A: Using Official IDRiD Dataset
Place your IDRiD dataset folder (e.g. `./data/idrid`) following standard structure:
```
data/idrid/
├── 1. Original Images/
│   └── a. Training Set/
│       ├── IDRiD_01.jpg
│       └── ...
└── 2. Groundtruths/
    └── a. Training Set/
        ├── 1. Microaneurysms/
        ├── 2. Haemorrhages/
        ├── 3. Hard Exudates/
        └── 4. Soft Exudates/
```

### Option B: Generate Synthetic IDRiD Sample Dataset (Offline Demo)
If you don't have the official multi-GB IDRiD dataset downloaded locally, run the built-in sample generator:
```bash
python dataset.py --generate-sample --output-dir ./data/idrid_sample
```
This generates realistic fundus images with simulated optic discs, retinal vessels, and 4 lesion ground truths for immediate testing.

---

## 🧠 Model Training

To train the U-Net model:
```bash
python train.py --dataset-dir ./data/idrid_sample --epochs 15 --batch-size 4 --lr 0.001
```

### Key Training Options:
- `--dataset-dir`: Path to IDRiD dataset directory
- `--epochs`: Number of training epochs (default: 15)
- `--batch-size`: Training batch size (default: 4)
- `--base-c`: Base channels for U-Net (default: 32)
- `--img-size`: Input image dimensions (default: 256)
- `--output-dir`: Checkpoint output folder (default: `./checkpoints`)

Training automatically detects **GPU acceleration** (Apple Silicon `mps`, NVIDIA `cuda`, or `cpu`) and saves:
- `checkpoints/best_model.pth` (Model with highest validation mean Dice score)
- `checkpoints/checkpoint.pth` (Latest epoch checkpoint)
- `checkpoints/history.json` (Epoch loss and metric logs)

---

## 🔍 Model Evaluation

To evaluate the trained model on test/validation set and compute exact metrics:
```bash
python evaluate.py --dataset-dir ./data/idrid_sample --checkpoint ./checkpoints/best_model.pth
```
This outputs per-class Dice, IoU, Precision, and Recall scores and exports visual comparison grids to `./eval_results/visualizations/`.

---

## 🔮 Inference on New Images (`predict.py`)

Run inference on any individual fundus image:
```bash
python predict.py --image ./data/idrid_sample/1.\ Original\ Images/a.\ Training\ Set/IDRiD_01.jpg --checkpoint ./checkpoints/best_model.pth
```

### Example Console Output:
```
--- Lesion Segmentation Results ---
  Microaneurysms (MA)      : DETECTED | Pixels: 412    | Retinal Area: 0.32%
  Hemorrhages (HE)         : DETECTED | Pixels: 1250   | Retinal Area: 0.98%
  Hard Exudates (EX)       : DETECTED | Pixels: 840    | Retinal Area: 0.66%
  Soft Exudates (SE)       : Clean    | Pixels: 0      | Retinal Area: 0.00%

Saved color-coded lesion overlay to: ./output_predictions/IDRiD_01_overlay.png
```

---

## 🌐 Launch Streamlit Web UI (`app.py`)

Start the interactive Web Application:
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`. Features include:
- Upload custom fundus image or pick sample image
- Side-by-side Original vs CLAHE enhanced green channel
- Real-time segmentation execution
- Interactive transparency slider for color overlay
- Per-lesion pixel count, surface area %, and clinical DR risk assessment
- Individual lesion mask viewer (MA, HE, EX, SE)

---

## 📐 Mathematical Formulation

### 1. Multilabel Dice Loss
$$\text{Dice Loss} = 1 - \frac{2 \sum_{i} p_i t_i + \epsilon}{\sum_{i} p_i^2 + \sum_{i} t_i^2 + \epsilon}$$

### 2. Combined Objective
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{BCEWithLogits}} + \mathcal{L}_{\text{Dice}}$$

---

## 👥 SIH26038 Team
- Solution developed for Smart India Hackathon 2026 (SIH26038).
- Focus: Automated Diabetic Retinopathy Lesion Segmentation System.

---

## Deployment: unified API on Render

The deployable service is now the FastAPI application in `backend/`. It exposes one API for the three retinal-analysis workflows and packages the versioned APTOS and IDRiD model artifacts in its Docker image.

| Endpoint | Purpose | Current availability |
| --- | --- | --- |
| `GET /` | Service information | Ready |
| `GET /health` | Render health check | Ready |
| `POST /api/predict/aptos` | APTOS DR-severity classification with image-quality gate | Ready |
| `POST /api/predict/idrid` | IDRiD lesion segmentation | Ready |
| `POST /api/predict/drive` | DRIVE vessel segmentation | Unavailable until a validated checkpoint is added |
| `POST /api/predict/all` | Best-effort combined result | Ready; returns `partial` while DRIVE is unavailable |

Prediction endpoints require an `X-API-Key` header and accept one JPEG, PNG, or TIFF image under 10 MB. `API_KEY` is never given a committed fallback value.

### Run locally

Use Python 3.11 (the Docker runtime) and install the deployment dependencies:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export API_KEY="replace-with-a-long-random-secret"
export CORS_ORIGINS="http://localhost:3000"
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

### Connect the Streamlit UI to Render

The root Streamlit app sends images to the unified API when `RENDER_API_URL` and `RENDER_API_KEY` are set. Copy [`.env.example`](/home/anshul/SIH-DIABETES/.env.example) to `.env`, then set the deployed Render URL and the same `API_KEY` configured in Render:

```dotenv
RENDER_API_URL=https://your-service.onrender.com
RENDER_API_KEY=your-render-api-key
RENDER_API_ENDPOINT=/api/predict/all
```

Run `streamlit run app.py`. The API key is used only by the Streamlit server process and is not sent to a browser. The default combined endpoint displays APTOS severity and IDRiD lesion metrics; it also reports DRIVE as unavailable until its checkpoint is deployed.

Verify it in a second terminal:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/predict/all \
  -H "X-API-Key: $API_KEY" \
  -F "file=@path/to/fundus-image.jpg"
```

### Deploy on Render

1. Commit and push this repository, including the tracked APTOS `.keras` and IDRiD `checkpoints/best_model.pth` artifacts. Do not put either artifact in `.dockerignore`.
2. In Render, create a **Blueprint** from the repository. Render reads [`render.yaml`](render.yaml), builds [`backend/Dockerfile`](backend/Dockerfile), and checks `GET /health`.
3. Set a strong random `API_KEY` secret in the Render service environment. Set `CORS_ORIGINS` to the exact deployed frontend origin, for example `https://app.example.com`; use comma-separated origins only when needed.
4. Deploy, then verify `https://<your-service>.onrender.com/health`. Use the same base URL for all frontend API calls and pass `X-API-Key` from a server-side frontend environment variable—never ship it in browser JavaScript.
5. Before presenting DRIVE as a feature, train and validate its model, add its checkpoint to the deployment image, and replace the intentionally unavailable `backend/app/models/drive/predictor.py` implementation.

The original Streamlit UI and training scripts are retained for research and local demonstrations. Production traffic should target the unified FastAPI endpoints above.
