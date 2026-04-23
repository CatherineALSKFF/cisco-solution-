"""Unified extractor that combines clause extraction AND comparison in a single LLM call."""

import json
import os
from datetime import date
from pathlib import Path
from typing import Optional

from anthropic import Anthropic

from src.schemas import ClauseExtraction, ClauseComparison, ComplianceStatus, RenewalStatus


def _load_security_standard() -> str:
    """Load Cisco security standard clause."""
    standards_path = Path(__file__).parent.parent.parent / "standards" / "cisco_security_clause.md"
    try:
        return standards_path.read_text()
    except FileNotFoundError:
        return ""


UNIFIED_SYSTEM_PROMPT = """You are a contract security analyst for Cisco PSIRT. Your task is to:
1. Extract key clauses from vendor contracts
2. Compare them against Cisco's Security Vulnerability Policy requirements
3. Flag any security gaps or compliance issues

Be precise and thorough. Quote relevant text. Flag missing critical requirements."""


UNIFIED_PROMPT = """Analyze this vendor contract against Cisco's Security Vulnerability Policy.

## TASK 1: EXTRACT CLAUSES

Extract these fields as JSON:

{{
  "vendor_name": "string or null",
  "contract_type": "string",
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",

  "security": {{
    "status": "compliant | needs_review | missing | not_applicable",
    "has_security_requirements": boolean,
    "has_incident_notification": boolean,
    "incident_notification_timeline": "e.g., '24 hours', '72 hours', or null if not specified",
    "has_audit_rights": boolean,
    "has_compliance_certifications": boolean,
    "certifications_mentioned": ["SOC2", "ISO27001", etc. or empty],
    "has_data_protection": boolean,
    "has_vulnerability_disclosure": boolean,
    "has_cvss_scoring": boolean,
    "has_secure_development": boolean,
    "prohibits_backdoors": boolean,
    "prohibits_hardcoded_credentials": boolean,
    "has_third_party_component_tracking": boolean,
    "has_security_updates_commitment": boolean,
    "gaps": ["list ALL missing security provisions from Cisco policy"],
    "extracted_text": "relevant security clause text"
  }},

  "royalty": {{
    "has_royalty": boolean,
    "royalty_type": "per-device | per-seat | percentage | minimum_commitment | flat_fee | null",
    "royalty_amount": "description or null",
    "payment_frequency": "quarterly | monthly | annual | one-time | null",
    "reporting_required": boolean,
    "extracted_text": "quoted text"
  }},

  "renewal": {{
    "renewal_status": "auto_renew | manual_renewal | expired | expiring_soon | no_renewal",
    "auto_renew": boolean,
    "notice_period_days": integer or null,
    "renewal_term_months": integer or null,
    "effective_date": "YYYY-MM-DD or null",
    "expiry_date": "YYYY-MM-DD or null",
    "extracted_text": "quoted text"
  }},

  "comparison": {{
    "match_status": "match | partial_match | missing | non_standard",
    "similarity_score": 0.0-1.0,
    "critical_gaps": ["CRITICAL missing items: backdoor prohibition, incident notification, vulnerability disclosure"],
    "gaps": ["all missing elements vs Cisco PSIRT policy"],
    "reasoning": "detailed explanation of compliance status"
  }},

  "confidence": 0.0-1.0
}}

## CISCO SECURITY VULNERABILITY POLICY REQUIREMENTS

Key requirements vendors MUST meet:

**CRITICAL (Red flags if missing):**
1. NO backdoors, hardcoded credentials, covert channels, undocumented access
2. Security incident notification within 24-72 hours
3. Vulnerability disclosure process (ISO/IEC 29147:2018)
4. CVSS v3.1 scoring for vulnerabilities
5. CVE assignment for confirmed vulnerabilities

**REQUIRED:**
6. 24/7 security incident contact
7. Encrypted communication support (PGP/GPG)
8. Confidential handling of vulnerability reports
9. Coordinated disclosure timeline
10. SOC 2 Type II or equivalent certification
11. Annual security audit reports
12. Data encryption at rest and in transit
13. Access controls and authentication
14. Third-party component vulnerability tracking
15. Security software updates from FCS to LDoS
16. Free updates for Critical/High severity issues

**CLOUD SERVICES (if applicable):**
17. Regular patching and monitoring
18. Customer notification for security issues
19. Timely patch deployment

{cisco_standard}

## CONTRACT TO ANALYZE

{contract_text}

Return ONLY valid JSON. Be thorough in identifying gaps."""


