from typing import List
from pydantic_settings import BaseSettings

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
        "*"
    ]
    
    # Database URL: SQLite by default for zero-friction local run; PostgreSQL in production
    DATABASE_URL: str = "sqlite:///./misinfo_app.db"
    
    # AI Engine Provider: "mock", "groq", "openai", or "anthropic"
    AI_PROVIDER: str = "mock"
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Model selections
    OPENAI_MODEL: str = "gpt-4o-mini"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    AI_REQUEST_TIMEOUT: int = 15  # seconds
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
