# Drishti Care — Multi-Model Retinal Tele-Ophthalmology Suite (SIH26038)

> **Point-of-Care AI Triage & Diagnostic System powered by 3 Specialized Deep Learning Models (IDRiD, APTOS 2019, DRIVE) and a Production React + Vite Frontend**

---

## 📌 Project Overview

Diabetic Retinopathy (DR) is a leading cause of preventable blindness globally. Early detection requires accurate localization of subtle microvascular lesions, precise severity grading, and vascular structure assessment from retinal fundus photography.

This repository delivers an end-to-end, multi-model AI suite built for **Smart India Hackathon 2026 (SIH26038)**, featuring **3 specialized AI models** deployed as containerized microservices and connected to the **Drishti Care Frontend Web Application**.

---

## 🧠 The 3 AI Models Overview

Our architecture decouples diagnosis into 3 independent, specialized neural networks:

| Model | Dataset | Task / Output | Architecture | Deployed Live Endpoint |
| --- | --- | --- | --- | --- |
| **1. IDRiD Model** | Indian Diabetic Retinopathy Image Dataset | **Pixel-Level Multi-Lesion Segmentation** (Microaneurysms, Hemorrhages, Hard Exudates, Soft Exudates) | PyTorch U-Net (4-Channel Logit Output + CLAHE Preprocessing) | `https://sih-diabetes-idrid.onrender.com` |
| **2. APTOS Model** | APTOS 2019 Blindness Detection Dataset | **DR Severity Staging (Stages 0–4)** + **Image Quality Assessment** (Laplacian Luminance Triage) | Hybrid CNN-Transformer / EfficientNet Classifier | `https://sih-diabetes-aptos.onrender.com` |
| **3. DRIVE Model** | Digital Retinal Images for Vessel Extraction | **Retinal Vascular Tree & Foveal Avascular Zone (FAZ) Segmentation** | Deep Learning Vessel U-Net | `https://sih-diabetes-drive.onrender.com` |

---

### 🔬 Model 1: IDRiD Retinal Lesion Segmentation Model

Localizes pinpoint microvascular pathologies on fundus scans:

- **Microaneurysms (MA)**: Tiny focal vascular dilations (Red markers).
- **Intraretinal Hemorrhages (HE)**: Deep retinal bleeding spots (Deep Red markers).
- **Hard Exudates (EX)**: Bright yellow lipid deposits with sharp boundaries.
- **Soft Exudates (SE)**: Pale cotton-wool spots (nerve fiber micro-infarctions).

- **Objective Loss**: Combined BCEWithLogits + Multilabel Dice Loss $\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{BCE}} + \mathcal{L}_{\text{Dice}}$.
- **API Endpoint**: `POST /api/predict/idrid`
- **Output Payload**:
  ```json
  {
    "status": "success",
    "lesions": {
      "MA": { "detected": true, "pixel_count": 412, "area_percentage": 0.32 },
      "HE": { "detected": true, "pixel_count": 1280, "area_percentage": 0.98 },
      "EX": { "detected": true, "pixel_count": 840, "area_percentage": 0.66 },
      "SE": { "detected": false, "pixel_count": 0, "area_percentage": 0.0 }
    }
  }
  ```

---

### 🩺 Model 2: APTOS 2019 DR Severity Staging Model

Grades overall disease severity across the international ICDR scale and checks input scan quality:

- **Staging Classification**:
  - **Stage 0**: No Diabetic Retinopathy
  - **Stage 1**: Mild Non-Proliferative DR (NPDR)
  - **Stage 2**: Moderate NPDR
  - **Stage 3**: Severe NPDR
  - **Stage 4**: Proliferative DR (PDR)
- **Image Quality Filtering**: Calculates Laplacian variance and luminance validation in <40ms to catch blurry or low-illumination scans before inference.
- **API Endpoint**: `POST /api/predict/aptos`
- **Output Payload**:
  ```json
  {
    "status": "success",
    "prediction": {
      "predicted_class": 2,
      "stage_name": "Moderate NPDR",
      "confidence": 91.4
    },
    "image_quality": {
      "is_valid": true,
      "quality_score": 0.98
    }
  }
  ```

---

### 🩸 Model 3: DRIVE Retinal Vessel Structure Model

Segments the main vascular tree to evaluate foveal avascular zone (FAZ) encroachment and vessel tortuosity:

