import json
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

SYSTEM_PROMPT = """
You are an objective AI verification assistant for TruthShield, an academic misinformation detection platform developed at Greater Noida Institute of Technology (GNIOT) / AKTU.

Your mission is to help users evaluate viral claims and understand why information may require independent verification before sharing.

CRITICAL CONSTRAINTS:
1. Do NOT claim absolute truth or omniscience. Your assessment is an AI-assisted evaluation.
2. Classification MUST strictly be one of:
   - "Likely Reliable"
   - "Potentially Misleading"
   - "Likely False"
   - "Needs Further Verification"
3. "confidence" must be a float between 0.50 and 0.95 representing algorithmic assessment confidence.
4. "reasons" must be an array of 2 to 4 clear, understandable bullet points explaining the linguistic, source, or factual context.
5. "recommendation" must give the user practical, actionable guidance on what to check before forwarding.

You MUST respond strictly in valid JSON format with the following schema:
{
  "classification": "Likely Reliable" | "Potentially Misleading" | "Likely False" | "Needs Further Verification",
  "confidence": 0.85,
  "summary": "Brief 1-sentence summary of the assessment",
  "claim": "Extracted atomic factual assertion",
  "reasons": [
    "First concrete reason...",
    "Second concrete reason..."
  ],
  "recommendation": "Actionable advice for the user before sharing",
  "source_assessment": {
    "source": "Domain or platform identified",
    "credibility": "Verified Authority" | "Known Media Outlet" | "Independent / Unverified" | "Suspicious / Satire",
    "details": "Explanation of domain reputation or source transparency"
  }
}
"""

class LLMService:
    """Manages prompt formatting, provider routing, and structured JSON parsing."""

    @classmethod
    def call_groq(cls, prompt_content: str) -> Optional[Dict[str, Any]]:
        """Invokes Groq API with Llama-3 model."""
        if not settings.GROQ_API_KEY:
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 800
        }

        with httpx.Client(timeout=settings.AI_REQUEST_TIMEOUT) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            else:
                print(f"Groq API returned status {resp.status_code}: {resp.text}")
                return None

    @classmethod
    def call_openai(cls, prompt_content: str) -> Optional[Dict[str, Any]]:
        """Invokes OpenAI API with GPT model."""
        if not settings.OPENAI_API_KEY:
            return None

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 800
        }

        with httpx.Client(timeout=settings.AI_REQUEST_TIMEOUT) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            else:
                print(f"OpenAI API returned status {resp.status_code}: {resp.text}")
                return None

    @classmethod
    def generate_assessment(cls, text: str, context_type: str = "text") -> Optional[Dict[str, Any]]:
        """Routes prompt to configured LLM provider with fallback handling."""
        prompt = f"Analyze the following {context_type} submission for potential misinformation:\n\n\"{text}\""
        
        provider = settings.AI_PROVIDER.lower()
        result = None

        try:
            if provider == "groq":
                result = cls.call_groq(prompt)
            elif provider == "openai":
                result = cls.call_openai(prompt)
            elif provider in ["llm", "auto"]:
                # Try Groq first, then OpenAI
                result = cls.call_groq(prompt) or cls.call_openai(prompt)
        except Exception as e:
            print(f"LLM API invocation failed gracefully: {str(e)}")
            return None

        return result
