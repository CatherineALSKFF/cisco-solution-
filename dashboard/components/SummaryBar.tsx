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
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "High Risk",
      value: summary.by_risk_level.red,
      color: "var(--risk-high)",
      bg: "var(--risk-high-bg)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: "Medium Risk",
      value: summary.by_risk_level.yellow,
      color: "var(--risk-medium)",
      bg: "var(--risk-medium-bg)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: "Low Risk",
      value: summary.by_risk_level.green,
      color: "var(--risk-low)",
      bg: "var(--risk-low-bg)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Expiring Soon",
      value: summary.expiring_in_90_days,
      color: summary.expiring_in_90_days > 0 ? "var(--risk-medium)" : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200 cursor-default"
          style={stat.bg ? { backgroundColor: stat.bg } : undefined}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: stat.bg || "var(--bg-surface)",
                color: stat.color || "var(--text-muted)",
              }}
            >
              {stat.icon}
            </div>
            {stat.color && stat.value > 0 && (
              <span
                className="w-2 h-2 rounded-full animate-pulse-subtle"
                style={{ backgroundColor: stat.color }}
              />
            )}
          </div>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: stat.color || "var(--text-primary)" }}>
            {stat.value}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
