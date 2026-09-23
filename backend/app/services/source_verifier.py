import re
import datetime
from urllib.parse import urlparse
from typing import Dict, Any, List

class SourceVerifier:
    """Advanced Source Verification & Domain Reputation Module.
    
    Inspects domain authenticity, imposter domain patterns, TLD credibility,
    and cross-checks against verified institutional and fact-checking registries.
    """

    # 1. Official Regulatory & Institutional Authorities
    VERIFIED_DOMAINS = {
        'who.int': {'name': 'World Health Organization', 'type': 'Official Authority', 'tier': 'Verified Authority'},
        'cdc.gov': {'name': 'Centers for Disease Control and Prevention', 'type': 'Official Authority', 'tier': 'Verified Authority'},
        'nasa.gov': {'name': 'NASA Official Portal', 'type': 'Official Authority', 'tier': 'Verified Authority'},
        'pib.gov.in': {'name': 'Press Information Bureau of India', 'type': 'Official Authority', 'tier': 'Verified Authority'},
        'icmr.gov.in': {'name': 'Indian Council of Medical Research', 'type': 'Official Authority', 'tier': 'Verified Authority'},
        'rbi.org.in': {'name': 'Reserve Bank of India', 'type': 'Official Authority', 'tier': 'Verified Authority'},
        'isro.gov.in': {'name': 'Indian Space Research Organisation', 'type': 'Official Authority', 'tier': 'Verified Authority'},
    }

    # 2. Accredited Fact-Checking Organizations
    FACT_CHECK_BUREAUS = {
        'factcheck.org': {'name': 'FactCheck.org', 'type': 'Fact-Checking Bureau', 'tier': 'Verified Authority'},
        'politifact.com': {'name': 'PolitiFact', 'type': 'Fact-Checking Bureau', 'tier': 'Verified Authority'},
        'snopes.com': {'name': 'Snopes', 'type': 'Fact-Checking Bureau', 'tier': 'Verified Authority'},
        'boomlive.in': {'name': 'BOOM Live Fact Check', 'type': 'Fact-Checking Bureau', 'tier': 'Verified Authority'},
        'altnews.in': {'name': 'Alt News Fact Check', 'type': 'Fact-Checking Bureau', 'tier': 'Verified Authority'},
    }

    # 3. Established Journalistic News Organizations
    KNOWN_MEDIA_OUTLETS = {
        'reuters.com': {'name': 'Reuters News Agency', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
        'apnews.com': {'name': 'Associated Press', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
        'bbc.com': {'name': 'BBC News', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
        'bbc.co.uk': {'name': 'BBC News (UK)', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
        'thehindu.com': {'name': 'The Hindu', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
        'indiatoday.in': {'name': 'India Today', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
        'ndtv.com': {'name': 'NDTV', 'type': 'Accredited News Bureau', 'tier': 'Known Media Outlet'},
    }

    # 4. Known Satirical / Parody Publications
    SUSPICIOUS_OR_SATIRE = {
        'theonion.com': {'name': 'The Onion (Satire)', 'type': 'Satire / Parody', 'tier': 'Suspicious / Satire'},
        'babylonbee.com': {'name': 'The Babylon Bee (Satire)', 'type': 'Satire / Parody', 'tier': 'Suspicious / Satire'},
        'fakenews24.com': {'name': 'Unverified Blog', 'type': 'Suspicious Host', 'tier': 'Suspicious / Satire'},
        'daily-viral-buzz.xyz': {'name': 'Clickbait Network', 'type': 'Clickbait Aggregator', 'tier': 'Suspicious / Satire'},
    }

    SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.buzz', '.cc', '.tk', '.work']

    @classmethod
    def is_safe_url(cls, url: str) -> bool:
        """Validates that a URL does not point to internal, local, or unsafe networks (SSRF prevention)."""
        try:
            parsed = urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            # Block localhost and private IP ranges
            blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
            if hostname in blocked or hostname.startswith('192.168.') or hostname.startswith('10.'):
                return False

            # Require http or https scheme
            if parsed.scheme not in ['http', 'https']:
                return False

            return True
        except Exception:
            return False

    @classmethod
    def detect_imposter_pattern(cls, hostname: str) -> bool:
        """Detects typosquatting and impersonation tricks like bbc-breaking-news.xyz."""
        brand_targets = ['bbc', 'who', 'cnn', 'nasa', 'pib', 'reuters', 'ndtv']
        for brand in brand_targets:
            # If the domain contains a brand name with hyphens or extra prefixes
            if brand in hostname:
                # If it's not the actual official domain
                if not any(hostname.endswith('.' + official) or hostname == official 
                           for official in ['bbc.com', 'who.int', 'nasa.gov', 'pib.gov.in', 'reuters.com', 'ndtv.com']):
                    return True
        return False

    @classmethod
    def evaluate_url(cls, url: str) -> Dict[str, Any]:
        """Comprehensive multi-factor source evaluation."""
        if not cls.is_safe_url(url):
            return {
                "source": "Invalid / Unsafe URL",
                "credibility": "Suspicious / Satire",
                "source_type": "Blocked / Unsafe",
                "verification_status": "Flagged as Unsafe",
                "details": "URL rejected due to security constraints (local address or unsupported scheme)."
            }

        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if hostname.startswith("www."):
            hostname = hostname[4:]

        # Check 1: Official Regulatory Authorities
        if hostname in cls.VERIFIED_DOMAINS:
            item = cls.VERIFIED_DOMAINS[hostname]
            return {
                "source": f"{item['name']} ({hostname})",
                "credibility": item["tier"],
                "source_type": item["type"],
                "verification_status": "Verified Authority",
                "details": "Registered official governmental or international agency with verified editorial accountability."
            }

        # Check 2: Recognized Fact-Checking Bureaus
        if hostname in cls.FACT_CHECK_BUREAUS:
            item = cls.FACT_CHECK_BUREAUS[hostname]
            return {
                "source": f"{item['name']} ({hostname})",
                "credibility": item["tier"],
                "source_type": item["type"],
                "verification_status": "Certified Fact-Checker",
                "details": "Signatory to the International Fact-Checking Network (IFCN) with transparent sourcing."
            }

        # Check 3: Accredited Journalistic News
        if hostname in cls.KNOWN_MEDIA_OUTLETS:
            item = cls.KNOWN_MEDIA_OUTLETS[hostname]
            return {
                "source": f"{item['name']} ({hostname})",
                "credibility": item["tier"],
                "source_type": item["type"],
                "verification_status": "Accredited News Bureau",
                "details": "Established news organization operating with professional editorial guidelines."
            }

        # Check 4: Known Satirical / Deceptive Publishers
        if hostname in cls.SUSPICIOUS_OR_SATIRE:
            item = cls.SUSPICIOUS_OR_SATIRE[hostname]
            return {
                "source": f"{item['name']} ({hostname})",
                "credibility": item["tier"],
                "source_type": item["type"],
                "verification_status": "Flagged as Satire / Clickbait",
                "details": "Host cataloged in registries of satirical publications or commercial viral amplification blogs."
            }

        # Check 5: Imposter / Typosquatting Patterns
        if cls.detect_imposter_pattern(hostname):
            return {
                "source": f"Suspicious Imposter ({hostname})",
                "credibility": "Suspicious / Satire",
                "source_type": "Suspected Imposter Domain",
                "verification_status": "High Risk of Typosquatting",
                "details": "Domain mimics recognizable news agencies using suspicious hyphenation or unverified TLDs."
            }

        # Check 6: Generic Top-Level Domains (.gov, .edu, .org)
        if hostname.endswith('.gov') or hostname.endswith('.gov.in') or hostname.endswith('.edu') or hostname.endswith('.ac.in'):
            return {
                "source": hostname,
                "credibility": "Verified Authority",
                "source_type": "Institutional Entity",
                "verification_status": "Government / Academic Domain",
                "details": "Official state, educational, or governmental registered namespace."
            }

        # Check 7: Suspicious / Cheap TLDs
        if any(hostname.endswith(tld) for tld in cls.SUSPICIOUS_TLDS):
            return {
                "source": hostname,
                "credibility": "Suspicious / Satire",
                "source_type": "Low-Reputation TLD",
                "verification_status": "Requires Strict Independent Verification",
                "details": "Domain registered under a high-risk TLD frequently utilized in disposable spam and phishing campaigns."
            }

        # Check 8: Standard Unverified Domain
        return {
            "source": hostname or "Unrecognized Domain",
            "credibility": "Independent / Unverified",
            "source_type": "Independent Web Publisher",
            "verification_status": "Awaiting Corroboration",
            "details": "Publisher not present in recognized institutional or certified fact-checking registries. Independent cross-referencing required."
        }
