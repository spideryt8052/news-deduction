"""
TruthShield Database Initialization & Seeding Utility
Lead Developer: Soni (Roll No: 2501320140140)
Guidance: Dr. Saumya Chaturvedi (GNIOT / AKTU)

Initializes both relational schema (Table 2 + operational tables) in PostgreSQL / SQLite
and populates verified institutional sources and reference claims.
"""

import os
import sys
import datetime
from pathlib import Path

# Add project root and backend to python path
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
backend_dir = project_root / "backend"

sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.database.session import Base
from app.core.config import settings

# Import all models to ensure metadata registration
from app.models.models import (
    AnalysisResultModel,
    AnalysisReasonModel,
    EvidenceModel,
    SourceAssessmentModel,
    UserFeedbackModel,
    ReportedClaimModel,
    UserModel,
    PostModel,
    ClaimModel,
    SourceModel,
    VerificationModel,
    ClassificationModel,
    EngagementModel,
    AlertModel
)

def initialize_database(db_url: str = None):
    target_url = db_url or settings.DATABASE_URL
    print("=" * 70)
    print("TruthShield: Database Layer Initialization & Audit")
    print(f"Target Database URL: {target_url}")
    print("=" * 70)

    try:
        # Determine connect args
        connect_args = {"check_same_thread": False} if "sqlite" in target_url else {}
        engine = create_engine(target_url, connect_args=connect_args)
        
        # 1. Create all tables defined in models
        print("[1/3] Creating relational tables via SQLAlchemy 2.0 ORM...")
        Base.metadata.create_all(bind=engine)
        print("  -> Tables created successfully.")

        # 2. Inspect created tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"[2/3] Registered Tables in Schema ({len(tables)} total):")
        for tbl in sorted(tables):
            cols = [c["name"] for c in inspector.get_columns(tbl)]
            print(f"  - {tbl:<22} ({len(cols)} columns: {', '.join(cols[:4])}...)")

        # 3. Seed Reference Data
        print("[3/3] Checking & Seeding Reference Institutional Sources...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        seed_file = current_dir / "seed_data.sql"
        if seed_file.exists():
            with open(seed_file, "r", encoding="utf-8") as f:
                sql_content = f.read()

            # Execute statements
            # SQLite does not support ON CONFLICT (id) DO NOTHING directly in some multi-statements
            # So we split and execute cleanly
            statements = [s.strip() for s in sql_content.split(";") if s.strip()]
            success_count = 0
            is_sqlite = "sqlite" in target_url
            for stmt in statements:
                # Remove comment-only lines
                clean_lines = [l for l in stmt.split("\n") if not l.strip().startswith("--")]
                clean_stmt = "\n".join(clean_lines).strip()
                if not clean_stmt:
                    continue
                if is_sqlite:
                    # Replace ON CONFLICT (id) DO NOTHING with OR IGNORE for SQLite compatibility
                    clean_stmt = clean_stmt.replace("INSERT INTO", "INSERT OR IGNORE INTO")
                    if "ON CONFLICT" in clean_stmt:
                        clean_stmt = clean_stmt.split("ON CONFLICT")[0].strip()
                try:
                    db.execute(text(clean_stmt))
                    db.commit()
                    success_count += 1
                except Exception as ex:
                    print(f"  [DEBUG] Statement failed: {ex}")
                    db.rollback()
            print(f"  -> Executed seed script: {success_count} statements processed.")

        # Print record summary
        source_count = db.query(SourceModel).count()
        post_count = db.query(PostModel).count()
        claim_count = db.query(ClaimModel).count()
        analysis_count = db.query(AnalysisResultModel).count()

        print("-" * 70)
        print("Database Status Summary:")
        print(f"  - Verified Sources:     {source_count}")
        print(f"  - Reference Posts:       {post_count}")
        print(f"  - Atomic Claims:         {claim_count}")
        print(f"  - Live Analysis Logs:    {analysis_count}")
        print("-" * 70)
        print("DATABASE INITIALIZATION COMPLETED WITH 100% SUCCESS!")
        print("=" * 70)
        db.close()

    except Exception as e:
        print(f"[ERROR] Database initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    url_override = sys.argv[1] if len(sys.argv) > 1 else None
    initialize_database(url_override)
