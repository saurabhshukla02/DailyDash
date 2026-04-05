import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const unitLabels = { steps: "steps", protein: "g" };
const CURRENCY_SYMBOLS = { USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥", CAD:"CA$", AUD:"A$", CHF:"Fr", CNY:"¥", BRL:"R$", MXN:"MX$", SGD:"S$" };

export default function HistoryDetail({ log, onBack }) {
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.currency) setCurrencySymbol(CURRENCY_SYMBOLS[user.currency] || user.currency);
    });
  }, []);
  const tasks = log.tasks || [];
  const categories = [...new Set(tasks.map(t => t.category))];

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{format(parseISO(log.date), "EEEE, MMMM d")}</h1>
        </div>
      </div>

      {categories.map(cat => {
        const catTasks = tasks.filter(t => t.category === cat);
        return (
          <div key={cat} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{cat}</p>
            <div className="space-y-2">
              {catTasks.map((task, i) => (
                <div key={i} className="flex items-start gap-3 py-1.5">
                  {task.task_type === "binary" ? (
                    <>
                      {task.completed
                        ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500" />
                        : <Circle className="w-4 h-4 mt-0.5 text-muted-foreground" />}
                      <span className={cn(
                        "text-sm",
                        task.completed ? "text-foreground" : "text-muted-foreground line-through"
                      )}>
                        {task.name}
                      </span>
                    </>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{task.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Total: {task.task_type === "spending" ? currencySymbol : ""}
                        {(task.entries || []).reduce((s, e) => s + (e.value || 0), 0).toLocaleString()}
                        {task.task_type !== "spending" ? ` ${unitLabels[task.task_type] || task.unit || ""}` : ""}
                      </p>
                      {(task.entries || []).map((entry, j) => (
                        <p key={j} className="text-xs text-muted-foreground ml-2">
                          • {entry.description && `${entry.description}: `}
                          {task.task_type === "spending" ? `${currencySymbol}${entry.value?.toFixed(2)}` : `${entry.value?.toLocaleString()} ${unitLabels[task.task_type] || ""}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}