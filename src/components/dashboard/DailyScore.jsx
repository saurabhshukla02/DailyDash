import { cn } from "@/lib/utils";

export default function DailyScore({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-5 bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
          <circle
            cx="48" cy="48" r="40" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
          {pct}%
        </span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">Daily Score</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">
          {completed} <span className="text-muted-foreground font-normal text-base">/ {total}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {pct >= 80 ? "Great progress! 🔥" : pct >= 50 ? "Keep going! 💪" : "Let's get started!"}
        </p>
      </div>
    </div>
  );
}