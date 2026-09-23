import uuid
import datetime
from typing import Optional

from app.services.base_analyzer import BaseAnalyzer
from app.services.mock_analyzer import MockAnalyzer
from app.services.llm_service import LLMService
from app.schemas.analysis import (
    AnalysisResultResponse,
    SourceAssessment
)

class LLMAnalyzer(BaseAnalyzer):
    """Production AI Analyzer utilizing Generative LLMs (Groq Llama-3 / OpenAI).
    
    Provides transparent explainability, structured JSON output, and automatic
    fallback to MockAnalyzer if network or API keys are unavailable.
    """

    def __init__(self):
        self._fallback_analyzer = MockAnalyzer()

    def analyze_text(self, text: str, source_hint: Optional[str] = None) -> AnalysisResultResponse:
        llm_data = LLMService.generate_assessment(text, context_type="social media post / headline")

        # Fallback to MockAnalyzer if LLM call returns None
        if not llm_data or "classification" not in llm_data:
            return self._fallback_analyzer.analyze_text(text, source_hint)

        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        src_data = llm_data.get("source_assessment", {})
        source_dto = SourceAssessment(
            source=src_data.get("source", source_hint or "Unverified Forward"),
            credibility=src_data.get("credibility", "Needs Verification"),
            details=src_data.get("details", "Evaluated via Generative AI assessment pipeline.")
        )

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="text",
            classification=llm_data.get("classification", "Needs Further Verification"),
            confidence=round(float(llm_data.get("confidence", 0.75)), 2),
            summary=llm_data.get("summary", "AI-assisted credibility assessment."),
            claim=llm_data.get("claim", text[:140]),
            evidence=[],
            source_assessment=source_dto,
            reasons=llm_data.get("reasons", ["Linguistic evaluation completed."]),
            recommendation=llm_data.get("recommendation", "Verify with independent sources before forwarding."),
            created_at=created_at
        )

    def analyze_url(self, url: str) -> AnalysisResultResponse:
        llm_data = LLMService.generate_assessment(url, context_type="web article URL")

        if not llm_data or "classification" not in llm_data:
            return self._fallback_analyzer.analyze_url(url)

        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        src_data = llm_data.get("source_assessment", {})
        source_dto = SourceAssessment(
            source=src_data.get("source", url),
            credibility=src_data.get("credibility", "Independent / Unverified"),
            details=src_data.get("details", "Evaluated via Generative AI domain analysis.")
        )

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="url",
            classification=llm_data.get("classification", "Needs Further Verification"),
            confidence=round(float(llm_data.get("confidence", 0.75)), 2),
            summary=llm_data.get("summary", f"AI assessment for URL ({url})."),
            claim=llm_data.get("claim", f"Article at {url}"),
            evidence=[],
            source_assessment=source_dto,
            reasons=llm_data.get("reasons", ["Domain reputation and content examined."]),
            recommendation=llm_data.get("recommendation", "Confirm with established news outlets."),
            created_at=created_at
        )

    def analyze_image(self, extracted_text: str, filename: str) -> AnalysisResultResponse:
        result = self.analyze_text(
            text=extracted_text, 
            source_hint=f"Screenshot ({filename})"
        )
        result.input_type = "image"
        return result
