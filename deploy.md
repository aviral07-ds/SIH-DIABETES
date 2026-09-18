1. Target repository structure

I recommend moving toward this:

SIH-DIABETES/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── health.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── aptos/
│   │   │   │   ├── model.py
│   │   │   │   ├── predictor.py
│   │   │   │   ├── config.json
│   │   │   │   └── best_aptos_model.keras
│   │   │   │
│   │   │   ├── idrid/
│   │   │   │   ├── model.py
│   │   │   │   ├── predictor.py
│   │   │   │   └── best_model.pth
│   │   │   │
│   │   │   └── drive/
│   │   │       ├── model.py
│   │   │       ├── predictor.py
│   │   │       └── best_model.pth
│   │   │
│   │   ├── services/
│   │   │   ├── aptos_service.py
│   │   │   ├── idrid_service.py
│   │   │   ├── drive_service.py
│   │   │   └── unified_service.py
│   │   │
│   │   └── schemas/
│   │       └── responses.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   └── ...
│
├── datasets/
│   └── .gitkeep
│
├── .dockerignore
├── .gitignore
├── render.yaml
└── README.md
Why this structure?

The three models remain independent internally:

                ┌── APTOS
                │
Request ──► FastAPI ──► IDRiD
                │
                └── DRIVE

But externally you have:

https://your-app.onrender.com

instead of three different Render URLs.

2. API design

I would expose these endpoints:

GET  /                         → API information
GET  /health                   → health check

POST /api/predict/aptos        → DR severity classification
POST /api/predict/idrid        → lesion segmentation
POST /api/predict/drive        → vessel segmentation

POST /api/predict/all          → run all three

The most useful endpoint for your eventual frontend is:

POST /api/predict/all

The frontend sends one retinal image, and the backend runs:

                    retinal image
                         │
                         ▼
                    FastAPI
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       APTOS           IDRiD           DRIVE
          │              │              │
          ▼              ▼              ▼
       Severity       Lesions         Vessels
3. main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.api.health import router as health_router


app = FastAPI(
    title="SIH Diabetes AI API",
    description="Unified diabetic retinopathy inference API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(router, prefix="/api")

For production, replace allow_origins=["*"] with your actual frontend domain.

4. Health endpoint

backend/app/api/health.py

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "SIH Diabetes AI API"
    }

Render can use:

/health

as the health-check endpoint.

5. Central routes

backend/app/api/routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.aptos_service import predict_aptos
from app.services.idrid_service import predict_idrid
from app.services.drive_service import predict_drive
from app.services.unified_service import predict_all


router = APIRouter()


