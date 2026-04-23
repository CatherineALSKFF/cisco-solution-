"use client";

import { motion } from "framer-motion";
import { Contract, RiskLevel } from "@/lib/types";
import { formatDate, daysUntil } from "@/lib/utils";

interface ContractsTableProps {
  contracts: Contract[];
  onSelect: (contract: Contract) => void;
  selectedId?: string;
  filterLevel: RiskLevel | "all";
  onFilterChange: (level: RiskLevel | "all") => void;
}

export function ContractsTable({
  contracts,
  onSelect,
  selectedId,
  filterLevel,
}: ContractsTableProps) {
  const filtered =
    filterLevel === "all"
      ? contracts
      : contracts.filter((c) => c.overall_risk_level === filterLevel);

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="w-12 px-4 py-3.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
              />
            </th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Vendor
            </th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Expires
            </th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Risk
            </th>
            <th className="text-right px-4 py-3.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Confidence
            </th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((contract, i) => {
            const days = daysUntil(contract.expiry_date);
            const isExpired = days !== null && days <= 0;
            const isSelected = selectedId === contract.contract_id;

            return (
              <motion.tr
                key={contract.contract_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015, duration: 0.2 }}
                onClick={() => onSelect(contract)}
                className={`group cursor-pointer border-b border-[var(--border)] transition-all duration-150 ${
                  isSelected
                    ? "bg-[var(--accent-soft)]"
                    : "hover:bg-[var(--bg-hover)]"
                }`}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {contract.vendor_name || "Unknown Vendor"}
                  </div>
                  <div className="text-[11px] text-[var(--text-faint)] font-mono mt-0.5">
                    {contract.contract_id}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                  {contract.contract_type || "—"}
                </td>
                <td className="px-4 py-4">
                  <div className={`text-sm font-medium ${isExpired ? "text-[var(--risk-high)]" : "text-[var(--text-primary)]"}`}>
                    {formatDate(contract.expiry_date)}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isExpired ? "text-[var(--risk-high)]" : "text-[var(--text-muted)]"}`}>
                    {isExpired ? "Expired" : days !== null ? `${days} days` : ""}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                    contract.overall_risk_level === "red" ? "text-[var(--risk-high)]" :
                    contract.overall_risk_level === "yellow" ? "text-[var(--risk-medium)]" :
                    "text-[var(--risk-low)]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      contract.overall_risk_level === "red" ? "bg-[var(--risk-high)]" :
                      contract.overall_risk_level === "yellow" ? "bg-[var(--risk-medium)]" :
                      "bg-[var(--risk-low)]"
                    }`} />
                    {contract.overall_risk_level === "red" ? "High" :
                     contract.overall_risk_level === "yellow" ? "Medium" : "Low"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-20 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-300"
                        style={{ width: `${contract.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)] w-10 text-right font-medium">
                      {Math.round(contract.confidence * 100)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
