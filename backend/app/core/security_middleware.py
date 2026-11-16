"""
TruthShield Security & Defense Middleware
Protects against DoS, brute-force credential stuffing, clickjacking, MIME sniffing, and information disclosure.
"""

import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects industry-standard OWASP HTTP security headers into every response."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window IP-based rate limiting to prevent DoS attacks, 
    credential stuffing, and automated OTP / API quota abuse.
    """
    def __init__(self, app):
        super().__init__(app)
        # Store: { ip: [timestamp1, timestamp2, ...] }
        self._ip_history = defaultdict(list)
        # Store for sensitive endpoints: { ip: [timestamp1, ...] }
        self._auth_history = defaultdict(list)
        self._last_cleanup = time.time()

    def _cleanup_old_records(self, now: float):
        """Purge entries older than 120 seconds to prevent unbounded memory growth."""
        if now - self._last_cleanup < 60:
            return
        self._last_cleanup = now
        cutoff = now - 120

        for d in (self._ip_history, self._auth_history):
            expired_keys = []
            for ip, timestamps in d.items():
                d[ip] = [t for t in timestamps if t > cutoff]
                if not d[ip]:
                    expired_keys.append(ip)
            for k in expired_keys:
                d.pop(k, None)

    async def dispatch(self, request: Request, call_next):
        # Exempt health check and documentation endpoints from strict limits
        path = request.url.path
        if path in ("/api/health", "/docs", "/openapi.json", "/redoc", "/"):
            return await call_next(request)

        # Extract client IP (respecting forward headers from cloud proxies)
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or request.client.host
            if request.client
            else "unknown"
        )

        now = time.time()
        self._cleanup_old_records(now)

        # 1. Sensitive Endpoint Guard (Auth & OTP endpoints: max 20 requests per minute)
        if path.startswith("/api/auth"):
            auth_timestamps = [t for t in self._auth_history[client_ip] if now - t < 60]
            if len(auth_timestamps) >= 20:
                logger.warning(f"🚨 [Security] Rate limit exceeded on auth endpoint by IP {client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Too Many Requests",
                        "message": "Too many requests to authentication services. Please wait 60 seconds before trying again.",
                        "retry_after_seconds": 60
                    },
                    headers={"Retry-After": "60"}
                )
            auth_timestamps.append(now)
            self._auth_history[client_ip] = auth_timestamps

        # 2. Global Rate Limit (Max 150 requests per minute per IP)
        timestamps = [t for t in self._ip_history[client_ip] if now - t < 60]
        if len(timestamps) >= 150:
            logger.warning(f"🚨 [Security] Global rate limit exceeded by IP {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": "Global request quota reached. Please slow down.",
                    "retry_after_seconds": 60
                },
                headers={"Retry-After": "60"}
            )

        timestamps.append(now)
        self._ip_history[client_ip] = timestamps

        return await call_next(request)
