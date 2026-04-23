"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contract, ContractSummary, RiskLevel } from "@/lib/types";
import { fetchContracts, fetchSummary, uploadContract } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { SummaryBar } from "@/components/SummaryBar";
import { ContractsTable } from "@/components/ContractsTable";
import { ContractDetail } from "@/components/ContractDetail";
import { UploadZone } from "@/components/UploadZone";
import { RiskChart } from "@/components/RiskChart";

export default function Dashboard() {
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; status: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeView, setActiveView] = useState("dashboard");

  const loadData = useCallback(async () => {
    try {
      const [summaryData, contractsData] = await Promise.all([
        fetchSummary(),
        fetchContracts(),
      ]);
      setSummary(summaryData);
      setContracts(contractsData);
      setError(null);
    } catch (e) {
      setError("Failed to connect to API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress({ fileName: file.name, status: "Analyzing contract..." });

    try {
      const newContract = await uploadContract(file);
      setContracts((prev) => [newContract, ...prev]);
      setSummary((prev) => {
        if (!prev) return prev;
        const riskKey = newContract.overall_risk_level as keyof typeof prev.by_risk_level;
        return {
          ...prev,
          total_contracts: prev.total_contracts + 1,
          by_risk_level: {
            ...prev.by_risk_level,
            [riskKey]: prev.by_risk_level[riskKey] + 1,
          },
        };
      });
      setToast({ message: `Analyzed: ${newContract.vendor_name || file.name}`, type: "success" });
      setSelectedContract(newContract);
      setActiveView("dashboard");
    } catch (e) {
      setToast({ message: `Failed to analyze ${file.name}`, type: "error" });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSelectedContract(null);
    if (view === "risks") {
      setFilterLevel("red");
    } else if (view === "contracts" || view === "dashboard") {
      setFilterLevel("all");
    }
  };

  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-surface)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--text-primary)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--text-muted)] font-medium">Loading CES...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-surface)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white p-8 rounded-2xl border border-[var(--border)] shadow-sm"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--risk-high-bg)] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[var(--risk-high)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Connection Error</h2>
          <p className="text-sm text-[var(--text-muted)] mb-5">{error}</p>
          <code className="inline-block px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-sm font-mono text-[var(--text-secondary)]">
            python main.py
          </code>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-surface)] flex">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        stats={{
          total: summary?.total_contracts || 0,
          high: summary?.by_risk_level.red || 0,
        }}
      />

      {/* Main Content */}
      <div className="flex-1 ml-60 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[var(--border)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {selectedContract ? selectedContract.vendor_name || "Contract Details" :
                  activeView === "dashboard" ? "Overview" :
                  activeView === "contracts" ? "All Contracts" :
                  activeView === "risks" ? "Risk Alerts" :
                  activeView === "upload" ? "Upload Contract" :
                  "Settings"}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {selectedContract ? selectedContract.contract_id :
                  activeView === "dashboard" ? "Contract risk analysis overview" :
                  activeView === "contracts" ? `${contracts.length} contracts analyzed` :
                  activeView === "risks" ? `${summary?.by_risk_level.red || 0} high-risk contracts requiring attention` :
                  activeView === "upload" ? "Analyze new contract documents" :
                  "Configure CES settings"}
              </p>
            </div>
            {!selectedContract && activeView !== "upload" && (
              <button
                onClick={() => setActiveView("upload")}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--text-secondary)] transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Contract
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          <AnimatePresence mode="wait">
            {selectedContract ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ContractDetail
                  contract={selectedContract}
                  onBack={() => setSelectedContract(null)}
                />
              </motion.div>
            ) : activeView === "upload" ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                <UploadZone
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
                {contracts.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                      Recently Analyzed
                    </h4>
                    <div className="space-y-2">
                      {contracts.slice(0, 5).map((contract) => (
                        <button
                          key={contract.contract_id}
                          onClick={() => {
                            setSelectedContract(contract);
                          }}
                          className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-1 h-10 rounded-full ${
                              contract.overall_risk_level === "red" ? "bg-[var(--risk-high)]" :
                              contract.overall_risk_level === "yellow" ? "bg-[var(--risk-medium)]" :
                              "bg-[var(--risk-low)]"
                            }`} />
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                                {contract.vendor_name || "Unknown Vendor"}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {contract.contract_type}
                              </p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeView === "settings" ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl space-y-6"
              >
                <div className="bg-white p-6 rounded-xl border border-[var(--border)]">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">API Status</h4>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Backend connection</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--risk-low)] animate-pulse" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Connected</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[var(--border)]">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Analysis Standards</h4>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Security policy configuration</p>
                  <div className="text-sm text-[var(--text-secondary)] font-mono bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border)]">
                    Cisco PSIRT Security Vulnerability Policy
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Stats + Chart Row */}
                {summary && activeView === "dashboard" && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                      <SummaryBar summary={summary} />
                    </div>
                    <RiskChart summary={summary} />
                  </div>
                )}

                {/* Contracts Table */}
                <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
                  <ContractsTable
                    contracts={contracts}
                    onSelect={handleContractSelect}
                    selectedId={undefined}
                    filterLevel={filterLevel}
                    onFilterChange={setFilterLevel}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 ml-30 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-[var(--risk-low)] text-white"
                : "bg-[var(--risk-high)] text-white"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
