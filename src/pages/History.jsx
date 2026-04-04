import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import HistoryDetail from "@/components/history/HistoryDetail";

export default function History() {
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["history-logs"],
    queryFn: () => base44.entities.DailyLog.list("-date", 60),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedLog) {
    return <HistoryDetail log={selectedLog} onBack={() => setSelectedLog(null)} />;
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground">Review your past days</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No history yet. Start tracking to see past days here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const tasks = log.tasks || [];
            const binary = tasks.filter(t => t.task_type === "binary");
            const completed = binary.filter(t => t.completed).length;
            const total = binary.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
              >
                <div className="text-center min-w-[44px]">
                  <p className="text-xs text-muted-foreground font-medium uppercase">
                    {format(parseISO(log.date), "EEE")}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {format(parseISO(log.date), "d")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(parseISO(log.date), "MMM")}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-semibold",
                      pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {pct}% complete
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completed}/{total} tasks • {tasks.length - binary.length} logged entries
                  </p>
                </div>
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                    <circle
                      cx="20" cy="20" r="16" fill="none"
                      stroke={pct >= 80 ? "hsl(152, 55%, 48%)" : pct >= 50 ? "hsl(43, 96%, 56%)" : "hsl(var(--muted-foreground))"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}