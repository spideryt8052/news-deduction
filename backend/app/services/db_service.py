import uuid
import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    AnalysisResultModel,
    AnalysisReasonModel,
    EvidenceModel,
    SourceAssessmentModel,
    UserFeedbackModel,
    ReportedClaimModel
)
from app.schemas.analysis import (
    AnalysisResultResponse,
    EvidenceItem,
    SourceAssessment
)

class DatabaseService:
    """Manages transactional persistence for evaluations, sources, and user feedback."""

    @staticmethod
    def save_analysis(db: Session, result: AnalysisResultResponse, raw_content: str = "") -> AnalysisResultModel:
        """Persists a complete analysis result with associated reasons and evidence."""
        # Create parent result record
        db_result = AnalysisResultModel(
            id=result.id,
            input_type=result.input_type,
            input_content=raw_content or result.claim,
            classification=result.classification,
            confidence=result.confidence,
            summary=result.summary,
            claim=result.claim,
            recommendation=result.recommendation,
            created_at=datetime.datetime.utcnow()
        )
        db.add(db_result)

        # Add reasons
        for idx, r_text in enumerate(result.reasons):
            reason_record = AnalysisReasonModel(
                result_id=result.id,
                reason_text=r_text,
                order_index=idx
            )
            db.add(reason_record)

        # Add evidence
        for ev in result.evidence:
            ev_record = EvidenceModel(
                result_id=result.id,
                title=ev.title,
                url=ev.url,
                snippet=ev.snippet,
                stance=ev.stance,
                source_name=ev.source_name
            )
            db.add(ev_record)

        # Add source assessment
        if result.source_assessment:
            src = result.source_assessment
            src_record = SourceAssessmentModel(
                result_id=result.id,
                source=src.source,
                credibility=src.credibility,
                details=src.details
            )
            db.add(src_record)

        db.commit()
        db.refresh(db_result)
        return db_result

    @staticmethod
    def get_analysis_by_id(db: Session, result_id: str) -> Optional[AnalysisResultResponse]:
        """Retrieves and reconstructs an AnalysisResultResponse DTO from relational tables."""
        record = db.query(AnalysisResultModel).filter(AnalysisResultModel.id == result_id).first()
        if not record:
            return None

        evidence_items = [
            EvidenceItem(
                title=e.title,
                url=e.url,
                snippet=e.snippet,
                stance=e.stance,
                source_name=e.source_name
            ) for e in record.evidence
        ]

        source_dto = SourceAssessment(
            source=record.source_assessment.source if record.source_assessment else "Unverified",
            credibility=record.source_assessment.credibility if record.source_assessment else "Needs Verification",
            details=record.source_assessment.details if record.source_assessment else "Source record not found"
        )

        reasons_list = [r.reason_text for r in sorted(record.reasons, key=lambda x: x.order_index)]

        return AnalysisResultResponse(
            id=record.id,
            input_type=record.input_type,
            classification=record.classification,
            confidence=record.confidence,
            summary=record.summary,
            claim=record.claim,
            evidence=evidence_items,
            source_assessment=source_dto,
            reasons=reasons_list,
            recommendation=record.recommendation,
            created_at=record.created_at.isoformat()
        )

    @staticmethod
    def get_history(db: Session, limit: int = 20, offset: int = 0) -> List[AnalysisResultModel]:
        """Fetches paginated analysis records ordered by descending timestamp."""
        return db.query(AnalysisResultModel)\
                 .order_by(AnalysisResultModel.created_at.desc())\
                 .offset(offset)\
                 .limit(limit)\
                 .all()

    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        """Calculates classification frequency counts directly using SQL aggregation."""
        counts = db.query(
            AnalysisResultModel.classification, 
            func.count(AnalysisResultModel.id)
        ).group_by(AnalysisResultModel.classification).all()

        count_dict = {cat: count for cat, count in counts}

        reliable = count_dict.get("Likely Reliable", 0)
        misleading = count_dict.get("Potentially Misleading", 0)
        false_cnt = count_dict.get("Likely False", 0)
        unverified = count_dict.get("Needs Further Verification", 0)

        total = reliable + misleading + false_cnt + unverified

        percentages = {
            "Likely Reliable": round((reliable / total) * 100, 1) if total else 0.0,
            "Potentially Misleading": round((misleading / total) * 100, 1) if total else 0.0,
            "Likely False": round((false_cnt / total) * 100, 1) if total else 0.0,
            "Needs Further Verification": round((unverified / total) * 100, 1) if total else 0.0,
        }

        return {
            "total_analyses": total,
            "reliable_count": reliable,
            "misleading_count": misleading,
            "false_count": false_cnt,
            "unverified_count": unverified,
            "breakdown_percentages": percentages,
            "status": "database_connected"
        }

    @staticmethod
    def save_feedback(db: Session, result_id: str, is_helpful: bool, comments: Optional[str] = None):
        """Stores user assessment rating."""
        fb = UserFeedbackModel(
            result_id=result_id,
            is_helpful=is_helpful,
            comments=comments
        )
        db.add(fb)
        db.commit()
        return fb

    @staticmethod
    def save_report(db: Session, claim: str, platform: str, url: Optional[str] = None, notes: Optional[str] = None) -> str:
        """Stores crowdsourced viral report."""
        rep = ReportedClaimModel(
            claim=claim,
            platform=platform,
            url=url,
            notes=notes
        )
        db.add(rep)
        db.commit()
        return rep.id

    @staticmethod
    def seed_initial_records(db: Session):
        """Seeds prototype evaluation records if database is empty."""
        existing_count = db.query(AnalysisResultModel).count()
        if existing_count > 0:
            return  # already initialized

        initial_cases = [
            (
                "Viral garlic and salt water cure for respiratory infections",
                "Likely False",
                0.93,
                "text",
                "Natural mixture (boiled garlic/salt) acts as an instant viral cure.",
                "Do NOT forward medical remedies from unverified social media posts; consult a physician.",
                [
                    "No clinical trial evidence exists supporting garlic water as an antiviral cure.",
                    "Uses urgent forwarded phrasing ('forward immediately before censored').",
                    "Lacks official health agency corroboration (WHO, ICMR, CDC)."
                ]
            ),
            (
                "WHO Guideline on Daily Sodium Intake for Adults",
                "Likely Reliable",
                0.92,
                "url",
                "WHO recommends adult sodium consumption below 2,000 mg per day.",
                "Information appears consistent with verified guidance. Safe to reference.",
                [
                    "Attributes claim to an established international health authority.",
                    "Matches published clinical dietary guidance on non-communicable disease prevention.",
                    "Language is objective, neutral, and educational without urgent forwarding hooks."
                ]
            ),
            (
                "NASA golden asteroid makes everyone billionaires overnight",
                "Potentially Misleading",
                0.83,
                "text",
                "Golden asteroid collision will alter global wealth distribution.",
                "Cross-examine space research claims with NASA or ESA official press releases.",
                [
                    "Sensationalized clickbait language ('SCIENTISTS SHOCKED', 'Billionaires overnight').",
                    "Misinterprets scientific asteroid observation missions (e.g., Psyche mineral composition).",
                    "Headlines exaggerate economic implications to drive social media sharing."
                ]
            ),
            (
                "Local municipal water supply disruption alert",
                "Needs Further Verification",
                0.66,
                "image",
                "Municipal water supply will be paused for maintenance tomorrow morning.",
                "Check the official city municipal council website or helpline for confirmation.",
                [
                    "Flyer lacks official municipal seals or verified contact signatures.",
                    "Independent local news reports have not confirmed the scheduled shutoff."
                ]
            )
        ]

        for title, classification, conf, in_type, claim, rec, reasons in initial_cases:
            res_id = str(uuid.uuid4())
            rec_model = AnalysisResultModel(
                id=res_id,
                input_type=in_type,
                input_content=title,
                classification=classification,
                confidence=conf,
                summary=f"Prototype evaluation record: Classified as {classification}.",
                claim=claim,
                recommendation=rec,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=len(title))
            )
            db.add(rec_model)

            for i, r_text in enumerate(reasons):
                db.add(AnalysisReasonModel(result_id=res_id, reason_text=r_text, order_index=i))

            db.add(SourceAssessmentModel(
                result_id=res_id,
                source="Institutional Archive" if classification == "Likely Reliable" else "Social Media Forward",
                credibility="Verified Authority" if classification == "Likely Reliable" else "Needs Verification",
                details="Seeded evaluation benchmark record."
            ))

        db.commit()
