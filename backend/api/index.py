import sys
import os
from fastapi import Request

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

@app.middleware("http")
async def vercel_asgi_path_fix(request: Request, call_next):
    # Vercel sends the client-requested URL in x-matched-path or x-forwarded-uri
    original_path = (
        request.headers.get("x-matched-path") 
        or request.headers.get("x-forwarded-uri")
        or ""
    ).split("?")[0].strip()

    current_path = request.scope.get("path", "")

    if original_path and original_path != current_path:
        request.scope["path"] = original_path
    elif current_path in ("/api/index.py", "/api/index"):
        request.scope["path"] = "/"

    return await call_next(request)

@app.get("/api/index.py", include_in_schema=False)
@app.get("/api", include_in_schema=False)
async def vercel_root_fallback():
    return {
        "status": "online",
        "service": "TruthShield Backend API",
        "message": "TruthShield Backend API is running successfully on Vercel!",
        "docs": "/docs",
        "health": "/api/health"
    }
