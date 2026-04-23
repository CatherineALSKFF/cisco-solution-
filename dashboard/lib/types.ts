export type RiskLevel = "red" | "yellow" | "green";

export interface ContractSummary {
  total_contracts: number;
  by_risk_level: {
    red: number;
    yellow: number;
    green: number;
  };
  expiring_in_90_days: number;
}

export interface RiskFlag {
  level: RiskLevel;
  category: string;
  title: string;
  description: string;
  recommendation?: string;
}

export interface ClauseComparison {
  clause_type: string;
  match_status: string;
  similarity_score: number;
  gaps: string[];
  reasoning: string;
}

export interface SecurityClause {
  status: string;
  has_security_requirements: boolean;
  has_incident_notification: boolean;
  has_audit_rights: boolean;
  has_compliance_certifications: boolean;
  has_data_protection: boolean;
  gaps: string[];
  extracted_text?: string;
}

export interface RoyaltyTerms {
  has_royalty: boolean;
  royalty_type?: string;
  royalty_amount?: string;
  payment_frequency?: string;
  reporting_required: boolean;
  extracted_text?: string;
}

export interface RenewalTerms {
  renewal_status: string;
  auto_renew: boolean;
  notice_period_days?: number;
  renewal_term_months?: number;
  effective_date?: string;
  expiry_date?: string;
  days_until_expiry?: number;
  extracted_text?: string;
}

export interface ClauseExtraction {
  security: SecurityClause;
  royalty: RoyaltyTerms;
  renewal: RenewalTerms;
}

export interface Contract {
  contract_id: string;
  file_name: string;
  vendor_name?: string;
  contract_type?: string;
  effective_date?: string;
  expiry_date?: string;
  clauses: ClauseExtraction;
  comparisons: ClauseComparison[];
  risk_flags: RiskFlag[];
  overall_risk_level: RiskLevel;
  confidence: number;
  processing_time_ms?: number;
  raw_text_length?: number;
}
