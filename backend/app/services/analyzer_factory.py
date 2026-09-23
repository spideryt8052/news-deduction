from app.core.config import settings
from app.services.base_analyzer import BaseAnalyzer
from app.services.mock_analyzer import MockAnalyzer

_analyzer_instance: BaseAnalyzer = None

def get_analyzer() -> BaseAnalyzer:
    """Factory dependency providing the active Misinformation Analysis Engine.
    
    Supports seamless switching between MockAnalyzer, MLAnalyzer, and LLMAnalyzer
    configured via the AI_PROVIDER environment variable.
    """
    global _analyzer_instance
    if _analyzer_instance is not None:
        return _analyzer_instance

    provider = settings.AI_PROVIDER.lower()
    
    if provider in ["mock", "demo", "offline"]:
        _analyzer_instance = MockAnalyzer()
    elif provider in ["llm", "groq", "openai", "anthropic"]:
        # Lazily imported in Phase 8
        try:
            from app.services.llm_analyzer import LLMAnalyzer
            _analyzer_instance = LLMAnalyzer()
        except ImportError:
            _analyzer_instance = MockAnalyzer()
    else:
        _analyzer_instance = MockAnalyzer()

    return _analyzer_instance
