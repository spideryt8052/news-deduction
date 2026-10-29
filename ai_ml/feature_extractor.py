"""
TruthShield Linguistic & Statistical Feature Extractor
Lead AI Developer: Aarti Vishwakarma (Roll No: 2501320140001)

Extracts domain-specific deception markers, emotional urgency signals, sensationalism
indices, and text tokens for downstream machine learning classifiers.
"""

import re
from typing import Dict, Any, List

class FeatureExtractor:
    """Extracts psychological, structural, and linguistic features from text."""

    URGENCY_KEYWORDS = [
        "forward immediately", "share immediately", "forward to all", "share to all",
        "before deleted", "secret leaked", "warning urgent", "urgent notice",
        "breaking news", "miracle cure", "dissolves all", "cures 100%",
        "hiding the truth", "government won't tell", "scientists shocked",
        "shocking footage", "share to save", "within 2 hours", "tonight midnight"
    ]

    SUPERLATIVE_KEYWORDS = [
        "miracle", "100%", "instant", "completely", "guaranteed", "secret",
        "shocking", "stunning", "hidden", "unbelievable", "billionaire",
        "eliminate forever", "never before seen", "mindblowing"
    ]

    @classmethod
    def clean_text(cls, text: str) -> str:
        """Sanitizes text by stripping URLs, emojis, and extraneous symbols."""
        # Remove URLs
        text = re.sub(r"https?://\S+|www\.\S+", "", text)
        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @classmethod
    def extract_features(cls, text: str) -> Dict[str, Any]:
        """Calculates quantitative manipulation indicators."""
        raw_len = max(len(text), 1)
        cleaned = cls.clean_text(text)
        lower_text = cleaned.lower()

        # 1. Uppercase & Capitalization Metrics
        alpha_chars = [c for c in text if c.isalpha()]
        uppercase_count = sum(1 for c in alpha_chars if c.isupper())
        uppercase_ratio = round(uppercase_count / max(len(alpha_chars), 1), 3)

        # 2. Exclamation & Punctuation Density
        exclamation_count = text.count("!")
        question_count = text.count("?")
        punctuation_density = round((exclamation_count + question_count) / (len(text.split()) or 1), 3)

        # 3. Urgency & Coercion Markers
        matched_urgency = [k for k in cls.URGENCY_KEYWORDS if k in lower_text]
        urgency_score = round(min(1.0, len(matched_urgency) * 0.35 + (0.3 if exclamation_count >= 2 else 0.0)), 2)

        # 4. Sensationalism & Superlative Density
        matched_superlatives = [k for k in cls.SUPERLATIVE_KEYWORDS if k in lower_text]
        sensationalism_score = round(min(1.0, len(matched_superlatives) * 0.30 + uppercase_ratio * 0.40), 2)

        # 5. Composite Manipulation Index M in [0, 1]
        manipulation_index = round(min(1.0, (urgency_score * 0.55) + (sensationalism_score * 0.45)), 3)

        return {
            "cleaned_text": cleaned,
            "uppercase_ratio": uppercase_ratio,
            "exclamation_count": exclamation_count,
            "matched_urgency_markers": matched_urgency,
            "urgency_score": urgency_score,
            "matched_superlatives": matched_superlatives,
            "sensationalism_score": sensationalism_score,
            "manipulation_index": manipulation_index
        }
