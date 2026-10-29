"""
Admin Panel Routes: System Telemetry, User Management, Content Moderation
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.models import (
    UserModel,
    AnalysisResultModel,
    ClaimModel,
    SourceModel,
    UserFeedbackModel,
    ReportedClaimModel
)
from app.schemas.auth import (
    UserResponse,
    UpdateUserRoleRequest,
    AdminStatsResponse
)
from app.api.deps import get_current_admin
from app.services.vector_service import VectorService
from app.core.config import settings

router = APIRouter(prefix="/api/admin", tags=["Administration"])

@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get aggregated system telemetry for Admin Dashboard"
)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    total_users = db.query(UserModel).count()
    total_analyses = db.query(AnalysisResultModel).count()
    total_claims = db.query(ClaimModel).count()
    total_sources = db.query(SourceModel).count()
    total_feedback = db.query(UserFeedbackModel).count()
    total_reported = db.query(ReportedClaimModel).count()

    # Percentages by classification
    percentages = {}
    if total_analyses > 0:
        counts = db.query(
            AnalysisResultModel.classification, 
            func.count(AnalysisResultModel.id)
        ).group_by(AnalysisResultModel.classification).all()
        for cat, cnt in counts:
            percentages[cat] = round((cnt / total_analyses) * 100, 1)

    vec_stats = VectorService().get_stats()
    db_status = "PostgreSQL 16 Engine" if "postgres" in settings.DATABASE_URL.lower() else "SQLite Persistent Engine"

    return AdminStatsResponse(
        total_users=total_users,
        total_analyses=total_analyses,
        total_claims=total_claims,
        total_sources=total_sources,
        total_feedback=total_feedback,
        total_reported=total_reported,
        percentages=percentages,
        ai_provider=settings.AI_PROVIDER,
        database_status=db_status,
        vector_store_status=vec_stats
    )

@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all registered accounts"
)
async def list_all_users(
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    users = db.query(UserModel).order_by(UserModel.created_at.desc()).all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else ""
        ) for u in users
    ]

@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Update user role or active status"
)
@router.put(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Update user role or active status"
)
async def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    target_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    if target_user.id == admin.id and payload.role and payload.role != "admin":
        raise HTTPException(status_code=400, detail="Administrators cannot demote their own account.")

    if payload.role:
        if payload.role not in ["user", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'user' or 'admin'.")
        target_user.role = payload.role

    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    db.commit()
    db.refresh(target_user)

    return UserResponse(
        id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        is_active=target_user.is_active,
        created_at=target_user.created_at.isoformat() if target_user.created_at else ""
    )

@router.get(
    "/claims",
    summary="List all recent analyses for content moderation"
)
async def list_claims_for_moderation(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    results = db.query(AnalysisResultModel).order_by(AnalysisResultModel.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "claim": r.claim,
            "classification": r.classification,
            "confidence": r.confidence,
            "input_type": r.input_type,
            "summary": r.summary,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        } for r in results
    ]

@router.delete(
    "/claims/{claim_id}",
    summary="Delete / moderate an analysis record"
)
async def delete_claim_analysis(
    claim_id: str,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    record = db.query(AnalysisResultModel).filter(AnalysisResultModel.id == claim_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Claim record '{claim_id}' removed from database."}

@router.get(
    "/reports",
    summary="List user-reported crowdsourced claims"
)
async def list_reported_claims(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(get_current_admin)
):
    reports = db.query(ReportedClaimModel).order_by(ReportedClaimModel.created_at.desc()).limit(limit).all()
    return [
        {
            "id": rep.id,
            "claim": rep.claim,
            "platform": rep.platform,
            "url": rep.url,
            "notes": rep.notes,
            "created_at": rep.created_at.isoformat() if rep.created_at else ""
        } for rep in reports
    ]
