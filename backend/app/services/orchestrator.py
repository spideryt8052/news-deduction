from typing import Dict, Any, List, Optional
from app.schemas.analysis import AnalysisResultResponse
from app.services.analyzer_factory import get_analyzer

# In-memory storage for analysis results (synced with PostgreSQL/SQLite)
ANALYSIS_CACHE: Dict[str, Dict[str, Any]] = {}

class PipelineOrchestrator:
    """Coordinates the full 6-stage analysis workflow from the MCA synopsis.
    
    Acts as the single point of entry for the API layer while delegating
    to pluggable analysis engines (MockAnalyzer or LLMAnalyzer) with optional
    runtime client API key / provider overrides.
    """

    @classmethod
    def analyze_text(
        cls, 
        text: str, 
        source_hint: Optional[str] = None,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        analyzer = get_analyzer(ai_provider=ai_provider, api_key=api_key)
        try:
            result = analyzer.analyze_text(
                text=text, 
                source_hint=source_hint,
                ai_provider=ai_provider,
                api_key=api_key
            )
        except TypeError:
            result = analyzer.analyze_text(text=text, source_hint=source_hint)

        ANALYSIS_CACHE[result.id] = result.model_dump()
        return result

    @classmethod
    def analyze_url(
        cls, 
        url: str,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        analyzer = get_analyzer(ai_provider=ai_provider, api_key=api_key)
        try:
            result = analyzer.analyze_url(
                url=url,
                ai_provider=ai_provider,
                api_key=api_key
            )
        except TypeError:
            result = analyzer.analyze_url(url=url)

        ANALYSIS_CACHE[result.id] = result.model_dump()
        return result

    @classmethod
    def analyze_image(
        cls, 
        extracted_text: str, 
        filename: str,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        analyzer = get_analyzer(ai_provider=ai_provider, api_key=api_key)
        try:
            result = analyzer.analyze_image(
                extracted_text=extracted_text, 
                filename=filename,
                ai_provider=ai_provider,
                api_key=api_key
            )
        except TypeError:
            result = analyzer.analyze_image(extracted_text=extracted_text, filename=filename)

        ANALYSIS_CACHE[result.id] = result.model_dump()
        return result

    @classmethod
    def get_result_by_id(cls, result_id: str) -> Optional[AnalysisResultResponse]:
        cached = ANALYSIS_CACHE.get(result_id)
        if cached:
            return AnalysisResultResponse(**cached)
        return None

    @classmethod
    def get_recent_history(cls, limit: int = 20) -> List[Dict[str, Any]]:
        results = list(ANALYSIS_CACHE.values())
        return results[-limit:][::-1]
