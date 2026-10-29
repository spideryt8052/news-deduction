-- =============================================================================
-- TruthShield Reference Seed Data (PostgreSQL / SQLite)
-- Pre-populates authoritative registries, fact-checking bureaus, and sample claims
-- =============================================================================

-- 1. Insert Initial System User
INSERT INTO users (id, name, email, created_at)
VALUES 
    ('usr-sys-001', 'System Verification Administrator', 'admin@truthshield.aktu.ac.in', CURRENT_TIMESTAMP),
    ('usr-research-002', 'Academic Research Reviewer', 'reviewer@gniot.edu.in', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Accredited Institutional & Fact-Checking Sources (Table 2: sources)
INSERT INTO sources (id, source_name, url, credibility_info)
VALUES
    ('src-who-001', 'World Health Organization (WHO)', 'https://www.who.int', 'Official Global Health Authority (Tier 1 Verified). Transparent editorial oversight and peer-reviewed medical guidelines.'),
    ('src-pib-002', 'Press Information Bureau of India (PIB)', 'https://pib.gov.in', 'Official Gazette and Communication Bureau of the Government of India. Primary authority for national policy notices.'),
    ('src-rbi-003', 'Reserve Bank of India (RBI)', 'https://www.rbi.org.in', 'Central Monetary Authority of India. Sole issuer of currency regulations and banking notices.'),
    ('src-icmr-004', 'Indian Council of Medical Research (ICMR)', 'https://www.icmr.gov.in', 'Apex biomedical research institution in India. Coordinates clinical guidelines and epidemiological validation.'),
    ('src-nasa-005', 'NASA Official Portal', 'https://www.nasa.gov', 'Aeronautics and Space Administration. Authority on astronomical, planetary defense, and space events.'),
    ('src-snopes-006', 'Snopes Fact Checking', 'https://www.snopes.com', 'Accredited member of the International Fact-Checking Network (IFCN). Independent urban legend and rumor investigation.'),
    ('src-boom-007', 'BOOM Live Fact Check', 'https://www.boomlive.in', 'IFCN certified fact-checker specializing in South Asian digital misinformation and viral WhatsApp forensics.'),
    ('src-alt-008', 'Alt News Fact Check', 'https://www.altnews.in', 'IFCN signatory dedicated to debunking political propaganda, manipulated media, and communal rumors in India.'),
    ('src-reuters-009', 'Reuters News Bureau', 'https://www.reuters.com', 'Global accredited news bureau with strict multi-source verification standards.'),
    ('src-onion-010', 'The Onion (Satire / Parody)', 'https://theonion.com', 'Cataloged humor publication. Content is intentionally fabricated for satire and entertainment - not authentic news.')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Reference Posts
INSERT INTO posts (id, user_id, platform, text, headline, media_type, source, created_at)
VALUES
    ('pst-ref-001', 'usr-sys-001', 'WhatsApp', 'URGENT: Drinking boiled garlic water mixed with salt cures all viral lung infections in 2 hours! Forward to all groups!', 'Miracle Garlic Water Cure', 'text', 'Viral Forward Chain', CURRENT_TIMESTAMP),
    ('pst-ref-002', 'usr-sys-001', 'X', 'The World Health Organization (WHO) has released an updated guideline on daily dietary sodium intake recommending under 2000mg for adults.', 'WHO Updates Global Dietary Sodium Guidance', 'text', 'https://www.who.int', CURRENT_TIMESTAMP),
    ('pst-ref-003', 'usr-sys-001', 'Facebook', 'SCIENTISTS SHOCKED: NASA confirms massive golden asteroid will hit Earth next Tuesday making every citizen a billionaire!', 'Golden Asteroid Wealth Claim', 'text', 'Social Feed Post', CURRENT_TIMESTAMP),
    ('pst-ref-004', 'usr-sys-001', 'WhatsApp', 'BREAKING: Central Bank announces sudden complete currency cancellation and bank note invalidation from tonight midnight!', 'Emergency Currency Ban Hoax', 'text', 'Anonymous Audio & Text Forward', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Extracted Atomic Claims
INSERT INTO claims (id, post_id, claim_text, created_at)
VALUES
    ('clm-ref-001', 'pst-ref-001', 'Drinking boiled garlic water cures respiratory viral infections in 2 hours.', CURRENT_TIMESTAMP),
    ('clm-ref-002', 'pst-ref-002', 'WHO recommends consuming less than 2000 mg of sodium daily for adults.', CURRENT_TIMESTAMP),
    ('clm-ref-003', 'pst-ref-003', 'NASA confirmed a golden asteroid will collide with Earth and distribute mineral wealth to all citizens.', CURRENT_TIMESTAMP),
    ('clm-ref-004', 'pst-ref-004', 'Central bank is invalidating all currency banknotes effective immediately tonight.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Verification Records (Connecting Claims to Verified Sources)
INSERT INTO verification_records (id, claim_id, source_id, status, details, verified_at)
VALUES
    ('vrf-ref-001', 'clm-ref-001', 'src-who-001', 'REFUTING', 'WHO Mythbusters confirm garlic has minor antimicrobial properties but zero clinical evidence of curing viral respiratory infections.', CURRENT_TIMESTAMP),
    ('vrf-ref-002', 'clm-ref-002', 'src-who-001', 'SUPPORTING', 'Official WHO technical guidance document published and validated in institutional archives.', CURRENT_TIMESTAMP),
    ('vrf-ref-003', 'clm-ref-003', 'src-nasa-005', 'REFUTING', 'NASA Planetary Defense Office tracks Near-Earth asteroids, asteroid 16 Psyche contains metal but is in the asteroid belt and poses no Earth impact risk.', CURRENT_TIMESTAMP),
    ('vrf-ref-004', 'clm-ref-004', 'src-pib-002', 'REFUTING', 'PIB Fact Check confirmed no emergency demonetization notice has been issued, viral notice is forged.', CURRENT_TIMESTAMP),
    ('vrf-ref-005', 'clm-ref-004', 'src-rbi-003', 'REFUTING', 'Reserve Bank of India regulatory notifications contain no directive regarding sudden currency invalidation.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Classifications (3-Tier Standard)
INSERT INTO classifications (id, post_id, category, confidence, classified_at)
VALUES
    ('cls-ref-001', 'pst-ref-001', 'False-Fake', 0.95, CURRENT_TIMESTAMP),
    ('cls-ref-002', 'pst-ref-002', 'Real', 0.94, CURRENT_TIMESTAMP),
    ('cls-ref-003', 'pst-ref-003', 'Misleading', 0.88, CURRENT_TIMESTAMP),
    ('cls-ref-004', 'pst-ref-004', 'False-Fake', 0.96, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Engagement Telemetry
INSERT INTO engagement_records (id, post_id, likes, comments, shares, updated_at)
VALUES
    ('eng-ref-001', 'pst-ref-001', 1420, 89, 8740, CURRENT_TIMESTAMP),
    ('eng-ref-002', 'pst-ref-002', 3200, 140, 950, CURRENT_TIMESTAMP),
    ('eng-ref-003', 'pst-ref-003', 8900, 1200, 14500, CURRENT_TIMESTAMP),
    ('eng-ref-004', 'pst-ref-004', 540, 310, 18900, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert User Alerts & Behavioral Nudges
INSERT INTO user_alerts (id, post_id, alert_message, nudge_type, created_at)
VALUES
    ('alt-ref-001', 'pst-ref-001', 'CRITICAL MEDICAL WARNING: This home-remedy claim is medically refuted by the World Health Organization. Never delay seeking certified clinical care based on unverified viral forward messages.', 'Pre-Share Warning', CURRENT_TIMESTAMP),
    ('alt-ref-002', 'pst-ref-002', 'VERIFIED INSTITUTIONAL NOTICE: Claim matches published documentation from the World Health Organization. Safe to reference as an official health guideline.', 'Contextual Note', CURRENT_TIMESTAMP),
    ('alt-ref-003', 'pst-ref-003', 'CLICKBAIT SENSATIONALISM ALERT: Real scientific information regarding asteroid 16 Psyche has been distorted into an impossible wealth-distribution fantasy. Check NASA official releases before sharing.', 'Pre-Share Warning', CURRENT_TIMESTAMP),
    ('alt-ref-004', 'pst-ref-004', 'FINANCIAL HOAX WARNING: Official central banking and government gazettes confirm this claim is completely fabricated. Do not forward to prevent financial panic.', 'Pre-Share Warning', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
