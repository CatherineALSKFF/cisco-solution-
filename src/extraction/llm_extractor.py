import json
import os
from datetime import date
from typing import Optional

from anthropic import Anthropic

from src.schemas import ClauseExtraction, ComplianceStatus, RenewalStatus


EXTRACTION_SYSTEM_PROMPT = """You are a contract analysis expert specializing in software licensing, OEM agreements, and vendor contracts for a large enterprise (Cisco).

Your task is to extract specific clauses and terms from contracts. You must:
1. Be precise and extract only what is explicitly stated
2. Distinguish between what is present vs. what is missing
3. Quote relevant text when extracting
4. Acknowledge uncertainty when information is ambiguous

Focus on three key areas:
1. SECURITY clauses - data protection, incident notification, audit rights, compliance requirements
2. ROYALTY/PAYMENT terms - fees, royalties, payment schedules, minimums
3. RENEWAL/TERM clauses - expiration, auto-renewal, notice periods, termination rights"""


EXTRACTION_PROMPT = """Analyze this contract and extract the following information. Return a JSON object with this exact structure:

{{
  "vendor_name": "string or null",
  "contract_type": "string describing agreement type",
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",

  "security": {{
    "status": "compliant | needs_review | missing | not_applicable",
    "has_security_requirements": boolean,
    "has_incident_notification": boolean,
    "has_audit_rights": boolean,
    "has_compliance_certifications": boolean,
    "has_data_protection": boolean,
    "gaps": ["list of missing or weak security provisions"],
    "extracted_text": "relevant quoted text from contract"
  }},

  "royalty": {{
    "has_royalty": boolean,
    "royalty_type": "per-device | per-seat | percentage | minimum_commitment | flat_fee | null",
    "royalty_amount": "description of amount/rate or null",
    "payment_frequency": "quarterly | monthly | annual | one-time | null",
    "reporting_required": boolean,
    "extracted_text": "relevant quoted text"
  }},

  "renewal": {{
    "renewal_status": "auto_renew | manual_renewal | expired | expiring_soon | no_renewal",
    "auto_renew": boolean,
    "notice_period_days": integer or null,
    "renewal_term_months": integer or null,
    "effective_date": "YYYY-MM-DD or null",
    "expiry_date": "YYYY-MM-DD or null",
    "extracted_text": "relevant quoted text"
  }},

  "confidence": 0.0-1.0 (your confidence in extraction accuracy)
}}

For security.status:
- "compliant": Has comprehensive security terms (incident notification, audit rights, data protection)
- "needs_review": Has some security terms but missing key elements
- "missing": No meaningful security provisions
- "not_applicable": Security requirements not relevant to this contract type

CONTRACT TEXT:
{contract_text}

Return ONLY valid JSON, no other text."""


class ClauseExtractor:
    """Extract structured clause information from contract text using Claude."""

    def __init__(self, api_key: Optional[str] = None, model: str = "claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = model

    def extract(self, contract_text: str, file_name: str = "") -> tuple[ClauseExtraction, dict]:
        """Extract clauses from contract text.

        Returns:
            Tuple of (ClauseExtraction, metadata dict with vendor_name, contract_type, dates, confidence)
        """
        prompt = EXTRACTION_PROMPT.format(contract_text=contract_text[:50000])

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=EXTRACTION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = response.content[0].text
        data = self._parse_json_response(response_text)

        clauses = self._build_clause_extraction(data)
        metadata = {
            "vendor_name": data.get("vendor_name"),
            "contract_type": data.get("contract_type"),
            "effective_date": self._parse_date(data.get("effective_date")),
            "expiry_date": self._parse_date(data.get("expiry_date")),
            "confidence": data.get("confidence", 0.7),
        }

        return clauses, metadata

    def _parse_json_response(self, text: str) -> dict:
        """Parse JSON from LLM response, handling common issues."""
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
        """Parse date string to date object."""
        if not date_str:
            return None
        try:
            return date.fromisoformat(date_str)
        except (ValueError, TypeError):
            return None

    def _build_clause_extraction(self, data: dict) -> ClauseExtraction:
        """Build ClauseExtraction from parsed JSON."""
        from src.schemas.contract import SecurityClause, RoyaltyTerms, RenewalTerms

        security_data = data.get("security", {})
        security = SecurityClause(
            status=ComplianceStatus(security_data.get("status", "needs_review")),
            has_security_requirements=security_data.get("has_security_requirements", False),
            has_incident_notification=security_data.get("has_incident_notification", False),
            has_audit_rights=security_data.get("has_audit_rights", False),
            has_compliance_certifications=security_data.get("has_compliance_certifications", False),
            has_data_protection=security_data.get("has_data_protection", False),
            gaps=security_data.get("gaps", []),
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
        renewal_status_str = renewal_data.get("renewal_status", "manual_renewal")
        try:
            renewal_status = RenewalStatus(renewal_status_str)
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

        return ClauseExtraction(
            security=security,
            royalty=royalty,
            renewal=renewal,
        )
