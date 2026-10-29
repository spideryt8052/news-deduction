"""
TruthShield Semantic Vector Embeddings & Similarity Matching
Lead AI Developer: Aarti Vishwakarma (Roll No: 2501320140001)

Generates dense vector representations for claims and computes semantic similarity
across social media rumors to match previously verified fact-checks.
"""

import math
import re
from typing import List, Dict, Any, Tuple

class SemanticEmbeddingEngine:
    """Computes dense term-frequency vector representations and cosine metrics."""

    def __init__(self):
        self.stopwords = {
            "a", "an", "the", "in", "on", "at", "to", "for", "of", "with",
            "is", "are", "was", "were", "and", "or", "by", "that", "this", "it"
        }

    def tokenize(self, text: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", text.lower())
        return [w for w in words if w not in self.stopwords]

    def compute_embedding(self, text: str, vocabulary: List[str]) -> List[float]:
        """Maps text into a normalized term-frequency dense vector."""
        tokens = self.tokenize(text)
        vec = [tokens.count(w) for w in vocabulary]
        norm = math.sqrt(sum(v * v for v in vec))
        if norm == 0:
            return [0.0] * len(vocabulary)
        return [round(v / norm, 4) for v in vec]

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two unit vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        return round(max(0.0, min(1.0, dot)), 4)

    def find_nearest_neighbors(
        self, 
        query: str, 
        candidates: List[Dict[str, Any]], 
        top_k: int = 3,
        threshold: float = 0.20
    ) -> List[Tuple[float, Dict[str, Any]]]:
        """Ranks candidate claims by semantic similarity to query."""
        all_tokens = set(self.tokenize(query))
        for c in candidates:
            all_tokens.update(self.tokenize(c.get("claim", "")))
        vocab = sorted(list(all_tokens))

        query_vec = self.compute_embedding(query, vocab)
        scored = []
        for c in candidates:
            cand_vec = self.compute_embedding(c.get("claim", ""), vocab)
            sim = self.cosine_similarity(query_vec, cand_vec)
            if sim >= threshold:
                scored.append((sim, c))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:top_k]
