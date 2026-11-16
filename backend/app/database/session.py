"""
TruthShield Database Layer - Native MongoDB Session and Query Adapter
Provides MongoDB persistence (Local & Cloud Atlas) with seamless compatibility for FastAPI routes.
"""

import os
import uuid
import datetime
import logging
from typing import Optional, List, Dict, Any, Type
from sqlalchemy.orm import declarative_base

from app.database.mongodb import (
    init_mongodb,
    get_mongo_db,
    get_db_status,
    _in_memory_store
)

logger = logging.getLogger("truthshield.session")

# SQLAlchemy Declarative Base kept for model metadata and schema definitions
Base = declarative_base()


class MongoQuery:
    """Query builder executing queries against MongoDB collections."""

    def __init__(self, model_class: Type, session: "MongoSession"):
        self.model_class = model_class
        self.session = session
        self.collection_name = getattr(model_class, "__tablename__", "items")
        self._filter: Dict[str, Any] = {}
        self._sort: List[tuple] = []
        self._skip: int = 0
        self._limit: Optional[int] = None

    def filter(self, *criterion) -> "MongoQuery":
        for crit in criterion:
            if isinstance(crit, dict):
                self._filter.update(crit)
            elif hasattr(crit, "left") and hasattr(crit, "right"):
                # Handle SQLAlchemy binary expression (e.g., UserModel.email == '...')
                col_name = (
                    getattr(crit.left, "key", None)
                    or getattr(crit.left, "name", None)
                    or str(crit.left).split(".")[-1]
                )
                val = getattr(crit.right, "value", None)
                if val is None and hasattr(crit.right, "element"):
                    val = getattr(crit.right.element, "value", None)

                op_name = getattr(crit.operator, "__name__", "")
                if "eq" in op_name:
                    self._filter[col_name] = val
                elif "ne" in op_name:
                    self._filter[col_name] = {"$ne": val}
                elif "gt" in op_name:
                    self._filter[col_name] = {"$gt": val}
                elif "lt" in op_name:
                    self._filter[col_name] = {"$lt": val}
                else:
                    self._filter[col_name] = val
        return self

    def order_by(self, *criteria) -> "MongoQuery":
        for crit in criteria:
            if hasattr(crit, "element"):
                col = (
                    getattr(crit.element, "name", None)
                    or str(crit.element).split(".")[-1]
                )
                direction = -1 if "desc" in str(getattr(crit, "modifier", "desc")).lower() else 1
                self._sort.append((col, direction))
            elif isinstance(crit, str):
                self._sort.append((crit.lstrip("-"), -1 if crit.startswith("-") else 1))
        return self

    def offset(self, n: int) -> "MongoQuery":
        self._skip = max(0, n)
        return self

    def limit(self, n: int) -> "MongoQuery":
        self._limit = max(0, n)
        return self

    def count(self) -> int:
        db = get_mongo_db()
        if db is not None:
            try:
                coll = db[self.collection_name]
                return coll.count_documents(self._filter)
            except Exception as e:
                logger.warning(f"Mongo count failed: {e}")

        # Fallback in-memory count
        store = _in_memory_store.get(self.collection_name, [])
        return len(self._apply_in_memory_filter(store))

    def first(self) -> Optional[Any]:
        results = self.limit(1).all()
        return results[0] if results else None

    def all(self) -> List[Any]:
        db = get_mongo_db()
        raw_docs: List[Dict[str, Any]] = []

        if db is not None:
            try:
                coll = db[self.collection_name]
                cursor = coll.find(self._filter)
                if self._sort:
                    cursor = cursor.sort(self._sort)
                if self._skip:
                    cursor = cursor.skip(self._skip)
                if self._limit:
                    cursor = cursor.limit(self._limit)
                raw_docs = list(cursor)
            except Exception as e:
                logger.warning(f"Mongo query failed: {e}. Checking in-memory store...")
                store = _in_memory_store.get(self.collection_name, [])
                raw_docs = self._apply_in_memory_filter(store)
        else:
            store = _in_memory_store.get(self.collection_name, [])
            raw_docs = self._apply_in_memory_filter(store)

        return [self._doc_to_model(doc) for doc in raw_docs]

    def _apply_in_memory_filter(self, store: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        filtered = []
        for doc in store:
            match = True
            for k, v in self._filter.items():
                if isinstance(v, dict):
                    if "$ne" in v and doc.get(k) == v["$ne"]:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(doc)

        if self._sort:
            for col, direction in reversed(self._sort):
                filtered.sort(key=lambda d: d.get(col, "") or "", reverse=(direction == -1))

        if self._skip:
            filtered = filtered[self._skip:]
        if self._limit is not None:
            filtered = filtered[:self._limit]

        return filtered

    def _doc_to_model(self, doc: Dict[str, Any]) -> Any:
        """Converts a MongoDB BSON/dict document into a typed Model instance."""
        clean = dict(doc)
        clean.pop("_id", None)  # Remove internal Mongo ObjectId

        # Convert ISO strings to datetime if model expects datetime
        for k in ["created_at", "verified_at", "updated_at"]:
            if k in clean and isinstance(clean[k], str):
                try:
                    clean[k] = datetime.datetime.fromisoformat(clean[k].replace("Z", "+00:00"))
                except Exception:
                    clean[k] = datetime.datetime.utcnow()

        try:
            # Extract nested fields if any
            reasons_data = clean.pop("reasons", None)
            evidence_data = clean.pop("evidence", None)
            source_data = clean.pop("source_assessment", None)

            # Filter clean attributes to only recognized columns of the model
            model_attrs = {}
            if hasattr(self.model_class, "__table__"):
                for col in self.model_class.__table__.columns:
                    if col.name in clean:
                        model_attrs[col.name] = clean[col.name]
            else:
                model_attrs = clean

            instance = self.model_class(**model_attrs)

            # Re-attach child relationships
            if reasons_data is not None:
                from app.models.models import AnalysisReasonModel
                instance.reasons = [
                    AnalysisReasonModel(
                        result_id=instance.id,
                        reason_text=r if isinstance(r, str) else r.get("reason_text", ""),
                        order_index=i
                    )
                    for i, r in enumerate(reasons_data)
                ]

            if evidence_data is not None:
                from app.models.models import EvidenceModel
                instance.evidence = [
                    EvidenceModel(
                        result_id=instance.id,
                        title=e.get("title", ""),
                        url=e.get("url"),
                        snippet=e.get("snippet", ""),
                        stance=e.get("stance", "SUPPORTING"),
                        source_name=e.get("source_name", "Verified Registry")
                    )
                    for e in evidence_data
                ]

            if source_data is not None:
                from app.models.models import SourceAssessmentModel
                instance.source_assessment = SourceAssessmentModel(
                    result_id=instance.id,
                    source=source_data.get("source", ""),
                    credibility=source_data.get("credibility", ""),
                    details=source_data.get("details", "")
                )

            return instance
        except Exception as e:
            logger.warning(f"Error hydrating model {self.model_class.__name__}: {e}")
            # Dynamic attribute wrapper fallback
            class DynamicModel(self.model_class):
                def __init__(self, **kwargs):
                    for k, v in kwargs.items():
                        setattr(self, k, v)
            return DynamicModel(**clean)


class MongoSession:
    """MongoDB Session providing transactional and ORM-like interface for FastAPI routes."""

    def __init__(self):
        self._pending_add: List[Any] = []
        self._pending_delete: List[Any] = []

    def query(self, model_class: Type) -> MongoQuery:
        return MongoQuery(model_class, self)

    def add(self, instance: Any):
        if instance not in self._pending_add:
            self._pending_add.append(instance)

    def delete(self, instance: Any):
        if instance not in self._pending_delete:
            self._pending_delete.append(instance)

    def commit(self):
        db = get_mongo_db()

        # Process Deletions
        for instance in self._pending_delete:
            coll_name = getattr(instance, "__tablename__", "items")
            inst_id = getattr(instance, "id", None)
            if inst_id:
                if db is not None:
                    try:
                        db[coll_name].delete_one({"id": inst_id})
                    except Exception as e:
                        logger.error(f"Mongo delete failed: {e}")
                # Also remove from in-memory fallback store
                store = _in_memory_store.get(coll_name, [])
                _in_memory_store[coll_name] = [d for d in store if d.get("id") != inst_id]

        self._pending_delete.clear()

        # Process Additions / Updates
        for instance in self._pending_add:
            coll_name = getattr(instance, "__tablename__", "items")
            
            # Ensure instance has an ID
            if not getattr(instance, "id", None):
                setattr(instance, "id", str(uuid.uuid4()))

            doc: Dict[str, Any] = {}
            if hasattr(instance, "__table__"):
                for col in instance.__table__.columns:
                    val = getattr(instance, col.name, None)
                    if isinstance(val, (datetime.datetime, datetime.date)):
                        val = val.isoformat()
                    doc[col.name] = val
            else:
                for k, v in instance.__dict__.items():
                    if not k.startswith("_"):
                        if isinstance(v, (datetime.datetime, datetime.date)):
                            v = v.isoformat()
                        doc[k] = v

            # Serialize nested relationships if present
            if hasattr(instance, "reasons") and instance.reasons:
                doc["reasons"] = [
                    getattr(r, "reason_text", str(r)) for r in instance.reasons
                ]

            if hasattr(instance, "evidence") and instance.evidence:
                doc["evidence"] = [
                    {
                        "title": getattr(e, "title", ""),
                        "url": getattr(e, "url", ""),
                        "snippet": getattr(e, "snippet", ""),
                        "stance": getattr(e, "stance", "SUPPORTING"),
                        "source_name": getattr(e, "source_name", "")
                    }
                    for e in instance.evidence
                ]

            if hasattr(instance, "source_assessment") and instance.source_assessment:
                sa = instance.source_assessment
                doc["source_assessment"] = {
                    "source": getattr(sa, "source", ""),
                    "credibility": getattr(sa, "credibility", ""),
                    "details": getattr(sa, "details", "")
                }

            # Upsert into MongoDB
            if db is not None:
                try:
                    db[coll_name].replace_one({"id": doc["id"]}, doc, upsert=True)
                except Exception as e:
                    logger.error(f"Mongo upsert failed: {e}")

            # Also sync into in-memory fallback store
            store = _in_memory_store.setdefault(coll_name, [])
            store = [d for d in store if d.get("id") != doc["id"]]
            store.append(doc)
            _in_memory_store[coll_name] = store

        self._pending_add.clear()

    def refresh(self, instance: Any):
        inst_id = getattr(instance, "id", None)
        coll_name = getattr(instance, "__tablename__", "items")
        if not inst_id:
            return

        db = get_mongo_db()
        raw_doc = None
        if db is not None:
            try:
                raw_doc = db[coll_name].find_one({"id": inst_id})
            except Exception:
                pass

        if not raw_doc:
            store = _in_memory_store.get(coll_name, [])
            raw_doc = next((d for d in store if d.get("id") == inst_id), None)

        if raw_doc:
            clean = dict(raw_doc)
            clean.pop("_id", None)
            for k, v in clean.items():
                if isinstance(v, str) and ("-0" in v or "+0" in v or "T" in v):
                    try:
                        v = datetime.datetime.fromisoformat(v.replace("Z", "+00:00"))
                    except Exception:
                        pass
                setattr(instance, k, v)

    def rollback(self):
        self._pending_add.clear()
        self._pending_delete.clear()

    def close(self):
        self._pending_add.clear()
        self._pending_delete.clear()


def get_db():
    """FastAPI Dependency delivering active MongoSession."""
    session = MongoSession()
    try:
        yield session
    finally:
        session.close()


# Alias for compatibility with SQLAlchemy sessionmaker
SessionLocal = MongoSession


def init_db():
    """Initializes MongoDB database, collections, and indexes."""
    return init_mongodb()
