import os
import uuid
import json

import cv2
import numpy as np
import tensorflow as tf
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from image_quality.pipeline import process_image

# Authentication & rate limiting
from auth import setup_rate_limiting, get_current_user


# ============================================================
# APP CONFIG
# ============================================================

app = FastAPI(
    title="Diabetic Retinopathy Screening API",
    description="APTOS EfficientNetB0 based DR screening backend",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
setup_rate_limiting(app)


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = "best_aptos_model.keras"

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}


# ============================================================
# MODEL CONFIGURATION
# ============================================================

CLASS_NAMES = {
    0: "No DR",
    1: "Mild DR",
    2: "Moderate DR",
    3: "Severe DR",
    4: "Proliferative DR"
}

# Load referable threshold from aptos_model_config.json so the value used
# at runtime always matches the one recorded for the trained model.
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aptos_model_config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as _config_file:
    _model_config = json.load(_config_file)

REFERABLE_THRESHOLD = float(_model_config.get("threshold", 0.42))


# ============================================================
# LOAD MODEL
# ============================================================

# Configure logging (run this once at the startup of app.py)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("dr_screening")

logger.info("Loading APTOS DR model from %s...", MODEL_PATH)

try:
    model = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False
    )
    logger.info("Model loaded successfully.")
    logger.info("Input shape : %s", model.input_shape)
    logger.info("Output shape: %s", model.output_shape)

except Exception as e:
    logger.error("Model loading failed: %s", e, exc_info=True)
    model = None



# PREPROCESSING
# Same baseline preprocessing


def preprocess_image(
    image_path,
    target_size=224
):

    # Read image
    

    img = cv2.imread(
        image_path
    )

    if img is None:

        raise ValueError(
            "Unable to read image."
        )

    # Convert to grayscale
 
    gray = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2GRAY
    )

    # --------------------------------------------------------
    # Find non-black fundus region
    # --------------------------------------------------------

    _, thresh = cv2.threshold(
        gray,
        15,
        255,
        cv2.THRESH_BINARY
    )

    coords = cv2.findNonZero(
        thresh
    )

    # --------------------------------------------------------
    # Crop
    # --------------------------------------------------------

    if coords is None:

        cropped = img

    else:

        x, y, w, h = cv2.boundingRect(
            coords
        )

        cropped = img[
            y:y + h,
            x:x + w
        ]

    # --------------------------------------------------------
    # Resize preserving aspect ratio
    # --------------------------------------------------------

    h, w = cropped.shape[:2]

    scale = min(
        target_size / w,
        target_size / h
    )

    new_w = int(
        w * scale
    )

    new_h = int(
        h * scale
    )

    resized = cv2.resize(
        cropped,
        (new_w, new_h)
    )

    # --------------------------------------------------------
    # Black canvas
    # --------------------------------------------------------

    canvas = np.zeros(
        (
            target_size,
            target_size,
            3
        ),
        dtype=np.uint8
    )

    # --------------------------------------------------------
    # Center image
    # --------------------------------------------------------

    x_offset = (
        target_size - new_w
    ) // 2

    y_offset = (
        target_size - new_h
    ) // 2

    canvas[
        y_offset:y_offset + new_h,
        x_offset:x_offset + new_w
    ] = resized

    # --------------------------------------------------------
    # BGR → RGB
    # --------------------------------------------------------

    canvas = cv2.cvtColor(
        canvas,
        cv2.COLOR_BGR2RGB
    )

    # IMPORTANT:
    # Keep 0–255.
    #
    # EfficientNetB0 inside the model already performs
    # its own input preprocessing.
    # --------------------------------------------------------

    canvas = canvas.astype(
        np.float32
    )

    return canvas


# ============================================================
# PREDICTION
# ============================================================

