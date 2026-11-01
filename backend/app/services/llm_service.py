import os
import json
import re
import httpx
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.services.evidence_engine import EvidenceEngine
from app.schemas.analysis import EvidenceItem

SYSTEM_PROMPT = """
You are an objective AI verification assistant for TruthShield, an advanced misinformation detection and social media credibility assessment platform.

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
7. PROVENANCE & ORIGIN ("कहाँ का है / कहाँ से शुरू हुआ"): You MUST investigate where this statement, image, or URL originated. Identify the country/geographic origin, the initial platform (e.g. WhatsApp, X/Twitter, satire site), whether an old event/photo is being recycled, and provide full provenance details.

You MUST respond strictly in valid JSON format with the following schema:
{
  "classification": "Likely Reliable" | "Potentially Misleading" | "Likely False" | "Needs Further Verification",
  "confidence": 0.88,
  "summary": "Brief 1-sentence summary of the assessment",
  "claim": "Extracted atomic factual assertion",
  "origin_info": {
    "location": "Country, region, or geographic origin (e.g. India, USA, Global)",
    "original_platform": "Initial platform or medium where this post/claim first surfaced (e.g. WhatsApp, X / Twitter, Satire Website, YouTube)",
    "first_seen_period": "Historical date or timeframe (e.g. 'Old rumor recirculated from 2020', 'Current breaking news 2024')",
    "provenance_details": "Detailed explanation of where this claim/image/URL actually originated, whether old media is being reused out of context, who first pushed it, and its true historical background."
  },
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
    def check_ollama_alive(cls, base_url: Optional[str] = None) -> bool:
        """Quick check to see if local Ollama instance is reachable."""
        host = (base_url or getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        try:
            with httpx.Client(timeout=1.5) as client:
                resp = client.get(f"{host}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    @classmethod
    def get_active_keys_status(cls) -> Dict[str, bool]:
        """Returns dict of which AI providers currently have valid credentials configured."""
        return {
            "groq": bool(cls.get_key_for_provider("groq")),
            "gemini": bool(cls.get_key_for_provider("gemini")),
            "openai": bool(cls.get_key_for_provider("openai")),
            "anthropic": bool(cls.get_key_for_provider("anthropic")),
            "ollama": cls.check_ollama_alive()
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
        """Invokes Google Gemini REST API with automated fallback across available model versions."""
        key = cls.get_key_for_provider("gemini", api_key)
        if not key:
            return None

        # Robust list of models to try in case of model retirement or spikes
        candidate_models = [model] if model else [
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-3.8-flash",
            settings.GEMINI_MODEL,
        ]

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

        for model_name in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
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
                        print(f"Gemini ({model_name}) API Warning {resp.status_code}: {resp.text[:150]}")
                        # Continue to next candidate model if 404 (not found), 503 (demand spike), or 429
                        continue
            except Exception as e:
                print(f"Gemini ({model_name}) invocation exception: {str(e)}")
                continue

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
    def call_ollama(
        cls, 
        prompt_content: str, 
        model: Optional[str] = None, 
        base_url: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Invokes Local Ollama instance (100% Offline / Local Laptop).
        Zero external API calls, runs completely private on user's machine.
        """
        host = (base_url or getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        model_name = (model or getattr(settings, "OLLAMA_MODEL", "llama3.2")).strip()
        timeout_seconds = getattr(settings, "OLLAMA_TIMEOUT", 90)

        # 1. Try Ollama native chat endpoint with JSON format
        url_native = f"{host}/api/chat"
        payload_native = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }

        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                resp = client.post(url_native, json=payload_native)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("message", {}).get("content", "")
                    parsed = extract_json_from_text(content)
                    if parsed:
                        return parsed
        except Exception as e:
            print(f"Ollama native invocation notice: {str(e)}")

        # 2. Fallback to Ollama OpenAI-compatible endpoint
        url_openai = f"{host}/v1/chat/completions"
        payload_openai = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                resp = client.post(url_openai, json=payload_openai)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return extract_json_from_text(content)
        except Exception as e:
            print(f"Ollama OpenAI-compatible endpoint error: {str(e)}")

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
                return True, "Google Gemini API key verified successfully! (Model: Gemini 3.5 Flash)"
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

        elif provider_clean in ["ollama", "local"]:
            host = (api_key if (api_key and api_key.startswith("http")) else getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
            target_model = api_key if (api_key and not api_key.startswith("http")) else getattr(settings, "OLLAMA_MODEL", "llama3.2")
            try:
                with httpx.Client(timeout=4.0) as client:
                    resp = client.get(f"{host}/api/tags")
                    if resp.status_code == 200:
                        data = resp.json()
                        models = [m.get("name") for m in data.get("models", []) if "name" in m]
                        models_str = ", ".join(models[:4]) if models else "none yet (run: ollama pull llama3.2)"
                        return True, f"Ollama is online locally at {host}! Installed models: {models_str}. Active: {target_model}."
                    return False, f"Ollama returned HTTP status {resp.status_code}."
            except Exception as e:
                return False, (
                    f"Cannot reach local Ollama at {host}. "
                    "Make sure Ollama is installed (https://ollama.com) and running locally (`ollama serve`)."
                )

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
            elif target_provider in ["ollama", "local"]:
                m_override = api_key if (api_key and not api_key.startswith("http")) else None
                url_override = api_key if (api_key and api_key.startswith("http")) else None
                result = cls.call_ollama(prompt, model=m_override, base_url=url_override)
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
                    elif api_key.startswith("http") or any(m in api_key.lower() for m in ["llama", "mistral", "qwen", "phi"]):
                        result = cls.call_ollama(prompt, model=api_key if not api_key.startswith("http") else None, base_url=api_key if api_key.startswith("http") else None)
                    else:
                        # Try Groq, then Gemini, then OpenAI, then Ollama
                        result = (
                            cls.call_groq(prompt, api_key=api_key) or
                            cls.call_gemini(prompt, api_key=api_key) or
                            cls.call_openai(prompt, api_key=api_key) or
                            cls.call_ollama(prompt)
                        )
                else:
                    # Check configured keys from .env in preferred order (Groq -> Gemini -> OpenAI -> Anthropic -> Ollama)
                    if cls.get_key_for_provider("groq"):
                        result = cls.call_groq(prompt)
                    elif cls.get_key_for_provider("gemini"):
                        result = cls.call_gemini(prompt)
                    elif cls.get_key_for_provider("openai"):
                        result = cls.call_openai(prompt)
                    elif cls.get_key_for_provider("anthropic"):
                        result = cls.call_anthropic(prompt)
                    elif cls.check_ollama_alive():
                        result = cls.call_ollama(prompt)
                    elif settings.API_KEY:
                        # Fallback for generic key
                        result = (
                            cls.call_groq(prompt, api_key=settings.API_KEY) or
                            cls.call_gemini(prompt, api_key=settings.API_KEY) or
                            cls.call_openai(prompt, api_key=settings.API_KEY) or
                            (cls.call_ollama(prompt) if cls.check_ollama_alive() else None)
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

    @classmethod
    def chat(
        cls,
        message: str,
        conversation_history: Optional[list] = None,
        ai_provider: Optional[str] = None,
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        language: Optional[str] = "en"
    ) -> Dict[str, Any]:
        """Provides natural, human-like conversational AI answers across general Q&A and fact-checking."""
        system_instruction = (
            "You are TruthShield AI, an intelligent, empathetic, and human-like conversational AI assistant "
            "similar to Google Gemini and ChatGPT, specialized in comprehensive knowledge and truth verification.\n\n"
            "GUIDELINES:\n"
            "1. Answer ANY question asked by the user (science, technology, daily life, coding, history, general advice, news, or casual chatting).\n"
            "2. If the user asks about a viral rumor, controversial claim, current event, image, or URL, provide objective, evidence-grounded fact-checking with logical context and sources.\n"
            "3. PROVENANCE & ORIGIN INVESTIGATION (कहाँ का है / असली स्रोत की पड़ताल):\n"
            "   Whenever analyzing or discussing any claim, event, photo, or viral news, always thoroughly identify its TRUE ORIGIN:\n"
            "   - Geographic Origin: Where did this actually happen or come from (Country, State, City)?\n"
            "   - Original Platform / Medium: Where did it first surface (WhatsApp forward, Telegram, X/Twitter, YouTube)?\n"
            "   - Timeline & Recycled Context: When was it first seen? Is it an old event or recycled media falsely presented as new?\n"
            "   - Full Provenance Breakdown: Explain clearly how the claim originated and who altered or circulated it.\n"
            "4. Be articulate, warm, polite, and helpful like a real human tutor and expert analyst. Use clean Markdown (bullet points, bold key terms, quotes).\n"
            "5. Never say you cannot answer just because you are a verification tool. You are a full conversational AI assistant."
        )

        lang_code = (language or "en").split("-")[0].lower()
        LANG_MAP = {
            "hi": "Hindi (हिन्दी)",
            "ur": "Urdu (اردو)",
            "bn": "Bengali (বাংলা)",
            "pa": "Punjabi (ਪੰਜਾਬੀ)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
            "mr": "Marathi (मराठी)",
            "gu": "Gujarati (ગુજરાતી)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "ml": "Malayalam (മലയാളം)",
            "ar": "Arabic (العربية)",
            "bho": "Bhojpuri (भोजपुरी)",
            "mai": "Maithili (मैथिली)",
            "as": "Assamese (অসমীয়া)",
            "es": "Spanish (Español)",
            "fr": "French (Français)",
            "de": "German (Deutsch)",
            "ru": "Russian (Русский)",
            "zh": "Chinese (中文)",
            "ja": "Japanese (日本語)",
            "ko": "Korean (한국어)",
            "id": "Indonesian (Bahasa Indonesia)",
            "tr": "Turkish (Türkçe)",
            "vi": "Vietnamese (Tiếng Việt)",
            "fa": "Persian (فارسی)",
            "sw": "Swahili (Kiswahili)",
        }

        if lang_code == "bho":
            system_instruction += (
                "\n\nCRITICAL LANGUAGE MANDATE: The user has selected Bhojpuri (भोजपुरी).\n"
                "You MUST formulate your ENTIRE response in pure, authentic Bhojpuri (भोजपुरी) using Devanagari script. "
                "Use natural Bhojpuri vocabulary, verb forms, and phrases (such as: बा, गइल, करीं, राउर, का हाल बा, झूठ बात ह, जानकारी, आदि). "
                "Do NOT answer in formal standard Hindi or English. Write completely and natively in Bhojpuri."
            )
        elif lang_code == "ar":
            system_instruction += (
                "\n\nCRITICAL LANGUAGE MANDATE: The user has selected Arabic (العربية).\n"
                "You MUST formulate your ENTIRE response in fluent, clear Modern Standard Arabic (العربية الفصحى) using Arabic script. "
                "Do NOT mix English words into the Arabic text so that speech synthesis can vocalize the entire response smoothly."
            )
        elif lang_code != "en" and lang_code in LANG_MAP:
            target_lang_name = LANG_MAP[lang_code]
            system_instruction += (
                f"\n\nCRITICAL LANGUAGE MANDATE: The user has selected the language: {target_lang_name}.\n"
                f"You MUST formulate your ENTIRE response in {target_lang_name}, using proper native script and natural, fluent spoken phrasing suitable for text-to-speech. "
                f"Do NOT answer in English, even if the user question is written in English or Latin script. Answer completely in {target_lang_name}."
            )
        else:
            system_instruction += "\nIf the user writes in Hindi or Hinglish, reply naturally in Hindi or Hinglish. If in English, reply in English."

        history = conversation_history or []
        provider = (ai_provider or settings.AI_PROVIDER or "auto").lower()

        # 1. Try Gemini
        gemini_key = cls.get_key_for_provider("gemini", api_key if provider == "gemini" else None)
        if provider in ["gemini", "auto"] and gemini_key:
            try:
                candidate_models = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-pro-latest"]
                # Build contents array
                contents = []
                # Include recent history (up to last 6 turns)
                for item in history[-6:]:
                    role = "user" if item.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": item.get("content", "")}]})
                
                # Append current prompt with system instruction
                contents.append({
                    "role": "user",
                    "parts": [{"text": f"System Directive: {system_instruction}\n\nUser Question: {message}"}]
                })

                for m in candidate_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={gemini_key}"
                    with httpx.Client(timeout=18) as client:
                        resp = client.post(url, json={
                            "contents": contents,
                            "generationConfig": {"temperature": temperature}
                        }, headers={"Content-Type": "application/json"})

                        if resp.status_code == 200:
                            data = resp.json()
                            cands = data.get("candidates", [])
                            if cands and "content" in cands[0] and "parts" in cands[0]["content"]:
                                text = cands[0]["content"]["parts"][0]["text"].strip()
                                return {
                                    "response": text,
                                    "provider": "gemini",
                                    "model": m,
                                    "suggested_questions": cls._generate_suggestions(message, text)
                                }
            except Exception as e:
                print(f"Gemini chat error: {e}")

        # 2. Try Groq
        groq_key = cls.get_key_for_provider("groq", api_key if provider == "groq" else None)
        if provider in ["groq", "auto"] and groq_key:
            try:
                messages = [{"role": "system", "content": system_instruction}]
                for item in history[-6:]:
                    messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
                messages.append({"role": "user", "content": message})

                url = "https://api.groq.com/openai/v1/chat/completions"
                with httpx.Client(timeout=15) as client:
                    resp = client.post(url, json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": 1200
                    }, headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    })
                    if resp.status_code == 200:
                        text = resp.json()["choices"][0]["message"]["content"].strip()
                        return {
                            "response": text,
                            "provider": "groq",
                            "model": "llama-3.3-70b-versatile",
                            "suggested_questions": cls._generate_suggestions(message, text)
                        }
            except Exception as e:
                print(f"Groq chat error: {e}")

        # 3. Try OpenAI
        openai_key = cls.get_key_for_provider("openai", api_key if provider == "openai" else None)
        if provider in ["openai", "auto"] and openai_key:
            try:
                messages = [{"role": "system", "content": system_instruction}]
                for item in history[-6:]:
                    messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
                messages.append({"role": "user", "content": message})

                url = "https://api.openai.com/v1/chat/completions"
                with httpx.Client(timeout=15) as client:
                    resp = client.post(url, json={
                        "model": "gpt-4o-mini",
                        "messages": messages,
                        "temperature": temperature,
                    }, headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json"
                    })
                    if resp.status_code == 200:
                        text = resp.json()["choices"][0]["message"]["content"].strip()
                        return {
                            "response": text,
                            "provider": "openai",
                            "model": "gpt-4o-mini",
                            "suggested_questions": cls._generate_suggestions(message, text)
                        }
            except Exception as e:
                print(f"OpenAI chat error: {e}")

        # 4. Try Ollama (Local LLM / 100% Offline)
        use_ollama = (provider in ["ollama", "local"]) or (provider == "auto" and not (gemini_key or groq_key or openai_key) and cls.check_ollama_alive())
        if use_ollama:
            try:
                host = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
                model_name = getattr(settings, "OLLAMA_MODEL", "llama3.2")
                if api_key:
                    if api_key.startswith("http"):
                        host = api_key.rstrip("/")
                    else:
                        model_name = api_key.strip()
                
                messages = [{"role": "system", "content": system_instruction}]
                for item in history[-6:]:
                    messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
                messages.append({"role": "user", "content": message})

                timeout_s = getattr(settings, "OLLAMA_TIMEOUT", 90)
                with httpx.Client(timeout=timeout_s) as client:
                    resp = client.post(f"{host}/api/chat", json={
                        "model": model_name,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": temperature}
                    })
                    if resp.status_code == 200:
                        text = resp.json().get("message", {}).get("content", "").strip()
                        return {
                            "response": text,
                            "provider": "ollama",
                            "model": model_name,
                            "suggested_questions": cls._generate_suggestions(message, text)
                        }
            except Exception as e:
                print(f"Ollama chat error: {e}")

        # 5. High-Quality Human-like Fallback (Offline / Resilient Mode)
        fallback_text = cls._generate_human_fallback_chat(message, language=lang_code)
        return {
            "response": fallback_text,
            "provider": "truthshield-engine",
            "model": "hybrid-cognitive-v1",
            "suggested_questions": cls._generate_suggestions(message, fallback_text)
        }

    @classmethod
    def _generate_suggestions(cls, query: str, response: str) -> list:
        """Derives 3 intelligent follow-up suggestions tailored to the topic."""
        q_lower = query.lower()
        if any(w in q_lower for w in ["myth", "cure", "virus", "health", "garlic", "medicine"]):
            return [
                "What does the World Health Organization recommend?",
                "How can I spot pseudoscientific medical claims?",
                "Where can I find peer-reviewed medical studies?"
            ]
        elif any(w in q_lower for w in ["deepfake", "image", "photo", "video", "ai"]):
            return [
                "What tools can detect deepfake images?",
                "How do reverse image search tools work?",
                "Can AI generate realistic voice clones?"
            ]
        elif any(w in q_lower for w in ["whatsapp", "forward", "fake news", "social media"]):
            return [
                "What is the 30-Second Rule before forwarding?",
                "How do social media algorithms spread viral rumors?",
                "What are the cyber laws regarding spreading rumors?"
            ]
        else:
            return [
                "Can you explain this in simpler terms?",
                "How can I verify this information independently?",
                "What are the practical applications of this?"
            ]

    @classmethod
    def _generate_human_fallback_chat(cls, query: str, language: str = "en") -> str:
        """Generates structured, human-like answers when external LLM endpoints are unreachable."""
        q = query.strip()
        q_lower = q.lower()
        lang = (language or "en").lower()

        # Hindi localized fallback
        if lang == "hi":
            if any(w in q_lower for w in ["hi", "hello", "hey", "kaise ho", "kya haal", "namaste", "नमस्ते"]):
                return (
                    "नमस्ते! 👋 मैं **ट्रुथशील्ड एआई (TruthShield AI)** हूँ, आपका व्यक्तिगत एआई सहायक।\n\n"
                    "आप मुझसे कोई भी सवाल पूछ सकते हैं:\n"
                    "- 🔍 **सोशल मीडिया की वायरल खबरों और अफवाहों की सच्चाई जांचें**\n"
                    "- 📚 **विज्ञान, तकनीक, इतिहास और सामान्य ज्ञान के बारे में समझें**\n"
                    "- 🛡️ **फेक न्यूज़ और डीपफेक पहचानने के आसान तरीके जानें**\n\n"
                    "आज आप क्या जानना या जांचना चाहते हैं?"
                )
            if "garlic" in q_lower or "लहसुन" in q_lower:
                return (
                    "### 🧄 तथ्य-जांच: उबले हुए लहसुन के पानी का दावा\n\n"
                    "**निष्कर्ष:** **झूठा या मिथक (Likely False)**\n\n"
                    "- **तथ्य:** हालांकि लहसुन सेहत के लिए अच्छा होता है, लेकिन उबला हुआ लहसुन पानी किसी भी वायरल संक्रमण का इलाज नहीं है।\n"
                    "- **विश्व स्वास्थ्य संगठन (WHO):** WHO के अनुसार इस दावे का कोई वैज्ञानिक प्रमाण नहीं है।\n"
                    "- **सलाह:** किसी भी बीमारी में केवल प्रमाणित डॉक्टरों की सलाह लें, सोशल मीडिया नुस्खों पर भरोसा न करें।"
                )
            return (
                f"### सवाल का विश्लेषण: \"{q}\"\n\n"
                "आपके सवाल के मुख्य बिंदु:\n"
                "1. **तथ्य की पुष्टि:** किसी भी जानकारी पर विश्वास करने से पहले उसके आधिकारिक स्रोतों की जांच करना आवश्यक है।\n"
                "2. **जांच का तरीका:** यदि यह कोई वायरल खबर है, तो प्रतिष्ठित समाचार एजेंसियों (जैसे Reuters, PTI) से मिलान करें।\n"
                "3. **सलाह:** बिना सत्यापन के सोशल मीडिया पर कोई भी संदेश साझा न करें।"
            )

        # Bhojpuri localized fallback
        if lang == "bho":
            if any(w in q_lower for w in ["hi", "hello", "hey", "kaise ho", "kya haal", "ka haal", "pranam", "प्रणाम", "नमस्ते"]):
                return (
                    "प्रणाम! 👋 हम **ट्रुथशील्ड एआई (TruthShield AI)** हईं, राउर आपन एआई सहायक।\n\n"
                    "रउआ हमरा से कवनो भी सवाल पूछ सकीं ले:\n"
                    "- 🔍 **सोशल मीडिया के कवनो वायरल खबर भा अफवाह के सच्चाई जांचीं**\n"
                    "- 📚 **बिज्ञान, इतिहास, समाज आ पढ़ाई-लिखाई के बात पूछीं**\n"
                    "- 🛡️ **झूठ खबर आ फेक वीडियो पहिचाने के तरीका समझीं**\n\n"
                    "बताईं, आज रउआ का जाने भा जांचल चाहत बानी?"
                )
            return (
                f"### सवाल के पड़ताल: \"{q}\"\n\n"
                "राउर सवाल पर मुख्य बात:\n"
                "1. **तथ्य के जांच:** कवनो भी बात पर बिस्वास करे से पहिले ओकर असली सोर्स जरूर देख लीं।\n"
                "2. **सच्चाई के परख:** अगर ई सोशल मीडिया के वायरल मैसेज ह, त एकरा के बिना जांचे आगे जिन भेजीं।\n"
                "3. **सलाह:** सरकार भा आधिकारिक समाचार एजेंसी से मिलान कइला के बादे भरोसा करीं।"
            )

        # Arabic localized fallback
        if lang == "ar":
            if any(w in q_lower for w in ["hi", "hello", "hey", "مرحبا", "سلام", "اهلا"]):
                return (
                    "مرحبًا بك! 👋 أنا **تروث شيلد ذكاء اصطناعي (TruthShield AI)**، مساعدك الشخصي للتحقق من الحقائق والمعلومات.\n\n"
                    "يمكنك سؤالي عن أي شيء:\n"
                    "- 🔍 **التحقق من صحة الأخبار والشائعات المتداولة على وسائل التواصل**\n"
                    "- 📚 **شرح المفاهيم العلمية والتقنية والتاريخية**\n"
                    "- 🛡️ **كشف الأخبار المزيفة والتزييف العميق**\n\n"
                    "كيف يمكنني مساعدتك اليوم؟"
                )
            return (
                f"### تحليل الاستفسار: \"{q}\"\n\n"
                "النقاط الأساسية بخصوص استفسارك:\n"
                "1. **التحقق من المصدر:** قبل تصدیق أو مشاركة أي خبر، تأكد من الاعتماد على وكالات الأنباء الرسمية المعتمدة.\n"
                "2. **فحص الأدلة:** تجنب إعادة نشر الرسائل المجهولة التي تفتقر للمصادر الموثقة.\n"
                "3. **التوجيه:** فكّر جيدًا وتحقق قبل المشاركة على وسائل التواصل."
            )

        # Urdu localized fallback
        if lang == "ur":
            return (
                f"### جواب: \"{q}\"\n\n"
                "ٹروتھ شیلڈ تصدیقی نظام کے مطابق:\n"
                "1. کسی بھی وائرل خبر کو شیئر کرنے سے پہلے اس کی مستند ذرائع سے تصدیق ضروری ہے۔\n"
                "2. انٹرنیٹ پر موجود غیر مصدقہ معلومات پر فورا یقین نہ کریں۔"
            )

        # Greetings in English
        if any(w in q_lower for w in ["hi", "hello", "hey", "kaise ho", "kya haal", "namaste"]):
            return (
                "Hello! 👋 I'm **TruthShield AI**, your personal conversational assistant.\n\n"
                "You can ask me **absolutely anything**—just like in ChatGPT or Google Gemini:\n"
                "- 🔍 **Fact-check any viral post or news claim**\n"
                "- 📚 **Explain complex concepts** (science, technology, AI, history, algorithms)\n"
                "- 🛡️ **Media literacy & safety** (how to detect deepfakes, scams, phishing)\n"
                "- 💬 **General questions & problem-solving** in English or Hindi/Hinglish\n\n"
                "What would you like to explore or verify right now?"
            )

        # Fact checking garlic water
        if "garlic" in q_lower:
            return (
                "### 🧄 Fact-Check Analysis: Garlic Water Remedy\n\n"
                "**Verdict:** **Likely False / Myth**\n\n"
                "- **Factual Consensus:** While garlic (*Allium sativum*) contains allicin and has antimicrobial properties in laboratory settings, **there is zero clinical evidence** that drinking boiled garlic water cures systemic viral respiratory infections.\n"
                "- **Official Position:** Both the **World Health Organization (WHO)** and health agencies globally have issued public advisories confirming that while garlic is a healthy dietary food, it is **not a cure** for viral epidemics.\n"
                "- **Recommendation:** Always consult qualified medical professionals and do not replace evidence-based medical treatment with viral social media home remedies."
            )

        # General helpful fallback with clear notification about missing LLM key
        return (
            f"### सवाल / प्रश्न: \"{q}\"\n\n"
            "⚠️ **Note: AI Key Not Configured on Server (Offline Mode)**\n"
            "सर्वर पर अभी तक **Google Gemini / Groq API Key** सेट नहीं की गई है, इसलिए यह सिस्टम ऑफ़लाइन टेम्पलेट मोड में है।\n\n"
            "👉 **इसे असली AI (ChatGPT/Gemini) जैसा चलाने के लिए:**\n"
            "1. ऊपर नेविगेशन बार में **'AI Engine'** बटन पर क्लिक करें और अपनी **Gemini API Key** पेस्ट करें, या\n"
            "2. Render डैशबोर्ड के **Environment** सेक्शन में `GEMINI_API_KEY` जोड़ें।\n\n"
            "**बुनियादी जानकारी (General Guidance):**\n"
            "- किसी भी दावे या जानकारी को साझा करने से पहले विश्वसनीय स्रोतों से सत्यापित करें।\n"
            "- सोशल मीडिया फॉरवर्ड्स को बिना जांचे आगे न भेजें।"
        )
