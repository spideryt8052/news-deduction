# API Documentation

## Base URL
- Local Development: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Endpoints

### 1. Health & Status
- **`GET /api/health`**
  - Returns service status, active database mode, and AI analyzer mode.

### 2. Analysis Endpoints
- **`POST /api/analyze/text`**
  - Request: `{"text": "...", "source_hint": "WhatsApp forward"}`
  - Response: Structured analysis object with classification, confidence, reasons, evidence, source assessment.
- **`POST /api/analyze/url`**
  - Request: `{"url": "https://example.com/news-story"}`
  - Response: Content extraction metadata + full analysis object.
- **`POST /api/analyze/image`**
  - Request: `multipart/form-data` with `file: UploadFile`
  - Response: OCR extracted text + full analysis object.

### 3. History & Query
- **`GET /api/results/{id}`**
  - Fetch previous analysis by UUID.
- **`GET /api/history`**
  - Query parameters: `limit` (default 20), `offset` (default 0).
- **`GET /api/stats`**
  - Aggregated classification counts and statistics for charts.

### 4. Feedback & Community
- **`POST /api/feedback`**
  - Request: `{"result_id": "...", "is_helpful": true, "comments": "..."}`
- **`POST /api/report`**
  - Request: `{"claim": "...", "platform": "Instagram", "url": "..."}`
