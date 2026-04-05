import { Footprints, Beef, Wallet } from "lucide-react";

export default function QuickTotals({ tasks, currencySymbol = "$" }) {
  const stepsTotal = tasks
    .filter(t => t.task_type === "steps")
    .reduce((sum, t) => sum + (t.entries || []).reduce((s, e) => s + (e.value || 0), 0), 0);

  const proteinTotal = tasks
    .filter(t => t.task_type === "protein")
    .reduce((sum, t) => sum + (t.entries || []).reduce((s, e) => s + (e.value || 0), 0), 0);

  const spendingTotal = tasks
    .filter(t => t.task_type === "spending")
    .reduce((sum, t) => sum + (t.entries || []).reduce((s, e) => s + (e.value || 0), 0), 0);

  const items = [
    { icon: Footprints, label: "Steps", value: stepsTotal.toLocaleString(), color: "text-emerald-600 bg-emerald-50" },
    { icon: Beef, label: "Protein", value: `${proteinTotal}g`, color: "text-amber-600 bg-amber-50" },
    { icon: Wallet, label: "Spent", value: `${currencySymbol}${spendingTotal.toFixed(2)}`, color: "text-slate-600 bg-slate-100" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-card rounded-xl border border-border p-3 text-center">
          <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-base font-bold text-foreground mt-2">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}