import math
import re
from typing import List, Dict, Any, Optional

try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False


class VectorService:
    """Semantic Vector Storage & Retrieval Service.
    
    Supports ChromaDB for dense vector embeddings and persistent nearest-neighbor
    search on social media claims. Automatically falls back to a high-speed in-memory
    TF-IDF / Cosine vector similarity engine when ChromaDB package is not installed.
    """

    _instance = None
    _chroma_client = None
    _chroma_collection = None
    _memory_store: List[Dict[str, Any]] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initializes ChromaDB or the embedded fallback vector engine."""
        self._memory_store = []
        if HAS_CHROMADB:
            try:
                self._chroma_client = chromadb.Client(Settings(anonymized_telemetry=False))
                self._chroma_collection = self._chroma_client.get_or_create_collection(
                    name="truthshield_claims",
                    metadata={"description": "Verified social media claims and fact-check vectors"}
                )
                self.engine_type = "ChromaDB (Dense Vector Store)"
            except Exception:
                self.engine_type = "In-Memory Vector Engine (TF-IDF Cosine)"
        else:
            self.engine_type = "In-Memory Vector Engine (TF-IDF Cosine)"

        # Seed with initial factual clusters
        self._seed_reference_claims()

    def _seed_reference_claims(self):
        """Seeds reference verified claims for instant similarity lookup."""
        seeds = [
            {
                "id": "ref-claim-001",
                "claim": "Drinking boiled garlic water or herbal infusions cures viral respiratory infections in hours.",
                "category": "False-Fake",
                "classification": "Likely False",
                "source": "World Health Organization Mythbusters",
                "verification_status": "REFUTED"
            },
            {
                "id": "ref-claim-002",
                "claim": "Central banking authority announces emergency ban, currency invalidation, or free lottery grant.",
                "category": "False-Fake",
                "classification": "Likely False",
                "source": "RBI / PIB Fact Check",
                "verification_status": "REFUTED"
            },
            {
                "id": "ref-claim-003",
                "claim": "World Health Organization recommends daily sodium intake of less than 2000 mg for adults.",
                "category": "Real",
                "classification": "Likely Reliable",
                "source": "WHO Official Dietary Guidelines",
                "verification_status": "SUPPORTED"
            },
            {
                "id": "ref-claim-004",
                "claim": "NASA confirmed a golden asteroid will collide with Earth and make citizens billionaires.",
                "category": "Misleading",
                "classification": "Potentially Misleading",
                "source": "NASA Planetary Defense Coordination Office",
                "verification_status": "MISLEADING_CONTEXT"
            },
            {
                "id": "ref-claim-005",
                "claim": "5G mobile network radiation causes viral transmission and immune deficiency.",
                "category": "False-Fake",
                "classification": "Likely False",
                "source": "Federal Communications Commission & WHO",
                "verification_status": "REFUTED"
            }
        ]

        for s in seeds:
            self.index_claim(
                claim_id=s["id"],
                claim_text=s["claim"],
                metadata={
                    "category": s["category"],
                    "classification": s["classification"],
                    "source": s["source"],
                    "verification_status": s["verification_status"]
                }
            )

    def _tokenize(self, text: str) -> List[str]:
        """Simple alphanumeric tokenizer with stopword suppression."""
        stopwords = {
            "a", "an", "the", "in", "on", "at", "to", "for", "of", "with",
            "is", "are", "was", "were", "and", "or", "by", "that", "this", "it"
        }
        words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", text.lower())
        return [w for w in words if w not in stopwords]

    def _compute_cosine_similarity(self, text_a: str, text_b: str) -> float:
        """Computes term-frequency cosine vector similarity."""
        tokens_a = self._tokenize(text_a)
        tokens_b = self._tokenize(text_b)
        if not tokens_a or not tokens_b:
            return 0.0

        all_words = set(tokens_a).union(set(tokens_b))
        vec_a = [tokens_a.count(w) for w in all_words]
        vec_b = [tokens_b.count(w) for w in all_words]

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def index_claim(self, claim_id: str, claim_text: str, metadata: Optional[Dict[str, Any]] = None):
        """Indexes a claim into the vector store."""
        meta = metadata or {}
        # Always maintain in memory store for fallback
        # Check if already exists
        self._memory_store = [item for item in self._memory_store if item["id"] != claim_id]
        self._memory_store.append({
            "id": claim_id,
            "text": claim_text,
            "metadata": meta
        })

        if HAS_CHROMADB and self._chroma_collection:
            try:
                # Format metadata values to string/int/float for ChromaDB
                clean_meta = {k: str(v) for k, v in meta.items()}
                self._chroma_collection.upsert(
                    ids=[claim_id],
                    documents=[claim_text],
                    metadatas=[clean_meta]
                )
            except Exception:
                pass

    def search_similar_claims(
        self, 
        query_text: str, 
        top_k: int = 3, 
        threshold: float = 0.25
    ) -> List[Dict[str, Any]]:
        """Performs nearest-neighbor semantic search for related claims."""
        if HAS_CHROMADB and self._chroma_collection:
            try:
                results = self._chroma_collection.query(
                    query_texts=[query_text],
                    n_results=top_k
                )
                formatted = []
                if results and "ids" in results and results["ids"]:
                    ids = results["ids"][0]
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    distances = results["distances"][0] if "distances" in results and results["distances"] else [0.2] * len(ids)

                    for cid, doc, meta, dist in zip(ids, docs, metas, distances):
                        sim = max(0.0, 1.0 - (dist if dist is not None else 0.5))
                        if sim >= threshold:
                            formatted.append({
                                "claim_id": cid,
                                "claim_text": doc,
                                "similarity_score": round(sim, 3),
                                "metadata": meta
                            })
                    if formatted:
                        return formatted
            except Exception:
                pass

        # Fallback in-memory cosine similarity search
        scored: List[Dict[str, Any]] = []
        for item in self._memory_store:
            score = self._compute_cosine_similarity(query_text, item["text"])
            if score >= threshold:
                scored.append({
                    "claim_id": item["id"],
                    "claim_text": item["text"],
                    "similarity_score": round(score, 3),
                    "metadata": item["metadata"]
                })

        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """Returns vector collection statistics and active engine details."""
        chroma_count = 0
        if HAS_CHROMADB and self._chroma_collection:
            try:
                chroma_count = self._chroma_collection.count()
            except Exception:
                chroma_count = 0

        return {
            "engine": self.engine_type,
            "has_native_chromadb": HAS_CHROMADB,
            "total_indexed_claims": max(len(self._memory_store), chroma_count),
            "collection_name": "truthshield_claims"
        }
