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
    
    MCA Project (2025–2027) submitted at Greater Noida Institute of Technology (GNIOT)
    affiliated with Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow.
    
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
