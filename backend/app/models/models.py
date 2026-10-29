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
    user_id = Column(String(36), nullable=True, index=True)
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


# =====================================================================
# Academic Research Schema Models (Paper Table 2: Normalized Workflow)
# =====================================================================

class UserModel(Base):
    """Academic Table 2: Registered user or administrator."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), default="user", nullable=False)  # 'user', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    posts = relationship("PostModel", back_populates="user", cascade="all, delete-orphan")


class PostModel(Base):
    """Academic Table 2: Social media publication instance."""
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    platform = Column(String(50), nullable=False)  # WhatsApp, Facebook, X, Instagram, etc.
    text = Column(Text, nullable=False)
    headline = Column(String(500), nullable=True)
    media_type = Column(String(50), default="text")  # text, image, video, multi-modal
    source = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("UserModel", back_populates="posts")
    claims = relationship("ClaimModel", back_populates="post", cascade="all, delete-orphan")
    classification = relationship("ClassificationModel", back_populates="post", uselist=False, cascade="all, delete-orphan")
    engagement = relationship("EngagementModel", back_populates="post", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("AlertModel", back_populates="post", cascade="all, delete-orphan")


class ClaimModel(Base):
    """Academic Table 2: Atomic factual assertion extracted from a post."""
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("PostModel", back_populates="claims")
    verifications = relationship("VerificationModel", back_populates="claim", cascade="all, delete-orphan")


class SourceModel(Base):
    """Academic Table 2: Domain authority and institutional credentials."""
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=True)
    credibility_info = Column(Text, nullable=False)

    verifications = relationship("VerificationModel", back_populates="source_ref")


class VerificationModel(Base):
    """Academic Table 2: Evidence association linking claims to trusted sources."""
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # SUPPORTING, REFUTING, CONTEXTUAL
    details = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("ClaimModel", back_populates="verifications")
    source_ref = relationship("SourceModel", back_populates="verifications")


class ClassificationModel(Base):
    """Academic Table 2: 3-Tier Categorical verdict (Real, Misleading, False-Fake)."""
    __tablename__ = "classifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    category = Column(String(50), nullable=False)  # Real, Misleading, False-Fake
    confidence = Column(Float, nullable=False, default=0.85)
    classified_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("PostModel", back_populates="classification")


class EngagementModel(Base):
    """Academic Table 2: Virality and propagation telemetry."""
    __tablename__ = "engagement_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("PostModel", back_populates="engagement")


class AlertModel(Base):
    """Academic Table 2: User-facing credibility alert and behavioral nudge."""
    __tablename__ = "user_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_message = Column(Text, nullable=False)
    nudge_type = Column(String(50), default="Pre-Share Warning")  # Pre-Share Warning, Contextual Note, Critical Alert
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("PostModel", back_populates="alerts")

