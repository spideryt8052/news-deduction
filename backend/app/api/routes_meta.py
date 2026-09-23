from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.services.db_service import DatabaseService
from app.schemas.analysis import (
    FeedbackRequest,
    FeedbackResponse,
    ReportRequest,
    ReportResponse
)

router = APIRouter(prefix="/api", tags=["System & Community"])

@router.get("/health", summary="Service health check")
async def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "database": "connected (PostgreSQL / SQLite persistent layer)",
        "institution": "Greater Noida Institute of Technology (GNIOT) / AKTU",
        "supervisor": "Dr. Saumya Chaturvedi",
        "team": ["Aarti Vishwakarma", "Soni", "Vandana", "Yaseen Jamshed"]
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
