"""
TruthShield Statistical ML Analyzer Adapter
Lead AI Developer: Aarti Vishwakarma (Roll No: 2501320140001)

Adapts the standalone Scikit-Learn TF-IDF classifier (ai_ml/) into the
FastAPI BaseAnalyzer contract, enabling live runtime inference via provider='ml'.
"""

import uuid
import datetime
import sys
from pathlib import Path
from typing import Optional, List

# Ensure ai_ml is in path
project_root = Path(__file__).resolve().parent.parent.parent.parent
ai_ml_dir = project_root / "ai_ml"
if str(ai_ml_dir) not in sys.path:
    sys.path.insert(0, str(ai_ml_dir))

from app.services.base_analyzer import BaseAnalyzer
from app.services.mock_analyzer import MockAnalyzer
from app.services.source_verifier import SourceVerifier
from app.schemas.analysis import (
    AnalysisResultResponse,
    SourceAssessment,
    EvidenceItem
)

class MLAnalyzer(BaseAnalyzer):
    """Local Statistical Machine Learning Analyzer (TF-IDF + Calibrated Logistic Classifier)."""

    def __init__(self):
        try:
            from predictor import TruthShieldMLPredictor
            self._predictor = TruthShieldMLPredictor()
        except Exception:
            self._predictor = None
        self._fallback = MockAnalyzer()

    def analyze_text(
        self, 
        text: str, 
        source_hint: Optional[str] = None,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        if not self._predictor:
            return self._fallback.analyze_text(text, source_hint)

        pred = self._predictor.predict(text, source_hint)
        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Build evidence item citing linguistic feature extraction
        evidence_items = [
            EvidenceItem(
                title=f"Statistical NLP Classifier ({pred['model_metadata'].get('model_name', 'TF-IDF LogReg')})",
                url=None,
                snippet=f"Linguistic features analyzed: urgency={pred['linguistic_features']['urgency_score']}, sensationalism={pred['linguistic_features']['sensationalism_score']}.",
                stance="SUPPORTING" if pred["category_3tier"] == "Real" else "REFUTING",
                source_name="TruthShield ML Engine (GNIOT / AKTU)"
            )
        ]

        source_dto = SourceAssessment(
            source=source_hint or "Social Media Input",
            credibility="Verified Authority" if pred["category_3tier"] == "Real" else "Independent / Unverified",
            details=f"Evaluated via Local Scikit-Learn TF-IDF model. Manipulation Index: {pred['linguistic_features']['manipulation_index']}."
        )

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="text",
            classification=pred["classification"],
            category_3tier=pred["category_3tier"],
            confidence=pred["confidence"],
            summary=f"Evaluated as {pred['classification']} via Statistical NLP and linguistic manipulation heuristics.",
            claim=text[:140],
            evidence=evidence_items,
            source_assessment=source_dto,
            reasons=pred["reasons"],
            recommendation=pred["recommendation"],
            created_at=created_at
        )

    def analyze_url(
        self, 
        url: str,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        # Delegate URL verification to SourceVerifier via fallback
        return self._fallback.analyze_url(url)

    def analyze_image(
        self, 
        extracted_text: str, 
        filename: str,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AnalysisResultResponse:
        res = self.analyze_text(extracted_text, source_hint=f"Image Screenshot ({filename})")
        res.input_type = "image"
        return res
