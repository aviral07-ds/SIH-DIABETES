"""DRIVE remains intentionally unavailable until a validated checkpoint is provided."""


def predict(_: bytes) -> dict:
    raise RuntimeError("DRIVE inference is unavailable: no trained, validated checkpoint is included.")
