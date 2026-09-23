import os
import json
import re
import httpx
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.services.evidence_engine import EvidenceEngine
from app.schemas.analysis import EvidenceItem

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
3. "confidence" must be a float between 0.50 and 0.98 representing algorithmic assessment confidence based on evidence quality.
4. "reasons" must be an array of 2 to 4 clear, concrete bullet points explaining the linguistic, source, or factual context.
5. "recommendation" must give the user practical, actionable guidance on what to check before forwarding.
6. "evidence" should include 1 to 3 relevant real-world citations or fact-checking references with their stance: "SUPPORTING", "REFUTING", or "CONTEXTUAL".

You MUST respond strictly in valid JSON format with the following schema:
{
  "classification": "Likely Reliable" | "Potentially Misleading" | "Likely False" | "Needs Further Verification",
  "confidence": 0.88,
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
  },
  "evidence": [
    {
      "title": "Reference article title",
      "snippet": "Relevant factual excerpt",
      "source_name": "Publisher or Agency",
      "stance": "REFUTING" | "SUPPORTING" | "CONTEXTUAL",
      "url": "https://..."
    }
  ]
}
"""

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """Helper to safely extract JSON object from LLM response text."""
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    
    # Try finding markdown code block ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # Try finding first { and last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end+1])
        except Exception:
            pass
            
    return None

class LLMService:
    """Manages prompt formatting, provider routing, multi-LLM execution, and structured parsing."""

    @classmethod
    def detect_provider_from_key(cls, key: str) -> Optional[str]:
        """Auto-detects the provider name based on standard API key prefixes."""
        if not key or not isinstance(key, str):
            return None
        k = key.strip()
        if k.startswith("gsk_"):
            return "groq"
        elif k.startswith("AIzaSy"):
            return "gemini"
        elif k.startswith("sk-ant-"):
            return "anthropic"
        elif k.startswith("sk-"):
            return "openai"
        return None

    @classmethod
    def get_key_for_provider(cls, provider: str, explicit_key: Optional[str] = None) -> Optional[str]:
        """Resolves the appropriate API key for a provider across parameters and .env."""
        if explicit_key and explicit_key.strip():
            return explicit_key.strip()
        
        provider = provider.lower()
        if provider == "groq":
            if settings.GROQ_API_KEY:
                return settings.GROQ_API_KEY.strip()
            if settings.API_KEY and (settings.API_KEY.startswith("gsk_") or settings.AI_PROVIDER == "groq"):
                return settings.API_KEY.strip()
            return os.environ.get("GROQ_API_KEY") or (os.environ.get("API_KEY") if os.environ.get("API_KEY", "").startswith("gsk_") else None)

        elif provider == "gemini":
            if settings.GEMINI_API_KEY:
                return settings.GEMINI_API_KEY.strip()
            if settings.API_KEY and (settings.API_KEY.startswith("AIzaSy") or settings.AI_PROVIDER == "gemini"):
                return settings.API_KEY.strip()
            return os.environ.get("GEMINI_API_KEY") or (os.environ.get("API_KEY") if os.environ.get("API_KEY", "").startswith("AIzaSy") else None)

        elif provider == "openai":
            if settings.OPENAI_API_KEY:
                return settings.OPENAI_API_KEY.strip()
            if settings.API_KEY and (settings.API_KEY.startswith("sk-") and not settings.API_KEY.startswith("sk-ant-") or settings.AI_PROVIDER == "openai"):
                return settings.API_KEY.strip()
            return os.environ.get("OPENAI_API_KEY") or (os.environ.get("API_KEY") if (os.environ.get("API_KEY", "").startswith("sk-") and not os.environ.get("API_KEY", "").startswith("sk-ant-")) else None)

        elif provider == "anthropic":
            if settings.ANTHROPIC_API_KEY:
                return settings.ANTHROPIC_API_KEY.strip()
            if settings.API_KEY and (settings.API_KEY.startswith("sk-ant-") or settings.AI_PROVIDER == "anthropic"):
                return settings.API_KEY.strip()
            return os.environ.get("ANTHROPIC_API_KEY") or (os.environ.get("API_KEY") if os.environ.get("API_KEY", "").startswith("sk-ant-") else None)

        return None

    @classmethod
    def get_active_keys_status(cls) -> Dict[str, bool]:
        """Returns dict of which AI providers currently have valid credentials configured."""
        return {
            "groq": bool(cls.get_key_for_provider("groq")),
            "gemini": bool(cls.get_key_for_provider("gemini")),
            "openai": bool(cls.get_key_for_provider("openai")),
            "anthropic": bool(cls.get_key_for_provider("anthropic"))
        }

    @classmethod
    def call_groq(cls, prompt_content: str, api_key: Optional[str] = None, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes Groq API with ultra-fast Llama-3 model."""
        key = cls.get_key_for_provider("groq", api_key)
        if not key:
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model or settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 1000
        }

        try:
            with httpx.Client(timeout=settings.AI_REQUEST_TIMEOUT) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return extract_json_from_text(content)
                else:
                    print(f"Groq API Error {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            print(f"Groq invocation failed: {str(e)}")
            return None

    @classmethod
    def call_gemini(cls, prompt_content: str, api_key: Optional[str] = None, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes Google Gemini REST API."""
        key = cls.get_key_for_provider("gemini", api_key)
        if not key:
            return None

        model_name = model or settings.GEMINI_MODEL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
        headers = {"Content-Type": "application/json"}
        
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser Submission to Evaluate:\n{prompt_content}"
        payload = {
            "contents": [
                {"parts": [{"text": full_prompt}]}
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
        }

        try:
            with httpx.Client(timeout=settings.AI_REQUEST_TIMEOUT) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        part_text = candidates[0]["content"]["parts"][0]["text"]
                        return extract_json_from_text(part_text)
                else:
                    print(f"Gemini API Error {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            print(f"Gemini invocation failed: {str(e)}")
            return None

    @classmethod
    def call_openai(cls, prompt_content: str, api_key: Optional[str] = None, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes OpenAI API with GPT model."""
        key = cls.get_key_for_provider("openai", api_key)
        if not key:
            return None

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model or settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 1000
        }

        try:
            with httpx.Client(timeout=settings.AI_REQUEST_TIMEOUT) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return extract_json_from_text(content)
                else:
                    print(f"OpenAI API Error {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            print(f"OpenAI invocation failed: {str(e)}")
            return None

    @classmethod
    def call_anthropic(cls, prompt_content: str, api_key: Optional[str] = None, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes Anthropic Claude API."""
        key = cls.get_key_for_provider("anthropic", api_key)
        if not key:
            return None

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": model or settings.ANTHROPIC_MODEL,
            "max_tokens": 1000,
            "system": SYSTEM_PROMPT,
            "messages": [
                {"role": "user", "content": prompt_content}
            ]
        }

        try:
            with httpx.Client(timeout=settings.AI_REQUEST_TIMEOUT) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["content"][0]["text"]
                    return extract_json_from_text(content)
                else:
                    print(f"Anthropic API Error {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            print(f"Anthropic invocation failed: {str(e)}")
            return None

    @classmethod
    def test_key(cls, provider: str, api_key: str) -> Tuple[bool, str]:
        """Validates an API key on demand by sending a lightweight test query."""
        test_prompt = "Classify this short test: 'Drinking clean water is good for hydration.'"
        provider_clean = provider.strip().lower()

        if provider_clean == "groq":
            res = cls.call_groq(test_prompt, api_key=api_key)
            if res:
                return True, "Groq API key verified successfully! (Model: Llama 3.3 70B)"
            return False, "Failed to authenticate with Groq. Please check your API key."
            
        elif provider_clean == "gemini":
            res = cls.call_gemini(test_prompt, api_key=api_key)
            if res:
                return True, "Google Gemini API key verified successfully! (Model: Gemini 1.5 Flash)"
            return False, "Failed to authenticate with Google Gemini. Please check your API key."
            
        elif provider_clean == "openai":
            res = cls.call_openai(test_prompt, api_key=api_key)
            if res:
                return True, "OpenAI API key verified successfully! (Model: GPT-4o-mini)"
            return False, "Failed to authenticate with OpenAI. Please check your API key."
            
        elif provider_clean == "anthropic":
            res = cls.call_anthropic(test_prompt, api_key=api_key)
            if res:
                return True, "Anthropic API key verified successfully! (Model: Claude 3.5 Haiku)"
            return False, "Failed to authenticate with Anthropic. Please check your API key."

        return False, f"Unknown AI provider: {provider}"

    @classmethod
    def generate_assessment(
        cls, 
        text: str, 
        context_type: str = "text",
        provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Routes prompt to configured or passed LLM provider with graceful fallback."""
        prompt = f"Analyze the following {context_type} submission for credibility and potential misinformation:\n\n\"{text}\""
        
        target_provider = (provider or settings.AI_PROVIDER).lower()
        result = None

        try:
            # 1. Direct explicit provider execution
            if target_provider == "groq":
                result = cls.call_groq(prompt, api_key=api_key)
            elif target_provider == "gemini":
                result = cls.call_gemini(prompt, api_key=api_key)
            elif target_provider == "openai":
                result = cls.call_openai(prompt, api_key=api_key)
            elif target_provider == "anthropic":
                result = cls.call_anthropic(prompt, api_key=api_key)
            elif target_provider in ["auto", "llm"]:
                # Auto-detect available keys in priority order
                # If a client passed an api_key without specifying provider, auto-detect by prefix:
                if api_key:
                    detected = cls.detect_provider_from_key(api_key)
                    if detected == "groq":
                        result = cls.call_groq(prompt, api_key=api_key)
                    elif detected == "gemini":
                        result = cls.call_gemini(prompt, api_key=api_key)
                    elif detected == "anthropic":
                        result = cls.call_anthropic(prompt, api_key=api_key)
                    elif detected == "openai":
                        result = cls.call_openai(prompt, api_key=api_key)
                    else:
                        # Try Groq, then Gemini, then OpenAI
                        result = (
                            cls.call_groq(prompt, api_key=api_key) or
                            cls.call_gemini(prompt, api_key=api_key) or
                            cls.call_openai(prompt, api_key=api_key)
                        )
                else:
                    # Check configured keys from .env in preferred order (Groq -> Gemini -> OpenAI -> Anthropic)
                    if cls.get_key_for_provider("groq"):
                        result = cls.call_groq(prompt)
                    elif cls.get_key_for_provider("gemini"):
                        result = cls.call_gemini(prompt)
                    elif cls.get_key_for_provider("openai"):
                        result = cls.call_openai(prompt)
                    elif cls.get_key_for_provider("anthropic"):
                        result = cls.call_anthropic(prompt)
                    elif settings.API_KEY:
                        # Fallback for generic key
                        result = (
                            cls.call_groq(prompt, api_key=settings.API_KEY) or
                            cls.call_gemini(prompt, api_key=settings.API_KEY) or
                            cls.call_openai(prompt, api_key=settings.API_KEY)
                        )

        except Exception as e:
            print(f"LLM API invocation error: {str(e)}")
            return None

        # Post-process result if present
        if result and "classification" in result:
            # Normalize confidence
            try:
                conf = float(result.get("confidence", 0.75))
                result["confidence"] = round(max(0.50, min(0.98, conf)), 2)
            except Exception:
                result["confidence"] = 0.85
                
            # Ensure evidence list has valid structure
            raw_evidence = result.get("evidence", [])
            valid_evidence = []
            if isinstance(raw_evidence, list):
                for ev in raw_evidence:
                    if isinstance(ev, dict) and "title" in ev and "source_name" in ev:
                        valid_evidence.append(ev)
            
            # If no evidence generated by LLM, enrich with EvidenceEngine
            if not valid_evidence:
                kb_evidence = EvidenceEngine.find_evidence(text)
                for item in kb_evidence:
                    valid_evidence.append({
                        "title": item.title,
                        "snippet": item.snippet,
                        "source_name": item.source_name,
                        "stance": item.stance,
                        "url": item.url
                    })
            result["evidence"] = valid_evidence

        return result
