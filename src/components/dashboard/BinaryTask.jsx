import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Handles rendering of a single subtask row — supports binary (checkbox) and numeric types
function SubtaskRow({ subtask, completion, currencySymbol = "$", onToggle, onAddEntry, onRemoveEntry }) {
  const [showInput, setShowInput] = useState(false);
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");

  const isBinary = !subtask.task_type || subtask.task_type === "binary";
  const unitMap = { steps: "steps", protein: "g", spending: currencySymbol };
  const unit = unitMap[subtask.task_type] || "";

  const entries = completion?.entries || [];
  const total = entries.reduce((sum, e) => sum + (e.value || 0), 0);
  const isCompleted = isBinary ? !!completion?.completed : false;

  const handleAddEntry = () => {
    if (!value) return;
    onAddEntry({ description: desc, value: parseFloat(value) });
    setDesc("");
    setValue("");
    setShowInput(false);
  };

  if (isBinary) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors"
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          className="h-4 w-4 rounded border-2"
          onClick={e => e.stopPropagation()}
        />
        <span className={cn("text-xs font-medium transition-all", isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
          {subtask.name}
        </span>
      </button>
    );
  }

  // Numeric subtask
  return (
    <div className="py-2 px-3 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-foreground">{subtask.name}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {subtask.task_type === "spending" ? `${currencySymbol}${total.toFixed(2)}` : `${total.toLocaleString()} ${unit}`}
          </p>
        </div>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-lg" onClick={() => setShowInput(!showInput)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="mt-1 space-y-1">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between bg-secondary/50 rounded-lg px-2 py-1">
              <span className="text-[10px] text-muted-foreground">
                {entry.description && `${entry.description} – `}
                {subtask.task_type === "spending" ? `${currencySymbol}${entry.value.toFixed(2)}` : `${entry.value.toLocaleString()} ${unit}`}
              </span>
              <button onClick={() => onRemoveEntry(idx)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showInput && (
        <div className="mt-1.5 flex gap-2">
          <Input placeholder="Desc" value={desc} onChange={e => setDesc(e.target.value)} className="h-7 text-xs flex-1" />
          <Input placeholder={unit} type="number" value={value} onChange={e => setValue(e.target.value)} className="h-7 text-xs w-16" />
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAddEntry}>Add</Button>
        </div>
      )}
    </div>
  );
}

export default function BinaryTask({ task, onToggle, onToggleSubtask, onAddSubtaskEntry, onRemoveSubtaskEntry, currencySymbol = "$" }) {
  const [expanded, setExpanded] = useState(true);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completions = task.subtask_completions || {};

  if (!hasSubtasks) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors"
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="h-5 w-5 rounded-md border-2"
          onClick={e => e.stopPropagation()}
        />
        <span className={cn("text-sm font-medium transition-all", task.completed ? "text-muted-foreground line-through" : "text-foreground")}>
          {task.name}
        </span>
      </button>
    );
  }

  // Calculate progress across all subtasks (binary = completed, numeric = has entries)
  let completedCount = 0;
  const totalCount = task.subtasks.length;
  task.subtasks.forEach(s => {
    const isBinary = !s.task_type || s.task_type === "binary";
    if (isBinary) {
      if (completions[s.id]?.completed) completedCount++;
    } else {
      if ((completions[s.id]?.entries || []).length > 0) completedCount++;
    }
  });
  const allDone = completedCount === totalCount;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors"
      >
        {/* Mini circular progress */}
        <div className="relative w-5 h-5 flex-shrink-0">
          <svg viewBox="0 0 20 20" className="w-5 h-5 -rotate-90">
            <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
            <circle
              cx="10" cy="10" r="8"
              fill="none"
              stroke={allDone ? "hsl(var(--accent))" : "hsl(var(--primary))"}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 8}`}
              strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <span className={cn("text-sm font-medium transition-all", allDone ? "text-muted-foreground line-through" : "text-foreground")}>
            {task.name}
          </span>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{completedCount}/{totalCount} done</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="ml-4 pl-3 border-l-2 border-border space-y-0.5 pb-1.5">
          {task.subtasks.map(subtask => {
            const isBinary = !subtask.task_type || subtask.task_type === "binary";
            return (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                completion={completions[subtask.id]}
                currencySymbol={currencySymbol}
                onToggle={() => onToggleSubtask(subtask.id)}
                onAddEntry={isBinary ? undefined : (entry) => onAddSubtaskEntry(subtask.id, entry)}
                onRemoveEntry={isBinary ? undefined : (idx) => onRemoveSubtaskEntry(subtask.id, idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}