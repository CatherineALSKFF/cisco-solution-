import { Contract, ContractSummary, RiskLevel } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchSummary(): Promise<ContractSummary> {
  const res = await fetch(`${API_BASE}/contracts/summary`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchContracts(riskLevel?: RiskLevel): Promise<Contract[]> {
  const params = new URLSearchParams();
  if (riskLevel) params.set("risk_level", riskLevel);

  const url = `${API_BASE}/contracts${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contracts");
  return res.json();
}

export async function fetchContract(id: string): Promise<Contract> {
  const res = await fetch(`${API_BASE}/contracts/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch contract");
  return res.json();
}

export async function uploadContract(file: File): Promise<Contract> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/contracts/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to analyze contract");
  }

  return res.json();
}
