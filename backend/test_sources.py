from app.services.source_verifier import SourceVerifier
from app.services.evidence_engine import EvidenceEngine

def test_source_verification():
    print("=" * 65)
    print("TruthShield Phase 9: Source Verification & Evidence Engine Tests")
    print("=" * 65)

    # 1. Imposter / Typosquatting Detection
    res_imposter = SourceVerifier.evaluate_url("https://bbc-worldnews-breaking.xyz/article/story")
    assert res_imposter["verification_status"] == "High Risk of Typosquatting"
    print(f"[PASS] 1. Typosquatting Caught -> status='{res_imposter['verification_status']}', credibility='{res_imposter['credibility']}'")

    # 2. Official Authority Verification
    res_gov = SourceVerifier.evaluate_url("https://pib.gov.in/PressReleasePage.aspx?PRID=189283")
    assert res_gov["verification_status"] == "Verified Authority"
    assert res_gov["source_type"] == "Official Authority"
    print(f"[PASS] 2. Official Authority -> source='{res_gov['source']}', status='{res_gov['verification_status']}'")

    # 3. IFCN Fact-Checking Bureau
    res_factcheck = SourceVerifier.evaluate_url("https://www.snopes.com/fact-check/garlic-water-cure")
    assert res_factcheck["verification_status"] == "Certified Fact-Checker"
    print(f"[PASS] 3. Fact-Checker Registry -> source='{res_factcheck['source']}', type='{res_factcheck['source_type']}'")

    # 4. Satirical Publication Check
    res_satire = SourceVerifier.evaluate_url("https://theonion.com/scientists-reveal-everything-is-made-of-cheese")
    assert res_satire["credibility"] == "Suspicious / Satire"
    print(f"[PASS] 4. Satire Flagged -> status='{res_satire['verification_status']}'")

    # 5. Security & SSRF Prevention
    assert not SourceVerifier.is_safe_url("http://localhost:8000/internal-admin")
    assert not SourceVerifier.is_safe_url("http://127.0.0.1:5432")
    assert not SourceVerifier.is_safe_url("http://192.168.1.100/router")
    assert SourceVerifier.is_safe_url("https://www.who.int/emergencies")
    print("[PASS] 5. SSRF & Private IP Blocking Verified")

    # 6. Evidence Engine Stance Checks
    health_evidence = EvidenceEngine.find_evidence("Drinking boiled garlic water cures viruses")
    assert len(health_evidence) > 0
    assert any(e.stance == "REFUTING" for e in health_evidence)
    print(f"[PASS] 6. Evidence Corroboration -> Found {len(health_evidence)} refuting citations")

    print("=" * 65)
    print("ALL SOURCE VERIFICATION & EVIDENCE TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_source_verification()
