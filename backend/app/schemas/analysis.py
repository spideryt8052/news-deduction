from typing import List, Optional, Dict, Any
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

class OriginInfo(BaseModel):
    location: Optional[str] = Field("Global / Online", description="Country, region, or geographic origin")
    original_platform: Optional[str] = Field("Social Media", description="Platform or medium where it first surfaced")
    first_seen_period: Optional[str] = Field("Recent", description="Timeframe or historical date")
    provenance_details: Optional[str] = Field(None, description="Detailed background on where this story/image/claim actually originated, who started it, and historical context")

class AnalysisResultResponse(BaseModel):
    id: str
    input_type: str
    classification: str  # "Likely Reliable", "Potentially Misleading", "Likely False", "Needs Further Verification"
    category_3tier: Optional[str] = Field(default="Misleading", description="Academic 3-Tier Category: Real, Misleading, False-Fake")
    confidence: float
    summary: str
    claim: str
    evidence: List[EvidenceItem]
    source_assessment: SourceAssessment
    origin_info: Optional[OriginInfo] = Field(default_factory=lambda: OriginInfo())
    reasons: List[str]
    recommendation: str
    created_at: str

    def model_post_init(self, __context):
        if not self.category_3tier or self.category_3tier == "Misleading":
            mapping = {
                "Likely Reliable": "Real",
                "Potentially Misleading": "Misleading",
                "Likely False": "False-Fake",
                "Needs Further Verification": "Misleading"
            }
            self.category_3tier = mapping.get(self.classification, "Misleading")


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000, description="Claim or statement to semantically search against ChromaDB vector store")
    top_k: Optional[int] = Field(5, ge=1, le=20)
    threshold: Optional[float] = Field(0.20, ge=0.0, le=1.0)


class SemanticSearchResultItem(BaseModel):
    claim_id: str
    claim_text: str
    similarity_score: float
    metadata: Dict[str, Any] = {}


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SemanticSearchResultItem]
    engine: str
    total_matched: int

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
