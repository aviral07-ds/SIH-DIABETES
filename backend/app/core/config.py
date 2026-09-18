"""Runtime settings loaded from the environment."""

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    api_key: str | None = os.getenv("API_KEY")
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
    cors_origins: tuple[str, ...] = tuple(
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()
    )


settings = Settings()
