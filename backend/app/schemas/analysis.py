from typing import List, Optional, Dict
from pydantic import BaseModel, Field, HttpUrl

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=10000, description="Input text, news headline, or post to analyze")
    source_hint: Optional[str] = Field(None, max_length=100, description="Platform or source indicator (e.g. WhatsApp, X, Facebook)")
    ai_provider: Optional[str] = Field(None, description="Optional AI provider override (groq, gemini, openai, anthropic, mock)")
    api_key: Optional[str] = Field(None, description="Optional client-side API key override")

class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=8, max_length=2000, description="Web URL of news article or post to verify")
    ai_provider: Optional[str] = Field(None, description="Optional AI provider override")
    api_key: Optional[str] = Field(None, description="Optional client-side API key override")

class EvidenceItem(BaseModel):
    title: str
    url: Optional[str] = None
    snippet: str
    stance: str  # "SUPPORTING", "REFUTING", "CONTEXTUAL"
    source_name: str

class SourceAssessment(BaseModel):
    source: str
    credibility: str  # "Verified Authority", "Known Media Outlet", "Independent / Unverified", "Suspicious / Satire"
    details: str

class AnalysisResultResponse(BaseModel):
    id: str
    input_type: str
    classification: str  # "Likely Reliable", "Potentially Misleading", "Likely False", "Needs Further Verification"
    confidence: float
    summary: str
    claim: str
    evidence: List[EvidenceItem]
    source_assessment: SourceAssessment
    reasons: List[str]
    recommendation: str
    created_at: str

class FeedbackRequest(BaseModel):
    result_id: str
    is_helpful: bool
    comments: Optional[str] = Field(None, max_length=1000)

class FeedbackResponse(BaseModel):
    status: str
    message: str

class ReportRequest(BaseModel):
    claim: str = Field(..., min_length=5, max_length=1000)
    platform: str = Field(..., max_length=100)
    url: Optional[str] = Field(None, max_length=2000)
    notes: Optional[str] = Field(None, max_length=2000)

class ReportResponse(BaseModel):
    status: str
    report_id: str
    message: str

class HistoryItemResponse(BaseModel):
    id: str
    claim: str
    classification: str
    confidence: float
    input_type: str
    created_at: str

class StatsResponse(BaseModel):
    total_analyses: int
    reliable_count: int
    misleading_count: int
    false_count: int
    unverified_count: int
    breakdown_percentages: Dict[str, float]
    status: str
