import re

class ClaimExtractor:
    """Isolates atomic factual assertions from noisy social posts."""

    @staticmethod
    def extract_claim(text: str) -> str:
        """Extract the core falsifiable claim from text."""
        cleaned = text.strip()
        
        # Remove common forwarding junk prefixes
        cleaned = re.sub(r'^(forwarded as received:?|breaking:?|urgent alert:?|important message:?)\s*', '', cleaned, flags=re.IGNORECASE)
        
        # If text is concise, return it
        if len(cleaned) <= 180:
            return cleaned

        # Otherwise pick the first prominent sentence
        sentences = re.split(r'[.!?]+', cleaned)
        for s in sentences:
            s_clean = s.strip()
            if len(s_clean) >= 20:
                return s_clean[:200]

        return cleaned[:180] + "..."
