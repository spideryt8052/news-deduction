import io
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Header, status
from sqlalchemy.orm import Session
from PIL import Image

from app.database.session import get_db
from app.services.db_service import DatabaseService
from app.services.orchestrator import PipelineOrchestrator
from app.schemas.analysis import (
    TextAnalysisRequest,
    UrlAnalysisRequest,
    AnalysisResultResponse
)

router = APIRouter(prefix="/api", tags=["Analysis"])

@router.post(
    "/analyze/text",
    response_model=AnalysisResultResponse,
    summary="Analyze text or social media claim",
    description="Preprocesses textual statements, extracts atomic claims, checks linguistic markers, and returns an explanation-first credibility verdict."
)
async def analyze_text(
    payload: TextAnalysisRequest, 
    db: Session = Depends(get_db),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    try:
        effective_provider = payload.ai_provider or x_ai_provider
        effective_key = payload.api_key or x_api_key

        result = PipelineOrchestrator.analyze_text(
            text=payload.text,
            source_hint=payload.source_hint,
            ai_provider=effective_provider,
            api_key=effective_key
        )
        # Persist to database
        DatabaseService.save_analysis(db, result, raw_content=payload.text)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}"
        )

@router.post(
    "/analyze/url",
    response_model=AnalysisResultResponse,
    summary="Analyze web article URL",
    description="Parses domain credibility, inspects host registry against known fact-checkers and authorities, and generates an assessment."
)
async def analyze_url(
    payload: UrlAnalysisRequest, 
    db: Session = Depends(get_db),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    try:
        effective_provider = payload.ai_provider or x_ai_provider
        effective_key = payload.api_key or x_api_key

        result = PipelineOrchestrator.analyze_url(
            url=payload.url,
            ai_provider=effective_provider,
            api_key=effective_key
        )
        # Persist to database
        DatabaseService.save_analysis(db, result, raw_content=payload.url)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"URL verification error: {str(e)}"
        )

@router.post(
    "/analyze/image",
    response_model=AnalysisResultResponse,
    summary="Analyze screenshot or flyer image",
    description="Validates image format and size, inspects visual metadata, and passes extracted content through the credibility engine."
)
async def analyze_image(
    file: UploadFile = File(...),
    ai_provider: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    # 1. Validate file extension and MIME type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Allowed formats are PNG, JPEG, and WEBP."
        )

    # 2. Read bytes and enforce size limit (10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit."
        )

    # 3. Verify image integrity with Pillow
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is corrupted or not a valid image."
        )

    effective_provider = ai_provider or x_ai_provider
    effective_key = api_key or x_api_key

    # Extract text from image or pass filename context
    extracted_text = f"Content extracted from uploaded screenshot ({file.filename})"
    result = PipelineOrchestrator.analyze_image(
        extracted_text=extracted_text,
        filename=file.filename or "screenshot.png",
        ai_provider=effective_provider,
        api_key=effective_key
    )
    # Persist to database
    DatabaseService.save_analysis(db, result, raw_content=extracted_text)
    return result

@router.get(
    "/results/{result_id}",
    response_model=AnalysisResultResponse,
    summary="Retrieve previously generated assessment report",
    description="Fetches stored assessment details by unique UUID from the database."
)
async def get_result(result_id: str, db: Session = Depends(get_db)):
    result = DatabaseService.get_analysis_by_id(db, result_id)
    if not result:
        # Fallback check on in-memory cache
        result = PipelineOrchestrator.get_result_by_id(result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis report with ID '{result_id}' not found."
        )
    return result
