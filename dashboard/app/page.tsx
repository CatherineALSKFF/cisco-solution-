"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contract, ContractSummary, RiskLevel } from "@/lib/types";
import { fetchContracts, fetchSummary, uploadContract } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { DashboardCards } from "@/components/DashboardCards";
import { ContractsTable } from "@/components/ContractsTable";
import { DetailPanel } from "@/components/DetailPanel";
import { UploadZone } from "@/components/UploadZone";

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
    } else {
      setFilterLevel("all");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl border shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <code className="inline-block px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-mono text-gray-700">
            python main.py
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        stats={{
          total: summary?.total_contracts || 0,
          high: summary?.by_risk_level.red || 0,
          renewals: summary?.expiring_in_90_days || 0,
        }}
      />

      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        {/* Top Nav */}
        <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 flex items-center justify-between shadow-[var(--shadow-xs)]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">Cisco CDP</span>
            <span className="text-[var(--text-faint)]">›</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {activeView === "dashboard" ? "Dashboard" :
               activeView === "risks" ? "Risk Center" :
               activeView === "contracts" ? "Contracts" :
               activeView === "renewals" ? "Renewals" :
               activeView === "upload" ? "Upload" :
               "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[var(--bg-elevated)] rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span>Search contracts, clauses...</span>
              <kbd className="text-[10px] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded-md border border-[var(--border)] text-[var(--text-faint)] font-mono">⌘K</kbd>
            </div>
            <button className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          {activeView === "upload" ? (
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1 tracking-tight">Upload Contract</h1>
              <p className="text-[var(--text-muted)] mb-8">Analyze new contract documents</p>
              <UploadZone onUpload={handleUpload} isUploading={isUploading} uploadProgress={uploadProgress} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1.5 tracking-tight">Contract Intelligence</h1>
                <p className="text-[var(--text-muted)]">Cisco CDP Analysis Dashboard</p>
              </div>

              {/* Dashboard Cards */}
              {summary && <DashboardCards summary={summary} contracts={contracts} />}

              {/* Stats Row */}
              {summary && (
                <div className="flex items-center gap-8 py-5 mb-6 border-y border-[var(--border)]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{summary.total_contracts}</span>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Total Contracts</span>
                  </div>
                  <div className="w-px h-6 bg-[var(--border)]" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-[var(--risk-high)] tracking-tight">{summary.by_risk_level.red}</span>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">High Risk</span>
                  </div>
                  <div className="w-px h-6 bg-[var(--border)]" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-[var(--risk-medium)] tracking-tight">{summary.by_risk_level.yellow}</span>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Medium Risk</span>
                  </div>
                  <div className="w-px h-6 bg-[var(--border)]" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-[var(--risk-low)] tracking-tight">{summary.by_risk_level.green}</span>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Low Risk</span>
                  </div>
                  <div className="w-px h-6 bg-[var(--border)]" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{summary.expiring_in_90_days}</span>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Expiring in 90D</span>
                  </div>
                </div>
              )}

              {/* Filter + Actions */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl">
                  {[
                    { value: "all", label: "All", count: contracts.length },
                    { value: "red", label: "High Risk", count: summary?.by_risk_level.red || 0 },
                    { value: "yellow", label: "Medium", count: summary?.by_risk_level.yellow || 0 },
                    { value: "green", label: "Low", count: summary?.by_risk_level.green || 0 },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilterLevel(f.value as RiskLevel | "all")}
                      className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                        filterLevel === f.value
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      {f.label} <span className="text-[var(--text-faint)] ml-1">{f.count}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl">
                    <button className="px-3.5 py-2 text-sm font-medium bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg shadow-[var(--shadow-sm)]">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
                        </svg>
                        Table
                      </span>
                    </button>
                    <button className="px-3.5 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-colors">Board</button>
                    <button className="px-3.5 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-colors">Timeline</button>
                  </div>

                  <button className="px-3.5 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all flex items-center gap-1.5 shadow-[var(--shadow-xs)]">
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    Filters
                  </button>

                  <button className="px-3.5 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all shadow-[var(--shadow-xs)]">
                    Sort: Risk
                  </button>

                  <button className="px-3.5 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all shadow-[var(--shadow-xs)]">
                    Compare
                  </button>

                  <button className="px-3.5 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all shadow-[var(--shadow-xs)]">
                    CSV
                  </button>

                  <button
                    onClick={() => handleViewChange("upload")}
                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--text-primary)] rounded-xl hover:bg-[var(--text-secondary)] transition-all shadow-[var(--shadow-sm)] flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-[var(--shadow-sm)]">
                <ContractsTable
                  contracts={contracts}
                  onSelect={setSelectedContract}
                  selectedId={undefined}
                  filterLevel={filterLevel}
                  onFilterChange={setFilterLevel}
                />
              </div>
            </>
          )}
        </main>
      </div>

      <DetailPanel contract={selectedContract} onClose={() => setSelectedContract(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 ml-28 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
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
