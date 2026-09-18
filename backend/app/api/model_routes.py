"""A model-scoped inference router used by the independent deployments."""

from collections.abc import Callable

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import require_api_key


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


def create_prediction_router(model_name: str, predictor: Callable[[bytes], dict]) -> APIRouter:
    """Create one protected prediction endpoint without importing other models."""
    router = APIRouter(dependencies=[Depends(require_api_key)], tags=["predictions"])

    @router.post(f"/predict/{model_name.lower()}")
    async def prediction(file: UploadFile = File(...)):
        try:
            return predictor(await _image_bytes(file))
        except HTTPException:
            raise
        except (ValueError, OSError) as error:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
        except RuntimeError as error:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error

    return router
