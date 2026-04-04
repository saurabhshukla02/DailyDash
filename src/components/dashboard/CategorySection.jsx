import { useState } from "react";
import { ChevronDown, Dumbbell, Sparkles, Apple, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import BinaryTask from "./BinaryTask";
import NonBinaryTask from "./NonBinaryTask";

const categoryConfig = {
  health: { icon: Dumbbell, label: "Health", color: "bg-emerald-50 text-emerald-600 border-emerald-100", progressColor: "bg-emerald-500" },
  routine: { icon: Sparkles, label: "Routine", color: "bg-blue-50 text-blue-600 border-blue-100", progressColor: "bg-blue-500" },
  diet: { icon: Apple, label: "Diet", color: "bg-amber-50 text-amber-600 border-amber-100", progressColor: "bg-amber-500" },
  spending: { icon: Wallet, label: "Spending", color: "bg-slate-50 text-slate-600 border-slate-100", progressColor: "bg-slate-500" },
};

export default function CategorySection({ category, tasks, onToggleTask, onToggleSubtask, onAddSubtaskEntry, onRemoveSubtaskEntry, onAddEntry, onRemoveEntry, currencySymbol }) {
  const [open, setOpen] = useState(true);
  const config = categoryConfig[category] || categoryConfig.health;
  const Icon = config.icon;

  const binaryTasks = tasks.filter(t => t.task_type === "binary");
  let completedBinary = 0;
  let totalBinary = 0;
  binaryTasks.forEach(t => {
    if (t.subtasks && t.subtasks.length > 0) {
      t.subtasks.forEach(s => {
        totalBinary += 1;
        const isBinary = !s.task_type || s.task_type === "binary";
        const comp = (t.subtask_completions || {})[s.id];
        if (isBinary ? comp?.completed : (comp?.entries || []).length > 0) completedBinary += 1;
      });
    } else {
      totalBinary += 1;
      if (t.completed) completedBinary += 1;
    }
  });
  const binaryPct = totalBinary > 0 ? Math.round((completedBinary / totalBinary) * 100) : 100;

  const nonBinaryTasks = tasks.filter(t => t.task_type !== "binary");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">{config.label}</p>
            {totalBinary > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", config.progressColor)}
                    style={{ width: `${binaryPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{completedBinary}/{totalBinary}</span>
              </div>
            )}
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3 space-y-1.5">
            {binaryTasks.map((task, idx) => (
              <BinaryTask
                key={idx}
                task={task}
                onToggle={() => onToggleTask(task.template_id)}
                onToggleSubtask={(subtaskId) => onToggleSubtask(task.template_id, subtaskId)}
                onAddSubtaskEntry={(subtaskId, entry) => onAddSubtaskEntry(task.template_id, subtaskId, entry)}
                onRemoveSubtaskEntry={(subtaskId, idx2) => onRemoveSubtaskEntry(task.template_id, subtaskId, idx2)}
                currencySymbol={currencySymbol}
              />
            ))}
            {nonBinaryTasks.map((task, idx) => (
              <NonBinaryTask
                key={idx}
                task={task}
                onAddEntry={(entry) => onAddEntry(task.template_id, entry)}
                onRemoveEntry={(entryIdx) => onRemoveEntry(task.template_id, entryIdx)}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}