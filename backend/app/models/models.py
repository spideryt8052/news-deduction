import uuid
import datetime
from sqlalchemy import (
    Column, 
    String, 
    Float, 
    Text, 
    DateTime, 
    Boolean, 
    Integer, 
    ForeignKey
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class AnalysisResultModel(Base):
    """Stores full verification results for text, URLs, and screenshots."""
    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    input_type = Column(String(20), nullable=False)  # 'text', 'url', 'image'
    input_content = Column(Text, nullable=False)
    classification = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    summary = Column(Text, nullable=False)
    claim = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Relational associations
    reasons = relationship("AnalysisReasonModel", back_populates="result", cascade="all, delete-orphan")
    evidence = relationship("EvidenceModel", back_populates="result", cascade="all, delete-orphan")
    source_assessment = relationship("SourceAssessmentModel", back_populates="result", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("UserFeedbackModel", back_populates="result", cascade="all, delete-orphan")


class AnalysisReasonModel(Base):
    """Bulleted rationale explaining 'Why This Result?'."""
    __tablename__ = "analysis_reasons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    result_id = Column(String(36), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, index=True)
    reason_text = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)

    result = relationship("AnalysisResultModel", back_populates="reasons")


class EvidenceModel(Base):
    """Supporting, contradicting, or contextual evidence citations."""
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    result_id = Column(String(36), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=True)
    snippet = Column(Text, nullable=False)
    stance = Column(String(50), nullable=False)  # 'SUPPORTING', 'REFUTING', 'CONTEXTUAL'
    source_name = Column(String(255), nullable=False)

    result = relationship("AnalysisResultModel", back_populates="evidence")


class SourceAssessmentModel(Base):
    """Source domain credibility assessment."""
    __tablename__ = "source_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    result_id = Column(String(36), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    source = Column(String(255), nullable=False)
    credibility = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)

    result = relationship("AnalysisResultModel", back_populates="source_assessment")


class UserFeedbackModel(Base):
    """User rating and feedback on evaluation quality."""
    __tablename__ = "user_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    result_id = Column(String(36), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, index=True)
    is_helpful = Column(Boolean, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    result = relationship("AnalysisResultModel", back_populates="feedback")


class ReportedClaimModel(Base):
    """Crowdsourced viral claims submitted by users for investigation."""
    __tablename__ = "reported_claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim = Column(Text, nullable=False)
    platform = Column(String(100), nullable=False)
    url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
