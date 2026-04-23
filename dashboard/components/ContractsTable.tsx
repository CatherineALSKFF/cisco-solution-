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
          <tr className="border-b border-gray-200">
            <th className="w-10 px-4 py-3">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Vendor
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Expires
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Risk
            </th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((contract, i) => {
            const days = daysUntil(contract.expiry_date);
            const isExpired = days !== null && days <= 0;
            const isSelected = selectedId === contract.contract_id;

            return (
              <motion.tr
                key={contract.contract_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect(contract)}
                className={`group cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {contract.vendor_name || "Unknown Vendor"}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {contract.contract_id}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {contract.contract_type || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm font-medium ${isExpired ? "text-red-500" : "text-gray-900"}`}>
                    {formatDate(contract.expiry_date)}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isExpired ? "text-red-400" : "text-gray-400"}`}>
                    {isExpired ? "Expired" : days !== null ? `${days} days` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                    contract.overall_risk_level === "red" ? "text-red-500" :
                    contract.overall_risk_level === "yellow" ? "text-amber-500" :
                    "text-emerald-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      contract.overall_risk_level === "red" ? "bg-red-500" :
                      contract.overall_risk_level === "yellow" ? "bg-amber-500" :
                      "bg-emerald-500"
                    }`} />
                    {contract.overall_risk_level === "red" ? "High" :
                     contract.overall_risk_level === "yellow" ? "Medium" : "Low"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full"
                        style={{ width: `${contract.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">
                      {Math.round(contract.confidence * 100)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
