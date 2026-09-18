"""Best-effort unified inference; an unavailable model does not hide useful results."""

from collections.abc import Callable

from .aptos_service import predict_aptos
from .drive_service import predict_drive
from .idrid_service import predict_idrid


def _run(predictor: Callable[[bytes], dict], image_bytes: bytes) -> dict:
    try:
        return {"status": "success", **predictor(image_bytes)}
    except Exception as error:
        return {"status": "unavailable", "message": str(error)}


def predict_all(image_bytes: bytes) -> dict:
    results = {
        "aptos": _run(predict_aptos, image_bytes),
        "idrid": _run(predict_idrid, image_bytes),
        "drive": _run(predict_drive, image_bytes),
    }
    return {"status": "success" if all(item["status"] == "success" for item in results.values()) else "partial", "results": results}
