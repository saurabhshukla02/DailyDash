import { useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const unitLabels = { steps: "steps", protein: "g" };

export default function NonBinaryTask({ task, onAddEntry, onRemoveEntry, currencySymbol = "$" }) {
  const [showInput, setShowInput] = useState(false);
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");

  const isSpending = task.task_type === "spending";
  const unit = isSpending ? currencySymbol : (unitLabels[task.task_type] || task.unit || "");
  const total = (task.entries || []).reduce((sum, e) => sum + (e.value || 0), 0);
  const goal = typeof task.daily_goal === "number" ? task.daily_goal : (task.daily_goal ? parseFloat(task.daily_goal) : 0);
  const goalMet = goal > 0 && total >= goal;

  let statusClass = "text-muted-foreground";
  let statusSuffix = "";

  if (isSpending && goal > 0) {
    const diff = goal - total;
    if (total > goal) {
      statusClass = "text-red-600";
      statusSuffix = " • Over limit!";
    } else if (diff <= 50) {
      statusClass = "text-amber-600";
      statusSuffix = " • Almost at limit";
    } else {
      statusClass = "text-emerald-600";
    }
  } else {
    statusClass = goalMet ? "text-emerald-600" : "text-muted-foreground";
  }

  const showNearLimitAlert = isSpending && goal > 0 && total < goal && goal - total <= 50;
  const showOverLimitAlert = isSpending && goal > 0 && total > goal;

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
          <p
            className={cn(
              "text-xs font-semibold mt-0.5",
              statusClass
            )}
          >
            {isSpending ? `${currencySymbol}${total.toFixed(2)}` : `${total.toLocaleString()} ${unit}`}
            {goal
              ? ` / ${isSpending ? currencySymbol : ""}${goal.toLocaleString()}${!isSpending && unit ? ` ${unit}` : ""}`
              : ""}
            {!isSpending && goalMet && " ✓"}
            {isSpending && statusSuffix}
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

      {isSpending && (showNearLimitAlert || showOverLimitAlert) && (
        <div className="mt-2">
          <Alert
            className={cn(
              "border text-xs",
              showOverLimitAlert
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            )}
          >
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                showOverLimitAlert ? "text-red-500" : "text-amber-500"
              )}
            />
            <AlertDescription className="text-xs">
              {showOverLimitAlert
                ? `You have exceeded your spending limit for ${task.name}.`
                : `You're almost at your spending limit for ${task.name}!`}
            </AlertDescription>
          </Alert>
        </div>
      )}

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