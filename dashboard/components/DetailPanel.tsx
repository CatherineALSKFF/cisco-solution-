"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contract, RiskFlag } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { formatDate } from "@/lib/utils";

const recommendationDetails: Record<string, { explanation: string; action: string }> = {
  "Add Cisco standard security clause": {
    explanation: "This contract lacks Cisco's standard security requirements language. Without this clause, the vendor may not be held to Cisco's security standards, creating potential liability and compliance gaps.",
    action: "Request vendor to sign Cisco Security Addendum (CSA-2024) or incorporate standard security language into contract amendment.",
  },
  "Add security incident notification clause (24-72 hour requirement)": {
    explanation: "Per Cisco PSIRT policy, vendors must notify Cisco of security incidents within 24-72 hours. This contract does not contain such a requirement, which could delay incident response.",
    action: "Add clause requiring vendor notification within 24 hours for critical incidents, 72 hours for standard incidents. Use template from Legal Ops playbook.",
  },
  "Add vulnerability disclosure requirements": {
    explanation: "Contract lacks terms requiring the vendor to disclose known vulnerabilities in their software. This is a critical gap for supply chain security.",
    action: "Include coordinated vulnerability disclosure (CVD) requirements per Cisco's vendor security standards.",
  },
  "Add audit rights for security compliance": {
    explanation: "Without audit rights, Cisco cannot verify vendor compliance with security requirements. This limits visibility into potential risks.",
    action: "Add right-to-audit clause with 30-day notice period for security compliance verification.",
  },
  "Review royalty calculation methodology": {
    explanation: "The royalty terms in this contract may require detailed tracking and reporting. Ensure finance team has visibility into calculation requirements.",
    action: "Schedule review with Finance to confirm royalty tracking systems are configured correctly.",
  },
  "Verify compliance certifications are current": {
    explanation: "Contract references compliance certifications (SOC 2, ISO 27001, etc.) that may have expired or need renewal verification.",
    action: "Request current certification documentation from vendor and set calendar reminder for annual re-verification.",
  },
  "Schedule periodic review to assess alignment with current Cisco security and commercial standards.": {
    explanation: "Contracts older than 5 years may not reflect current security requirements, compliance standards, or market-competitive terms. Industry security standards have evolved significantly.",
    action: "Add this contract to the quarterly review queue. Compare current terms against the latest Cisco Security Standards Checklist and commercial benchmarks.",
  },
  "Initiate contract refresh process. Prioritize security clause updates and PSIRT policy alignment.": {
    explanation: "This contract predates several major security policy updates. Critical PSIRT requirements (vulnerability disclosure, incident notification timelines, SBOM requirements) may be missing entirely.",
    action: "Schedule vendor meeting to negotiate updated security exhibit. Use the 2024 Cisco Security Addendum template. Target completion within 90 days.",
  },
  "URGENT: Schedule contract modernization review. Update security provisions to current PSIRT standards, renegotiate commercial terms, and validate vendor compliance.": {
    explanation: "Legacy contracts over 10 years old pose significant risk. Security landscape has fundamentally changed - zero-trust architecture, supply chain security (SolarWinds), ransomware threats all emerged after this contract was executed.",
    action: "Escalate to Legal Ops leadership. Consider whether to renew/renegotiate or transition to alternative vendor with modern contract terms. Full security audit of vendor required.",
  },
  "CRITICAL: Add clause prohibiting backdoors per Cisco PSIRT policy.": {
    explanation: "Per Cisco Security Vulnerability Policy, all vendor software must be free of backdoors, undocumented access mechanisms, or covert channels. This is a zero-tolerance requirement.",
    action: "Add explicit prohibition clause: 'Vendor warrants that the Software contains no backdoors, undocumented administrative access, hardcoded credentials, or covert communication channels.'",
  },
  "CRITICAL: Add clause prohibiting hardcoded credentials per Cisco PSIRT policy.": {
    explanation: "Hardcoded credentials are a critical security vulnerability (CWE-798). They cannot be changed by customers and represent a persistent attack vector.",
    action: "Require vendor attestation that no hardcoded credentials exist. Add clause requiring credential rotation capabilities and prohibiting default passwords.",
  },
  "CRITICAL: Add 24-72 hour incident notification requirement per Cisco PSIRT policy.": {
    explanation: "Timely notification of security incidents is essential for Cisco's incident response. Without this requirement, Cisco may not learn of breaches affecting its supply chain.",
    action: "Add clause: 'Vendor shall notify Cisco within 24 hours of discovering any security incident affecting Cisco data or systems, and within 72 hours for incidents affecting vendor systems used in Cisco deliverables.'",
  },
  "CRITICAL: Add vulnerability disclosure requirements per Cisco PSIRT policy.": {
    explanation: "ISO/IEC 29147:2018 defines vulnerability disclosure processes. Without this, vendors may delay or avoid disclosing vulnerabilities that could affect Cisco products.",
    action: "Require vendor to maintain a documented vulnerability disclosure program and provide Cisco with advance notice (90 days minimum) before public disclosure of vulnerabilities in licensed software.",
  },
};

