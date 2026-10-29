# TruthShield: Database & Persistence Layer

**Layer Responsibility:** Database & Persistence Engineering  
**Lead Developer:** **Soni** (University Roll No: `2501320140140`)  
**Architecture Lead:** **Yaseen Jamshed** (University Roll No: `2501320140158`)  
**Project Supervisor:** **Dr. Saumya Chaturvedi**, Associate Professor, DCA, GNIOT  
**Affiliated University:** Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow  

---

## 📌 Architecture Overview

TruthShield implements an auditable, dual-persistence data architecture combining:
1. **Relational Database (PostgreSQL / SQLite):** Managed via SQLAlchemy 2.0 ORM with full ACID compliance, transactional integrity, and normalized relational traceability.
2. **Vector Database (ChromaDB):** High-dimensional dense vector embeddings for sub-second semantic nearest-neighbor retrieval and claim deduplication across social channels.

```
+--------------------------------------------------------------------------------+
|                           TruthShield Persistence Layer                        |
+--------------------------------------------------------------------------------+
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────────────┐   ┌────────────────────────────────────┐
│      Relational Storage Engine        │   │       Vector Storage Engine        │
│   (PostgreSQL 16 / SQLite Engine)     │   │   (ChromaDB Dense Claim Vectors)   │
├───────────────────────────────────────┤   ├────────────────────────────────────┤
│ • users                               │   │ • truthshield_claims Collection    │
│ • posts                               │   │ • Semantic Cosine Search           │
│ • claims                              │   │ • Cross-lingual Claim Deduplication│
│ • sources                             │   │ • In-Memory TF-IDF Fallback Engine │
│ • verification_records                │   └────────────────────────────────────┘
│ • classifications                     │
│ • engagement_records                  │
│ • user_alerts                         │
│ • analysis_results & evidence_items   │
└───────────────────────────────────────┘
```

---

## 🗄️ Relational Schema (Paper Table 2 Specification)

Strictly aligned with **Section 5 (Table 2)** of the submitted research paper:

| Table Name | Primary Key | Foreign Keys | Description & Traceability |
|---|---|---|---|
| `users` | `id` (UUID) | None | Submitting user profile or researcher account. |
| `posts` | `id` (UUID) | `user_id` $\to$ `users.id` | Social media post, origin platform, headline, and media modality. |
| `claims` | `id` (UUID) | `post_id` $\to$ `posts.id` | Atomic, verifiable factual assertion extracted from the post. |
| `sources` | `id` (UUID) | None | Verified authorities (WHO, PIB, RBI) and fact-check bureaus (IFCN). |
| `verification_records` | `id` (UUID) | `claim_id`, `source_id` | Foreign-key junction linking claims to sources with stance flags. |
| `classifications` | `id` (UUID) | `post_id` $\to$ `posts.id` | 3-tier verdict (`Real`, `Misleading`, `False-Fake`) & calibrated confidence. |
| `engagement_records` | `id` (UUID) | `post_id` $\to$ `posts.id` | Virality telemetry (likes, shares, comments). |
| `user_alerts` | `id` (UUID) | `post_id` $\to$ `posts.id` | Contextual explanation and pre-share behavioral nudge. |

---

## 📁 Folder Contents

- **`schema.sql`**: Complete PostgreSQL DDL script defining all tables, indexes, unique constraints, and cascade delete rules.
- **`seed_data.sql`**: Reference SQL dataset pre-populating verified institutional agencies, accredited fact-checkers, known satire domains, and sample verified claims.
- **`init_db.py`**: Standalone Python script to initialize SQLAlchemy tables, run schema inspection, and seed reference records.
- **`chroma_setup.py`**: Script to initialize the ChromaDB vector database collection, generate embeddings, and validate semantic search.
- **`manage_db.bat`**: One-click Windows utility script to initialize, seed, or inspect database status.

---

## 🚀 How to Run and Initialize

### 1. Initialize Local SQLite (Default / Viva Demo)
```bash
python init_db.py sqlite:///../misinfo_app.db
```

### 2. Initialize PostgreSQL (Docker or Production)
```bash
python init_db.py postgresql://postgres:postgres@localhost:5432/misinfo_db
```

### 3. Setup ChromaDB Vector Store
```bash
python chroma_setup.py
```

### 4. Or use the 1-Click Batch Manager
Double-click `manage_db.bat` or run:
```cmd
manage_db.bat
```
