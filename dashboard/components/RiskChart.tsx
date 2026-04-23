"use client";

import { motion } from "framer-motion";
import { ContractSummary } from "@/lib/types";

interface RiskChartProps {
  summary: ContractSummary;
}

export function RiskChart({ summary }: RiskChartProps) {
  const total = summary.total_contracts || 1;
  const high = summary.by_risk_level.red;
  const medium = summary.by_risk_level.yellow;
  const low = summary.by_risk_level.green;

  const highPct = (high / total) * 100;
  const mediumPct = (medium / total) * 100;
  const lowPct = (low / total) * 100;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const highOffset = 0;
  const mediumOffset = (highPct / 100) * circumference;
  const lowOffset = ((highPct + mediumPct) / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Risk Distribution</h3>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="20"
            />

            {/* Low risk (green) */}
            {low > 0 && (
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--risk-low)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (lowPct / 100) * circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (lowPct / 100) * circumference }}
                transition={{ duration: 1, delay: 0.4 }}
                transform="rotate(-90 80 80)"
                style={{ transformOrigin: "80px 80px", transform: `rotate(${-90 + (highPct + mediumPct) * 3.6}deg)` }}
              />
            )}

            {/* Medium risk (yellow) */}
            {medium > 0 && (
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--risk-medium)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (mediumPct / 100) * circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (mediumPct / 100) * circumference }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ transformOrigin: "80px 80px", transform: `rotate(${-90 + highPct * 3.6}deg)` }}
              />
            )}

            {/* High risk (red) */}
            {high > 0 && (
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--risk-high)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (highPct / 100) * circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (highPct / 100) * circumference }}
                transition={{ duration: 1 }}
                style={{ transformOrigin: "80px 80px", transform: "rotate(-90deg)" }}
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{total}</span>
            <span className="text-xs text-[var(--text-muted)]">contracts</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--risk-high)]" />
              <span className="text-sm text-[var(--text-secondary)]">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{high}</span>
              <span className="text-xs text-[var(--text-muted)]">({Math.round(highPct)}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--risk-medium)]" />
              <span className="text-sm text-[var(--text-secondary)]">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{medium}</span>
              <span className="text-xs text-[var(--text-muted)]">({Math.round(mediumPct)}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--risk-low)]" />
              <span className="text-sm text-[var(--text-secondary)]">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{low}</span>
              <span className="text-xs text-[var(--text-muted)]">({Math.round(lowPct)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
