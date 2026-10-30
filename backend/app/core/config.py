import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Absolute directories for bulletproof .env resolution
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BACKEND_DIR.parent

ENV_PATHS = [
    str(BACKEND_DIR / ".env"),
    str(ROOT_DIR / ".env"),
    ".env"
]

# Pre-parse non-empty variables from root and backend .env files
_file_values = {}
try:
    from dotenv import dotenv_values
    for _p in [ROOT_DIR / ".env", BACKEND_DIR / ".env"]:
        if _p.is_file():
            for _k, _v in dotenv_values(_p).items():
                if _v is not None and str(_v).strip() != "":
                    _file_values[_k] = str(_v).strip()
except Exception:
    pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "TruthShield: Social Media & Misleading Information Platform"
    PROJECT_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Server configuration
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Database URL: SQLite by default for zero-friction local run; PostgreSQL in production
    DATABASE_URL: str = "sqlite:///./misinfo_app.db"
    
    # AI Engine Provider: "auto", "groq", "gemini", "openai", "anthropic", or "mock"
    AI_PROVIDER: str = "auto"
    
    # Keys from .env
    API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Model selections
    OPENAI_MODEL: str = "gpt-4o-mini"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-20241022"
    AI_REQUEST_TIMEOUT: int = 25  # seconds
    
    # SMTP / Gmail Configuration for Real Email OTP Dispatch
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    
    class Config:
        env_file = ENV_PATHS
        extra = "allow"

settings = Settings()

# Ensure any non-empty key found in root .env or backend .env is assigned if currently empty
for _k, _v in _file_values.items():
    if hasattr(settings, _k) and not getattr(settings, _k):
        setattr(settings, _k, _v)

