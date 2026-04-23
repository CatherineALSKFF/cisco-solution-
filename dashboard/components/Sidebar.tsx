"use client";

import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
}

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  stats?: {
    total: number;
    high: number;
  };
}

export function Sidebar({ activeView, onViewChange, stats }: SidebarProps) {
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Overview",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      id: "contracts",
      label: "Contracts",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      badge: stats?.total,
    },
    {
      id: "risks",
      label: "Risk Alerts",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      badge: stats?.high,
      badgeColor: stats?.high ? "red" : undefined,
    },
  ];

  return (
    <motion.aside
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-60 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col fixed left-0 top-0 z-30"
    >
      {/* Logo */}
      <div className="h-14 px-4 flex items-center border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#111827] to-[#1f2937] flex flex-col items-start justify-center gap-1 p-2 shadow-md">
            <div className="h-[2.5px] w-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399]" />
            <div className="h-[2.5px] w-[70%] rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]" />
            <div className="h-[2.5px] w-[40%] rounded-full bg-gradient-to-r from-[#EF4444] to-[#F87171]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-[var(--text-primary)] leading-none tracking-tight">
              CES
            </span>
            <span className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">
              Contract Evaluation
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--text-muted)] cursor-pointer hover:border-[var(--border-strong)] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span>Search contracts...</span>
          <kbd className="ml-auto text-[10px] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border)] font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Navigation
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
              activeView === item.id
                ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`transition-colors ${activeView === item.id ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                item.badgeColor === "red"
                  ? "bg-[var(--risk-high)] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="pt-4">
          <p className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Actions
          </p>
          <button
            onClick={() => onViewChange("upload")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              activeView === "upload"
                ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm"
            }`}
          >
            <svg className="w-[18px] h-[18px] text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <span>Upload Contract</span>
          </button>
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={() => onViewChange("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            activeView === "settings"
              ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]"
          }`}
        >
          <svg className="w-[18px] h-[18px] text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>

        {/* User */}
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] truncate leading-none">Cisco User</p>
              <p className="text-[11px] text-[var(--text-muted)] truncate leading-none mt-0.5">Legal Team</p>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