interface DetailPanelProps {
  contract: Contract | null;
  onClose: () => void;
}

export function DetailPanel({ contract, onClose }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {contract && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[600px] bg-[var(--bg-surface)] border-l border-[var(--border)] z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {contract.vendor_name || "Unknown Vendor"}
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-mono">
                  {contract.contract_id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview */}
              <Section title="Overview">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contract Type" value={contract.contract_type} />
                  <Field label="Risk Level">
                    <RiskBadge level={contract.overall_risk_level} />
                  </Field>
                  <Field
                    label="Effective Date"
                    value={formatDate(contract.effective_date)}
                  />
                  <Field
                    label="Expiry Date"
                    value={formatDate(contract.expiry_date)}
                  />
                  <Field
                    label="Confidence"
                    value={`${Math.round(contract.confidence * 100)}%`}
                    mono
                  />
                  <Field
                    label="Processing Time"
                    value={`${contract.processing_time_ms}ms`}
                    mono
                  />
                </div>
              </Section>

              {/* Risk Flags */}
              {contract.risk_flags.length > 0 && (
                <Section title={`Risk Flags (${contract.risk_flags.length})`}>
                  <div className="space-y-3">
                    {contract.risk_flags.map((flag, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <RiskBadge level={flag.level} />
                          <span className="text-xs text-[var(--text-muted)] uppercase">
                            {flag.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {flag.title}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          {flag.description}
                        </p>
                        {flag.recommendation && (
                          <RecommendationLink recommendation={flag.recommendation} />
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Security Clause */}
              <Section title="Security Clause">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      active={contract.clauses.security.has_security_requirements}
                      label="Security Requirements"
                    />
                    <Chip
                      active={contract.clauses.security.has_incident_notification}
                      label="Incident Notification"
                    />
                    <Chip
                      active={contract.clauses.security.has_audit_rights}
                      label="Audit Rights"
                    />
                    <Chip
                      active={contract.clauses.security.has_compliance_certifications}
                      label="Compliance Certs"
                    />
                    <Chip
                      active={contract.clauses.security.has_data_protection}
                      label="Data Protection"
                    />
                  </div>
                  {contract.clauses.security.gaps.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-2">
                        Gaps
                      </p>
                      <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        {contract.clauses.security.gaps.slice(0, 5).map((gap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[var(--risk-medium)]">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>

              {/* Royalty Terms */}
              <Section title="Royalty Terms">
                {contract.clauses.royalty.has_royalty ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Type"
                      value={contract.clauses.royalty.royalty_type}
                    />
                    <Field
                      label="Amount"
                      value={contract.clauses.royalty.royalty_amount}
                    />
                    <Field
                      label="Frequency"
                      value={contract.clauses.royalty.payment_frequency}
                    />
                    <Field
                      label="Reporting"
                      value={
                        contract.clauses.royalty.reporting_required
                          ? "Required"
                          : "Not required"
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    No royalty terms in this contract.
                  </p>
                )}
              </Section>

              {/* Renewal Terms */}
              <Section title="Renewal Terms">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Auto-Renew"
                    value={contract.clauses.renewal.auto_renew ? "Yes" : "No"}
                  />
                  <Field
                    label="Notice Period"
                    value={
                      contract.clauses.renewal.notice_period_days
                        ? `${contract.clauses.renewal.notice_period_days} days`
                        : "—"
                    }
                  />
                  <Field
                    label="Renewal Term"
                    value={
                      contract.clauses.renewal.renewal_term_months
                        ? `${contract.clauses.renewal.renewal_term_months} months`
                        : "—"
                    }
                  />
                  <Field
                    label="Status"
                    value={contract.clauses.renewal.renewal_status}
                  />
                </div>
              </Section>

              {/* Comparisons */}
              {contract.comparisons.length > 0 && (
                <Section title="Standard Clause Comparison">
                  {contract.comparisons.map((comp, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {comp.clause_type}
                        </span>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {Math.round(comp.similarity_score * 100)}% match
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all"
                          style={{ width: `${comp.similarity_score * 100}%` }}
                        />
                      </div>
                      {comp.reasoning && (
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                          {comp.reasoning}
                        </p>
                      )}
                    </div>
                  ))}
                </Section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      {children || (
        <p
          className={`text-sm text-[var(--text-primary)] ${
            mono ? "font-mono" : ""
          }`}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function Chip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-md ${
        active
          ? "bg-[var(--risk-low)]/10 text-[var(--risk-low)]"
          : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
      }`}
    >
      {active ? "✓" : "✗"} {label}
    </span>
  );
}

function RecommendationLink({ recommendation }: { recommendation: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const details = recommendationDetails[recommendation] || {
    explanation: "This recommendation addresses a potential gap identified in the contract analysis.",
    action: "Review the contract terms and consult with Legal Ops for specific remediation steps.",
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors cursor-pointer"
      >
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        <span className="underline underline-offset-2 decoration-[var(--accent)]/30 group-hover:decoration-[var(--accent)]/60">
          {recommendation}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/20">
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
                  Why this matters
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {details.explanation}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
                  Recommended action
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {details.action}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