@router.post("/predict/aptos")
async def aptos_prediction(
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()

        return predict_aptos(image_bytes)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/predict/idrid")
async def idrid_prediction(
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()

        return predict_idrid(image_bytes)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/predict/drive")
async def drive_prediction(
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()

        return predict_drive(image_bytes)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/predict/all")
async def all_predictions(
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()

        return predict_all(image_bytes)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/")
def root():
    return {
        "status": "running",
        "service": "SIH Diabetes AI API",
        "models": [
            "APTOS",
            "IDRiD",
            "DRIVE"
        ]
    }
6. Model service layer

This part is important.

Don't put TensorFlow/PyTorch inference directly inside your FastAPI routes.

Instead:

route
  ↓
service
  ↓
model predictor

That makes debugging much easier.

aptos_service.py
from app.models.aptos.predictor import predict


def predict_aptos(image_bytes: bytes):
    result = predict(image_bytes)

    return {
        "model": "APTOS",
        "task": "diabetic_retinopathy_classification",
        "result": result
    }
idrid_service.py
from app.models.idrid.predictor import predict


def predict_idrid(image_bytes: bytes):
    result = predict(image_bytes)

    return {
        "model": "IDRiD",
        "task": "lesion_segmentation",
        "result": result
    }
drive_service.py
from app.models.drive.predictor import predict


def predict_drive(image_bytes: bytes):
    result = predict(image_bytes)

    return {
        "model": "DRIVE",
        "task": "vessel_segmentation",
        "result": result
    }
7. Unified service

unified_service.py

from app.services.aptos_service import predict_aptos
from app.services.idrid_service import predict_idrid
from app.services.drive_service import predict_drive


def predict_all(image_bytes: bytes):

    aptos_result = predict_aptos(image_bytes)

    idrid_result = predict_idrid(image_bytes)

    drive_result = predict_drive(image_bytes)

    return {
        "status": "success",
        "results": {
            "aptos": aptos_result,
            "idrid": idrid_result,
            "drive": drive_result
        }
    }

Later, we can optimize this so the models are loaded once at application startup, rather than loading them for every request.

8. APTOS predictor

Your existing APTOS implementation is the closest to production-ready. The repository already contains the FastAPI API, Keras model, image-quality pipeline and Docker configuration.

The new predictor should ultimately look like:

from io import BytesIO

import numpy as np
from PIL import Image
import tensorflow as tf


MODEL_PATH = "app/models/aptos/best_aptos_model.keras"

model = tf.keras.models.load_model(MODEL_PATH)


def predict(image_bytes: bytes):

    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    image = image.resize((224, 224))

    image_array = np.array(image) / 255.0

    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    predictions = model.predict(
        image_array,
        verbose=0
    )

    predicted_class = int(
        np.argmax(predictions[0])
    )

    confidence = float(
        np.max(predictions[0])
    )

    return {
        "class": predicted_class,
        "confidence": confidence
    }

However: don't replace your existing APTOS preprocessing with this blindly. Your repository has an image-quality pipeline that is intended to gate every prediction request, so we should preserve that pipeline when doing the actual migration.

9. IDRiD predictor

The IDRiD model is PyTorch, so its predictor can follow this pattern:

import io

import torch
from PIL import Image
import torchvision.transforms as transforms

from app.models.idrid.model import UNet


DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

model = UNet()

checkpoint = torch.load(
    "app/models/idrid/best_model.pth",
    map_location=DEVICE
)

model.load_state_dict(checkpoint)

model.to(DEVICE)
model.eval()


transform = transforms.Compose([
    transforms.ToTensor()
])


def predict(image_bytes: bytes):

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")

    tensor = transform(image)
    tensor = tensor.unsqueeze(0)
    tensor = tensor.to(DEVICE)

    with torch.no_grad():

        output = model(tensor)

    return {
        "shape": list(output.shape)
    }

This is intentionally a skeleton until we preserve the exact preprocessing/output handling from your existing IDRiD predict.py. The repository does have an IDRiD checkpoint, but that checkpoint was trained for only five epochs on a synthetic dataset rather than real IDRiD training data.

10. DRIVE predictor

I would initially create it like this:

def predict(image_bytes: bytes):

    raise RuntimeError(
        "DRIVE model is not ready for inference. "
        "Train and validate the model before deployment."
    )

That might look strange, but it's much better than pretending that DRIVE works.

Your repository currently has:

DRIVE
 ├── model architecture
 ├── training code
 ├── evaluation code
 └── prediction code

but no trained checkpoint, and the forensic inspection found confirmed execution bugs.

Once trained, replace that implementation with the real inference code.

11. Requirements

I would not use the current root requirements file unchanged.

The repository's dependency list has duplicate constraints and an apparent httpx2 issue, while PyTorch dependencies aren't pinned consistently.

For the unified backend, start with something like:

fastapi
uvicorn[standard]
python-multipart

numpy
pillow
opencv-python-headless

tensorflow-cpu==2.21.0
keras==3.13.2

torch
torchvision

scikit-image
scikit-learn
pandas

Then add only dependencies actually imported by the migrated code.

12. Dockerfile

This is where the major change happens.

Your current Dockerfile only packages APTOS; it explicitly copies the APTOS files and does not include Models 1 or 3.

The new Dockerfile should package the entire backend:

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app

RUN useradd \
    --create-home \
    --shell /bin/bash \
    appuser

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

Notice that we're no longer doing:

COPY aptos final/...

Instead:

COPY backend/app ./app

Everything required by the unified API lives under backend/app.

13. .dockerignore

Create:

.git
.github

__pycache__
*.pyc

.env
.env.*

.vscode
.idea

datasets/
*.ipynb

node_modules/

README.md
PROJECT_REPORT.md

Do not ignore your trained model files if they are required to build the image.

For example:

best_aptos_model.keras
best_model.pth

must be available to the Docker build unless you later move them to object storage/model storage.

14. Render deployment

The final architecture becomes:

                    GitHub
                      │
                      ▼
                   Render
                      │
                Docker Build
                      │
                      ▼
             ┌─────────────────┐
             │ FastAPI Docker  │
             │    Container    │
             └────────┬────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
       APTOS         IDRiD       DRIVE
      TensorFlow     PyTorch     PyTorch

Render then gives you one URL:

https://sih-diabetes-api.onrender.com

Your frontend talks only to:

POST https://sih-diabetes-api.onrender.com/api/predict/all
15. render.yaml

You can also define the service as infrastructure-as-code:

services:
  - type: web
    name: sih-diabetes-api
    runtime: docker

    dockerfilePath: ./backend/Dockerfile

    healthCheckPath: /health

    envVars:
      - key: API_KEY
        sync: false

Then configure the secret API_KEY in Render rather than committing it.

Your existing API already uses API-key authentication, and the forensic inspection specifically identified the committed "change-me-in-production" fallback as a security issue.

16. One important change I'd make to /predict/all

I wouldn't initially make one model failure destroy the entire response.

For example:

{
  "status": "partial",
  "results": {
    "aptos": {
      "status": "success",
      "prediction": 2
    },
    "idrid": {
      "status": "success",
      "lesions": {}
    },
    "drive": {
      "status": "unavailable",
      "message": "Model not trained"
    }
  }
}

That means while you're developing DRIVE, your frontend can still demonstrate APTOS + IDRiD.

Once DRIVE is actually trained:

{
  "status": "success",
  "results": {
    "aptos": {},
    "idrid": {},
    "drive": {}
  }
}
The migration path I'd use
CURRENT REPOSITORY
       │
       ▼
┌─────────────────────┐
│ Move code into      │
│ backend/app/models/ │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Build FastAPI       │
│ service layer       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ APTOS ──────────────┤
│ IDRiD ──────────────┤──► /api/predict/all
│ DRIVE ──────────────┤
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Unified Dockerfile  │
└──────────┬──────────┘
           │
           ▼
       RENDER

One correction to the earlier deployment idea: you don't need to upload three separate projects to Render. With this architecture, you push one GitHub repository, Render builds one Docker image, and that image contains the unified FastAPI application plus the model artifacts.

The next step should be the actual repository migration: taking your existing aptos final/, root IDRiD files, and drive-baby/drive/ files and mapping them into this structure without breaking their existing preprocessing/model-loading code. That is especially important for APTOS because its existing image-quality pipeline should be preserved rather than replaced by a simplified predictor.