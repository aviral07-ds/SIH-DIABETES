import os
import uuid

import cv2
import numpy as np
import tensorflow as tf

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from image_quality.pipeline import process_image


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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

# Selected ONLY from APTOS validation.
REFERABLE_THRESHOLD = 0.36


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading APTOS DR model...")

try:

    model = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False
    )

    print("Model loaded successfully.")
    print("Input shape :", model.input_shape)
    print("Output shape:", model.output_shape)

except Exception as e:

    print("Model loading failed:")
    print(e)

    model = None


# ============================================================
# PREPROCESSING
# Same baseline preprocessing
# ============================================================

def preprocess_image(
    image_path,
    target_size=224
):

    # --------------------------------------------------------
    # Read image
    # --------------------------------------------------------

    img = cv2.imread(
        image_path
    )

    if img is None:

        raise ValueError(
            "Unable to read image."
        )

    # --------------------------------------------------------
    # Convert to grayscale
    # --------------------------------------------------------

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
# PREDICTION ENDPOINT
# ============================================================

@app.post("/api/predict")
async def predict(
    image: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Check model
    # --------------------------------------------------------

    if model is None:

        raise HTTPException(
            status_code=500,
            detail="Model is not loaded."
        )

    # --------------------------------------------------------
    # Validate filename
    # --------------------------------------------------------

    if not image.filename:

        raise HTTPException(
            status_code=400,
            detail="No filename provided."
        )

    extension = os.path.splitext(
        image.filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Use JPG, JPEG or PNG."
            )
        )

    # --------------------------------------------------------
    # Read uploaded file
    # --------------------------------------------------------

    contents = await image.read()

    # --------------------------------------------------------
    # Size check
    # --------------------------------------------------------

    if len(contents) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=413,
            detail=(
                "Image too large. "
                "Maximum size is 10 MB."
            )
        )

    # --------------------------------------------------------
    # Unique temporary filename
    # --------------------------------------------------------

    filename = (
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    try:

        # ----------------------------------------------------
        # Save image
        # ----------------------------------------------------

        with open(
            filepath,
            "wb"
        ) as f:

            f.write(contents)

        # ----------------------------------------------------
        # Image quality assessment
        # ----------------------------------------------------

        quality_result = process_image(
            filepath
        )

        quality_data = quality_result.to_dict()

        image_quality = {
            "status": quality_data["quality_status"],
            "quality_score": quality_data["quality_score"],
            "focus_score": quality_data["focus_score"],
            "illumination_score": quality_data["illumination_score"],
            "field_of_view_score": quality_data["field_of_view_score"],
            "enhancement_applied": quality_data["enhancement_applied"],
            "enhancements": quality_data["enhancements_used"],
            "recapture_required": quality_data["recapture_required"],
            "recapture_feedback": quality_data["recapture_feedback"],
        }

        if quality_data["recapture_required"]:

            return JSONResponse({

                "success": True,

                "filename":
                    image.filename,

                "image_quality":
                    image_quality
            })

        controlled_image_path = os.path.join(
            UPLOAD_FOLDER,
            f"{uuid.uuid4().hex}_controlled{extension}"
        )

        if quality_result.processed_image is None or not cv2.imwrite(
            controlled_image_path,
            quality_result.processed_image
        ):

            raise ValueError(
                "Unable to save quality-controlled image."
            )

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        result = predict_dr(
            controlled_image_path
        )

        return JSONResponse({

            "success": True,

            "filename":
                image.filename,

            "image_quality":
                image_quality,

            "prediction":
                result

        })

    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to process "
                "the retinal image."
            )
        )

    finally:

        # ----------------------------------------------------
        # Delete temporary image
        # ----------------------------------------------------

        if os.path.exists(filepath):

            try:
                os.remove(filepath)

            except Exception:
                pass

        if "controlled_image_path" in locals() and os.path.exists(controlled_image_path):

            try:
                os.remove(controlled_image_path)

            except Exception:
                pass


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