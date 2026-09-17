Issue	Fix
JSON serialization (pipeline.py:35)	Removed processed_image/processed_image_path from to_dict()
Threshold mismatch (app.py:73 vs config)	Now loads REFERABLE_THRESHOLD from aptos_model_config.json (0.42)
Hardcoded Windows path (test_real_aptos.py:15)	Rewrote to use CLI args with default test_images/ directory
CORS invalid config (app.py:29-35)	Set allow_credentials=False to match wildcard origins
No logging (app.py:80-96)	Replaced print() with structured logging module
Temp file cleanup (app.py:636)	Initialize controlled_image_path = None before try block
APTOS Final — Production Enhancements
- Decomposed the 200-line predict() into _validate_upload, _validate_image_integrity, _build_quality_response, _process_single_prediction
- Added authentication via auth.py (API key + rate limiting with slowapi)
- Added batch prediction endpoint (/api/batch-predict, max 10 images)
- Added image integrity validation (decodes uploaded bytes with cv2.imdecode)
- Created Dockerfile, docker-compose.yml, project-level requirements.txt, pyproject.toml, .gitignore
Drive-Baby — Optimized & Aligned with APTOS Patterns
- config.py — Centralized DriveConfig with TrainingConfig, InferenceConfig, QualityConfig (mirrors APTOS's QualityConfig dataclass pattern)
- logging_utils.py — Structured logging with file output (same pattern as APTOS fix)
- model.py — Full U-Net rewrite with weight initialization, freeze_backbone(), unfreeze_all(), factory function
- dataset.py — Robust mask path resolution, create_dataloaders() factory, proper error handling
- losses.py — CombinedLoss (BCE + Dice), focal_loss, configurable weights
- metrics.py — compute_metrics(), evaluate_loader(), evaluate_single_image(), print_metrics()
- train.py — Full training loop with early stopping, LR scheduler, checkpointing, config overrides
- predict.py — CLI inference with overlay support, proper device handling
- evaluate.py — Standalone evaluation script (matches APTOS report item #19)
Verification
- All Python files pass py_compile syntax checks
- Quality pipeline test passes (JSON serialization confirmed)
- Config threshold loads correctly (0.42)
- test_real_aptos.py finds 15 test images in default directory
# SIH-DIABETES — Project Report

> Diabetic Retinopathy Screening System (APTOS 2019 · EfficientNetB0 · FastAPI)

---

## 1. Project Overview

A medical AI system that classifies diabetic retinopathy (DR) severity from retinal fundus images. The system consists of:

| Component | Purpose |
|-----------|---------|
| `aptos final/app.py` | FastAPI backend — accepts image uploads, runs quality assessment, and predicts DR severity |
| `aptos final/best_aptos_model.keras` | Trained EfficientNetB0 classifier (5-class DR severity) |
| `aptos final/aptos_model_config.json` | Model metadata — accuracy, sensitivity, specificity, threshold |
| `aptos final/image_quality/` | Standalone fundus image quality assessment and adaptive enhancement module |
| `aptos final/notebook*.ipynb` | Jupyter notebook — EDA, preprocessing, model training, evaluation |
| `aptos final/test_images/` | Sample fundus images for testing |

---

## 2. What Is Working Well

### 2.1 Model Performance
- **Sensitivity: 93.43%** and **Specificity: 90.83%** on the APTOS test set at threshold 0.42 — strong for a screening tool.
- EfficientNetB0 transfer learning with class-weighted loss handles the imbalanced dataset (Class 3 has only 154 training images vs 1,434 for Class 0).
- Frozen backbone + GlobalAveragePooling + Dropout(0.3) is a sound architecture choice.

### 2.2 Image Quality Module (`image_quality/`)
- **Clean separation of concerns**: quality assessment, enhancement, pipeline, config, and utilities are each in their own module.
- `QualityConfig` is a frozen dataclass with centralized thresholds — easy to calibrate for different camera/device characteristics.
- `QualityAssessment` uses three complementary scores (focus via Laplacian variance, illumination via LAB normalization, field-of-view via retinal mask coverage) with a weighted overall score.
- **Adaptive enhancement**: borderline images get targeted CLAHE, illumination normalization, and/or denoising — ungradable images are rejected immediately without wasting compute.
- **Comprehensive test suite** (`test_quality.py`) with 10 tests covering good, blurry, dark, overexposed, uneven, insufficient-FOV, borderline, and rejected cases.
- **Batch processing script** (`test_batch_pipeline.py`) for directory-level evaluation.
- **Analysis script** (`analyze_aptos_focus.py`) for statistical summaries across image sets.

### 2.3 API Design
- Proper FastAPI structure with typed endpoints.
- CORS middleware enabled for frontend integration.
- File validation (extension allowlist, 10 MB size limit).
- Temp file cleanup in `finally` block.
- `/` health-check endpoint and `/api/model-info` metadata endpoint.
- The quality module is invoked before prediction, ensuring poor-quality images are filtered early.

### 2.4 Preprocessing Pipeline
- Background cropping (threshold on grayscale), aspect-ratio-preserving resize, and centered padding to 224×224 — well-documented in the notebook.
- BGR→RGB conversion is handled correctly.
- The notebook's EDA thoroughly justifies each preprocessing decision.

---

## 3. What to Improve

### 3.1 Critical — Will Cause Failures

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | **Hardcoded Windows path** in `test_real_aptos.py` | `image_quality/test_real_aptos.py:15` | Change `r"C:\Users\DELL\Downloads\001639a390f0.png"` to a relative path or environment variable |
| 2 | **Threshold inconsistency**: `app.py` uses `REFERABLE_THRESHOLD = 0.36` while `aptos_model_config.json` specifies `0.42` | `app.py:73` vs `aptos_model_config.json:3` | Load threshold from the config file or add a comment justifying the difference; align them |
| 3 | **`QualityResult.to_dict()` includes `processed_image`** (a NumPy array) which is **not JSON-serializable** | `image_quality/pipeline.py:35` | Remove `processed_image` and `processed_image_path` from `to_dict()`, or add custom serialization |
| 4 | **No logging** — the app uses `print()` for model load status and errors | `app.py:80-96` | Replace with Python `logging` module; add structured log levels |

### 3.2 Important — Robustness & Security

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 5 | **No authentication/authorization** on the `/api/predict` endpoint | `app.py:447` | Add API key, JWT, or OAuth2 — this is a medical application |
| 6 | **No rate limiting** — endpoint is open to abuse | `app.py:447` | Add middleware or use `slowapi`/`ratelimit` |
| 7 | **No input image validation** beyond extension and size — corrupted or adversarial images could crash the pipeline | `app.py:488-506` | Validate image integrity (e.g., `cv2.imread` on uploaded bytes) before processing |
| 8 | **No error handling in `model.predict()`** — if model inference fails, the raw exception propagates | `app.py:280` | Wrap in try/except with proper HTTP 500 response |
| 9 | **`controlled_image_path` referenced in `finally` may be undefined** if an exception occurs before assignment | `app.py:636` | Initialize `controlled_image_path = None` before the `try` block |
| 10 | **`cors` allows all origins with credentials** — `allow_origins=["*"]` + `allow_credentials=True` is invalid per CORS spec | `app.py:29-35` | Specify explicit allowed origins |
| 11 | **Temporary files not cleaned on prediction error path** | `app.py:607-615` | Ensure both temp files are deleted in a robust `finally` |

### 3.3 Code Quality

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 12 | **Massive function** — `predict()` endpoint is ~200 lines | `app.py:447-643` | Decompose into helper functions: `validate_upload`, `save_temp`, `assess_quality`, `run_prediction`, `build_response` |
| 13 | **Notebook is incomplete and messy** — many partial/empty cells, code fragments, and markdown in the middle | `notebookef6874824c (4).ipynb` | Clean up: remove empty/duplicate cells, organize into clear sections, add narrative |
| 14 | **No project root `requirements.txt`** — only exists inside `image_quality/` and as a partial list in `aptos final/` | `requirements.txt` | Create a unified `requirements.txt` at project root including all dependencies |
| 15 | **`__pycache__/` directories** present in the project — should be gitignored | All directories | Add `.gitignore` with `__pycache__/`, `*.pyc`, `*.pyo`, `.ipynb_checkpoints/` |
| 16 | **No `setup.py` or `pyproject.toml`** — the `image_quality` package isn't installable | Project root | Add packaging config so `pip install -e .` works |

### 3.4 Model & ML

| # | Issue | Fix |
|---|-------|-----|
| 17 | **Test accuracy is 76.2%** — moderate; consider data augmentation tuning or architecture upgrades (EfficientNetB3/B4, or fine-tuning last few layers) | Experiment with unfreezing top layers, adding regularization |
| 18 | **No model explainability** — Grad-CAM or attention maps would help clinicians trust predictions | Build a Grad-CAM module that highlights influential retinal regions |
| 19 | **No test-set evaluation script** — metrics exist only in the notebook and config | Create a dedicated `evaluate.py` that loads the model and test data, outputs confusion matrix, ROC, per-class metrics |
| 20 | **Class weights are hardcoded** in the notebook — should be computed dynamically from class frequencies | Compute class weights programmatically (e.g., `sklearn.utils.class_weight.compute_class_weight`) |

---

## 4. What to Build Next

### Phase 1 — Foundation (Immediate)

| Priority | Feature | Description |
|----------|---------|-------------|
| **P0** | **Project-level `requirements.txt` + `pyproject.toml`** | Unify all dependencies; make `image_quality` installable as a package |
| **P0** | **`.gitignore`** | Exclude `__pycache__/`, `*.pyc`, `.ipynb_checkpoints/`, `uploads/`, `uploads/*`, `*.keras`, `venv/` |
| **P0** | **Fix `test_real_aptos.py` path** | Use relative path or env variable; make it a proper pytest test |
| **P0** | **Align thresholds** | Unify referable threshold across config and app |
| **P1** | **Add logging** | Replace all `print()` with `logging` module; add log rotation for production |
| **P1** | **Add `/api/batch-predict` endpoint** | Accept multiple images in one request; return results for each |
| **P1** | **Model evaluation script** | Standalone script that loads model + test data and outputs confusion matrix, ROC-AUC, per-class F1 |

### Phase 2 — Production Readiness (Short-term)

| Priority | Feature | Description |
|----------|---------|-------------|
| **P1** | **Dockerfile + docker-compose** | Containerize the FastAPI app with proper multi-stage build |
| **P1** | **Authentication** | Add API key or JWT-based auth to protect the medical prediction endpoint |
| **P1** | **Rate limiting** | Prevent API abuse with per-client rate limits |
| **P2** | **Database for predictions** | Store prediction history (PostgreSQL/SQLite) with patient ID, timestamp, image metadata, result |
| **P2** | **Grad-CAM explainability** | Show which regions of the fundus image influenced the prediction — critical for clinical trust |
| **P2** | **CI/CD pipeline** | GitHub Actions for: lint (ruff/flake8), test (`pytest`), type check, and Docker build |

### Phase 3 — Advanced Features (Medium-term)

| Priority | Feature | Description |
|----------|---------|-------------|
| **P2** | **Web frontend** | React/Vue dashboard for uploading images, viewing results, and browsing history |
| **P2** | **DICOM support** | Handle DICOM-format fundus images common in clinical settings |
| **P3** | **Model versioning & A/B testing** | Support multiple model versions; route traffic for comparison |
| **P3** | **Monitoring & observability** | Prometheus metrics, Grafana dashboards for latency, error rates, prediction distribution |
| **P3** | **Continuous retraining pipeline** | Automated retraining on new labeled data with validation gates before deployment |
| **P3** | **Multi-device quality calibration** | Per-device `QualityConfig` profiles for different camera types (fundus camera, smartphone) |

---

## 5. Architecture Diagram

```
User Upload
     │
     ▼
┌──────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│  FastAPI      │────▶│ Image Quality Module │────▶│ DR Prediction      │
│  /api/predict │     │                     │     │ (EfficientNetB0)   │
│               │     │ 1. Assess Quality   │     │                    │
│ - Validate    │     │ 2. Enhance (if      │────▶│ - Preprocess       │
│ - Size check  │     │    borderline)      │     │ - Predict          │
│ - Type check  │     │ 3. Reassess         │     │ - Post-process     │
└──────────────┘     └─────────────────────┘     └────────────────────┘
       │                          │                         │
       ▼                          ▼                         ▼
  JSON Response            QualityResult              Prediction Result
  - Quality scores         - Assessment               - DR class + confidence
  - Enhancement info       - Enhanced image           - Referable decision
  - Recapture feedback     - Recapture required       - Class probabilities
```

---

## 6. File Inventory

```
SIH-DIABETES/
├── aptos final/
│   ├── app.py                          # FastAPI backend (663 lines)
│   ├── best_aptos_model.keras          # Trained model
│   ├── aptos_model_config.json         # Model config + metrics
│   ├── requirements.txt                # API dependencies (7 packages)
│   ├── image_quality/                  # Quality assessment module (13 files)
│   │   ├── __init__.py
│   │   ├── config.py                   # QualityConfig dataclass (40 params)
│   │   ├── quality_assessment.py       # Focus/illumination/FOV scoring (120 lines)
│   │   ├── enhancement.py              # CLAHE/illumination/denoising (40 lines)
│   │   ├── pipeline.py                 # QualityPipeline + QualityResult (103 lines)
│   │   ├── utils.py                    # Image loading + retinal mask (50 lines)
│   │   ├── analyze_aptos_focus.py      # Analysis CLI (145 lines)
│   │   ├── test_quality.py             # Unit tests (104 lines, 10 tests)
│   │   ├── test_real_aptos.py          # Real image test (129 lines) ⚠️ broken path
│   │   ├── test_batch_pipeline.py      # Batch CLI (107 lines)
│   │   ├── requirements.txt            # Module deps (3 packages)
│   │   └── README.md
│   ├── test_images/                    # 17 test images
│   └── notebookef6874824c (4).ipynb   # EDA + training (1600 cells, messy)
├── LICENSE
└── venv/                               # Virtual environment (should be gitignored)
```

---

## 7. Summary Scorecard

| Area | Rating | Notes |
|------|--------|-------|
| **Model Accuracy** | ⭐⭐⭐⭐ | 76.2% test accuracy, 93.4% sensitivity — solid baseline |
| **Code Structure** | ⭐⭐⭐⭐ | Clean module separation; app.py could be decomposed |
| **Testing** | ⭐⭐⭐ | Good unit tests for quality module; no API/model tests |
| **Documentation** | ⭐⭐⭐ | README exists for image_quality; notebook EDA is thorough but messy |
| **Production Readiness** | ⭐⭐ | No auth, no logging, no Docker, no CI/CD |
| **Security** | ⭐⭐ | Open API, no input sanitization beyond basic checks |
| **Deployment** | ⭐⭐ | No containerization, no packaging, no deployment config |

---

*Report generated from project analysis on 2026-09-12.*
