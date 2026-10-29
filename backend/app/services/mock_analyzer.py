import uuid
import datetime
from typing import Optional, List, Dict, Any

from app.services.base_analyzer import BaseAnalyzer
from app.services.text_preprocessor import TextPreprocessor
from app.services.claim_extractor import ClaimExtractor
from app.services.source_verifier import SourceVerifier
from app.services.evidence_engine import EvidenceEngine
from app.schemas.analysis import (
    AnalysisResultResponse, 
    EvidenceItem, 
    SourceAssessment,
    OriginInfo
)

class MockAnalyzer(BaseAnalyzer):
    """Realistic Heuristic & Knowledge-Base Analyzer for Viva & Demonstrations.
    
    Evaluates claims against known misinformation patterns, authority whitelists,
    and linguistic markers with calibrated AI confidence calculation.
    """

    # Knowledge Base: Known verified fact checks & authentic references
    FACT_CHECK_REPOSITORY = [
        {
            "keywords": ["garlic", "respiratory", "cure", "boil", "lemon", "salt water", "steam"],
            "classification": "Likely False",
            "base_confidence": 0.89,
            "claim": "Natural home concoction acts as an instant viral cure or preventive remedy.",
            "reasons": [
                "Lacks clinical trial validation and peer-reviewed empirical evidence.",
                "Employs urgent viral forwarding language designed to cause alarm.",
                "Directly refuted by international health authorities (WHO, ICMR, CDC)."
            ],
            "recommendation": "Do NOT forward medical remedies from unverified messaging groups; consult an accredited healthcare professional.",
            "evidence": [
                EvidenceItem(
                    title="WHO Mythbusters: Remedies and Viral Illness",
                    snippet="There is no scientific evidence that home remedies such as boiled garlic water or salt mixtures cure viral respiratory diseases.",
                    source_name="World Health Organization",
                    stance="REFUTING",
                    url="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters"
                )
            ]
        },
        {
            "keywords": ["asteroid", "billionaire", "golden", "nasa shocked", "alien", "end of world", "doomsday"],
            "classification": "Potentially Misleading",
            "base_confidence": 0.83,
            "claim": "Catastrophic asteroid collision or planetary gold bounty will abruptly alter Earth.",
            "reasons": [
                "Sensational clickbait adjectives designed to trigger maximum engagement ('SCIENTISTS SHOCKED', 'billionaires overnight').",
                "Distorts scientific asteroid reconnaissance missions (such as NASA's Psyche mineral study).",
                "Omits critical caveats regarding zero trajectory probability of impacting Earth."
            ],
            "recommendation": "Cross-examine space exploration and astronomical claims with official NASA or ESA press releases.",
            "evidence": [
                EvidenceItem(
                    title="NASA Planetary Defense Coordination Office",
                    snippet="NASA monitors all near-Earth asteroids. No known asteroid larger than 140 meters has a significant chance to hit Earth for the next 100 years.",
                    source_name="NASA Jet Propulsion Laboratory",
                    stance="CONTEXTUAL",
                    url="https://www.jpl.nasa.gov"
                )
            ]
        },
        {
            "keywords": ["bank note", "currency ban", "rbi closing", "free money", "guaranteed crypto", "double money"],
            "classification": "Likely False",
            "base_confidence": 0.92,
            "claim": "Central banking authority announces sudden currency cancellation or free monetary distribution.",
            "reasons": [
                "Mimics financial authority directives without official gazette notifications.",
                "Promotes financial panic or phishing links to harvest user credentials.",
                "Contradicts regulatory communications published on official central bank portals."
            ],
            "recommendation": "Verify all banking and monetary regulations exclusively on the Reserve Bank or Ministry of Finance portals.",
            "evidence": [
                EvidenceItem(
                    title="Press Information Bureau (PIB) Fact Check: Banking Notices",
                    snippet="Official government notices regarding financial regulation are communicated via official press releases, not viral social messages.",
                    source_name="PIB Fact Check Unit",
                    stance="REFUTING",
                    url="https://factcheck.pib.gov.in"
                )
            ]
        },
        {
            "keywords": ["who", "guideline", "sodium", "dietary", "icmr", "official announcement", "curriculum", "syllabus"],
            "classification": "Likely Reliable",
            "base_confidence": 0.91,
            "claim": "Official guideline or educational policy released by an accredited institutional body.",
            "reasons": [
                "Directly references recognized public agencies with published policy documentation.",
                "Language is objective, educational, and free of emotional or viral forwarding triggers.",
                "Consistency verified with public institutional press releases."
            ],
            "recommendation": "Information appears consistent with verified institutional publications.",
            "evidence": [
                EvidenceItem(
                    title="Official Technical Report Documentation",
                    snippet="Verified publication matches published standards and institutional press releases.",
                    source_name="Institutional Regulatory Archive",
                    stance="SUPPORTING",
                    url="https://www.who.int"
                )
            ]
        }
    ]

    def _calibrate_confidence(self, base_confidence: float, features: Dict[str, Any]) -> float:
        """Calibrate AI Assessment Confidence based on linguistic and empirical signals."""
        confidence = base_confidence

        # High urgency language increases confidence of manipulation detection
        if features.get("has_urgent_call", False):
            confidence += 0.04
        if features.get("is_sensational", False):
            confidence += 0.03
        if features.get("uppercase_ratio", 0) > 0.3:
            confidence += 0.02

        # Boundary clamping between 0.60 and 0.96
        return round(max(0.60, min(0.96, confidence)), 2)

    def analyze_text(self, text: str, source_hint: Optional[str] = None) -> AnalysisResultResponse:
        cleaned = TextPreprocessor.clean_text(text)
        features = TextPreprocessor.extract_features(cleaned)
        claim = ClaimExtractor.extract_claim(cleaned)
        raw_lower = cleaned.lower()

        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 1. Match against Fact Check Repository
        matched = None
        for item in self.FACT_CHECK_REPOSITORY:
            if any(k in raw_lower for k in item["keywords"]):
                matched = item
                break

        if matched:
            classification = matched["classification"]
            confidence = self._calibrate_confidence(matched["base_confidence"], features)
            summary = f"AI assessment: Classified as {classification} based on knowledge base comparison and linguistic analysis."
            claim_text = matched["claim"]
            reasons = list(matched["reasons"])
            recommendation = matched["recommendation"]
            evidence = matched.get("evidence", []) or EvidenceEngine.find_evidence(cleaned)
            source = SourceAssessment(
                source=source_hint or "Forwarded Social Media Content",
                credibility="Verified Authority" if classification == "Likely Reliable" else "Suspicious / Satire",
                details="Evaluated against institutional repositories and linguistic marker databases."
            )
        else:
            # Ambiguous or Uncategorized Submission
            classification = "Needs Further Verification"
            confidence = 0.68
            summary = "AI assessment: Content requires further corroboration before trusting or sharing."
            claim_text = claim
            reasons = [
                "Sparse independent corroborating evidence found in verified public fact-checking repositories.",
                "Source does not carry established institutional or journalistic verification credentials.",
                "Linguistic features suggest personal opinion or unconfirmed breaking hearsay."
            ]
            recommendation = "Pause and verify this statement with independent, established news sources before forwarding."
            evidence = EvidenceEngine.find_evidence(cleaned)
            source = SourceAssessment(
                source=source_hint or "Unverified Text Submission",
                credibility="Needs Verification",
                details="Claim requires manual corroboration against established reporting."
            )

        origin_info = OriginInfo(
            location="India / Regional" if any(k in cleaned.lower() for k in ["whatsapp", "forward", "india", "delhi", "mumbai", "garlic"]) else "Global / Social Media",
            original_platform=source_hint or "Viral Social Media Forward",
            first_seen_period="Recirculating viral narrative" if classification in ["Likely False", "Potentially Misleading"] else "Recent",
            provenance_details="Claim provenance traced to forwarded messaging channels and social media engagement amplification."
        )

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="text",
            classification=classification,
            confidence=confidence,
            summary=summary,
            claim=claim_text,
            evidence=evidence,
            source_assessment=source,
            origin_info=origin_info,
            reasons=reasons,
            recommendation=recommendation,
            created_at=created_at
        )

    def analyze_url(self, url: str) -> AnalysisResultResponse:
        source_eval = SourceVerifier.evaluate_url(url)
        analysis_id = str(uuid.uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if source_eval["credibility"] == "Verified Authority":
            classification = "Likely Reliable"
            confidence = 0.93
            reasons = [
                "Published by an accredited institutional or governmental authority.",
                "Domain employs transparent editorial accountability and peer review.",
                "No deceptive tracking or spoofing patterns detected."
            ]
            recommendation = "Verified institutional source. Safe to reference."
        elif source_eval["credibility"] == "Suspicious / Satire":
            classification = "Likely False"
            confidence = 0.91
            reasons = [
                "Domain is cataloged in registries of satirical outlets or clickbait aggregators.",
                "Content is intended for entertainment or commercial viral amplification.",
                "Facts cannot be validated against legitimate news bureaus."
            ]
            recommendation = "Do not treat this content as authentic news; source is flagged as satire or deceptive."
        elif source_eval["credibility"] == "Known Media Outlet":
            classification = "Likely Reliable"
            confidence = 0.86
            reasons = [
                "Published by an established news bureau with recognized reporting standards.",
                "Subject to journalistic review and editorial accountability."
            ]
            recommendation = "Reputable journalistic source. Cross-reference for breaking developments."
        else:
            classification = "Needs Further Verification"
            confidence = 0.65
            reasons = [
                "Unrecognized or independent blog lacking accredited editorial policies.",
                "Author credentials and fact-checking transparency cannot be verified."
            ]
            recommendation = "Check whether mainstream accredited publications corroborate the report before sharing."

        origin_info = OriginInfo(
            location="Global / Web Domain" if not any(x in url.lower() for x in [".in", "india", "delhi"]) else "India",
            original_platform=source_eval.get("source") or "Web Publication",
            first_seen_period="Web Domain Article",
            provenance_details=f"Evaluated domain source '{source_eval.get('source')}'. Web provenance and domain credibility analyzed."
        )

        return AnalysisResultResponse(
            id=analysis_id,
            input_type="url",
            classification=classification,
            confidence=confidence,
            summary=f"AI assessment for URL ({source_eval['source']}): Classified as {classification}.",
            claim=f"Article published at {url}",
            evidence=[],
            source_assessment=SourceAssessment(**source_eval),
            origin_info=origin_info,
            reasons=reasons,
            recommendation=recommendation,
            created_at=created_at
        )

    def analyze_image(self, extracted_text: str, filename: str) -> AnalysisResultResponse:
        # Analyzes extracted text from image through the same verified pipeline
        result = self.analyze_text(
            text=extracted_text, 
            source_hint=f"Screenshot Upload ({filename})"
        )
        result.input_type = "image"
        return result
