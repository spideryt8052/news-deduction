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

    print("\nALL LLM ABSTRACTION TESTS PASSED!")

if __name__ == "__main__":
    test_llm_abstraction()