class UnifiedExtractor:
    """Single-call extractor that performs extraction + comparison together."""

    def __init__(self, api_key: Optional[str] = None, model: str = "claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = model
        self.security_standard = _load_security_standard()

    def extract_and_compare(
        self,
        contract_text: str,
        file_name: str = ""
    ) -> tuple[ClauseExtraction, list[ClauseComparison], dict]:
        """Extract clauses AND compare against standards in one LLM call.

        Returns:
            Tuple of (ClauseExtraction, list[ClauseComparison], metadata dict)
        """
        prompt = UNIFIED_PROMPT.format(
            cisco_standard=self.security_standard[:3000],
            contract_text=contract_text[:45000],
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=UNIFIED_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        data = self._parse_json_response(response.content[0].text)

        clauses = self._build_clause_extraction(data)
        comparisons = self._build_comparisons(data)
        metadata = {
            "vendor_name": data.get("vendor_name"),
            "contract_type": data.get("contract_type"),
            "effective_date": self._parse_date(data.get("effective_date")),
            "expiry_date": self._parse_date(data.get("expiry_date")),
            "confidence": data.get("confidence", 0.7),
        }

        return clauses, comparisons, metadata

    def _parse_json_response(self, text: str) -> dict:
        """Parse JSON from LLM response."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
            raise

    def _parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parse date string."""
        if not date_str:
            return None
        try:
            return date.fromisoformat(date_str)
        except (ValueError, TypeError):
            return None

    def _build_clause_extraction(self, data: dict) -> ClauseExtraction:
        """Build ClauseExtraction from parsed data."""
        from src.schemas.contract import SecurityClause, RoyaltyTerms, RenewalTerms

        security_data = data.get("security", {})
        security = SecurityClause(
            status=ComplianceStatus(security_data.get("status", "needs_review")),
            has_security_requirements=security_data.get("has_security_requirements", False),
            has_incident_notification=security_data.get("has_incident_notification", False),
            incident_notification_timeline=security_data.get("incident_notification_timeline"),
            has_audit_rights=security_data.get("has_audit_rights", False),
            has_compliance_certifications=security_data.get("has_compliance_certifications", False),
            certifications_mentioned=security_data.get("certifications_mentioned", []),
            has_data_protection=security_data.get("has_data_protection", False),
            has_vulnerability_disclosure=security_data.get("has_vulnerability_disclosure", False),
            has_cvss_scoring=security_data.get("has_cvss_scoring", False),
            has_secure_development=security_data.get("has_secure_development", False),
            prohibits_backdoors=security_data.get("prohibits_backdoors", False),
            prohibits_hardcoded_credentials=security_data.get("prohibits_hardcoded_credentials", False),
            has_third_party_component_tracking=security_data.get("has_third_party_component_tracking", False),
            has_security_updates_commitment=security_data.get("has_security_updates_commitment", False),
            gaps=security_data.get("gaps", []),
            critical_gaps=security_data.get("critical_gaps", []) if "critical_gaps" in security_data else data.get("comparison", {}).get("critical_gaps", []),
            extracted_text=security_data.get("extracted_text"),
        )

        royalty_data = data.get("royalty", {})
        royalty = RoyaltyTerms(
            has_royalty=royalty_data.get("has_royalty", False),
            royalty_type=royalty_data.get("royalty_type"),
            royalty_amount=royalty_data.get("royalty_amount"),
            payment_frequency=royalty_data.get("payment_frequency"),
            reporting_required=royalty_data.get("reporting_required", False),
            extracted_text=royalty_data.get("extracted_text"),
        )

        renewal_data = data.get("renewal", {})
        try:
            renewal_status = RenewalStatus(renewal_data.get("renewal_status", "manual_renewal"))
        except ValueError:
            renewal_status = RenewalStatus.MANUAL_RENEWAL

        renewal = RenewalTerms(
            renewal_status=renewal_status,
            auto_renew=renewal_data.get("auto_renew", False),
            notice_period_days=renewal_data.get("notice_period_days"),
            renewal_term_months=renewal_data.get("renewal_term_months"),
            effective_date=self._parse_date(renewal_data.get("effective_date")),
            expiry_date=self._parse_date(renewal_data.get("expiry_date")),
            extracted_text=renewal_data.get("extracted_text"),
        )

        return ClauseExtraction(security=security, royalty=royalty, renewal=renewal)

    def _build_comparisons(self, data: dict) -> list[ClauseComparison]:
        """Build comparison results from parsed data."""
        comp_data = data.get("comparison", {})

        if not comp_data:
            return []

        return [ClauseComparison(
            clause_type="security",
            match_status=comp_data.get("match_status", "needs_review"),
            similarity_score=comp_data.get("similarity_score", 0.5),
            gaps=comp_data.get("gaps", []),
            reasoning=comp_data.get("reasoning", ""),
        )]
