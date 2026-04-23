"use client";

import { motion } from "framer-motion";
import { Contract } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { formatDate } from "@/lib/utils";

interface ContractDetailProps {
  contract: Contract;
  onBack: () => void;
}

export function ContractDetail({ contract, onBack }: ContractDetailProps) {
  const securityChecks = [
    { key: "has_security_requirements", label: "Security Requirements", value: contract.clauses?.security?.has_security_requirements },
    { key: "has_incident_notification", label: "Incident Notification", value: contract.clauses?.security?.has_incident_notification },
    { key: "has_audit_rights", label: "Audit Rights", value: contract.clauses?.security?.has_audit_rights },
    { key: "has_compliance_certifications", label: "Compliance Certs", value: contract.clauses?.security?.has_compliance_certifications },
    { key: "has_data_protection", label: "Data Protection", value: contract.clauses?.security?.has_data_protection },
    { key: "has_vulnerability_disclosure", label: "Vulnerability Disclosure", value: contract.clauses?.security?.has_vulnerability_disclosure },
    { key: "prohibits_backdoors", label: "Prohibits Backdoors", value: contract.clauses?.security?.prohibits_backdoors },
    { key: "prohibits_hardcoded_credentials", label: "No Hardcoded Creds", value: contract.clauses?.security?.prohibits_hardcoded_credentials },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to contracts
          </button>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {contract.vendor_name || "Unknown Vendor"}
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-mono mt-1">
            {contract.contract_id}
          </p>
        </div>
        <RiskBadge level={contract.overall_risk_level} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Contract Type</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{contract.contract_type || "—"}</p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Effective Date</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(contract.effective_date) || "—"}</p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Expiry Date</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(contract.expiry_date) || "—"}</p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Confidence</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{Math.round(contract.confidence * 100)}%</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Risk Flags */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Risk Flags ({contract.risk_flags?.length || 0})
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--risk-high)]" />
                {contract.risk_flags?.filter(f => f.level === "red").length || 0} High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--risk-medium)]" />
                {contract.risk_flags?.filter(f => f.level === "yellow").length || 0} Medium
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {contract.risk_flags?.map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-lg border-l-4 ${
                  flag.level === "red"
                    ? "bg-[var(--risk-high-bg)] border-l-[var(--risk-high)]"
                    : "bg-[var(--risk-medium-bg)] border-l-[var(--risk-medium)]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      flag.level === "red" ? "text-[var(--risk-high)]" : "text-[var(--risk-medium)]"
                    }`}>
                      {flag.level === "red" ? "HIGH" : "MEDIUM"} · {flag.category}
                    </span>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                      {flag.title}
                    </h4>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  {flag.description}
                </p>
                {flag.recommendation && (
                  <p className="text-xs text-[var(--accent)] font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {flag.recommendation}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Clauses Summary */}
        <div className="space-y-4">
          {/* Security Checklist */}
          <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
              Security Compliance
            </h4>
            <div className="space-y-2">
              {securityChecks.map((check) => (
                <div key={check.key} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{check.label}</span>
                  {check.value ? (
                    <svg className="w-4 h-4 text-[var(--risk-low)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[var(--risk-high)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Royalty Terms */}
          {contract.clauses?.royalty?.has_royalty && (
            <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                Royalty Terms
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Type</span>
                  <span className="text-[var(--text-primary)] font-medium">{contract.clauses.royalty.royalty_type || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Frequency</span>
                  <span className="text-[var(--text-primary)] font-medium">{contract.clauses.royalty.payment_frequency || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Reporting</span>
                  <span className="text-[var(--text-primary)] font-medium">{contract.clauses.royalty.reporting_required ? "Required" : "No"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Renewal Terms */}
          {contract.clauses?.renewal && (
            <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                Renewal Terms
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Auto-Renew</span>
                  <span className={`font-medium ${contract.clauses.renewal.auto_renew ? "text-[var(--risk-medium)]" : "text-[var(--text-primary)]"}`}>
                    {contract.clauses.renewal.auto_renew ? "Yes" : "No"}
                  </span>
                </div>
                {contract.clauses.renewal.notice_period_days && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Notice Period</span>
                    <span className="text-[var(--text-primary)] font-medium">{contract.clauses.renewal.notice_period_days} days</span>
                  </div>
                )}
                {contract.clauses.renewal.renewal_term_months && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Renewal Term</span>
                    <span className="text-[var(--text-primary)] font-medium">{contract.clauses.renewal.renewal_term_months} months</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison Scores */}
          {contract.comparisons && contract.comparisons.length > 0 && (
            <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                Compliance Scores
              </h4>
              <div className="space-y-3">
                {contract.comparisons.map((comp, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--text-secondary)] capitalize">{comp.clause_type}</span>
                      <span className={`font-semibold ${
                        comp.similarity_score >= 0.7 ? "text-[var(--risk-low)]" :
                        comp.similarity_score >= 0.4 ? "text-[var(--risk-medium)]" :
                        "text-[var(--risk-high)]"
                      }`}>
                        {Math.round(comp.similarity_score * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${comp.similarity_score * 100}%`,
                          backgroundColor:
                            comp.similarity_score >= 0.7 ? "var(--risk-low)" :
                            comp.similarity_score >= 0.4 ? "var(--risk-medium)" :
                            "var(--risk-high)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