- **Task**: Binary vessel extraction and anatomical feature masking.
- **API Endpoint**: `POST /api/predict/drive`
- **Output Payload**:
  ```json
  {
    "status": "success",
    "vessel_density": 0.142,
    "faz_integrity": "Normal",
    "segmentation_mask": "data:image/png;base64,..."
  }
  ```

---

## 💻 Drishti Care Frontend Web Application

The **Drishti Care** user interface is a production-grade single-page application built with **React**, **Vite**, **Tailwind CSS**, and **Lucide Icons**, featuring:

- **Bilingual i18n Support**: Seamless toggle between English and Hindi (हिंदी).
- **Patient Registration & ABHA Integration**: ABDM M3-compliant metadata fields.
- **Dual-Channel Visual Explainability**:
  - Channel 1: Lesion localization overlay.
  - Channel 2: Grad-CAM++ neural saliency heatmaps.
- **Live Deployed API Integration**: Queries all 3 Render microservices concurrently with real-time progress fallback.
- **Printable & Exportable ABDM Reports**: One-click DICOM/PDF generation (`jspdf` & `html2canvas`) with digital signature blocks.
- **Live Frontend Deployment**: [https://sih-diabetes-frontend-yg0r.onrender.com](https://sih-diabetes-frontend-yg0r.onrender.com)

---

## 📁 Repository Directory Structure

```
idrid-retinal-lesion-segmentation/
├── backend/                             # Multi-model FastAPI backend services
│   ├── app/
│   │   ├── main_aptos.py                # APTOS microservice entrypoint
│   │   ├── main_idrid.py                # IDRiD microservice entrypoint
│   │   ├── main_drive.py                # DRIVE microservice entrypoint
│   │   ├── models/                      # PyTorch model definitions & checkpoints
│   │   │   ├── idrid/                   # U-Net segmentation model & best_model.pth
│   │   │   ├── aptos/                   # EfficientNet DR severity classifier
│   │   │   └── drive/                   # Vessel extraction model
│   │   └── api/model_routes.py          # Unified API routes (/api/predict/*)
│   ├── Dockerfile.aptos                 # Container config for APTOS service
│   ├── Dockerfile.idrid                 # Container config for IDRiD service
│   └── Dockerfile.drive                 # Container config for DRIVE service
│
├── frontend/                            # Drishti Care React + Vite SPA
│   ├── src/
│   │   ├── components/                  # Navbar, Footer, ApiSettingsModal
│   │   ├── pages/                       # HomePage, ScreeningPage, ResultPage, AnalysisPage, ReportPage
│   │   ├── services/apiService.js       # Live API service integration & contract parser
│   │   ├── i18n/translations.js         # Bilingual EN / HI translation system
│   │   └── context/LanguageContext.jsx  # Global language provider
│   ├── index.html                       # Drishti Care HTML container
│   └── package.json
│
├── render.yaml                          # Blueprint for deploying all microservices to Render
├── docker-compose.yml                   # Local multi-service orchestrator
├── deployment.md                        # Step-by-step cloud deployment manual
└── README.md                            # Main project documentation
```

---

## 🚀 Quick Start & Installation

### 1. Clone & Set Up Local Environment

```bash
git clone https://github.com/aviral07-ds/SIH-DIABETES.git
cd SIH-DIABETES
```

### 2. Run All 3 Microservices via Docker Compose

```bash
docker compose up --build
```

This spins up all 3 backend services locally:
- **APTOS API**: `http://localhost:8001`
- **IDRiD API**: `http://localhost:8002`
- **DRIVE API**: `http://localhost:8003`

### 3. Launch Frontend Web App

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to interact with **Drishti Care**!

---

## 📡 Health Check & API Verification

You can test all 3 live deployed endpoints directly via `curl`:

```bash
# IDRiD Lesion Segmentation Service
curl https://sih-diabetes-idrid.onrender.com/health

# APTOS DR Severity Staging Service
curl https://sih-diabetes-aptos.onrender.com/health

# DRIVE Vessel Segmentation Service
curl https://sih-diabetes-drive.onrender.com/health
```

Expected Response: `{"status": "healthy"}`

---

## 👥 SIH26038 Team & Acknowledgments

- **Project**: Smart India Hackathon 2026 (SIH26038)
- **Domain**: Tele-Ophthalmology Point-of-Care Triage & Rural Health Tech
- **Datasets**: IDRiD, APTOS 2019 Blindness Detection, DRIVE
