import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const unitLabels = { steps: "steps", protein: "g" };

export default function NonBinaryTask({ task, onAddEntry, onRemoveEntry, currencySymbol = "$" }) {
  const [showInput, setShowInput] = useState(false);
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");

  const unit = task.task_type === "spending" ? currencySymbol : (unitLabels[task.task_type] || task.unit || "");
  const total = (task.entries || []).reduce((sum, e) => sum + (e.value || 0), 0);
  const goalMet = task.daily_goal && total >= task.daily_goal;

  const handleAdd = () => {
    if (!value) return;
    onAddEntry({ description: desc, value: parseFloat(value) });
    setDesc("");
    setValue("");
    setShowInput(false);
  };

  return (
    <div className="py-2.5 px-3 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{task.name}</p>
          <p className={cn(
            "text-xs font-semibold mt-0.5",
            goalMet ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {task.task_type === "spending" ? `${currencySymbol}${total.toFixed(2)}` : `${total.toLocaleString()} ${unit}`}
            {task.daily_goal ? ` / ${task.task_type === "spending" ? currencySymbol : ""}${task.daily_goal.toLocaleString()} ${task.task_type !== "spending" ? unit : ""}` : ""}
            {goalMet && " ✓"}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 rounded-lg"
          onClick={() => setShowInput(!showInput)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {(task.entries || []).length > 0 && (
        <div className="mt-2 space-y-1">
          {task.entries.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">
                {entry.description && `${entry.description} – `}
                {task.task_type === "spending" ? `${currencySymbol}${entry.value.toFixed(2)}` : `${entry.value.toLocaleString()} ${unit}`}
              </span>
              <button onClick={() => onRemoveEntry(idx)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showInput && (
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <Input
            placeholder={unit}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-xs w-20"
          />
          <Button size="sm" className="h-8 px-3 text-xs" onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}