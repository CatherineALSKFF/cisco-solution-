"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Contract, ContractSummary, RiskLevel } from "@/lib/types";
import { fetchContracts, fetchSummary } from "@/lib/api";
import { SummaryBar } from "@/components/SummaryBar";
import { ContractsTable } from "@/components/ContractsTable";
import { DetailPanel } from "@/components/DetailPanel";

export default function Dashboard() {
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, contractsData] = await Promise.all([
          fetchSummary(),
          fetchContracts(),
        ]);
        setSummary(summaryData);
        setContracts(contractsData);
      } catch (e) {
        setError("Failed to connect to API. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[var(--text-muted)]"
        >
          Loading contracts...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-[var(--risk-high)] text-lg mb-2">
            Connection Error
          </div>
          <p className="text-[var(--text-muted)] text-sm max-w-md">
            {error}
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-4 font-mono">
            Run: python main.py
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Contract Intelligence
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Cisco CDP Analysis Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--risk-low)]" />
            API Connected
          </div>
        </div>
        {summary && <SummaryBar summary={summary} />}
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col min-h-0"
      >
        <ContractsTable
          contracts={contracts}
          onSelect={setSelectedContract}
          selectedId={selectedContract?.contract_id}
          filterLevel={filterLevel}
          onFilterChange={setFilterLevel}
        />
      </motion.main>

      {/* Detail Panel */}
      <DetailPanel
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
      />
    </div>
  );
}
