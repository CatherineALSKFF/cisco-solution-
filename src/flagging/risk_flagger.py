from datetime import date, timedelta
from typing import Optional

from src.schemas import (
    ClauseExtraction,
    ClauseComparison,
    RiskFlag,
    RiskLevel,
    ComplianceStatus,
)


class RiskFlagger:
    """Generate risk flags based on extracted clauses and comparisons."""

    def __init__(self):
        self.expiry_warning_days = 90
        self.expiry_critical_days = 30

    def generate_flags(
        self,
        clauses: ClauseExtraction,
        comparisons: list[ClauseComparison],
        expiry_date: Optional[date] = None,
    ) -> tuple[list[RiskFlag], RiskLevel]:
        """Generate all risk flags and determine overall risk level."""
        flags = []

        flags.extend(self._check_security_risks(clauses))
        flags.extend(self._check_royalty_risks(clauses))
        flags.extend(self._check_renewal_risks(clauses, expiry_date))
        flags.extend(self._check_comparison_risks(comparisons))

        overall_level = self._calculate_overall_risk(flags)

        return flags, overall_level

    def _check_security_risks(self, clauses: ClauseExtraction) -> list[RiskFlag]:
        """Check for security-related risks."""
        flags = []
        security = clauses.security

        if security.status == ComplianceStatus.MISSING:
            flags.append(RiskFlag(
                level=RiskLevel.RED,
                category="security",
                title="Missing Security Provisions",
                description="Contract has no meaningful security requirements.",
                recommendation="Add Cisco standard security exhibit before renewal.",
            ))
        elif security.status == ComplianceStatus.NEEDS_REVIEW:
            flags.append(RiskFlag(
                level=RiskLevel.YELLOW,
                category="security",
                title="Incomplete Security Terms",
                description="Contract has some security terms but is missing key elements.",
                recommendation="Review and strengthen security provisions.",
            ))

        if not security.has_incident_notification:
            flags.append(RiskFlag(
                level=RiskLevel.YELLOW,
                category="security",
                title="No Incident Notification Requirement",
                description="Contract does not require vendor to notify Cisco of security incidents.",
                recommendation="Add security incident notification clause (24-72 hour requirement).",
            ))

        if not security.has_data_protection and security.has_security_requirements:
            flags.append(RiskFlag(
                level=RiskLevel.YELLOW,
                category="security",
                title="Missing Data Protection Terms",
                description="Security provisions exist but no explicit data protection/privacy terms.",
                recommendation="Add data protection addendum.",
            ))

        return flags

    def _check_royalty_risks(self, clauses: ClauseExtraction) -> list[RiskFlag]:
        """Check for royalty/payment-related risks."""
        flags = []
        royalty = clauses.royalty

        if royalty.has_royalty and royalty.reporting_required:
            flags.append(RiskFlag(
                level=RiskLevel.YELLOW,
                category="royalty",
                title="Royalty Reporting Required",
                description=f"Contract requires periodic royalty reporting ({royalty.payment_frequency or 'unspecified frequency'}).",
                recommendation="Ensure reporting process is documented and tracked.",
            ))

        if royalty.has_royalty and not royalty.royalty_amount:
            flags.append(RiskFlag(
                level=RiskLevel.YELLOW,
                category="royalty",
                title="Unclear Royalty Amount",
                description="Contract includes royalties but amount/rate is not clearly specified.",
                recommendation="Clarify royalty calculation method.",
            ))

        return flags

    def _check_renewal_risks(
        self,
        clauses: ClauseExtraction,
        expiry_date: Optional[date] = None,
    ) -> list[RiskFlag]:
        """Check for renewal/expiration-related risks."""
        flags = []
        renewal = clauses.renewal

        check_date = expiry_date or renewal.expiry_date
        if check_date:
            days_until = (check_date - date.today()).days
            renewal.days_until_expiry = days_until

            if days_until <= 0:
                flags.append(RiskFlag(
                    level=RiskLevel.RED,
                    category="renewal",
                    title="Contract Expired",
                    description=f"Contract expired on {check_date}.",
                    recommendation="Immediate action required - renew or terminate relationship.",
                ))
            elif days_until <= self.expiry_critical_days:
                flags.append(RiskFlag(
                    level=RiskLevel.RED,
                    category="renewal",
                    title="Contract Expiring Imminently",
                    description=f"Contract expires in {days_until} days ({check_date}).",
                    recommendation="Urgent: initiate renewal discussions or transition planning.",
                ))
            elif days_until <= self.expiry_warning_days:
                flags.append(RiskFlag(
                    level=RiskLevel.YELLOW,
                    category="renewal",
                    title="Contract Expiring Soon",
                    description=f"Contract expires in {days_until} days ({check_date}).",
                    recommendation="Begin renewal planning and vendor discussions.",
                ))

        if renewal.auto_renew:
            notice_days = renewal.notice_period_days or 30
            if check_date:
                notice_deadline = check_date - timedelta(days=notice_days)
                days_to_deadline = (notice_deadline - date.today()).days

                if days_to_deadline <= 30 and days_to_deadline > 0:
                    flags.append(RiskFlag(
                        level=RiskLevel.YELLOW,
                        category="renewal",
                        title="Auto-Renewal Notice Deadline Approaching",
                        description=f"Must notify by {notice_deadline} ({days_to_deadline} days) to prevent auto-renewal.",
                        recommendation="Decide whether to renew or provide non-renewal notice.",
                    ))

        if not renewal.auto_renew and check_date:
            days_until = (check_date - date.today()).days
            if 0 < days_until <= self.expiry_warning_days:
                flags.append(RiskFlag(
                    level=RiskLevel.YELLOW,
                    category="renewal",
                    title="Manual Renewal Required",
                    description="Contract does not auto-renew and will expire without action.",
                    recommendation="Initiate renewal negotiations.",
                ))

        return flags

    def _check_comparison_risks(self, comparisons: list[ClauseComparison]) -> list[RiskFlag]:
        """Check for risks based on clause comparisons."""
        flags = []

        for comp in comparisons:
            if comp.match_status == "missing":
                flags.append(RiskFlag(
                    level=RiskLevel.RED,
                    category="compliance",
                    title=f"Missing {comp.clause_type.title()} Clause",
                    description=f"Contract is missing required {comp.clause_type} provisions.",
                    recommendation=f"Add Cisco standard {comp.clause_type} clause.",
                ))
            elif comp.match_status == "non_standard":
                flags.append(RiskFlag(
                    level=RiskLevel.RED,
                    category="compliance",
                    title=f"Non-Standard {comp.clause_type.title()} Terms",
                    description=f"{comp.clause_type.title()} terms deviate significantly from Cisco standards.",
                    recommendation=f"Review gaps: {', '.join(comp.gaps[:3])}",
                ))
            elif comp.match_status == "partial_match" and comp.similarity_score < 0.6:
                flags.append(RiskFlag(
                    level=RiskLevel.YELLOW,
                    category="compliance",
                    title=f"Weak {comp.clause_type.title()} Terms",
                    description=f"{comp.clause_type.title()} clause partially meets standards (score: {comp.similarity_score:.0%}).",
                    recommendation=f"Strengthen: {', '.join(comp.gaps[:2])}",
                ))

        return flags

    def _calculate_overall_risk(self, flags: list[RiskFlag]) -> RiskLevel:
        """Calculate overall risk level from individual flags."""
        if any(f.level == RiskLevel.RED for f in flags):
            return RiskLevel.RED
        if any(f.level == RiskLevel.YELLOW for f in flags):
            return RiskLevel.YELLOW
        return RiskLevel.GREEN
