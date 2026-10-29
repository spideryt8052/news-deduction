from typing import Optional
from app.core.config import settings
from app.services.base_analyzer import BaseAnalyzer
from app.services.mock_analyzer import MockAnalyzer

_default_analyzer_instance: Optional[BaseAnalyzer] = None

def get_analyzer(ai_provider: Optional[str] = None, api_key: Optional[str] = None) -> BaseAnalyzer:
    """Factory dependency providing the active Misinformation Analysis Engine.
    
    Supports dynamic switching between MockAnalyzer and LLMAnalyzer
    configured via environment variables or runtime request overrides.
    """
    global _default_analyzer_instance

    target_provider = (ai_provider or settings.AI_PROVIDER).lower()

    # If explicit mock/offline requested and no api key provided
    if target_provider in ["mock", "demo", "offline"] and not api_key:
        return MockAnalyzer()

    # If local statistical machine learning requested
    if target_provider in ["ml", "scikit-learn", "ai_ml", "local_ml"]:
        try:
            from app.services.ml_analyzer import MLAnalyzer
            return MLAnalyzer()
        except Exception:
            return MockAnalyzer()

    # If api_key or live provider requested
    try:
        from app.services.llm_analyzer import LLMAnalyzer
        return LLMAnalyzer()
    except Exception:
        return MockAnalyzer()
