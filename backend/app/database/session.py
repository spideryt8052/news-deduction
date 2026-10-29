import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Determine database engine
db_url = settings.DATABASE_URL

# For SQLite, enable check_same_thread=False
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI Dependency for transactional database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes schema and tables in PostgreSQL or SQLite with automatic column upgrade."""
    import app.models.models  # ensure models are registered
    Base.metadata.create_all(bind=engine)

    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if "users" in tables:
            user_cols = [c["name"] for c in inspector.get_columns("users")]
            with engine.connect() as conn:
                if "password_hash" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                if "role" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
                if "is_active" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                conn.commit()

        if "analysis_results" in tables:
            analysis_cols = [c["name"] for c in inspector.get_columns("analysis_results")]
            with engine.connect() as conn:
                if "user_id" not in analysis_cols:
                    conn.execute(text("ALTER TABLE analysis_results ADD COLUMN user_id VARCHAR(36)"))
                conn.commit()
    except Exception:
        pass

