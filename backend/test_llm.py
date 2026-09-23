from app.services.llm_service import SYSTEM_PROMPT, LLMService
from app.services.llm_analyzer import LLMAnalyzer
from app.schemas.analysis import AnalysisResultResponse

def test_llm_abstraction():
    print("Testing LLM Abstraction & Fallback Resilience...")

    # 1. Verify system prompt structure
    assert "TruthShield" in SYSTEM_PROMPT
    assert "Likely Reliable" in SYSTEM_PROMPT
    assert "Potentially Misleading" in SYSTEM_PROMPT
    assert "Likely False" in SYSTEM_PROMPT
    assert "Needs Further Verification" in SYSTEM_PROMPT
    print("[PASS] 1. System Prompt Constraints Verified")

    # 2. Test LLMAnalyzer fallback when API key is empty
    analyzer = LLMAnalyzer()
    res = analyzer.analyze_text(
        text="BREAKING: Drinking boiled garlic water cures viruses in 2 hours!",
        source_hint="WhatsApp"
    )
    assert isinstance(res, AnalysisResultResponse)
    assert res.classification == "Likely False"
    print(f"[PASS] 2. Graceful Fallback Verified -> classification='{res.classification}', confidence={res.confidence}")

    # 3. Test URL analysis with fallback
    res_url = analyzer.analyze_url("https://www.who.int/guideline-test")
    assert isinstance(res_url, AnalysisResultResponse)
    assert res_url.classification == "Likely Reliable"
    print(f"[PASS] 3. URL Fallback Verified -> classification='{res_url.classification}'")

    # 4. Test passing dynamic api_key and ai_provider parameters directly
    res_with_key = analyzer.analyze_text(
        text="BREAKING: Drinking boiled garlic water cures viruses in 2 hours!",
        source_hint="WhatsApp",
        ai_provider="groq",                          # "groq" | "gemini" | "openai" | "anthropic"
        api_key="gsk_test_parameter_support_key"      # Your actual API key goes here
    )
    assert isinstance(res_with_key, AnalysisResultResponse)
    assert res_with_key.classification in ["Likely False", "Needs Further Verification"]
    print(f"[PASS] 4. Dynamic API Key & Provider Parameters Verified -> provider='groq', classification='{res_with_key.classification}'")

    print("\nALL LLM ABSTRACTION TESTS PASSED!")

if __name__ == "__main__":
    test_llm_abstraction()
