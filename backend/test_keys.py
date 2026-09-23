from fastapi.testclient import TestClient
from app.main import app

def test_api_key_endpoints():
    print("=" * 65)
    print("Testing AI Key Integration & Status Endpoints")
    print("=" * 65)

    with TestClient(app) as client:
        # 1. Check AI Status Endpoint
        res = client.get("/api/config/ai-status")
        assert res.status_code == 200, f"AI status failed: {res.text}"
        data = res.json()
        assert "server_keys" in data
        assert "supported_providers" in data
        assert "groq" in data["supported_providers"]
        assert "gemini" in data["supported_providers"]
        assert "openai" in data["supported_providers"]
        print(f"[PASS] 1. GET /api/config/ai-status -> supported={data['supported_providers']}")

        # 2. Test Key Validation Endpoint with Mock/Empty validation
        res_bad = client.post("/api/config/test-key", json={"provider": "groq", "api_key": ""})
        assert res_bad.status_code == 400
        print("[PASS] 2. Empty API key correctly rejected with HTTP 400")

        # 3. Test Invalid Key Graceful Handling
        res_test = client.post("/api/config/test-key", json={"provider": "groq", "api_key": "gsk_invalid_test_key"})
        assert res_test.status_code == 200
        assert res_test.json()["success"] is False
        print(f"[PASS] 3. Invalid key caught gracefully -> message: '{res_test.json()['message']}'")

        # 4. Test Header Passing with Fallback
        res_hdr = client.post(
            "/api/analyze/text",
            json={"text": "Drinking boiled garlic water cures viruses in 2 hours!"},
            headers={"X-AI-Provider": "groq", "X-API-Key": "gsk_dummy_test_key"}
        )
        assert res_hdr.status_code == 200
        result_payload = res_hdr.json()
        # Should gracefully return valid assessment even with dummy key due to fallback
        assert result_payload["classification"] in ["Likely False", "Needs Further Verification"]
        print(f"[PASS] 4. Custom header execution with fallback -> classification='{result_payload['classification']}'")

    print("=" * 65)
    print("ALL AI KEY INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    test_api_key_endpoints()
