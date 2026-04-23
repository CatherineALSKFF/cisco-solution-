"use client";

import { motion } from "framer-motion";
import { ContractSummary } from "@/lib/types";

interface SummaryBarProps {
  summary: ContractSummary;
}

export function SummaryBar({ summary }: SummaryBarProps) {
  const stats = [
    {
      label: "Total Contracts",
      value: summary.total_contracts,
      color: "text-[var(--text-primary)]",
    },
    {
      label: "High Risk",
      value: summary.by_risk_level.red,
      color: "text-[var(--risk-high)]",
    },
    {
      label: "Medium Risk",
      value: summary.by_risk_level.yellow,
      color: "text-[var(--risk-medium)]",
    },
    {
      label: "Low Risk",
      value: summary.by_risk_level.green,
      color: "text-[var(--risk-low)]",
    },
    {
      label: "Expiring in 90d",
      value: summary.expiring_in_90_days,
      color: summary.expiring_in_90_days > 0
        ? "text-[var(--risk-medium)]"
        : "text-[var(--text-primary)]",
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 px-5 py-3"
        >
          <span className={`text-2xl font-semibold tabular-nums ${stat.color}`}>
            {stat.value}
          </span>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
            {stat.label}
          </span>
          {i < stats.length - 1 && (
            <div className="w-px h-8 bg-[var(--border)] ml-4" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
