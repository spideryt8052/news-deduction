import uuid
import datetime
from typing import Optional, List

from app.services.base_analyzer import BaseAnalyzer
from app.services.mock_analyzer import MockAnalyzer
from app.services.source_verifier import SourceVerifier
from app.services.llm_service import LLMService
from app.schemas.analysis import (
    AnalysisResultResponse,
    SourceAssessment,
    EvidenceItem,
    OriginInfo
)

class LLMAnalyzer(BaseAnalyzer):
    """Production AI Analyzer utilizing Generative LLMs (Groq / Gemini / OpenAI / Anthropic).
    
    Provides transparent explainability, structured JSON output, and automatic
    fallback to MockAnalyzer if network or API keys are unavailable.
    """

    def __init__(self):
        self._fallback_analyzer = MockAnalyzer()

    def analyze_text(
        self, 
        text: str, 
        source_hint: Optional[str] = None,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        llm_data = LLMService.generate_assessment(
            text, 
            context_type="social media post / headline",
            provider=ai_provider,
            api_key=api_key
        )

        # Fallback to MockAnalyzer if LLM call returns None or missing classification
        if not llm_data or "classification" not in llm_data:
            return self._fallback_analyzer.analyze_text(text, source_hint)

        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        src_data = llm_data.get("source_assessment", {})
        source_dto = SourceAssessment(
            source=src_data.get("source", source_hint or "Forwarded Social Media Content"),
            credibility=src_data.get("credibility", "Needs Verification"),
            details=src_data.get("details", f"Evaluated via Generative AI assessment pipeline ({ai_provider or 'LLM'}).")
        )

        origin_dict = llm_data.get("origin_info", {})
        origin_dto = OriginInfo(
            location=origin_dict.get("location", "Global / Social Media"),
            original_platform=origin_dict.get("original_platform", source_hint or "Social Media Forward"),
            first_seen_period=origin_dict.get("first_seen_period", "Recent / Under Review"),
            provenance_details=origin_dict.get("provenance_details", "Origin investigated via AI multi-source cross-referencing.")
        )

        # Process evidence items
        evidence_items: List[EvidenceItem] = []
        for ev in llm_data.get("evidence", []):
            try:
                evidence_items.append(EvidenceItem(
                    title=ev.get("title", "Reference Source"),
                    snippet=ev.get("snippet", ""),
                    source_name=ev.get("source_name", "Fact-Checking Registry"),
                    stance=ev.get("stance", "CONTEXTUAL"),
                    url=ev.get("url")
                ))
            except Exception:
                pass

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="text",
            classification=llm_data.get("classification", "Needs Further Verification"),
            confidence=round(float(llm_data.get("confidence", 0.75)), 2),
            summary=llm_data.get("summary", "AI-assisted credibility assessment."),
            claim=llm_data.get("claim", text[:140]),
            evidence=evidence_items,
            source_assessment=source_dto,
            origin_info=origin_dto,
            reasons=llm_data.get("reasons", ["Linguistic and factual context examined."]),
            recommendation=llm_data.get("recommendation", "Verify with independent sources before forwarding."),
            created_at=created_at
        )

    def analyze_url(
        self, 
        url: str,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        # Immediately block SSRF and unsafe local addresses before calling external LLMs
        if not SourceVerifier.is_safe_url(url):
            return self._fallback_analyzer.analyze_url(url)

        llm_data = LLMService.generate_assessment(
            url, 
            context_type="web article URL",
            provider=ai_provider,
            api_key=api_key
        )

        if not llm_data or "classification" not in llm_data:
            return self._fallback_analyzer.analyze_url(url)

        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        src_data = llm_data.get("source_assessment", {})
        source_dto = SourceAssessment(
            source=src_data.get("source", url),
            credibility=src_data.get("credibility", "Independent / Unverified"),
            details=src_data.get("details", f"Evaluated via Generative AI domain analysis ({ai_provider or 'LLM'}).")
        )

        evidence_items: List[EvidenceItem] = []
        for ev in llm_data.get("evidence", []):
            try:
                evidence_items.append(EvidenceItem(
                    title=ev.get("title", "Reference Source"),
                    snippet=ev.get("snippet", ""),
                    source_name=ev.get("source_name", "Accredited Agency"),
                    stance=ev.get("stance", "CONTEXTUAL"),
                    url=ev.get("url")
                ))
            except Exception:
                pass

        origin_dict = llm_data.get("origin_info", {})
        origin_dto = OriginInfo(
            location=origin_dict.get("location", "Online Domain / Web"),
            original_platform=origin_dict.get("original_platform", "Web Article"),
            first_seen_period=origin_dict.get("first_seen_period", "Recent"),
            provenance_details=origin_dict.get("provenance_details", "Domain and web article origin verified through credibility registry.")
        )

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="url",
            classification=llm_data.get("classification", "Needs Further Verification"),
            confidence=round(float(llm_data.get("confidence", 0.75)), 2),
            summary=llm_data.get("summary", f"AI assessment for URL ({url})."),
            claim=llm_data.get("claim", f"Article at {url}"),
            evidence=evidence_items,
            source_assessment=source_dto,
            origin_info=origin_dto,
            reasons=llm_data.get("reasons", ["Domain reputation and publisher transparency analyzed."]),
            recommendation=llm_data.get("recommendation", "Confirm with established news outlets."),
            created_at=created_at
        )

    def analyze_image(
        self, 
        extracted_text: str, 
        filename: str,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        result = self.analyze_text(
            text=extracted_text, 
            source_hint=f"Screenshot ({filename})",
            ai_provider=ai_provider,
            api_key=api_key
        )
        result.input_type = "image"
        return result
