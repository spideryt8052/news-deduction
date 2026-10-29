import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_e2e_auth_tests():
    print("=== STARTING FULL AUTH, USER PANEL & ADMIN PANEL INTEGRATION TESTS ===")

    with TestClient(app) as client:
        # 1. Admin login with seeded credentials
        admin_login_res = client.post("/api/auth/login", json={
            "email": "admin@truthshield.com",
            "password": "admin123"
        })
        assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
        admin_data = admin_login_res.json()
        admin_token = admin_data["access_token"]
        assert admin_data["user"]["role"] == "admin"
        print("[PASS] Step 1: Admin seeded login passed.")

        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Check Admin Stats
        stats_res = client.get("/api/admin/stats", headers=admin_headers)
        assert stats_res.status_code == 200, f"Admin stats failed: {stats_res.text}"
        stats_data = stats_res.json()
        print(f"[PASS] Step 2: Admin stats passed. Total users: {stats_data['total_users']}, Total claims: {stats_data['total_claims']}")

        # 3. Check Admin Users List
        users_res = client.get("/api/admin/users", headers=admin_headers)
        assert users_res.status_code == 200, f"Admin users failed: {users_res.text}"
        users_list = users_res.json()
        assert len(users_list) >= 2
        print(f"[PASS] Step 3: Admin users list passed. Retrieved {len(users_list)} users.")

        # 4. User Registration (New citizen journalist)
        import time
        test_email = f"citizen.reporter.{int(time.time())}@truthshield.com"
        reg_res = client.post("/api/auth/register", json={
            "name": "Citizen Reporter",
            "email": test_email,
            "password": "password123"
        })
        assert reg_res.status_code == 200, f"User registration failed: {reg_res.text}"
        user_data = reg_res.json()

        user_token = user_data["access_token"]
        user_id = user_data["user"]["id"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        print("[PASS] Step 4: User registration & token generation passed.")

        # 5. User Profile & History (Empty or initial)
        profile_res = client.get("/api/user/profile", headers=user_headers)
        assert profile_res.status_code == 200, f"User profile failed: {profile_res.text}"
        profile = profile_res.json()
        assert "user" in profile and "stats" in profile
        print("[PASS] Step 5: User profile endpoint passed.")

        # 6. User submits an analysis claim with their auth token
        claim_payload = {
            "text": "Breaking news: New solar flare completely knocks out power grid in city.",
            "source_hint": "Twitter viral thread"
        }
        analyze_res = client.post("/api/analyze/text", json=claim_payload, headers=user_headers)
        assert analyze_res.status_code == 200, f"Analysis failed: {analyze_res.text}"
        analyzed_claim = analyze_res.json()
        print(f"[PASS] Step 6: Authenticated analysis submitted. Verdict: {analyzed_claim['classification']}")

        # 7. Check User History - should now contain the new claim!
        history_res = client.get("/api/user/history", headers=user_headers)
        assert history_res.status_code == 200
        user_history = history_res.json()
        assert len(user_history) >= 1
        assert any(h["id"] == analyzed_claim["id"] for h in user_history)
        print(f"[PASS] Step 7: User personal history verified with {len(user_history)} records.")

        # 8. Admin promotes the user to Admin role
        promote_res = client.put(f"/api/admin/users/{user_id}/role", json={
            "role": "admin",
            "is_active": True
        }, headers=admin_headers)
        assert promote_res.status_code == 200
        updated_user = promote_res.json()
        assert updated_user["role"] == "admin"
        print("[PASS] Step 8: Admin user privilege promotion passed.")

        # 9. Admin claim moderation - fetch claims list
        admin_claims_res = client.get("/api/admin/claims", headers=admin_headers)
        assert admin_claims_res.status_code == 200
        admin_claims = admin_claims_res.json()
        assert len(admin_claims) >= 1
        print(f"[PASS] Step 9: Admin claim moderation retrieval passed with {len(admin_claims)} claims.")

        # 10. Admin claim deletion
        claim_to_delete = admin_claims[0]["id"]
        del_res = client.delete(f"/api/admin/claims/{claim_to_delete}", headers=admin_headers)
        assert del_res.status_code == 200
        print("[PASS] Step 10: Admin claim deletion moderation passed.")

        # 11. Security validation - normal user cannot access admin endpoint
        demote_res = client.put(f"/api/admin/users/{user_id}/role", json={
            "role": "user",
            "is_active": True
        }, headers=admin_headers)
        assert demote_res.status_code == 200

        # Now regular user tries to call admin stats
        unauthorized_res = client.get("/api/admin/stats", headers=user_headers)
        assert unauthorized_res.status_code == 403, f"Expected 403 forbidden, got {unauthorized_res.status_code}"
        print("[PASS] Step 11: Role-based authorization security barrier passed (403 Forbidden).")

    print("\n[SUCCESS] ALL 11 AUTH, USER PANEL & ADMIN PANEL INTEGRATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_e2e_auth_tests()
