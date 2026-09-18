"""
FastAPI REST API Server for IDRiD Retinal Lesion Segmentation Model (SIH26038).
Provides REST endpoints for JSON lesion analysis, clinical risk assessment, and PNG overlay generation.
"""

import os
import io
import base64
import numpy as np
import cv2
from PIL import Image
import torch
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional

from model import UNet
from predict import load_prediction_model, predict_single_image, LESION_NAMES_FULL, LESION_COLORS_RGB

# Initialize FastAPI App
app = FastAPI(
    title="IDRiD Retinal Lesion Segmentation API (SIH26038)",
    description="REST API service powering AI pixel-level segmentation of Microaneurysms, Hemorrhages, Hard Exudates, and Soft Exudates in fundus images.",
    version="1.0.0"
)

# Enable CORS for cross-platform integration (Web, Mobile, React, Angular)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and device
MODEL = None
DEVICE = None
CHECKPOINT_PATH = "./checkpoints/best_model.pth"

def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    else:
        return torch.device("cpu")

@app.on_event("startup")
def startup_event():
    global MODEL, DEVICE
    DEVICE = get_device()
    print(f"[FastAPI] Initializing model on device: {DEVICE}")
    if os.path.exists(CHECKPOINT_PATH):
        try:
            MODEL, _ = load_prediction_model(CHECKPOINT_PATH, DEVICE)
            print(f"[FastAPI] Loaded checkpoint successfully from {CHECKPOINT_PATH}")
        except Exception as e:
            print(f"[FastAPI] Warning: Failed to load checkpoint: {e}")
    else:
        print(f"[FastAPI] Warning: Checkpoint not found at {CHECKPOINT_PATH}. Run training first.")


@app.get("/")
def root():
    """Root sitemap & health check"""
    return {
        "status": "online",
        "service": "IDRiD Retinal Lesion Segmentation API (SIH26038)",
        "version": "1.0.0",
        "device": str(DEVICE),
        "model_loaded": MODEL is not None,
        "endpoints": {
            "health": "/health",
            "predict_json": "/predict",
            "predict_overlay_png": "/predict/overlay",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "device": str(DEVICE),
        "checkpoint_exists": os.path.exists(CHECKPOINT_PATH),
        "model_loaded": MODEL is not None
    }


@app.post("/predict")
async def predict_lesions_json(
    file: UploadFile = File(...),
    threshold: float = Query(0.5, ge=0.1, le=0.9, description="Confidence binarization threshold"),
    use_clahe: bool = Query(True, description="Apply CLAHE green channel enhancement")
):
    """
    Accepts fundus image file upload.
    Returns structured JSON with detection status, pixel counts, area %, and clinical risk assessment.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Ensure best_model.pth exists.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image (.jpg, .png, .tif)")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded image file.")

    # Save to temp path for prediction function
    os.makedirs("./temp_uploads", exist_ok=True)
    temp_path = os.path.join("./temp_uploads", f"temp_{file.filename}")
    cv2.imwrite(temp_path, img_bgr)

    try:
        res = predict_single_image(MODEL, temp_path, DEVICE, img_size=(256, 256), threshold=threshold, use_clahe=use_clahe)
        
        # Calculate overall clinical risk
        stats = res["lesion_stats"]
        total_lesion_area = sum(s["area_percentage"] for s in stats.values())
        any_detected = any(s["detected"] for s in stats.values())

        if total_lesion_area > 1.5 or (stats["HE"]["detected"] and stats["SE"]["detected"]):
            risk_level = "Severe DR Risk"
            recommendation = "High presence of hemorrhages/exudates detected. Immediate ophthalmological consultation required."
        elif any_detected:
            risk_level = "Mild-to-Moderate DR Risk"
            recommendation = "Early microvascular lesions detected. Regular retinal screening recommended."
        else:
            risk_level = "No DR Detected (Clean)"
            recommendation = "No microaneurysms, hemorrhages, or exudates detected. Retinal background is normal."

        response_data = {
            "filename": file.filename,
            "dimensions": {"height": img_bgr.shape[0], "width": img_bgr.shape[1]},
            "threshold": threshold,
            "use_clahe": use_clahe,
            "lesion_analysis": stats,
            "summary": {
                "overall_lesion_area_percentage": round(total_lesion_area, 2),
                "clinical_risk_level": risk_level,
                "recommendation": recommendation
            }
        }
        return JSONResponse(content=response_data)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/predict/overlay")
async def predict_lesions_overlay_png(
    file: UploadFile = File(...),
    threshold: float = Query(0.5, ge=0.1, le=0.9),
    use_clahe: bool = Query(True)
):
    """
    Accepts fundus image file upload.
    Returns PNG image of color-coded multi-lesion overlay onto original fundus.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Checkpoint missing.")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded image file.")

    os.makedirs("./temp_uploads", exist_ok=True)
    temp_path = os.path.join("./temp_uploads", f"temp_overlay_{file.filename}")
    cv2.imwrite(temp_path, img_bgr)

    try:
        res = predict_single_image(MODEL, temp_path, DEVICE, img_size=(256, 256), threshold=threshold, use_clahe=use_clahe)
        overlay_rgb = res["overlay_orig"]
        overlay_bgr = cv2.cvtColor(overlay_rgb, cv2.COLOR_RGB2BGR)

        is_success, buffer = cv2.imencode(".png", overlay_bgr)
        if not is_success:
            raise HTTPException(status_code=500, detail="Failed to encode overlay image")

        return Response(content=buffer.tobytes(), media_type="image/png")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
