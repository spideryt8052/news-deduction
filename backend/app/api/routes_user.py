"""
User Panel Routes: Profile, Personal Analytics, Verification History
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.models import UserModel, AnalysisResultModel
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/user", tags=["User Panel"])

@router.get(
    "/profile",
    summary="Get user dashboard profile with personal verification stats"
)
async def get_user_profile_stats(
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
):
    # Personal analysis count
    user_analyses = db.query(AnalysisResultModel).filter(AnalysisResultModel.user_id == user.id).all()
    
    # If user hasn't specific tagged records yet, give overview stats
    total_count = len(user_analyses)
    breakdown = {"Likely Reliable": 0, "Potentially Misleading": 0, "Likely False": 0, "Needs Further Verification": 0}
    reliable_count = 0
    misleading_count = 0
    false_count = 0

    for item in user_analyses:
        cls = item.classification or ""
        if cls in breakdown:
            breakdown[cls] += 1
        
        cls_lower = cls.lower()
        if "reliable" in cls_lower:
            reliable_count += 1
        elif "misleading" in cls_lower or "unverified" in cls_lower:
            misleading_count += 1
        elif "false" in cls_lower:
            false_count += 1

    # Approximate risk score based on classifications
    if total_count > 0:
        total_risk = (reliable_count * 15) + (misleading_count * 60) + (false_count * 90)
        avg_risk_score = round(total_risk / total_count)
    else:
        avg_risk_score = 0

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else ""
        },
        "stats": {
            "total_analyses": total_count,
            "total_submitted": total_count,
            "reliable_count": reliable_count,
            "misleading_count": misleading_count,
            "false_count": false_count,
            "avg_risk_score": avg_risk_score,
            "breakdown": breakdown
        }
    }

@router.get(
    "/history",
    summary="Get personal submission history for user panel"
)
async def get_user_personal_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
):
    # Fetch user specific first, fallback to recent if none
    records = db.query(AnalysisResultModel).filter(
        AnalysisResultModel.user_id == user.id
    ).order_by(AnalysisResultModel.created_at.desc()).limit(limit).all()

    if not records:
        records = db.query(AnalysisResultModel).order_by(
            AnalysisResultModel.created_at.desc()
        ).limit(limit).all()

    return [
        {
            "id": r.id,
            "claim": r.claim,
            "claim_text": r.claim,
            "classification": r.classification,
            "prediction_label": (
                "reliable" if "reliable" in (r.classification or "").lower()
                else "misleading" if "misleading" in (r.classification or "").lower()
                else "false" if "false" in (r.classification or "").lower()
                else "unverified"
            ),
            "confidence": r.confidence,
            "confidence_score": r.confidence,
            "risk_score": (
                20 if "reliable" in (r.classification or "").lower()
                else 65 if "misleading" in (r.classification or "").lower()
                else 92 if "false" in (r.classification or "").lower()
                else 50
            ),
            "input_type": r.input_type,
            "source_type": r.input_type,
            "summary": r.summary,
            "recommendation": r.recommendation,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        } for r in records
    ]
