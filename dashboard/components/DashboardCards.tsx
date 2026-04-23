"use client";

import { motion } from "framer-motion";
import { Contract, ContractSummary } from "@/lib/types";

interface DashboardCardsProps {
  summary: ContractSummary;
  contracts: Contract[];
}

export function DashboardCards({ summary, contracts }: DashboardCardsProps) {
  const total = summary.total_contracts || 1;
  const high = summary.by_risk_level.red;
  const medium = summary.by_risk_level.yellow;
  const low = summary.by_risk_level.green;

  const riskScore = ((high * 10 + medium * 5 + low * 1) / total).toFixed(1);
  const circumference = 2 * Math.PI * 45;
  const riskPct = (parseFloat(riskScore) / 10) * 100;

  const recentAlerts = contracts
    .filter(c => c.overall_risk_level === "red" || c.risk_flags.length > 3)
    .slice(0, 4)
    .map(c => ({
      title: c.risk_flags[0]?.title || "Risk flagged",
      vendor: c.vendor_name || "Unknown",
      time: "2h",
    }));

  const contractTypes = contracts.reduce((acc, c) => {
    const type = c.contract_type?.split(" ")[0] || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTypes = Object.entries(contractTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Portfolio Risk Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Portfolio Risk Score</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{total} contracts · updated 4m ago</p>
          </div>
          <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
            ↑ 1.2 wk
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle
                cx="55" cy="55" r="45"
                fill="none"
                stroke="#EF4444"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (riskPct / 100) * circumference}
                transform="rotate(-90 55 55)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{riskScore}</span>
              <span className="text-[10px] text-gray-400">/ 10</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">High</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(high/total)*100}%` }} />
                </div>
                <span className="text-gray-900 font-medium w-6 text-right">{high}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Medium</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(medium/total)*100}%` }} />
                </div>
                <span className="text-gray-900 font-medium w-6 text-right">{medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Low</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(low/total)*100}%` }} />
                </div>
                <span className="text-gray-900 font-medium w-6 text-right">{low}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Alerts</span>
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              {recentAlerts.length} new
            </span>
          </div>
          <button className="text-[12px] text-gray-500 hover:text-gray-700 flex items-center gap-1">
            View all <span>›</span>
          </button>
        </div>

        <div className="space-y-3">
          {recentAlerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">{alert.title}</p>
                <p className="text-[11px] text-gray-400 truncate">{alert.vendor}</p>
              </div>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{alert.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risk by Type */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-900">Risk by type</span>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {topTypes.map(([type, count], i) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-gray-700 truncate">{type}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-red-500 rounded-full" style={{ opacity: 1 - i * 0.15 }} />
                <span className="text-sm text-gray-900 font-medium w-4 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
