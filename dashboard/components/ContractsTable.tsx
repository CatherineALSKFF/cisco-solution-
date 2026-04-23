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
  const filters: { label: string; value: RiskLevel | "all" }[] = [
    { label: "All", value: "all" },
    { label: "High Risk", value: "red" },
    { label: "Medium", value: "yellow" },
    { label: "Low", value: "green" },
  ];

  const filtered =
    filterLevel === "all"
      ? contracts
      : contracts.filter((c) => c.overall_risk_level === filterLevel);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterLevel === f.value
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {filtered.length} contracts
        </span>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--bg-surface)] z-10">
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Vendor
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Expires
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Risk
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract, i) => {
              const days = daysUntil(contract.expiry_date);
              const isExpiringSoon = days !== null && days <= 90 && days > 0;
              const isExpired = days !== null && days <= 0;

              return (
                <motion.tr
                  key={contract.contract_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onSelect(contract)}
                  className={`border-b border-[var(--border-subtle)] cursor-pointer transition-colors ${
                    selectedId === contract.contract_id
                      ? "bg-[var(--bg-elevated)]"
                      : "hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text-primary)]">
                      {contract.vendor_name || "Unknown Vendor"}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">
                      {contract.contract_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {contract.contract_type || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={
                        isExpired
                          ? "text-[var(--risk-high)]"
                          : isExpiringSoon
                          ? "text-[var(--risk-medium)]"
                          : "text-[var(--text-secondary)]"
                      }
                    >
                      {formatDate(contract.expiry_date)}
                    </div>
                    {days !== null && (
                      <div className="text-xs text-[var(--text-muted)]">
                        {isExpired
                          ? "Expired"
                          : `${days} days`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={contract.overall_risk_level} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-[var(--text-secondary)]">
                      {Math.round(contract.confidence * 100)}%
                    </span>
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
