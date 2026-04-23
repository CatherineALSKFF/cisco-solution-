import { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
}

const config = {
  red: {
    bg: "bg-[var(--risk-high)]/10",
    text: "text-[var(--risk-high)]",
    dot: "bg-[var(--risk-high)]",
    label: "High",
  },
  yellow: {
    bg: "bg-[var(--risk-medium)]/10",
    text: "text-[var(--risk-medium)]",
    dot: "bg-[var(--risk-medium)]",
    label: "Medium",
  },
  green: {
    bg: "bg-[var(--risk-low)]/10",
    text: "text-[var(--risk-low)]",
    dot: "bg-[var(--risk-low)]",
    label: "Low",
  },
};

export function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const c = config[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        c.bg,
        c.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
