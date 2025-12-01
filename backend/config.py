"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    app_name: str = "Architect AI"
    debug: bool = True
    
    # Database / Frontend
    mongo_url: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    database_name: str = "architect_ai"
    use_in_memory_db: bool = os.environ.get("USE_IN_MEMORY_DB", "").lower() == "true"
    frontend_origin: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
    
    # JWT
    secret_key: str = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    refresh_token_expire_days: int = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
    
    # LLM
    llm_provider: str = os.environ.get("LLM_PROVIDER", "stub")
    llm_api_key: Optional[str] = os.environ.get("LLM_API_KEY")
    llm_model_name: str = os.environ.get("LLM_MODEL_NAME", "gpt-4")
    huggingface_api_key: Optional[str] = os.environ.get("HUGGINGFACE_API_KEY")
    gemini_api_key: Optional[str] = os.environ.get("GEMINI_API_KEY")

    # PlantUML / external services
    plantuml_api_host: Optional[str] = os.environ.get("PLANTUML_API_HOST")
    plantuml_api_key: Optional[str] = os.environ.get("PLANTUML_API_KEY")
    
    class Config:
        env_file = ".env"


settings = Settings()


def _resolve_llm_api_key(cfg: Settings) -> Optional[str]:
    """Prefer provider-specific keys if generic one not supplied."""
    if cfg.llm_api_key:
        return cfg.llm_api_key
    provider = (cfg.llm_provider or "").lower()
    if provider in {"gemini", "google", "google_gemini"} and cfg.gemini_api_key:
        return cfg.gemini_api_key
    if provider in {"huggingface", "hf"} and cfg.huggingface_api_key:
        return cfg.huggingface_api_key
    return cfg.llm_api_key


settings.llm_api_key = _resolve_llm_api_key(settings)
