"use client";

import { RiskLevel } from "@/lib/types";

interface RiskBadgeProps {
  level: RiskLevel;
}

const config: Record<RiskLevel, { bg: string; color: string; label: string }> = {
  red: {
    bg: "var(--risk-high-bg)",
    color: "var(--risk-high)",
    label: "High",
  },
  yellow: {
    bg: "var(--risk-medium-bg)",
    color: "var(--risk-medium)",
    label: "Medium",
  },
  green: {
    bg: "var(--risk-low-bg)",
    color: "var(--risk-low)",
    label: "Low",
  },
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const c = config[level];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: c.color }}
      />
      {c.label}
    </span>
  );
}
