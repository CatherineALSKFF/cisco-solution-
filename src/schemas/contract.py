from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NEEDS_REVIEW = "needs_review"
    MISSING = "missing"
    NOT_APPLICABLE = "not_applicable"


class RenewalStatus(str, Enum):
    AUTO_RENEW = "auto_renew"
    MANUAL_RENEWAL = "manual_renewal"
    EXPIRED = "expired"
    EXPIRING_SOON = "expiring_soon"
    NO_RENEWAL = "no_renewal"


class RoyaltyTerms(BaseModel):
    has_royalty: bool = Field(description="Whether the contract includes royalty payments")
    royalty_type: Optional[str] = Field(None, description="Type: per-device, per-seat, percentage, minimum commitment")
    royalty_amount: Optional[str] = Field(None, description="Amount or rate, e.g., 'USD 1.85 per device'")
    payment_frequency: Optional[str] = Field(None, description="quarterly, monthly, annual, etc.")
    reporting_required: bool = Field(False, description="Whether usage/royalty reporting is required")
    extracted_text: Optional[str] = Field(None, description="Relevant text from contract")


class RenewalTerms(BaseModel):
    renewal_status: RenewalStatus
    auto_renew: bool = Field(description="Whether contract auto-renews")
    notice_period_days: Optional[int] = Field(None, description="Days notice required to terminate/non-renew")
    renewal_term_months: Optional[int] = Field(None, description="Length of renewal term in months")
    effective_date: Optional[date] = Field(None)
    expiry_date: Optional[date] = Field(None)
    days_until_expiry: Optional[int] = Field(None)
    extracted_text: Optional[str] = Field(None, description="Relevant text from contract")


class SecurityClause(BaseModel):
    status: ComplianceStatus
    has_security_requirements: bool = Field(description="Whether contract includes security requirements")
    has_incident_notification: bool = Field(False, description="Requires notification of security incidents")
    has_audit_rights: bool = Field(False, description="Cisco has audit rights")
    has_compliance_certifications: bool = Field(False, description="Requires SOC2, ISO27001, etc.")
    has_data_protection: bool = Field(False, description="Includes data protection/privacy terms")
    gaps: list[str] = Field(default_factory=list, description="Missing or weak security provisions")
    extracted_text: Optional[str] = Field(None, description="Relevant text from contract")


class RiskFlag(BaseModel):
    level: RiskLevel
    category: str = Field(description="security, royalty, renewal, compliance")
    title: str
    description: str
    recommendation: Optional[str] = Field(None)


class ClauseExtraction(BaseModel):
    security: SecurityClause
    royalty: RoyaltyTerms
    renewal: RenewalTerms
    raw_sections: dict[str, str] = Field(default_factory=dict, description="Extracted text by section")


class ClauseComparison(BaseModel):
    clause_type: str
    match_status: str = Field(description="match, partial_match, missing, non_standard")
    similarity_score: float = Field(ge=0.0, le=1.0)
    gaps: list[str] = Field(default_factory=list)
    reasoning: str


class ContractAnalysis(BaseModel):
    contract_id: str
    file_name: str
    vendor_name: Optional[str] = None
    contract_type: Optional[str] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None

    clauses: ClauseExtraction
    comparisons: list[ClauseComparison] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)

    overall_risk_level: RiskLevel = RiskLevel.GREEN
    confidence: float = Field(ge=0.0, le=1.0, description="Model confidence in extraction accuracy")

    processing_time_ms: Optional[int] = None
    raw_text_length: Optional[int] = None