def predict_dr(
    image_path
):

    if model is None:

        raise RuntimeError(
            "DR model is not loaded."
        )

    # --------------------------------------------------------
    # Preprocess
    # --------------------------------------------------------

    image = preprocess_image(
        image_path
    )

    # --------------------------------------------------------
    # Add batch dimension
    # --------------------------------------------------------

    image = np.expand_dims(
        image,
        axis=0
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    probabilities = model.predict(
        image,
        verbose=0
    )[0]

    # --------------------------------------------------------
    # Predicted class
    # --------------------------------------------------------

    predicted_class = int(
        np.argmax(probabilities)
    )

    predicted_label = CLASS_NAMES[
        predicted_class
    ]

    # --------------------------------------------------------
    # Classification confidence
    # --------------------------------------------------------

    confidence = float(
        probabilities[
            predicted_class
        ]
    )

    # --------------------------------------------------------
    # Referable probability
    #
    # 0,1 → Non-referable
    # 2,3,4 → Referable
    # --------------------------------------------------------

    referable_probability = float(
        np.sum(
            probabilities[2:5]
        )
    )

    # --------------------------------------------------------
    # Referable decision
    # --------------------------------------------------------

    is_referable = (
        referable_probability
        >= REFERABLE_THRESHOLD
    )

    if is_referable:

        referable_label = (
            "Referable DR"
        )

    else:

        referable_label = (
            "Non-Referable DR"
        )

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    return {

        "predicted_class":
            predicted_class,

        "predicted_label":
            predicted_label,

        "confidence":
            round(
                confidence * 100,
                2
            ),

        "class_probabilities": {

            CLASS_NAMES[i]:
                round(
                    float(
                        probabilities[i]
                    ) * 100,
                    2
                )

            for i in range(5)
        },

        "referable_probability":
            round(
                referable_probability * 100,
                2
            ),

        "referable_threshold":
            REFERABLE_THRESHOLD,

        "referable":
            is_referable,

        "referable_label":
            referable_label
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {

        "status": "online",

        "service":
            "Diabetic Retinopathy Screening API",

        "model":
            "APTOS EfficientNetB0",

        "model_loaded":
            model is not None
    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/api/model-info")
def get_model_info():

    return {

        "model":
            "EfficientNetB0",

        "dataset":
            "APTOS 2019",

        "input_size":
            "224x224",

        "classes":
            CLASS_NAMES,

        "referable_definition":
            "DR Level 2 or higher",

        "referable_threshold":
            REFERABLE_THRESHOLD,

        "threshold_source":
            "APTOS validation set"
    }


# ============================================================
# PREDICTION HELPERS
# ============================================================

def _validate_upload(image: UploadFile) -> str:
    """Validate the uploaded file's extension and return the extension."""
    if not image.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    extension = os.path.splitext(image.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Use JPG, JPEG or PNG."
        )
    return extension


def _validate_image_integrity(contents: bytes) -> None:
    """Decode the uploaded bytes to verify the image is not corrupt."""
    decode_array = np.frombuffer(contents, dtype=np.uint8)
    decoded = cv2.imdecode(decode_array, cv2.IMREAD_COLOR)
    if decoded is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode the uploaded image. The file may be corrupt."
        )


def _build_quality_response(quality_data: dict, filename: str) -> JSONResponse:
    """Return a recapture-required response."""
    return JSONResponse({
        "success": True,
        "filename": filename,
        "image_quality": {
            "status": quality_data["quality_status"],
            "quality_score": quality_data["quality_score"],
            "focus_score": quality_data["focus_score"],
            "illumination_score": quality_data["illumination_score"],
            "field_of_view_score": quality_data["field_of_view_score"],
            "enhancement_applied": quality_data["enhancement_applied"],
            "enhancements": quality_data["enhancements_used"],
            "recapture_required": quality_data["recapture_required"],
            "recapture_feedback": quality_data["recapture_feedback"],
        },
    })


async def _process_single_prediction(image: UploadFile) -> dict:
    """Process a single image and return the prediction result dict."""
    extension = _validate_upload(image)
    contents = await image.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image too large. Maximum size is 10 MB."
        )

    _validate_image_integrity(contents)

    filepath = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}{extension}")
    controlled_image_path = None

    try:
        with open(filepath, "wb") as f:
            f.write(contents)

        quality_result = process_image(filepath)
        quality_data = quality_result.to_dict()

        if quality_data["recapture_required"]:
            return {
                "success": True,
                "filename": image.filename,
                "image_quality": {
                    "status": quality_data["quality_status"],
                    "quality_score": quality_data["quality_score"],
                    "focus_score": quality_data["focus_score"],
                    "illumination_score": quality_data["illumination_score"],
                    "field_of_view_score": quality_data["field_of_view_score"],
                    "enhancement_applied": quality_data["enhancement_applied"],
                    "enhancements": quality_data["enhancements_used"],
                    "recapture_required": quality_data["recapture_required"],
                    "recapture_feedback": quality_data["recapture_feedback"],
                },
            }

        controlled_image_path = os.path.join(
            UPLOAD_FOLDER,
            f"{uuid.uuid4().hex}_controlled{extension}"
        )

        if quality_result.processed_image is None or not cv2.imwrite(
            controlled_image_path,
            quality_result.processed_image
        ):
            raise ValueError("Unable to save quality-controlled image.")

        result = predict_dr(controlled_image_path)

        return {
            "success": True,
            "filename": image.filename,
            "image_quality": {
                "status": quality_data["quality_status"],
                "quality_score": quality_data["quality_score"],
                "focus_score": quality_data["focus_score"],
                "illumination_score": quality_data["illumination_score"],
                "field_of_view_score": quality_data["field_of_view_score"],
                "enhancement_applied": quality_data["enhancement_applied"],
                "enhancements": quality_data["enhancements_used"],
                "recapture_required": quality_data["recapture_required"],
                "recapture_feedback": quality_data["recapture_feedback"],
            },
            "prediction": result,
        }
    finally:
        for path in (filepath, controlled_image_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass


# ============================================================
# PREDICTION ENDPOINTS
# ============================================================

@app.post("/api/predict")
async def predict(
    image: UploadFile = File(...),
    _=Depends(get_current_user),
):
    """Accept a fundus image, assess quality, and predict DR severity."""
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    return await _process_single_prediction(image)


@app.post("/api/batch-predict")
async def batch_predict(
    images: list[UploadFile] = File(...),
    _=Depends(get_current_user),
):
    """Accept multiple fundus images and return predictions for each."""
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")

    if len(images) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 images per batch request."
        )

    results = []
    for image in images:
        try:
            result = await _process_single_prediction(image)
            results.append(result)
        except HTTPException as e:
            results.append({
                "filename": image.filename,
                "success": False,
                "error": e.detail,
            })
        except Exception as e:
            logger.error("Batch prediction failed for %s: %s", image.filename, e)
            results.append({
                "filename": image.filename,
                "success": False,
                "error": "Unable to process the retinal image.",
            })

    return JSONResponse({
        "success": True,
        "batch_size": len(images),
        "results": results,
    })


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                8000
            )
        ),
        reload=False
    )