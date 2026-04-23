"""Unified extractor: Security, Royalty T&C, and Commercial Exposure analysis."""

import json
import os
from datetime import date
from pathlib import Path
from typing import Optional

from anthropic import Anthropic

from src.schemas import ClauseExtraction, ClauseComparison, ComplianceStatus, RenewalStatus


def _load_standards() -> dict[str, str]:
    """Load all standard clause files."""
    standards_dir = Path(__file__).parent.parent.parent / "standards"
    standards = {}
    for name in ["cisco_security_clause.md", "commercial_exposure.md", "royalty_terms.md"]:
        try:
            standards[name] = (standards_dir / name).read_text()[:2000]
        except FileNotFoundError:
            standards[name] = ""
    return standards


UNIFIED_SYSTEM_PROMPT = """You are a contract analyst for Cisco Legal/Finance. Analyze vendor contracts for:
1. SECURITY GAP ANALYSIS - Compare against Cisco PSIRT Security Vulnerability Policy
2. ROYALTY T&C REVIEW - Assess royalty structure, rates, reporting, audit terms
3. COMMERCIAL EXPOSURE - Identify financial/operational risks

Be thorough. Flag ALL gaps and risks. Quote relevant contract text."""


UNIFIED_PROMPT = """Analyze this vendor contract comprehensively.

## OUTPUT FORMAT (JSON)

{{
  "vendor_name": "string or null",
  "contract_type": "string",
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",

  "security": {{
    "status": "compliant | needs_review | missing | not_applicable",
    "has_security_requirements": true/false,
    "has_incident_notification": true/false,
    "incident_notification_timeline": "24 hours, 72 hours, or null",
    "has_audit_rights": true/false,
    "has_compliance_certifications": true/false,
    "certifications_mentioned": ["SOC2", "ISO27001"],
    "has_data_protection": true/false,
    "has_vulnerability_disclosure": true/false,
    "has_cvss_scoring": true/false,
    "has_secure_development": true/false,
    "prohibits_backdoors": true/false,
    "prohibits_hardcoded_credentials": true/false,
    "has_third_party_component_tracking": true/false,
    "has_security_updates_commitment": true/false,
    "gaps": ["all security gaps"],
    "extracted_text": "security clause text"
  }},

  "royalty": {{
    "has_royalty": true/false,
    "royalty_type": "per-device | per-seat | percentage | minimum_commitment | flat_fee | null",
    "royalty_amount": "USD X.XX per unit or description",
    "royalty_base": "what the royalty is calculated on",
    "payment_frequency": "quarterly | monthly | annual",
    "reporting_required": true/false,
    "reporting_frequency": "quarterly | monthly | annual",
    "has_audit_rights": true/false,
    "audit_notice_days": integer or null,
    "has_true_up": true/false,
    "has_minimum_commitment": true/false,
    "minimum_amount": "USD amount or null",
    "has_royalty_cap": true/false,
    "has_volume_discounts": true/false,
    "risks": ["royalty-related risks"],
    "extracted_text": "royalty clause text"
  }},

  "commercial": {{
    "has_price_cap": true/false,
    "price_increase_limit": "X% or CPI or null",
    "has_mfn_pricing": true/false,
    "payment_terms": "Net-30, Net-45, etc.",
    "has_liability_cap": true/false,
    "liability_cap_amount": "description or null",
    "has_indemnification": true/false,
    "indemnification_direction": "mutual | vendor_only | cisco_only",
    "has_termination_convenience": true/false,
    "termination_notice_days": integer or null,
    "has_termination_fees": true/false,
    "termination_fee_description": "description or null",
    "has_change_of_control": true/false,
    "has_assignment_restriction": true/false,
    "risks": ["commercial exposure risks"],
    "extracted_text": "commercial terms text"
  }},

  "renewal": {{
    "renewal_status": "auto_renew | manual_renewal | expired | no_renewal",
    "auto_renew": true/false,
    "notice_period_days": integer or null,
    "renewal_term_months": integer or null,
    "effective_date": "YYYY-MM-DD or null",
    "expiry_date": "YYYY-MM-DD or null",
    "extracted_text": "renewal clause text"
  }},

  "comparisons": [
    {{
      "area": "security",
      "match_status": "match | partial_match | missing | non_standard",
      "score": 0.0-1.0,
      "critical_gaps": ["CRITICAL missing items"],
      "gaps": ["all gaps"],
      "reasoning": "explanation"
    }},
    {{
      "area": "royalty",
      "match_status": "match | partial_match | missing | non_standard",
      "score": 0.0-1.0,
      "critical_gaps": ["CRITICAL issues"],
      "gaps": ["all gaps"],
      "reasoning": "explanation"
    }},
    {{
      "area": "commercial",
      "match_status": "match | partial_match | missing | non_standard",
      "score": 0.0-1.0,
      "critical_gaps": ["CRITICAL exposures"],
      "gaps": ["all gaps"],
      "reasoning": "explanation"
    }}
  ],

  "confidence": 0.0-1.0
}}

## ANALYSIS REQUIREMENTS

### 1. SECURITY GAP ANALYSIS (Cisco PSIRT Policy)
CRITICAL (Red if missing):
- NO backdoors, hardcoded credentials, covert channels
- Security incident notification (24-72 hours)
- Vulnerability disclosure process (ISO 29147)
- CVSS scoring for vulnerabilities

REQUIRED:
- 24/7 security contact
- SOC 2 / ISO 27001 certification
- Data encryption
- Third-party component tracking
- Security update commitments

### 2. ROYALTY T&C REVIEW
Check for:
- Clear royalty calculation method
- Market-competitive rates
- Reasonable reporting frequency (quarterly max)
- Fair audit terms (30+ days notice, independent auditor)
- True-up provisions
- Royalty caps
- Volume discounts

RED FLAGS:
- Ambiguous calculation
- Excessive rates
- Punitive audit rights
- No caps or minimums protections

### 3. COMMERCIAL EXPOSURE
Check for:
- Price increase caps (3-5% or CPI)
- Liability caps (mutual)
- Termination for convenience
- Assignment restrictions
- Change of control protections
- Reasonable payment terms (Net-30+)

RED FLAGS:
- Unlimited liability
- No price protections
- One-sided indemnification
- Termination traps
- Auto-renewal at higher rates

## CONTRACT TO ANALYZE

{contract_text}

Return ONLY valid JSON."""


class UnifiedExtractor:
    """Extracts security, royalty, and commercial terms in one LLM call."""

    def __init__(self, api_key: Optional[str] = None, model: str = "claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = model
        self.standards = _load_standards()

    def extract_and_compare(
        self,
        contract_text: str,
        file_name: str = ""
    ) -> tuple[ClauseExtraction, list[ClauseComparison], dict]:
        """Extract all clauses and compare against standards."""
        prompt = UNIFIED_PROMPT.format(contract_text=contract_text[:45000])

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
        comparisons_data = data.get("comparisons", [])
        security_comparison = next((c for c in comparisons_data if c.get("area") == "security"), {})

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
            critical_gaps=security_comparison.get("critical_gaps", []),
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
        comparisons_data = data.get("comparisons", [])
        results = []

        for comp in comparisons_data:
            results.append(ClauseComparison(
                clause_type=comp.get("area", "unknown"),
                match_status=comp.get("match_status", "needs_review"),
                similarity_score=comp.get("score", 0.5),
                gaps=comp.get("gaps", []) + comp.get("critical_gaps", []),
                reasoning=comp.get("reasoning", ""),
            ))

        return results
