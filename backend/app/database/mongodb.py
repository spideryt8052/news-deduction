"""
MongoDB Connection Manager and Repository Layer for TruthShield
Replaces SQLite/PostgreSQL with MongoDB (Local & MongoDB Atlas Cloud)
"""

import os
import time
import logging
from typing import Optional, Dict, Any, List
import pymongo
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

logger = logging.getLogger("truthshield.mongodb")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None
_is_connected: bool = False
_connection_status: str = "initializing"

# In-memory document fallback store used when MongoDB Atlas is connecting or offline
_in_memory_store: Dict[str, List[Dict[str, Any]]] = {
    "users": [],
    "analysis_results": [],
    "reported_claims": [],
    "user_feedback": []
}


def get_mongodb_uri() -> str:
    """Retrieves MongoDB URI from environment or config."""
    from app.core.config import settings
    uri = (
        getattr(settings, "MONGODB_URI", "") 
        or os.environ.get("MONGODB_URI", "") 
        or getattr(settings, "DATABASE_URL", "")
    ).strip()

    if not uri or uri.startswith("sqlite") or uri.startswith("postgresql"):
        uri = "mongodb://localhost:27017"
    return uri


def get_mongodb_db_name() -> str:
    """Retrieves MongoDB database name."""
    from app.core.config import settings
    return (
        getattr(settings, "MONGODB_DATABASE", "") 
        or os.environ.get("MONGODB_DATABASE", "") 
        or "truthshield"
    ).strip()


def init_mongodb() -> Database:
    """
    Initializes connection to MongoDB (MongoDB Atlas or Local MongoDB).
    Sets up required collections and unique indexes.
    """
    global _client, _db, _is_connected, _connection_status

    uri = get_mongodb_uri()
    db_name = get_mongodb_db_name()

    logger.info(f"Connecting to MongoDB at: {uri.split('@')[-1] if '@' in uri else uri[:25]} (Database: {db_name})")

    try:
        # Connect with 3-second server selection timeout
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            socketTimeoutMS=5000,
            retryWrites=True
        )

        # Ping server to verify connectivity
        client.admin.command("ping")

        _client = client
        _db = client[db_name]
        _is_connected = True
        _connection_status = f"connected (MongoDB: {db_name})"
        logger.info(f"✅ Successfully connected to MongoDB Database: {db_name}")

        # Setup indexes for high performance and integrity
        try:
            _db.users.create_index("email", unique=True)
            _db.users.create_index("id", unique=True)
            _db.analysis_results.create_index("id", unique=True)
            _db.analysis_results.create_index("user_id")
            _db.analysis_results.create_index("created_at")
            _db.reported_claims.create_index("id", unique=True)
            _db.user_feedback.create_index("id", unique=True)
        except Exception as idx_err:
            logger.warning(f"Notice setting up MongoDB indexes: {idx_err}")

        # Seed initial bootstrap admin and demo accounts if users collection is empty
        _seed_initial_accounts(_db)

        return _db

    except (ServerSelectionTimeoutError, PyMongoError, Exception) as e:
        logger.warning(
            f"⚠️ MongoDB connection to '{uri[:35]}...' timed out or was unreachable ({e}). "
            "Activating resilient MongoDB In-Memory Adapter so the system remains 100% operational. "
            "To connect to live MongoDB, configure MONGODB_URI in backend/.env or your cloud environment."
        )
        _is_connected = False
        _connection_status = "fallback (In-Memory MongoDB Driver Active)"
        _seed_in_memory_accounts()
        return None


def get_mongo_db() -> Optional[Database]:
    """Returns the active MongoDB database instance if connected."""
    global _db
    if _db is None:
        init_mongodb()
    return _db


def get_mongo_client() -> Optional[MongoClient]:
    """Returns the MongoClient instance."""
    global _client
    return _client


def get_db_status() -> str:
    """Returns readable database status string for health endpoints."""
    global _connection_status
    return _connection_status


def _seed_initial_accounts(db: Database):
    """Seeds default demo accounts if collection is empty."""
    try:
        from app.core.security import hash_password
        if db.users.count_documents({}) == 0:
            demo_users = [
                {
                    "id": "admin-001",
                    "name": "TruthShield Administrator",
                    "email": "admin@truthshield.com",
                    "password_hash": hash_password("TruthShieldAdmin@2025"),
                    "role": "admin",
                    "is_active": True,
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                },
                {
                    "id": "user-001",
                    "name": "Verified Student User",
                    "email": "user@truthshield.com",
                    "password_hash": hash_password("TruthShield@2025"),
                    "role": "user",
                    "is_active": True,
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                },
                {
                    "id": "user-002",
                    "name": "Yaseen",
                    "email": "yaseenbrp25@gmail.com",
                    "password_hash": hash_password("TruthShield@2025"),
                    "role": "user",
                    "is_active": True,
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }
            ]
            db.users.insert_many(demo_users)
            logger.info("✅ Seeded initial demo accounts in MongoDB users collection.")
    except Exception as seed_err:
        logger.warning(f"Error seeding demo accounts: {seed_err}")


def _seed_in_memory_accounts():
    """Seeds in-memory store if empty."""
    from app.core.security import hash_password
    if len(_in_memory_store["users"]) == 0:
        demo_users = [
            {
                "id": "admin-001",
                "name": "TruthShield Administrator",
                "email": "admin@truthshield.com",
                "password_hash": hash_password("TruthShieldAdmin@2025"),
                "role": "admin",
                "is_active": True,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            {
                "id": "user-001",
                "name": "Verified Student User",
                "email": "user@truthshield.com",
                "password_hash": hash_password("TruthShield@2025"),
                "role": "user",
                "is_active": True,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            {
                "id": "user-002",
                "name": "Yaseen",
                "email": "yaseenbrp25@gmail.com",
                "password_hash": hash_password("TruthShield@2025"),
                "role": "user",
                "is_active": True,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        ]
        _in_memory_store["users"].extend(demo_users)
