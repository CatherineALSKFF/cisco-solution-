"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Contract } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { formatDate } from "@/lib/utils";

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
                          <p className="text-xs text-[var(--accent)] mt-2">
                            → {flag.recommendation}
                          </p>
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
