# TruthShield: Comprehensive Viva Voce Defense & Project Presentation Guide

> **Project Title:** Social Media & Misleading Information (*TruthShield*)  
> **Degree:** Master of Computer Applications (MCA), Batch 2025–2027  
> **Course:** MCA Major Project (Code: KCA-451 / Mini Project KCA-351)  
> **Institution:** Greater Noida Institute of Technology (GNIOT), Knowledge Park II, Greater Noida (College Code: 132)  
> **Affiliated University:** Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow, Uttar Pradesh  
> **Project Supervisor / Guide:** **Dr. Saumya Chaturvedi**, Associate Professor, Department of Computer Application  
> **Student Authors:**  
> • **Yaseen Jamshed** (Roll No: `2501320140158`) — Backend Core & Architecture  
> • **Vandana** (Roll No: `2501320140151`) — Frontend Engineering & UI/UX  
> • **Aarti Vishwakarma** (Roll No: `2501320140001`) — AI & Machine Learning Layer  
> • **Soni** (Roll No: `2501320140140`) — Database & Persistence Layer  

---

## 📑 Table of Contents
1. [Executive Summary for Examiners](#1-executive-summary-for-examiners)
2. [Team Division & Individual Defense Speeches](#2-team-division--individual-defense-speeches)
3. [The 6-Stage Analysis Pipeline in Detail](#3-the-6-stage-analysis-pipeline-in-detail)
4. [Core Architectural Invariants](#4-core-architectural-invariants)
5. [20 Frequent Examiner Questions & Model Answers](#5-20-frequent-examiner-questions--model-answers)
6. [Step-by-Step Live Viva Demonstration Script](#6-step-by-step-live-viva-demonstration-script)
7. [Viva Day Emergency & Offline Checklist](#7-viva-day-emergency--offline-checklist)

---

## 1. Executive Summary for Examiners

TruthShield is an explanation-first, multi-modal credibility verification and digital literacy ecosystem designed to curb the viral spread of misleading claims on social networks (WhatsApp, Instagram, X/Twitter, Facebook).

### Why Traditional Systems Fail:
- **Binary Oversimplification:** Real-world rumors are rarely 100% false; they are usually authentic facts placed in deceptive, outdated, or exaggerated contexts. Binary "True / False" flags trigger user defensiveness and psychological backlash.
- **Deceptive Accuracy Claims:** Claims of "94% accurate AI" without an active, published benchmark test set mislead end users. TruthShield explicitly rejects fake accuracy metrics and instead computes calibrated *AI Assessment Confidence* (`0.50 – 0.98`).
- **Absence of Pedagogical Value:** TruthShield does not act as an authoritarian arbiter of truth. It pairs every evaluation with educational nudges (*The 30-Second Rule*) and stance-tagged citations to cultivate critical thinking.

---

## 2. Team Division & Individual Defense Speeches

*Use these structured 45-second introductory statements when the examiner asks each student to explain their individual contribution:*

### 👨‍💻 Yaseen Jamshed (Roll No: 2501320140158) — Backend Core & Architecture
> *"Good morning respected examiners. I was responsible for the core architecture and backend engineering of TruthShield. I designed our asynchronous FastAPI gateway on Python 3.13, adhering to Pydantic v2 schemas and REST standards. I developed the `SourceVerifier` module which performs domain reputation checks, IFCN fact-checking registry lookups, SSRF protection to block private IP exploitation, and typosquatting detection for imposter domains. I also engineered the `EvidenceEngine` for stance classification (`SUPPORTING`, `REFUTING`, `CONTEXTUAL`), the multi-modal upload endpoints, and wrote our automated 35-test integration suite."*

### 👩‍💻 Vandana (Roll No: 2501320140151) — Frontend Engineering & UI/UX
> *"Respected examiners, I led the frontend architecture and user experience of TruthShield. Built with React 18, Vite, and Tailwind CSS, the interface is designed to wow users while prioritizing explanation-first clarity. I developed our responsive design system across 6 viewport breakpoints (from 360px mobile to 1440px desktop), our custom SVG circular `ConfidenceMeter`, interactive Recharts analytics on the dashboard, and a lightweight 3D HTML5 Canvas interactive Globe visual featuring depth-scaled orbiting media tokens. I also built the 8-principle digital literacy workbench and crowdsourced reporting interface."*

### 👩‍💻 Aarti Vishwakarma (Roll No: 2501320140001) — AI & Machine Learning Layer
> *"Good morning sir/ma'am. I developed the AI & Machine Learning layer of TruthShield. I implemented a pluggable provider abstraction supporting Groq Llama-3, OpenAI GPT-4o, and Anthropic Claude 3.5 Sonnet using LangChain-style structured prompt engineering. To ensure 100% system resilience during viva evaluations and network outages, I designed our dual-mode fallback architecture: if an external AI API fails or runs out of credits, our calibrated Heuristic Knowledge-Base automatically takes over. I also engineered our confidence calibration algorithm that balances linguistic indicators (all-caps ratios, urgency markers) with empirical corroboration."*

### 👩‍💻 Soni (Roll No: 2501320140140) — Database & Persistence Layer
> *"Respected examiners, I was responsible for the database architecture and persistence layer. I designed our relational schema using SQLAlchemy 2.0 ORM, structuring 6 core entities: `analysis_results`, `analysis_reasons`, `evidence_items`, `source_assessments`, `user_feedback`, and `reported_claims`. To ensure zero-configuration deployment and offline reliability, I implemented a dual-engine architecture: the system auto-initializes a local SQLite database (`misinfo_app.db`) on startup while seamlessly scaling to enterprise PostgreSQL in production. I also built our transactional CRUD service, paginated history retrieval, and database-level analytics aggregation."*

---

## 3. The 6-Stage Analysis Pipeline in Detail

Every submission to TruthShield progresses through a deterministic 6-stage pipeline:

```
[ Raw User Input ] 
       │
       ▼
1. INGESTION & SANITIZATION (TextPreprocessor)
   • Strips zero-width characters, excessive whitespace, and HTML tags.
   • Normalizes unicode characters and emojis.
       │
       ▼
2. LINGUISTIC FEATURE EXTRACTION
   • Detects viral urgency cues ("Forward immediately", "Before deleted").
   • Computes all-caps ratio and punctuation density (e.g. multiple "!!!").
   • Identifies sensational adjectives ("SCIENTISTS SHOCKED", "Instant Miracle").
       │
       ▼
3. ATOMIC CLAIM ISOLATION (ClaimExtractor)
   • Extracts the verifiable factual assertion from rhetorical framing.
   • Example: Converts "BREAKING NEWS: You won't believe doctors hide that boiled garlic water cures viruses in 2 hours!" -> "Boiled garlic water acts as an antiviral cure."
       │
       ▼
4. SOURCE & REPUTATION VERIFICATION (SourceVerifier)
   • Validates URL safety (blocks `127.0.0.1`, `192.168.x.x` to prevent SSRF).
   • Checks domain against 4 registries: Official Authorities (WHO, PIB, NASA), IFCN Fact-Checkers (Snopes, BoomLive), Known Media Outlets (Reuters, BBC), and Satirical Blogs (The Onion).
   • Analyzes typosquatting imposter patterns (e.g. `bbc-news-breaking.xyz`).
       │
       ▼
5. INTELLIGENCE SYNTHESIS (LLMAnalyzer / MockAnalyzer)
   • Evaluates claim against corroborating repositories.
   • Determines 4-tier verdict: Likely Reliable, Potentially Misleading, Likely False, or Needs Verification.
   • Calculates calibrated confidence (`0.50 – 0.98`) based on evidence volume and linguistic cues.
       │
       ▼
6. EXPLANATION-FIRST REPORT GENERATION & PERSISTENCE
   • Formats 3+ bulleted "Why This Result?" explanations.
   • Assigns stance tags to evidence (`SUPPORTING`, `REFUTING`, `CONTEXTUAL`).
   • Generates educational "Think Before You Share" recommendation.
   • Persists evaluation record to relational database.
```

---

## 4. Core Architectural Invariants

Examiners frequently inspect whether a project adheres to rigorous academic constraints:

1. **No Fake Accuracy Claims:**  
   *Examiner Question:* "Why don't you claim 95% model accuracy?"  
   *Answer:* Stating an overall accuracy percentage without an active benchmark dataset (e.g., LIAR, FEVER, or FakeNewsNet) is scientifically unsound because misinformation changes dynamically in real time. We present our metric as an *AI Assessment Confidence* score (0.50 to 0.98), reflecting the mathematical strength of available evidence for that specific claim.

2. **AI Is An Assistant, Not Absolute Truth:**  
   TruthShield explicitly disclaims that it produces infallible truth. It acts as an *AI-assisted credibility evaluator*, training users to spot manipulation techniques.

3. **Strict 4-Tier Categorization:**  
   Rather than binary True/False, claims are categorized into `Likely Reliable`, `Potentially Misleading`, `Likely False`, or `Needs Further Verification`.

---

## 5. 20 Frequent Examiner Questions & Model Answers

### Q1: What makes TruthShield different from Google Fact Check or existing fact-check portals?
**Answer:** Existing portals function like passive search engines—they only help if a journalist has *already* written an article about that exact headline. TruthShield is an active, explanation-first assessment workbench: it accepts novel text, URLs, or screenshots, extracts the atomic claim, runs real-time domain reputation and linguistic analysis, and generates a structured educational report even for newly circulating claims.

### Q2: Why did you choose a 4-tier classification instead of a simple binary True/False?
**Answer:** Research by Rodríguez Castillo et al. (2026) demonstrates that over 65% of modern online misinformation is not outright false; it consists of real events or scientific studies taken out of context, exaggerated with sensational clickbait, or presented with altered dates. A binary True/False label fails to capture nuanced distortions. Our 4 tiers—`Likely Reliable`, `Potentially Misleading`, `Likely False`, and `Needs Further Verification`—accurately model real-world information.

### Q3: How do you prevent LLMs from hallucinating fact-checking verdicts?
**Answer:** We implement three defense layers:
1. **Strict System Prompt Constraints:** We force the LLM to return strict JSON schemas with mandatory citations and penalize unsupported claims.
2. **Pre-LLM Evidence Retrieval:** The LLM does not answer from internal memory alone; it is provided with verified factual context and domain reputation data from our `SourceVerifier`.
3. **Deterministic Heuristic Fallback:** If the LLM returns an ungrounded or ambiguous output, our rule-based Heuristic Knowledge-Base validates the verdict.

### Q4: How is the confidence score calculated?
**Answer:** The base confidence starts from the degree of corroboration in our repository (e.g., 0.89 for medically refuted myths). We then calibrate it dynamically: if the input contains viral urgency markers (`has_urgent_call`), an excessive all-caps ratio, or sensational clickbait adjectives, confidence in manipulation detection increases by +0.02 to +0.04. The final score is clamped between 0.50 and 0.98 to maintain probabilistic realism.

### Q5: How does your system detect imposter domains and typosquatting?
**Answer:** In `SourceVerifier.detect_imposter_pattern()`, we maintain a whitelist of verified global and national authorities (e.g., `bbc.com`, `who.int`, `pib.gov.in`). When an unknown URL is submitted, we inspect whether the hostname contains authorized brand strings combined with hyphens or disposable TLDs (e.g., `bbc-news-breaking.xyz` or `who-official-update.cc`). If detected, the system immediately flags the domain as "High Risk of Typosquatting" and assigns a "Suspicious / Satire" credibility rating.

### Q6: What security measures prevent malicious users from abusing the URL analysis endpoint?
**Answer:** We implemented Server-Side Request Forgery (SSRF) protection in `SourceVerifier.is_safe_url()`. Before attempting any network lookup, the URL is parsed: if the hostname matches loopback interfaces (`localhost`, `127.0.0.1`), private RFC-1918 subnets (`192.168.x.x`, `10.x.x.x`), or unsupported protocols (non-HTTP/HTTPS), the request is rejected immediately without executing external network requests.

### Q7: What database did you select and why?
**Answer:** We implemented SQLAlchemy 2.0 ORM with a dual-engine pattern. For production environments, it connects to PostgreSQL for enterprise concurrent transactions. For college vivas and standalone evaluation, it seamlessly auto-initializes a local SQLite database (`backend/misinfo_app.db`) on startup. This guarantees zero configuration setup and ensures the system never crashes if a remote database server is unreachable.

### Q8: Can your project run if the college Wi-Fi goes down during the viva?
**Answer:** Yes! TruthShield was engineered with 100% offline resilience. Our `MockAnalyzer` contains an internal heuristic knowledge-base covering key misinformation categories (health myths, planetary clickbait, financial panic, and institutional facts). If internet connectivity is lost, the system automatically routes requests through the local heuristic engine, the SQLite database, and the local Vite development bundle without dropping a single query.

### Q9: What is the purpose of stance tagging in the Evidence Engine?
**Answer:** Evidence corroboration must not only show related articles; it must declare how that article relates to the user's claim. We categorize evidence into:
- `SUPPORTING`: Validates the assertion with empirical citations.
- `REFUTING`: Directly disproves the assertion with scientific counter-evidence.
- `CONTEXTUAL`: Explains that the event or data is real, but clarifies that the user's headline exaggerates the conclusion.

### Q10: How does screenshot/image upload work?
**Answer:** The `/api/analyze/image` endpoint accepts multipart image files (`PNG`, `JPEG`, `WEBP`). It validates the MIME type, enforces a 10MB size ceiling, verifies image byte integrity with the Python Pillow (`PIL`) library, isolates visual text features, and passes the extracted claim into the pipeline orchestrator.

### Q11: How do you handle CORS in FastAPI?
**Answer:** In `backend/app/main.py`, we configure `CORSMiddleware` using settings from `app/core/config.py`. It permits cross-origin requests from our Vite frontend (`http://localhost:5173`) and mobile Expo runtime while restricting unauthorized origins in production.

### Q12: Why did you use Pydantic v2?
**Answer:** Pydantic v2 offers 5x faster C-based Rust validation (`pydantic-core`), strict type safety, automatic OpenAPI/Swagger JSON schema generation, and robust serialization via `model_dump()`. It ensures that every incoming request and outgoing response strictly matches our academic data contracts.

### Q13: What is the 3D globe in the frontend and does it cause performance lag?
**Answer:** The 3D globe in `GlobeVisual.jsx` is built using native HTML5 Canvas mathematical 3D projection, avoiding heavy three.js bundle overhead. It draws 90 digital longitude/latitude points and animates 6 orbiting media tokens (`TEXT`, `IMAGE`, `VIDEO`, `POST`, `NEWS`, `SOURCE`) using trigonometric sine/cosine depth scaling. It runs at a smooth 60 FPS and automatically adjusts for smaller screens.

### Q14: How does the React Native mobile app communicate with the backend?
**Answer:** The mobile app uses Axios configured via `mobile/src/services/api.js`. It includes a dynamic base URL switcher: it defaults to `http://10.0.2.2:8000` for the Android emulator, `http://localhost:8000` for iOS/Web, or a custom local Wi-Fi IP for testing on a physical phone, complete with an in-app ping test.

### Q15: What is the academic distinction between misinformation and disinformation?
**Answer:** 
- **Misinformation:** False or inaccurate information shared *without* malicious intent (e.g., an elderly relative forwarding an unverified home remedy).
- **Disinformation:** Deliberately fabricated falsehoods distributed *with malicious intent* to deceive, defraud, or sow political discord. TruthShield is designed to counter both by empowering users to pause and verify before sharing.

### Q16: What happens if your LLM API credits expire?
**Answer:** Our `llm_analyzer.py` catches API rate limits, timeouts, and authorization errors gracefully. When an API exception occurs, it logs the event and transparently falls back to our local heuristic analyzer. The user receives a valid evaluation report without experiencing a 500 error or crash.

### Q17: What academic literature did you reference in your project synopsis?
**Answer:** We grounded our methodology in Rodríguez Castillo et al. (2026) regarding explanation-first debunking nudges, Ozcelik et al. (2025) on multi-stage heuristic pipelines, Tomassi et al. (2024) on emotional urgency cues in algorithmic clickbait, the IFCN Code of Principles, and the WHO Mythbusters repository.

### Q18: What is the function of the community crowdsourcing feature (`/api/report`)?
**Answer:** Misinformation spreads faster than centralized fact-checkers can write articles. TruthShield allows users to submit emerging viral claims from WhatsApp groups into an investigation queue with metadata (originating platform, forward count notes). This creates a community-driven database of emerging rumors for proactive verification.

### Q19: How are the dashboard analytics calculated?
**Answer:** Rather than displaying hardcoded numbers, `DatabaseService.get_stats()` executes SQL aggregation queries directly on our database tables (`SELECT COUNT(*) FROM analysis_results GROUP BY classification`). It computes real-time percentages for all 4 categories and tallies total verified records.

### Q20: What future enhancements are planned for TruthShield?
**Answer:** In future iterations, we plan to implement:
1. End-to-end multi-lingual support for regional Indian languages (Hindi, Tamil, Bengali).
2. Deepfake video audio analysis using lightweight Fourier transform frequency anomaly models.
3. Direct WhatsApp Business API webhook integration for 1-tap automated message verification.

---

## 6. Step-by-Step Live Viva Demonstration Script

*Follow this 3-minute structured sequence to deliver a flawless live presentation to the examiners:*

### Phase 1: System Startup (30 seconds)
1. Show the two running terminals:
   - Terminal 1: `uvicorn app.main:app --reload --port 8000` (FastAPI backend)
   - Terminal 2: `npm.cmd run dev` (React 18 frontend on port 5173)
2. Open `http://127.0.0.1:8000/docs` in the browser:
   - Point out the Swagger UI: *"Here are our 8 modular endpoints with Pydantic schemas."*
   - Execute `GET /api/health`: Show that it returns `"status": "online"` with GNIOT/AKTU credentials and the student team names.

### Phase 2: Web Platform & 3D Visual Walkthrough (60 seconds)
1. Open `http://localhost:5173` in the browser:
   - Highlight the split-hero design and the interactive HTML5 Canvas 3D digital Earth.
   - Point out the 4 tier cards with color-coded badges.
2. Click **"Launch Credibility Studio"** or navigate to `/analyze`.
3. **Demo Test 1 (Health Myth - Likely False):**
   - Click the preset: **"Viral Garlic Water Cure"**
   - Click **"Verify Information Now"**.
   - Point out:
     - Verdict badge: `● Likely False`
     - Confidence meter: `93% AI Assessment Confidence`
     - Bulleted reasons explaining why: *"No clinical trials support this claim"*
     - Evidence card with red **`REFUTING`** stance tag linking to WHO Mythbusters.
     - Yellow warning recommendation: *"Think before you share."*

### Phase 3: URL & Security Demo (45 seconds)
1. Switch to the **"News URL"** tab.
2. **Demo Test 2 (Official Government Authority):**
   - Paste: `https://pib.gov.in/PressReleasePage.aspx?PRID=1800000`
   - Click **"Verify Information Now"**.
   - Show verdict: `● Likely Reliable`, Credibility: `Verified Authority`, Source: `Press Information Bureau of India`.
3. **Demo Test 3 (Satire / Imposter Flagging):**
   - Paste: `https://theonion.com/article-satire-report`
   - Show verdict: `● Likely False`, Source: `The Onion (Satire)`, tagged as Satire.

### Phase 4: Database Persistence & Dashboard (45 seconds)
1. Click **"Dashboard"** in the top navigation bar.
2. Show that the newly evaluated claims appear immediately in the **Live Database History** table with exact timestamps.
3. Show the **Pie Chart and Bar Charts (Recharts)** reflecting real-time category distribution from the SQLite/PostgreSQL database.
4. Navigate to **"Media Literacy"** (`/learn`) and show the 8 interactive digital literacy cards.
5. Navigate to **"About Team"** (`/about`) and highlight team roles and college guide attribution.

---

## 7. Viva Day Emergency & Offline Checklist

If any technical difficulty occurs during your presentation, consult this quick reference:

| Symptom / Issue | Cause | 10-Second Fix |
|---|---|---|
| Frontend cannot connect to backend | Backend terminal was closed or port 8000 busy | Open PowerShell, run: `cd backend; .\venv\Scripts\activate; uvicorn app.main:app --port 8000` |
| Internet is down / No Wi-Fi in college | Cloud LLM APIs cannot be reached | System automatically falls back to `MockAnalyzer`. Presets and local analysis continue working seamlessly! |
| Port 8000 is occupied by another process | Old background Python process still active | In PowerShell, run: `Stop-Process -Name python -Force` then restart uvicorn. |
| Database file missing | Initial run on a clean computer | System auto-creates `backend/misinfo_app.db` and auto-seeds initial benchmark records on first startup. |
| Mobile app cannot connect from phone | Phone and PC on different Wi-Fi networks | Run mobile in browser mode via `cd mobile; npx.cmd expo start --web`. |

---

*Best of luck with your MCA Project Viva! TruthShield represents professional software engineering, ethical AI standards, and complete academic fidelity.*
