# System Architecture — Social Media & Misleading Information

## Overview
This platform implements an AI-assisted credibility assessment and digital literacy system developed as an MCA project under Dr. A.P.J. Abdul Kalam Technical University (AKTU) guidelines by Greater Noida Institute of Technology (GNIOT).

## Architectural Diagram

```
[ User Input (Text / URL / Image) ]
                 │
                 ▼
      [ React 18 + Vite Frontend ]
                 │ (REST API via Axios)
                 ▼
       [ FastAPI Core Gateway ]
                 │
        ┌────────┴──────────────────────────┐
        ▼                                   ▼
 [ Pipeline Orchestrator ]         [ PostgreSQL / SQLite ]
        │                             - analysis_results
        ├─ 1. Text Preprocessor       - claims
        ├─ 2. Claim Extractor         - sources
        ├─ 3. Source Verifier         - evidence_items
        ├─ 4. AI/LLM Analyzer         - user_feedback
        └─ 5. Nudge Generator
```

## Layered Design
1. **Presentation Layer (`frontend/`):** React 18, Tailwind CSS, Lucide Icons, Recharts, and interactive Canvas/CSS 3D Earth visualization.
2. **Gateway & API Layer (`backend/app/api/`):** Asynchronous FastAPI routes with Pydantic v2 validation.
3. **Intelligence Layer (`backend/app/services/`):** Pluggable analysis engine supporting offline heuristic mock analyzer and online LLM-based verification (Groq Llama-3 / OpenAI).
4. **Data Layer (`backend/app/database/`):** SQLAlchemy ORM models with dual-support for PostgreSQL and local SQLite.
5. **Mobile Extension (`mobile/`):** React Native + Expo app consuming the same REST API contracts.
