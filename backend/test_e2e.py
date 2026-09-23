"""
TruthShield: Comprehensive End-to-End System Integration Test Suite
Validates all multi-modal pipelines, database persistence, domain heuristics,
confidence calibration, error boundaries, and community reporting.
"""

import io
import sys
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app

def run_e2e_suite():
    print("=" * 70)
    print("TruthShield Phase 11: End-to-End System & Multi-Modal Verification")
    print("=" * 70)
    
    with TestClient(app) as client:
        # -------------------------------------------------------------
        # 1. Health & Academic Attribution
        # -------------------------------------------------------------
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        health_data = res.json()
        assert health_data["status"] == "online"
        assert "Aarti Vishwakarma" in health_data["team"]
        assert "Yaseen Jamshed" in health_data["team"]
        assert "Dr. Saumya Chaturvedi" == health_data["supervisor"]
        assert "GNIOT" in health_data["institution"]
        print("[PASS] 1. System Health & Academic Metadata (GNIOT/AKTU) Verified")

        # -------------------------------------------------------------
        # 2. Multi-Modal Text Archetypes (4 Tiers)
        # -------------------------------------------------------------
        # 2a. Health Myth (Likely False)
        res_t1 = client.post("/api/analyze/text", json={
            "text": "BREAKING: Drinking boiled garlic water cures respiratory virus in 2 hours! Forward immediately!",
            "source_hint": "WhatsApp Viral Message"
        })
        assert res_t1.status_code == 200
        d1 = res_t1.json()
        assert d1["classification"] == "Likely False"
        assert 0.50 <= d1["confidence"] <= 0.98, "Confidence must be within realistic 0.5-0.98 bounds"
        assert len(d1["reasons"]) >= 1, "Must contain 'Why this result' explanations"
        assert d1["recommendation"] is not None
        stored_id_1 = d1["id"]
        print(f"[PASS] 2a. Health Myth Text -> Verdict: {d1['classification']} (Confidence: {d1['confidence']:.2f})")

        # 2b. Sensationalism / Altered Context (Potentially Misleading)
        res_t2 = client.post("/api/analyze/text", json={
            "text": "SCIENTISTS SHOCKED: NASA confirms massive golden asteroid will collide with Earth making citizens billionaires!",
            "source_hint": "Social Post"
        })
        assert res_t2.status_code == 200
        d2 = res_t2.json()
        assert d2["classification"] == "Potentially Misleading"
        print(f"[PASS] 2b. Sensationalism Text -> Verdict: {d2['classification']} (Confidence: {d2['confidence']:.2f})")

        # 2c. Authoritative Medical Agency (Likely Reliable)
        res_t3 = client.post("/api/analyze/text", json={
            "text": "WHO guidelines recommend consuming less than 2000 mg of sodium daily for adults to reduce blood pressure.",
            "source_hint": "Official Health Bulletin"
        })
        assert res_t3.status_code == 200
        d3 = res_t3.json()
        assert d3["classification"] == "Likely Reliable"
        print(f"[PASS] 2c. Institutional Fact Text -> Verdict: {d3['classification']} (Confidence: {d3['confidence']:.2f})")

        # 2d. Ambiguous Unverified Rumor (Needs Further Verification)
        res_t4 = client.post("/api/analyze/text", json={
            "text": "Unconfirmed local report: The city metro line 3 might open next Monday morning.",
            "source_hint": "Anonymous Group"
        })
        assert res_t4.status_code == 200
        d4 = res_t4.json()
        assert d4["classification"] == "Needs Further Verification"
        print(f"[PASS] 2d. Ambiguous Rumor Text -> Verdict: {d4['classification']} (Confidence: {d4['confidence']:.2f})")

        # -------------------------------------------------------------
        # 3. Multi-Modal Web URL Analysis & Guardrails
        # -------------------------------------------------------------
        # 3a. Official Government Authority URL
        res_u1 = client.post("/api/analyze/url", json={
            "url": "https://pib.gov.in/PressReleasePage.aspx?PRID=1800000"
        })
        assert res_u1.status_code == 200
        du1 = res_u1.json()
        assert du1["classification"] == "Likely Reliable"
        assert "Verified Authority" in du1["source_assessment"]["credibility"]
        print(f"[PASS] 3a. Authority URL (pib.gov.in) -> Credibility: {du1['source_assessment']['credibility']}")

        # 3b. Satire Publisher URL
        res_u2 = client.post("/api/analyze/url", json={
            "url": "https://theonion.com/article-satirical-news-report"
        })
        assert res_u2.status_code == 200
        du2 = res_u2.json()
        assert du2["classification"] == "Likely False"
        assert "Satire" in du2["source_assessment"]["credibility"]
        print(f"[PASS] 3b. Satire URL (theonion.com) -> Flagged as Satire / Humor")

        # 3c. Typosquatting / Imposter Phishing Domain URL
        res_u3 = client.post("/api/analyze/url", json={
            "url": "https://bbc-news-official.xyz/breaking"
        })
        assert res_u3.status_code == 200
        du3 = res_u3.json()
        assert du3["classification"] in ["Potentially Misleading", "Likely False"]
        assert "Typosquatting" in du3["source_assessment"]["details"] or "Suspicious" in du3["source_assessment"]["credibility"]
        print(f"[PASS] 3c. Imposter Domain (bbc-news-official.xyz) -> Detected Typosquatting Risk")

        # 3d. Private Network SSRF Block
        res_u4 = client.post("/api/analyze/url", json={
            "url": "http://192.168.1.1/admin-panel"
        })
        assert res_u4.status_code == 200
        du4 = res_u4.json()
        assert "security constraints" in du4["source_assessment"]["details"] or "local address" in du4["source_assessment"]["details"]
        print(f"[PASS] 3d. SSRF Protection -> Private IP blocked from external crawling")

        # -------------------------------------------------------------
        # 4. Multi-Modal Image / Screenshot Ingestion (Multipart)
        # -------------------------------------------------------------
        # Create a valid test image with Pillow in memory
        img_buffer = io.BytesIO()
        img = Image.new("RGB", (320, 180), color=(15, 23, 42))
        d_img = ImageDraw.Draw(img)
        d_img.text((20, 80), "VIRAL ALERT TEST", fill=(255, 255, 255))
        img.save(img_buffer, format="PNG")
        img_buffer.seek(0)

        res_img = client.post(
            "/api/analyze/image",
            files={"file": ("screenshot_test.png", img_buffer, "image/png")}
        )
        assert res_img.status_code == 200
        dimg = res_img.json()
        assert dimg["input_type"] == "image"
        assert dimg["classification"] in ["Likely Reliable", "Potentially Misleading", "Likely False", "Needs Further Verification"]
        stored_img_id = dimg["id"]
        print(f"[PASS] 4a. Valid PNG Screenshot Upload -> Ingested & Analyzed (ID: {stored_img_id})")

        # Corrupted / Non-image upload rejection test
        fake_buffer = io.BytesIO(b"This is not a real image binary file.")
        res_bad = client.post(
            "/api/analyze/image",
            files={"file": ("fake_image.png", fake_buffer, "image/png")}
        )
        assert res_bad.status_code == 400
        print(f"[PASS] 4b. Malformed Image Rejection -> Returned 400 Bad Request as expected")

        # -------------------------------------------------------------
        # 5. Database Direct Record Retrieval
        # -------------------------------------------------------------
        res_fetch = client.get(f"/api/results/{stored_id_1}")
        assert res_fetch.status_code == 200
        dfetch = res_fetch.json()
        assert dfetch["id"] == stored_id_1
        assert dfetch["classification"] == "Likely False"
        assert len(dfetch["reasons"]) > 0
        print(f"[PASS] 5. Direct DB Retrieval (/api/results/{stored_id_1}) -> Matches stored record")

        # -------------------------------------------------------------
        # 6. User Feedback Loop
        # -------------------------------------------------------------
        res_fb1 = client.post("/api/feedback", json={
            "result_id": stored_id_1,
            "is_helpful": True,
            "comments": "Accurately flagged unproven viral remedy."
        })
        assert res_fb1.status_code == 200
        assert res_fb1.json()["status"] == "success"

        res_fb2 = client.post("/api/feedback", json={
            "result_id": stored_img_id,
            "is_helpful": False,
            "comments": "Would like higher resolution OCR extraction."
        })
        assert res_fb2.status_code == 200
        assert res_fb2.json()["status"] == "success"
        print("[PASS] 6. User Feedback Loop -> Positive and Negative reviews logged to DB")

        # -------------------------------------------------------------
        # 7. Crowdsourced Misinformation Reporting
        # -------------------------------------------------------------
        res_rep = client.post("/api/report", json={
            "claim": "Viral video claiming local petrol pumps will stay shut for 10 days",
            "platform": "WhatsApp",
            "url": "https://forwarded-claim.example.com",
            "notes": "Spreading fast across college student groups in Greater Noida."
        })
        assert res_rep.status_code == 200
        drep = res_rep.json()
        assert drep["status"] == "queued"
        assert "report_id" in drep
        print(f"[PASS] 7. Crowdsourced Claim Submission -> Queued with ID: {drep['report_id']}")

        # -------------------------------------------------------------
        # 8. History & Analytics Endpoints
        # -------------------------------------------------------------
        res_hist = client.get("/api/history?limit=10")
        assert res_hist.status_code == 200
        hist_items = res_hist.json()
        assert len(hist_items) >= 4, "Must contain previously analyzed test items"
        print(f"[PASS] 8a. History Retrieval -> Retrieved {len(hist_items)} recent evaluations")

        res_stats = client.get("/api/stats")
        assert res_stats.status_code == 200
        stats = res_stats.json()
        assert stats["total_analyses"] >= 10
        sum_counts = (
            stats["reliable_count"]
            + stats["misleading_count"]
            + stats["false_count"]
            + stats["unverified_count"]
        )
        assert sum_counts == stats["total_analyses"]
        assert len(stats["breakdown_percentages"]) == 4
        print(f"[PASS] 8b. Aggregated Analytics -> Total Analyses: {stats['total_analyses']}, Percentages: {stats['breakdown_percentages']}")

    print("=" * 70)
    print("ALL END-TO-END & MULTI-MODAL INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_suite()
