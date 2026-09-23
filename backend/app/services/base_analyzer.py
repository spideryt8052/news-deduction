from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.analysis import AnalysisResultResponse

class BaseAnalyzer(ABC):
    """Abstract Base Class for all Misinformation Analysis Engines.
    
    Allows seamless hot-swapping between MockAnalyzer, MLAnalyzer, and LLMAnalyzer
    without altering API routes, database schemas, or frontend interfaces.
    """

    @abstractmethod
    def analyze_text(self, text: str, source_hint: Optional[str] = None) -> AnalysisResultResponse:
        """Analyze raw text, news headlines, or social media statements."""
        pass

    @abstractmethod
    def analyze_url(self, url: str) -> AnalysisResultResponse:
        """Analyze web article links and domain reputation."""
        pass

    @abstractmethod
    def analyze_image(self, extracted_text: str, filename: str) -> AnalysisResultResponse:
        """Analyze text extracted from screenshots and flyers."""
        pass
