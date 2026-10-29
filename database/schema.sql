-- =============================================================================
-- TruthShield Database Schema DDL (PostgreSQL 16+)
-- Project: Social Media & Misleading Information Detection Platform
-- Institution: Greater Noida Institute of Technology (GNIOT) / AKTU
-- Persistence Layer Lead: Soni (Roll No: 2501320140140)
-- Architecture Lead: Yaseen Jamshed (Roll No: 2501320140158)
-- =============================================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1: ACADEMIC RESEARCH SCHEMA (Paper Table 2: 8 Normalized Entities)
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL, -- 'WhatsApp', 'X', 'Facebook', 'Instagram', 'Web'
    text TEXT NOT NULL,
    headline VARCHAR(500),
    media_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'video', 'multimodal'
    source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- 3. Claims Table (Atomic propositions extracted from posts)
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claims_post ON claims(post_id);

-- 4. Sources Table (Accredited registries, fact-checkers, official portals)
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(36) PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    credibility_info TEXT NOT NULL -- Credibility tier, IFCN accreditation, domain reputation
);

CREATE INDEX IF NOT EXISTS idx_sources_name ON sources(source_name);

-- 5. Verification Records Table (Traceable evidence junction)
CREATE TABLE IF NOT EXISTS verification_records (
    id VARCHAR(36) PRIMARY KEY,
    claim_id VARCHAR(36) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    source_id VARCHAR(36) NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'SUPPORTING', 'REFUTING', 'CONTEXTUAL'
    details TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verif_claim ON verification_records(claim_id);
CREATE INDEX IF NOT EXISTS idx_verif_source ON verification_records(source_id);

-- 6. Classifications Table (Academic 3-Tier standard: Real, Misleading, False-Fake)
CREATE TABLE IF NOT EXISTS classifications (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'Real', 'Misleading', 'False-Fake'
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    classified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_category ON classifications(category);

-- 7. Engagement Records Table (Propagation & virality metrics)
CREATE TABLE IF NOT EXISTS engagement_records (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. User Alerts Table (Pre-share warnings and digital literacy nudges)
CREATE TABLE IF NOT EXISTS user_alerts (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    alert_message TEXT NOT NULL,
    nudge_type VARCHAR(50) DEFAULT 'Pre-Share Warning', -- 'Pre-Share Warning', 'Contextual Note', 'Critical Alert'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_post ON user_alerts(post_id);


-- =============================================================================
-- PART 2: OPERATIONAL FASTAPI BACKEND TABLES (Live Web & Mobile Storage)
-- =============================================================================

-- Analysis Results (Full evaluation document)
CREATE TABLE IF NOT EXISTS analysis_results (
    id VARCHAR(36) PRIMARY KEY,
    input_type VARCHAR(20) NOT NULL, -- 'text', 'url', 'image'
    input_content TEXT NOT NULL,
    classification VARCHAR(50) NOT NULL, -- 'Likely Reliable', 'Potentially Misleading', 'Likely False', 'Needs Further Verification'
    confidence DOUBLE PRECISION NOT NULL,
    summary TEXT NOT NULL,
    claim TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_classification ON analysis_results(classification);
CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_results(created_at DESC);

-- Analysis Reasons ("Why This Result?" explanations)
CREATE TABLE IF NOT EXISTS analysis_reasons (
    id VARCHAR(36) PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    reason_text TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reasons_result ON analysis_reasons(result_id);

-- Evidence Items (Corroborating citations)
CREATE TABLE IF NOT EXISTS evidence_items (
    id VARCHAR(36) PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    snippet TEXT NOT NULL,
    stance VARCHAR(50) NOT NULL, -- 'SUPPORTING', 'REFUTING', 'CONTEXTUAL'
    source_name VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evidence_result ON evidence_items(result_id);

-- Source Assessments (Domain reputation)
CREATE TABLE IF NOT EXISTS source_assessments (
    id VARCHAR(36) PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL UNIQUE REFERENCES analysis_results(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    credibility VARCHAR(100) NOT NULL,
    details TEXT NOT NULL
);

-- User Feedback Loop
CREATE TABLE IF NOT EXISTS user_feedback (
    id VARCHAR(36) PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crowdsourced Viral Claims Queue
CREATE TABLE IF NOT EXISTS reported_claims (
    id VARCHAR(36) PRIMARY KEY,
    claim TEXT NOT NULL,
    platform VARCHAR(100) NOT NULL,
    url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
