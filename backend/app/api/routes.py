"""Authenticated image-inference endpoints."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import require_api_key
from app.services.aptos_service import predict_aptos
from app.services.drive_service import predict_drive
from app.services.idrid_service import predict_idrid
from app.services.unified_service import predict_all

router = APIRouter(dependencies=[Depends(require_api_key)], tags=["predictions"])


async def _image_bytes(file: UploadFile) -> bytes:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A file name is required.")
    if file.content_type not in {"image/jpeg", "image/png", "image/tiff"}:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Upload a JPEG, PNG, or TIFF image.")
    image_bytes = await file.read(settings.max_upload_bytes + 1)
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
    if len(image_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image exceeds the 10 MB upload limit.")
    return image_bytes


async def _run(file: UploadFile, predictor):
    try:
        return predictor(await _image_bytes(file))
    except HTTPException:
        raise
    except (ValueError, OSError) as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.post("/predict/aptos")
async def aptos_prediction(file: UploadFile = File(...)):
    return await _run(file, predict_aptos)


@router.post("/predict/idrid")
async def idrid_prediction(file: UploadFile = File(...)):
    return await _run(file, predict_idrid)


@router.post("/predict/drive")
async def drive_prediction(file: UploadFile = File(...)):
    return await _run(file, predict_drive)


@router.post("/predict/all")
async def all_predictions(file: UploadFile = File(...)):
    return await _run(file, predict_all)
