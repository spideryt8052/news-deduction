from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.database.session import init_db, SessionLocal
from app.services.db_service import DatabaseService
from app.api.routes_analyze import router as analyze_router
from app.api.routes_history import router as history_router
from app.api.routes_meta import router as meta_router
from app.api.routes_auth import router as auth_router
from app.api.routes_admin import router as admin_router
from app.api.routes_user import router as user_router
from app.api.routes_chat import router as chat_router
from app.api.routes_omnivoice import router as omnivoice_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables & Seed Prototype Data
    init_db()
    db = SessionLocal()
    try:
        DatabaseService.seed_initial_records(db)
    finally:
        db.close()
    yield

# Ensure tables exist immediately
init_db()

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
    description="""
    ## TruthShield: Social Media & Misleading Information Platform API
    
    An explainable, AI-assisted credibility assessment and digital literacy platform for detecting and analyzing potentially misleading information across social media.
    
    ### Core Capabilities:
    * **Multi-Modal Verification:** Ingests raw text, news URLs, and screenshot images.
    * **Claim Isolation & Source Assessment:** Cross-references domain authority and known fact-checkers.
    * **Explanation-First Reports:** Returns rationale and recommendations instead of binary true/false judgments.
    * **Database Persistence:** Transactional records stored via SQLAlchemy 2.0 (PostgreSQL / SQLite).
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Analysis", "description": "Endpoints for text, URL, and screenshot credibility evaluation."},
        {"name": "History & Analytics", "description": "Aggregated verification metrics and persistent logs."},
        {"name": "System & Community", "description": "Health checks, user feedback, and crowdsourced reporting."},
    ]
)

# Configure CORS Middleware
# Explicitly support localhost and 127.0.0.1 on any port (Vite, Next, mobile preview, etc.)
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173"
]
for _o in settings.CORS_ORIGINS:
    if _o != "*" and _o not in _allowed_origins:
        _allowed_origins.append(_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|.*\.trycloudflare\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Input validation failed. Please inspect the request format.",
            "details": exc.errors()
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "status_code": exc.status_code,
            "detail": exc.detail
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "The verification pipeline encountered an unexpected issue. Please retry.",
            "detail": str(exc)
        }
    )

# Register Sub-routers
app.include_router(analyze_router)
app.include_router(history_router)
app.include_router(meta_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(omnivoice_router)
