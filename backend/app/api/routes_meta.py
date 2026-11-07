from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.database.session import get_db
from app.services.db_service import DatabaseService
from app.services.llm_service import LLMService
from app.schemas.analysis import (
    FeedbackRequest,
    FeedbackResponse,
    ReportRequest,
    ReportResponse
)

router = APIRouter(prefix="/api", tags=["System & Community"])

class TestKeyRequest(BaseModel):
    provider: str
    api_key: str

class TestKeyResponse(BaseModel):
    success: bool
    message: str

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "hi"
    source_lang: Optional[str] = "auto"
    provider: Optional[str] = None
    api_key: Optional[str] = None

class TranslateResponse(BaseModel):
    status: str = "success"
    translated_text: str
    target_lang: str
    source_lang: str
    engine: Optional[str] = "hybrid"

@router.get("/health", summary="Service health check")
async def health_check():
    keys_status = LLMService.get_active_keys_status()
    configured_keys = [k for k, v in keys_status.items() if v]

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "active_backend_keys": configured_keys,
        "database": "connected (PostgreSQL / SQLite persistent layer)",
        "institution": "Greater Noida Institute of Technology (GNIOT) / AKTU",
        "supervisor": "Dr. Saumya Chaturvedi",
        "team": ["Aarti Vishwakarma", "Soni", "Vandana", "Yaseen Jamshed"]
    }

@router.get("/config/ai-status", summary="Get AI provider status and active configuration")
async def get_ai_status():
    keys_status = LLMService.get_active_keys_status()
    
    # Determine default effective provider
    effective = settings.AI_PROVIDER
    if effective == "auto":
        for p in ["groq", "gemini", "openai", "anthropic", "ollama"]:
            if keys_status.get(p):
                effective = p
                break
        if effective == "auto":
            effective = "mock"

    return {
        "configured_provider": settings.AI_PROVIDER,
        "effective_provider": effective,
        "server_keys": keys_status,
        "models": {
            "groq": settings.GROQ_MODEL,
            "gemini": settings.GEMINI_MODEL,
            "openai": settings.OPENAI_MODEL,
            "anthropic": settings.ANTHROPIC_MODEL,
            "ollama": getattr(settings, "OLLAMA_MODEL", "llama3.2")
        },
        "supported_providers": ["groq", "gemini", "openai", "anthropic", "ollama", "mock"]
    }

@router.post("/config/test-key", response_model=TestKeyResponse, summary="Test and validate an AI API Key")
async def test_api_key(payload: TestKeyRequest):
    provider_clean = payload.provider.strip().lower()
    if provider_clean not in ["ollama", "local", "mock"] and not payload.api_key.strip():
        raise HTTPException(status_code=400, detail="API Key cannot be empty.")
        
    success, msg = LLMService.test_key(payload.provider, payload.api_key)
    return TestKeyResponse(success=success, message=msg)

@router.post("/translate", response_model=TranslateResponse, summary="Translate text into any supported language")
async def translate_content(payload: TranslateRequest):
    """Translates text or reports into any target language with LLM and fast engine fallbacks."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    result = LLMService.translate(
        text=payload.text,
        target_lang=payload.target_lang,
        source_lang=payload.source_lang or "auto",
        provider=payload.provider,
        api_key=payload.api_key
    )
    return TranslateResponse(
        status="success",
        translated_text=result["translated_text"],
        target_lang=result["target_lang"],
        source_lang=result["source_lang"],
        engine=result.get("engine", "hybrid")
    )

@router.post("/feedback", response_model=FeedbackResponse, summary="Submit assessment feedback")
async def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    DatabaseService.save_feedback(
        db=db,
        result_id=payload.result_id,
        is_helpful=payload.is_helpful,
        comments=payload.comments
    )
    return FeedbackResponse(
        status="success",
        message="Thank you for your feedback. Record saved to database."
    )

@router.post("/report", response_model=ReportResponse, summary="Report a novel viral claim")
async def report_claim(payload: ReportRequest, db: Session = Depends(get_db)):
    report_id = DatabaseService.save_report(
        db=db,
        claim=payload.claim,
        platform=payload.platform,
        url=payload.url,
        notes=payload.notes
    )
    return ReportResponse(
        status="queued",
        report_id=report_id,
        message="Viral claim submitted and recorded in investigation database."
    )
