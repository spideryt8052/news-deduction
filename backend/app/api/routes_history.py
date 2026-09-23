from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.services.db_service import DatabaseService
from app.schemas.analysis import HistoryItemResponse, StatsResponse

router = APIRouter(prefix="/api", tags=["History & Analytics"])

@router.get(
    "/history",
    response_model=List[HistoryItemResponse],
    summary="Get recent analysis logs",
    description="Returns a paginated list of recently completed assessments from the database."
)
async def get_history(
    limit: int = Query(20, ge=1, le=100, description="Number of records to fetch"),
    offset: int = Query(0, ge=0, description="Offset index"),
    db: Session = Depends(get_db)
):
    records = DatabaseService.get_history(db, limit=limit, offset=offset)
    
    items = []
    for item in records:
        items.append(
            HistoryItemResponse(
                id=item.id,
                claim=item.claim,
                classification=item.classification,
                confidence=item.confidence,
                input_type=item.input_type,
                created_at=item.created_at.isoformat()
            )
        )
    return items

@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Get aggregated evaluation statistics",
    description="Returns historical classification counts and percentage distributions calculated directly from the database."
)
async def get_stats(db: Session = Depends(get_db)):
    stats_data = DatabaseService.get_stats(db)
    return StatsResponse(**stats_data)
