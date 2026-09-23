import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        print("=" * 65)
        print("TruthShield Phase 7: Database & API Test Suite")
        print("=" * 65)

        # 1. Health Endpoint
        r = client.get('/api/health')
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print(f"[PASS] 1. GET /api/health -> status={r.json()['status']}")

        # 2. Medical Myth -> Likely False
        r = client.post('/api/analyze/text', json={
            'text': 'BREAKING: Drinking boiled garlic water mixed with salt cures viral infections in 2 hours! Forward immediately!'
        })
        assert r.status_code == 200, f"Text failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Likely False", f"Expected Likely False, got {res['classification']}"
        assert len(res['evidence']) > 0, "Expected evidence items"
        print(f"[PASS] 2. Health Myth -> verdict='{res['classification']}', confidence={res['confidence']}")

        # 3. Sensational Clickbait -> Potentially Misleading
        r = client.post('/api/analyze/text', json={
            'text': 'SCIENTISTS SHOCKED: NASA confirms massive golden asteroid will hit Earth next Tuesday making everyone billionaires!'
        })
        assert r.status_code == 200, f"Text failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Potentially Misleading", f"Expected Potentially Misleading, got {res['classification']}"
        print(f"[PASS] 3. Asteroid Clickbait -> verdict='{res['classification']}', confidence={res['confidence']}")

        # 4. Official Report -> Likely Reliable
        r = client.post('/api/analyze/text', json={
            'text': 'The World Health Organization (WHO) has released an updated guideline on daily dietary sodium intake for adults.'
        })
        assert r.status_code == 200, f"Text failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Likely Reliable", f"Expected Likely Reliable, got {res['classification']}"
        print(f"[PASS] 4. Official Guideline -> verdict='{res['classification']}', confidence={res['confidence']}")

        # 5. Financial Hoax -> Likely False
        r = client.post('/api/analyze/text', json={
            'text': 'URGENT: Central bank announces complete currency ban and bank note invalidation starting midnight!'
        })
        assert r.status_code == 200, f"Text failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Likely False", f"Expected Likely False, got {res['classification']}"
        print(f"[PASS] 5. Financial Panic -> verdict='{res['classification']}', confidence={res['confidence']}")

        # 6. Ambiguous Claim -> Needs Further Verification
        r = client.post('/api/analyze/text', json={
            'text': 'A local shopkeeper in town said that the market will remain shut down for the next three days.'
        })
        assert r.status_code == 200, f"Text failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Needs Further Verification", f"Expected Needs Further Verification, got {res['classification']}"
        print(f"[PASS] 6. Ambiguous Rumor -> verdict='{res['classification']}', confidence={res['confidence']}")

        # 7. URL Verification: Trusted Authority
        r = client.post('/api/analyze/url', json={'url': 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'})
        assert r.status_code == 200, f"URL failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Likely Reliable"
        print(f"[PASS] 7. Verified URL -> verdict='{res['classification']}', source='{res['source_assessment']['source']}'")

        # 8. URL Verification: Satirical Site
        r = client.post('/api/analyze/url', json={'url': 'https://www.theonion.com/article-headline-satire'})
        assert r.status_code == 200, f"URL failed: {r.text}"
        res = r.json()
        assert res['classification'] == "Likely False"
        print(f"[PASS] 8. Satire URL -> verdict='{res['classification']}', credibility='{res['source_assessment']['credibility']}'")

        # 9. Image Upload Verification
        img_byte_arr = io.BytesIO()
        img = Image.new('RGB', (120, 120), color='purple')
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        files = {'file': ('test_flyer.png', img_byte_arr, 'image/png')}
        r = client.post('/api/analyze/image', files=files)
        assert r.status_code == 200, f"Image upload failed: {r.text}"
        print(f"[PASS] 9. Screenshot Upload -> verdict='{r.json()['classification']}', input_type='{r.json()['input_type']}'")

        # 10. Database Aggregated Stats Check
        r = client.get('/api/stats')
        assert r.status_code == 200, f"Stats failed: {r.text}"
        print(f"[PASS] 10. Database Stats -> total={r.json()['total_analyses']}, percentages={r.json()['breakdown_percentages']}")

        # 11. Database Query History Check
        r = client.get('/api/history')
        assert r.status_code == 200, f"History failed: {r.text}"
        history_list = r.json()
        assert len(history_list) > 0, "Expected persistent history records"
        print(f"[PASS] 11. Database History -> {len(history_list)} persistent records found in DB")

        # 12. Feedback Submission to Database
        sample_id = history_list[0]['id']
        r = client.post('/api/feedback', json={'result_id': sample_id, 'is_helpful': True, 'comments': 'Great explanation'})
        assert r.status_code == 200, f"Feedback failed: {r.text}"
        print(f"[PASS] 12. User Feedback -> status={r.json()['status']}")

        # 13. Crowdsourced Report Submission to Database
        r = client.post('/api/report', json={'claim': 'Novel viral message about electricity cut', 'platform': 'WhatsApp'})
        assert r.status_code == 200, f"Report failed: {r.text}"
        print(f"[PASS] 13. Crowdsourced Report -> report_id={r.json()['report_id']}")

        print("=" * 65)
        print("ALL 13 DATABASE PERSISTENCE & API TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)

if __name__ == "__main__":
    run_tests()
