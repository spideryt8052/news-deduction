import io
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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

@router.post("/translate/extract-doc", summary="Extract readable text from PDF, DOCX, TXT, or MD documents")
async def extract_document_text(file: UploadFile = File(...)):
    """Extracts text content from uploaded document files (PDF, DOCX, TXT, MD, CSV, JSON)."""
    filename = file.filename or "document"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    allowed = ["pdf", "docx", "txt", "md", "csv", "json"]
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats: {', '.join('.' + a for a in allowed)}"
        )
    
    # Secure streaming read with strict 15MB ceiling to prevent Memory Exhaustion DoS attacks
    max_size = 15 * 1024 * 1024  # 15MB
    chunks = []
    total_bytes = 0
    while True:
        chunk = await file.read(512 * 1024)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_size:
            raise HTTPException(status_code=400, detail="Document exceeds 15MB file size limit.")
        chunks.append(chunk)

    if total_bytes == 0:
        raise HTTPException(status_code=400, detail="The uploaded document is empty.")

    contents = b"".join(chunks)
        
    extracted_text = ""
    pages_count = 1
    
    try:
        if ext == "pdf":
            try:
                import pypdf
            except ImportError:
                raise HTTPException(status_code=500, detail="PDF engine (pypdf) is not installed on server.")
                
            pdf_stream = io.BytesIO(contents)
            reader = pypdf.PdfReader(pdf_stream)
            if reader.is_encrypted:
                try:
                    reader.decrypt("")
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail="This PDF is password-protected. Please remove password encryption and retry."
                    )
            
            pages_count = len(reader.pages)
            pages_text = []
            for page in reader.pages:
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append(txt.strip())
            
            extracted_text = "\n\n".join(pages_text)
            if not extracted_text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="No selectable text found in this PDF. It appears to be an image-only scanned document."
                )
                
        elif ext == "docx":
            try:
                import docx
            except ImportError:
                raise HTTPException(status_code=500, detail="Word engine (python-docx) is not installed on server.")
                
            docx_stream = io.BytesIO(contents)
            doc = docx.Document(docx_stream)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        paragraphs.append(row_text)
            
            extracted_text = "\n\n".join(paragraphs)
            if not extracted_text.strip():
                raise HTTPException(status_code=400, detail="No readable text found in this Word (.docx) document.")
                
        elif ext in ["txt", "md", "csv", "json"]:
            try:
                extracted_text = contents.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = contents.decode("latin-1", errors="replace")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
        
    return {
        "status": "success",
        "filename": filename,
        "file_type": ext,
        "pages": pages_count,
        "char_count": len(extracted_text),
        "word_count": len(extracted_text.split()),
        "extracted_text": extracted_text
    }

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
