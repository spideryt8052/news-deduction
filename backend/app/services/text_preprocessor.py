import re
from typing import Dict, Any

class TextPreprocessor:
    """Preprocesses raw user input text from social media."""

    @staticmethod
    def clean_text(text: str) -> str:
        """Strip redundant whitespace, junk characters, and normalize unicode."""
        if not text:
            return ""
        # Normalize multiple spaces and newlines
        cleaned = re.sub(r'\s+', ' ', text).strip()
        return cleaned

    @staticmethod
    def extract_features(text: str) -> Dict[str, Any]:
        """Extract linguistic cues characteristic of social media misinformation."""
        lower = text.lower()
        
        # Check for urgent forwarding mandates
        urgent_markers = [
            'forward', 'share before deleted', 'share immediately', 
            'breaking news', 'wake up', 'viral', 'secret cure', 'secret remedy',
            'don\'t ignore', '100% cure', 'censored'
        ]
        has_urgent_call = any(marker in lower for marker in urgent_markers)

        # Excessive exclamation or question marks
        exclamation_count = text.count('!')
        question_count = text.count('?')
        is_sensational = exclamation_count >= 3 or (exclamation_count + question_count >= 4)

        # Uppercase ratio (ALL CAPS shouting)
        alpha_chars = [c for c in text if c.isalpha()]
        upper_ratio = (sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)) if alpha_chars else 0.0

        return {
            "has_urgent_call": has_urgent_call,
            "is_sensational": is_sensational,
            "uppercase_ratio": round(upper_ratio, 2),
            "exclamation_count": exclamation_count,
            "character_length": len(text),
            "word_count": len(text.split())
        }
