import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
  { code: "CAD", symbol: "CA$", label: "CAD (CA$)" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)" },
  { code: "CHF", symbol: "Fr", label: "CHF (Fr)" },
  { code: "CNY", symbol: "¥", label: "CNY (¥)" },
  { code: "BRL", symbol: "R$", label: "BRL (R$)" },
  { code: "MXN", symbol: "MX$", label: "MXN (MX$)" },
  { code: "SGD", symbol: "S$", label: "SGD (S$)" },
];

const categoryLabels = { health: "Health", routine: "Routine", diet: "Diet", spending: "Spending" };
const typeLabels = { binary: "Check-off", steps: "Steps Counter", protein: "Protein Tracker", spending: "Spending Log" };

export default function Settings() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "", category: "health", task_type: "binary", unit: "", daily_goal: "", track_streak: false, is_active: true, subtasks: []
  });
  const [newSubtask, setNewSubtask] = useState({ name: "", task_type: "binary" });
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.currency) setCurrency(user.currency);
    });
  }, []);

  const handleCurrencyChange = async (val) => {
    setCurrency(val);
    await base44.auth.updateMe({ currency: val });
  };

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["task-templates"],
    queryFn: () => base44.entities.TaskTemplate.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-templates"] }),
  });

  const resetForm = () => {
    setForm({ name: "", category: "health", task_type: "binary", unit: "", daily_goal: "", track_streak: false, is_active: true, subtasks: [] });
    setNewSubtask({ name: "", task_type: "binary" });
    setShowAdd(false);
    setEditingId(null);
  };

  const handleEdit = (t) => {
    setForm({
      name: t.name,
      category: t.category,
      task_type: t.task_type,
      unit: t.unit || "",
      daily_goal: t.daily_goal || "",
      track_streak: t.track_streak || false,
      is_active: t.is_active !== false,
      subtasks: t.subtasks || [],
    });
    setEditingId(t.id);
    setShowAdd(true);
  };

  const addSubtask = () => {
    if (!newSubtask.name.trim()) return;
    const subtask = { id: crypto.randomUUID(), name: newSubtask.name.trim(), task_type: newSubtask.task_type };
    setForm(f => ({ ...f, subtasks: [...(f.subtasks || []), subtask] }));
    setNewSubtask({ name: "", task_type: "binary" });
  };

  const removeSubtask = (id) => {
    setForm(f => ({ ...f, subtasks: (f.subtasks || []).filter(s => s.id !== id) }));
  };

  const handleSave = () => {
    const data = {
      ...form,
      daily_goal: form.daily_goal ? parseFloat(form.daily_goal) : undefined,
      subtasks: form.task_type === "binary" ? (form.subtasks || []) : [],
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ ...data, order: templates.length });
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const grouped = {};
  Object.keys(categoryLabels).forEach(cat => {
    grouped[cat] = templates.filter(t => t.category === cat);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your daily tasks</p>
        </div>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, catTemplates]) => (
        catTemplates.length > 0 && (
          <div key={cat}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {categoryLabels[cat]}
            </p>
            <div className="space-y-2">
              {catTemplates.map(t => (
                <div
                  key={t.id}
                  className={cn(
                    "bg-card rounded-xl border border-border p-3.5 flex items-center gap-3",
                    t.is_active === false && "opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {typeLabels[t.task_type]}
                      {t.daily_goal ? ` • Goal: ${t.daily_goal}` : ""}
                      {t.track_streak ? " • 🔥 Streak" : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleEdit(t)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(t.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {templates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No tasks defined yet. Add your first task to get started.</p>
        </div>
      )}

      <div className="pt-4 border-t border-border space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preferences</p>
          <div className="bg-card rounded-xl border border-border p-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Currency</p>
              <p className="text-[10px] text-muted-foreground">Used for spending tasks</p>
            </div>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" className="w-full rounded-xl text-destructive hover:text-destructive" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Task" : "Add Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Task Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Gym, Morning Skincare"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.task_type} onValueChange={v => setForm({ ...form, task_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.task_type !== "binary" && (
              <div>
                <Label className="text-xs">Daily Goal (optional)</Label>
                <Input
                  type="number"
                  value={form.daily_goal}
                  onChange={e => setForm({ ...form, daily_goal: e.target.value })}
                  placeholder="e.g., 10000"
                  className="mt-1"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Track Streak 🔥</Label>
              <Switch checked={form.track_streak} onCheckedChange={v => setForm({ ...form, track_streak: v })} />
            </div>
            {form.task_type === "binary" && (
              <div>
                <Label className="text-xs">Subtasks</Label>
                <div className="mt-1 space-y-1.5">
                  {(form.subtasks || []).map(s => (
                    <div key={s.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs flex-1 text-foreground">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{typeLabels[s.task_type] || s.task_type}</span>
                      <button onClick={() => removeSubtask(s.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="space-y-2 mt-1">
                    <Input
                      value={newSubtask.name}
                      onChange={e => setNewSubtask(n => ({ ...n, name: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubtask())}
                      placeholder="Subtask name…"
                      className="h-8 text-xs"
                    />
                    <div className="flex gap-2">
                      <Select value={newSubtask.task_type} onValueChange={v => setNewSubtask(n => ({ ...n, task_type: v }))}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(typeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={addSubtask}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editingId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}