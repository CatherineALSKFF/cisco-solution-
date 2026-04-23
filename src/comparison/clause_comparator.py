import os
from typing import Optional

from anthropic import Anthropic

from src.schemas import ClauseComparison, ClauseExtraction


COMPARISON_SYSTEM_PROMPT = """You are a legal compliance analyst comparing contract clauses against corporate standards.

Your task is to evaluate whether extracted contract terms meet Cisco's standard requirements.
Be specific about what is present, what is missing, and what needs improvement.
Provide actionable reasoning."""


COMPARISON_PROMPT = """Compare the following extracted clause against Cisco's standard requirements.

CLAUSE TYPE: {clause_type}

EXTRACTED FROM CONTRACT:
{extracted_clause}

CISCO STANDARD REQUIREMENT:
{standard_clause}

Evaluate and return JSON with this structure:
{{
  "match_status": "match | partial_match | missing | non_standard",
  "similarity_score": 0.0-1.0,
  "gaps": ["list of specific missing or deficient elements"],
  "reasoning": "explanation of the comparison result"
}}

match_status definitions:
- "match": Meets or exceeds standard requirements
- "partial_match": Has some required elements but missing others
- "missing": Clause type not present in contract
- "non_standard": Present but significantly deviates from standards

Return ONLY valid JSON."""


class ClauseComparator:
    """Compare extracted clauses against Cisco standard clauses."""

    def __init__(self, api_key: Optional[str] = None, model: str = "claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = model
        self._load_standards()

    def _load_standards(self):
        """Load Cisco standard clauses from files."""
        standards_dir = os.path.join(os.path.dirname(__file__), "..", "..", "standards")

        self.standards = {
            "security": self._read_standard(os.path.join(standards_dir, "cisco_security_clause.md")),
        }

    def _read_standard(self, path: str) -> str:
        """Read a standard clause file."""
        try:
            with open(path, "r") as f:
                return f.read()
        except FileNotFoundError:
            return ""

    def compare_security(self, clauses: ClauseExtraction) -> ClauseComparison:
        """Compare security clause against Cisco standard."""
        extracted = self._format_security_clause(clauses.security)
        return self._compare_clause("security", extracted, self.standards.get("security", ""))

    def compare_all(self, clauses: ClauseExtraction) -> list[ClauseComparison]:
        """Compare all relevant clauses against standards."""
        comparisons = []

        if self.standards.get("security"):
            comparisons.append(self.compare_security(clauses))

        return comparisons

    def _format_security_clause(self, security) -> str:
        """Format security clause data for comparison."""
        elements = []
        if security.has_security_requirements:
            elements.append("- Has security requirements")
        if security.has_incident_notification:
            elements.append("- Has incident notification requirement")
        if security.has_audit_rights:
            elements.append("- Has audit rights")
        if security.has_compliance_certifications:
            elements.append("- Requires compliance certifications")
        if security.has_data_protection:
            elements.append("- Has data protection terms")

        if security.gaps:
            elements.append(f"- Identified gaps: {', '.join(security.gaps)}")

        if security.extracted_text:
            elements.append(f"\nExtracted text:\n{security.extracted_text}")

        if not elements:
            return "No security provisions found in contract."

        return "\n".join(elements)

    def _compare_clause(self, clause_type: str, extracted: str, standard: str) -> ClauseComparison:
        """Compare a single clause against its standard using LLM."""
        if not standard:
            return ClauseComparison(
                clause_type=clause_type,
                match_status="missing",
                similarity_score=0.0,
                gaps=["No standard defined for comparison"],
                reasoning="Cannot compare - no standard clause defined.",
            )

        prompt = COMPARISON_PROMPT.format(
            clause_type=clause_type,
            extracted_clause=extracted,
            standard_clause=standard,
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=COMPARISON_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        return self._parse_comparison_response(clause_type, response.content[0].text)

    def _parse_comparison_response(self, clause_type: str, text: str) -> ClauseComparison:
        """Parse LLM comparison response."""
        import json

        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])

        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            data = json.loads(text[start:end])

            return ClauseComparison(
                clause_type=clause_type,
                match_status=data.get("match_status", "needs_review"),
                similarity_score=data.get("similarity_score", 0.5),
                gaps=data.get("gaps", []),
                reasoning=data.get("reasoning", ""),
            )
        except (json.JSONDecodeError, ValueError):
            return ClauseComparison(
                clause_type=clause_type,
                match_status="needs_review",
                similarity_score=0.5,
                gaps=["Failed to parse comparison"],
                reasoning=text[:500],
            )
