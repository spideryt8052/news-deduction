"""
TruthShield Vector Database Setup & Ingestion Utility (ChromaDB)
Lead Developer: Soni (Roll No: 2501320140140) & Aarti Vishwakarma (Roll No: 2501320140001)

Initializes persistent vector storage for dense claim retrieval, nearest-neighbor matching,
and deduplication of viral rumors across social media platforms.
"""

import sys
from pathlib import Path

# Add project root and backend to python path
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
backend_dir = project_root / "backend"

sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))

from backend.app.services.vector_service import VectorService, HAS_CHROMADB

def setup_vector_store():
    print("=" * 70)
    print("TruthShield: Vector Database (ChromaDB) Setup & Ingestion")
    print(f"Native ChromaDB Engine Available: {HAS_CHROMADB}")
    print("=" * 70)

    vec_service = VectorService()
    stats_initial = vec_service.get_stats()
    print(f"Active Engine: {stats_initial['engine']}")
    print(f"Initial Collection Size: {stats_initial['total_indexed_claims']} claims")

    # Add diverse semantic claim clusters
    expanded_claims = [
        {
            "id": "exp-claim-101",
            "claim": "Drinking warm saltwater and lemon every 15 minutes eliminates viral particles from throat.",
            "category": "False-Fake",
            "classification": "Likely False",
            "source": "WHO Clinical Advisory",
            "verification_status": "REFUTED"
        },
        {
            "id": "exp-claim-102",
            "claim": "The Reserve Bank of India has extended the deadline for exchanging pre-2005 currency notes.",
            "category": "Real",
            "classification": "Likely Reliable",
            "source": "Reserve Bank of India Press Release",
            "verification_status": "SUPPORTED"
        },
        {
            "id": "exp-claim-103",
            "claim": "NASA James Webb Space Telescope detected alien megastructures around Proxima Centauri.",
            "category": "Misleading",
            "classification": "Potentially Misleading",
            "source": "NASA Astrophysical Journal",
            "verification_status": "MISLEADING_CONTEXT"
        },
        {
            "id": "exp-claim-104",
            "claim": "Ministry of Finance is offering 50,000 rupees direct cash grant to all citizens via WhatsApp link.",
            "category": "False-Fake",
            "classification": "Likely False",
            "source": "PIB Fact Check Bureau",
            "verification_status": "REFUTED"
        }
    ]

    print("\n[1/2] Indexing Expanded Benchmark Claims into Vector Space...")
    for item in expanded_claims:
        vec_service.index_claim(
            claim_id=item["id"],
            claim_text=item["claim"],
            metadata={
                "category": item["category"],
                "classification": item["classification"],
                "source": item["source"],
                "verification_status": item["verification_status"]
            }
        )
        print(f"  + Indexed [{item['category']}]: '{item['claim'][:60]}...'")

    # Perform Verification Query
    print("\n[2/2] Validating Semantic Nearest-Neighbor Retrieval...")
    test_queries = [
        "does drinking hot lemon water kill respiratory viruses?",
        "urgent notice central bank giving free 50000 rupees to everyone"
    ]

    for q in test_queries:
        print(f"\nQuery: '{q}'")
        results = vec_service.search_similar_claims(q, top_k=2, threshold=0.15)
        for idx, match in enumerate(results, 1):
            print(f"  Match {idx}: [Similarity: {match['similarity_score']:.3f}] - {match['claim_text']}")
            print(f"           Verdict: {match['metadata'].get('classification')} | Source: {match['metadata'].get('source')}")

    stats_final = vec_service.get_stats()
    print("\n" + "=" * 70)
    print("VECTOR STORE SETUP STATUS:")
    print(f"  - Active Collection:   {stats_final['collection_name']}")
    print(f"  - Total Stored Claims: {stats_final['total_indexed_claims']}")
    print(f"  - Engine Type:         {stats_final['engine']}")
    print("CHROMA / VECTOR STORE INITIALIZATION SUCCEEDED!")
    print("=" * 70)

if __name__ == "__main__":
    setup_vector_store()
