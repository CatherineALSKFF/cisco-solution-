"use client";

import { motion } from "framer-motion";
import { Contract, RiskLevel } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
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
  onFilterChange,
}: ContractsTableProps) {
  const filters: { label: string; value: RiskLevel | "all"; color?: string }[] = [
    { label: "All", value: "all" },
    { label: "High Risk", value: "red", color: "var(--risk-high)" },
    { label: "Medium", value: "yellow", color: "var(--risk-medium)" },
    { label: "Low", value: "green", color: "var(--risk-low)" },
  ];

  const filtered =
    filterLevel === "all"
      ? contracts
      : contracts.filter((c) => c.overall_risk_level === filterLevel);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`relative px-4 py-2 text-xs font-medium rounded-md transition-all duration-150 ${
                filterLevel === f.value
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {f.color && filterLevel === f.value && (
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
              )}
              <span className={f.color && filterLevel === f.value ? "ml-2" : ""}>
                {f.label}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {filtered.length}
          </span>
          <span className="text-xs text-[var(--text-muted)]">contracts</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-[var(--border-strong)]">
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest bg-white">
                Vendor
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest bg-white">
                Type
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest bg-white">
                Expires
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest bg-white">
                Risk
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest bg-white">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((contract, i) => {
              const days = daysUntil(contract.expiry_date);
              const isExpiringSoon = days !== null && days <= 90 && days > 0;
              const isExpired = days !== null && days <= 0;
              const isSelected = selectedId === contract.contract_id;

              return (
                <motion.tr
                  key={contract.contract_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  onClick={() => onSelect(contract)}
                  className={`group cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-[var(--accent-light)]"
                      : "hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-10 rounded-full transition-all duration-150"
                        style={{
                          backgroundColor:
                            contract.overall_risk_level === "red"
                              ? "var(--risk-high)"
                              : contract.overall_risk_level === "yellow"
                              ? "var(--risk-medium)"
                              : "var(--risk-low)",
                          opacity: isSelected ? 1 : 0.5,
                        }}
                      />
                      <div>
                        <div className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          {contract.vendor_name || "Unknown Vendor"}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          {contract.contract_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {contract.contract_type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`text-sm font-medium ${
                        isExpired
                          ? "text-[var(--risk-high)]"
                          : isExpiringSoon
                          ? "text-[var(--risk-medium)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {formatDate(contract.expiry_date)}
                    </div>
                    {days !== null && (
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isExpired
                            ? "text-[var(--risk-high)]"
                            : isExpiringSoon
                            ? "text-[var(--risk-medium)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {isExpired ? "Expired" : `${days} days`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <RiskBadge level={contract.overall_risk_level} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${contract.confidence * 100}%`,
                            backgroundColor:
                              contract.confidence >= 0.9
                                ? "var(--risk-low)"
                                : contract.confidence >= 0.7
                                ? "var(--risk-medium)"
                                : "var(--risk-high)",
                          }}
                        />
                      </div>
                      <span className="font-mono text-sm text-[var(--text-secondary)] w-10 text-right">
                        {Math.round(contract.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
