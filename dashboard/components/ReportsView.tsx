"use client";

import { motion } from "framer-motion";
import { Contract, ContractSummary } from "@/lib/types";

interface ReportsViewProps {
  summary: ContractSummary;
  contracts: Contract[];
}

export function ReportsView({ summary, contracts }: ReportsViewProps) {
  const highRiskContracts = contracts.filter(c => c.overall_risk_level === "red");
  const expiringContracts = contracts.filter(c => {
    if (!c.expiry_date) return false;
    const days = Math.floor((new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  });

  const securityGaps = contracts.reduce((acc, c) => {
    c.risk_flags.filter(f => f.category === "security").forEach(f => {
      acc[f.title] = (acc[f.title] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topSecurityGaps = Object.entries(securityGaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const staleContracts = contracts.filter(c => {
    if (!c.effective_date) return false;
    const years = (Date.now() - new Date(c.effective_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
    return years >= 5;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reports</h1>
        <p className="text-[var(--text-muted)] mt-1">Contract portfolio analysis and risk reports</p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Executive Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Executive Summary</h2>
          <div className="grid grid-cols-5 gap-6">
            <div className="text-center p-4 bg-[var(--bg-base)] rounded-xl">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{summary.total_contracts}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Total Contracts</p>
            </div>
            <div className="text-center p-4 bg-[var(--risk-high-soft)] rounded-xl">
              <p className="text-3xl font-bold text-[var(--risk-high)]">{summary.by_risk_level.red}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">High Risk</p>
            </div>
            <div className="text-center p-4 bg-[var(--risk-medium-soft)] rounded-xl">
              <p className="text-3xl font-bold text-[var(--risk-medium)]">{summary.by_risk_level.yellow}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Medium Risk</p>
            </div>
            <div className="text-center p-4 bg-[var(--risk-low-soft)] rounded-xl">
              <p className="text-3xl font-bold text-[var(--risk-low)]">{summary.by_risk_level.green}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Low Risk</p>
            </div>
            <div className="text-center p-4 bg-[var(--bg-base)] rounded-xl">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{staleContracts.length}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Stale (5+ yrs)</p>
            </div>
          </div>
        </motion.div>

        {/* Security Gaps Report */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Security Gap Analysis</h2>
            <span className="text-xs bg-[var(--risk-high-bg)] text-[var(--risk-high)] px-2 py-1 rounded-full">
              {Object.values(securityGaps).reduce((a, b) => a + b, 0)} total gaps
            </span>
          </div>
          <div className="space-y-3">
            {topSecurityGaps.map(([gap, count], i) => (
              <div key={gap} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)] truncate flex-1 mr-4">{gap}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--risk-high)] rounded-full"
                      style={{ width: `${(count / contracts.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)] w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expiring Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Expiring in 90 Days</h2>
            <span className="text-xs bg-[var(--risk-medium-bg)] text-[var(--risk-medium)] px-2 py-1 rounded-full">
              {expiringContracts.length} contracts
            </span>
          </div>
          {expiringContracts.length > 0 ? (
            <div className="space-y-3">
              {expiringContracts.slice(0, 5).map((contract) => {
                const days = Math.floor((new Date(contract.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={contract.contract_id} className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{contract.vendor_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{contract.contract_type}</p>
                    </div>
                    <span className={`text-sm font-medium ${days <= 30 ? 'text-[var(--risk-high)]' : 'text-[var(--risk-medium)]'}`}>
                      {days} days
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No contracts expiring soon</p>
          )}
        </motion.div>

        {/* High Risk Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">High Risk Contracts</h2>
            <span className="text-xs bg-[var(--risk-high-bg)] text-[var(--risk-high)] px-2 py-1 rounded-full">
              {highRiskContracts.length} contracts
            </span>
          </div>
          <div className="space-y-3">
            {highRiskContracts.slice(0, 5).map((contract) => (
              <div key={contract.contract_id} className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{contract.vendor_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{contract.risk_flags.length} risk flags</p>
                </div>
                <span className="text-xs bg-[var(--risk-high-bg)] text-[var(--risk-high)] px-2 py-0.5 rounded">
                  {Math.round(contract.confidence * 100)}% conf
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stale Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Stale Contracts (5+ Years)</h2>
            <span className="text-xs bg-[var(--risk-medium-bg)] text-[var(--risk-medium)] px-2 py-1 rounded-full">
              {staleContracts.length} need review
            </span>
          </div>
          {staleContracts.length > 0 ? (
            <div className="space-y-3">
              {staleContracts.slice(0, 5).map((contract) => {
                const years = Math.floor((Date.now() - new Date(contract.effective_date!).getTime()) / (1000 * 60 * 60 * 24 * 365));
                return (
                  <div key={contract.contract_id} className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{contract.vendor_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Effective: {new Date(contract.effective_date!).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-medium ${years >= 10 ? 'text-[var(--risk-high)]' : 'text-[var(--risk-medium)]'}`}>
                      {years} years old
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No stale contracts found</p>
          )}
        </motion.div>
      </div>

      {/* Export Actions */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-[var(--text-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF Report
        </button>
        <button className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
        <button className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Report
        </button>
      </div>
    </div>
  );
}
