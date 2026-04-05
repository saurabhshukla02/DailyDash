import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DailyScore from "@/components/dashboard/DailyScore";
import CategorySection from "@/components/dashboard/CategorySection";
import QuickTotals from "@/components/dashboard/QuickTotals";
import StreakBadges from "@/components/dashboard/StreakBadges";
import AddEntryDialog from "@/components/dashboard/AddEntryDialog";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showNewDay, setShowNewDay] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const CURRENCY_SYMBOLS = { USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥", CAD:"CA$", AUD:"A$", CHF:"Fr", CNY:"¥", BRL:"R$", MXN:"MX$", SGD:"S$" };

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.currency) setCurrencySymbol(CURRENCY_SYMBOLS[user.currency] || user.currency);
    });
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ["task-templates"],
    queryFn: () => base44.entities.TaskTemplate.list(),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["daily-logs"],
    queryFn: () => base44.entities.DailyLog.filter({ date: todayStr() }),
  });

  const todayLog = logs[0];

  // Calculate streaks
  const { data: allLogs = [] } = useQuery({
    queryKey: ["all-logs-for-streaks"],
    queryFn: () => base44.entities.DailyLog.list("-date", 60),
  });

  const streaks = calculateStreaks(allLogs, todayLog);

  const createDayMutation = useMutation({
    mutationFn: async () => {
      const activeTemplates = templates.filter(t => t.is_active !== false);
      const tasks = activeTemplates.map(t => ({
        template_id: t.id,
        name: t.name,
        category: t.category,
        task_type: t.task_type,
        unit: t.unit,
        daily_goal: t.daily_goal,
        completed: false,
        entries: [],
        notes: "",
        track_streak: t.track_streak || false,
      }));
      return base44.entities.DailyLog.create({ date: todayStr(), tasks, is_closed: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["all-logs-for-streaks"] });
      setShowNewDay(false);
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: ({ tasks }) => base44.entities.DailyLog.update(todayLog.id, { tasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["all-logs-for-streaks"] });
    },
  });

  // Auto-sync: add missing templates, remove deleted ones, and update changed goals/names
  useEffect(() => {
    if (!todayLog) return;
    const activeTemplates = templates.filter(t => t.is_active !== false);
    const activeTemplateIds = new Set(activeTemplates.map(t => t.id));
    const templateMap = Object.fromEntries(activeTemplates.map(t => [t.id, t]));
    const existingIds = new Set((todayLog.tasks || []).map(t => t.template_id));

    // Remove tasks whose template was deleted or deactivated
    const filteredTasks = (todayLog.tasks || []).filter(t => activeTemplateIds.has(t.template_id));

    // Update daily_goal, name, track_streak, task_type, unit, category, subtasks on existing tasks if template changed
    const updatedTasks = filteredTasks.map(t => {
      const tmpl = templateMap[t.template_id];
      if (!tmpl) return t;
      const goalChanged = tmpl.daily_goal !== t.daily_goal;
      const nameChanged = tmpl.name !== t.name;
      const streakChanged = (tmpl.track_streak || false) !== t.track_streak;
      const newSubtasks = tmpl.subtasks || [];
      const oldSubtasksJson = JSON.stringify(t.subtasks || []);
      const newSubtasksJson = JSON.stringify(newSubtasks);
      const subtasksChanged = oldSubtasksJson !== newSubtasksJson;
      const typeChanged = tmpl.task_type !== t.task_type;
      const categoryChanged = tmpl.category !== t.category;
      const unitChanged = tmpl.unit !== t.unit;
      if (goalChanged || nameChanged || streakChanged || subtasksChanged || typeChanged || categoryChanged || unitChanged) {
        const existingCompletions = t.subtask_completions || {};
        const validIds = newSubtasks.map(s => s.id);
        const prunedCompletions = Object.fromEntries(
          Object.entries(existingCompletions).filter(([id]) => validIds.includes(id))
        );
        return {
          ...t,
          daily_goal: tmpl.daily_goal,
          name: tmpl.name,
          track_streak: tmpl.track_streak || false,
          task_type: tmpl.task_type,
          category: tmpl.category,
          unit: tmpl.unit,
          subtasks: newSubtasks,
          subtask_completions: prunedCompletions,
        };
      }
      return t;
    });

    // Add tasks for new templates
    const newTasks = activeTemplates
    .filter(t => !existingIds.has(t.id))
    .map(t => ({
      template_id: t.id,
      name: t.name,
      category: t.category,
      task_type: t.task_type,
      unit: t.unit,
      daily_goal: t.daily_goal,
      completed: false,
      entries: [],
      notes: "",
      track_streak: t.track_streak || false,
      subtasks: t.subtasks || [],
      subtask_completions: {},
    }));

    const hasRemovals = filteredTasks.length !== (todayLog.tasks || []).length;
    const hasUpdates = updatedTasks.some((t, i) => t !== filteredTasks[i]);
    const hasAdditions = newTasks.length > 0;

    if (hasRemovals || hasUpdates || hasAdditions) {
      updateLogMutation.mutate({ tasks: [...updatedTasks, ...newTasks] });
    }
  }, [templates, todayLog?.id]);

  const handleToggleTask = (templateId) => {
    const updatedTasks = todayLog.tasks.map(t =>
      t.template_id === templateId ? { ...t, completed: !t.completed } : t
    );
    updateLogMutation.mutate({ tasks: updatedTasks });
  };

  const handleToggleSubtask = (templateId, subtaskId) => {
    const updatedTasks = todayLog.tasks.map(t => {
      if (t.template_id !== templateId) return t;
      const prev = (t.subtask_completions || {});
      const prevEntry = prev[subtaskId] || {};
      const completions = { ...prev, [subtaskId]: { ...prevEntry, completed: !prevEntry.completed } };
      const allDone = (t.subtasks || []).every(s => {
        const isBinary = !s.task_type || s.task_type === "binary";
        return isBinary ? completions[s.id]?.completed : (completions[s.id]?.entries || []).length > 0;
      });
      return { ...t, subtask_completions: completions, completed: allDone };
    });
    updateLogMutation.mutate({ tasks: updatedTasks });
  };

  const handleAddSubtaskEntry = (templateId, subtaskId, entry) => {
    const updatedTasks = todayLog.tasks.map(t => {
      if (t.template_id !== templateId) return t;
      const prev = (t.subtask_completions || {});
      const prevEntry = prev[subtaskId] || {};
      const entries = [...(prevEntry.entries || []), entry];
      const completions = { ...prev, [subtaskId]: { ...prevEntry, entries } };
      const allDone = (t.subtasks || []).every(s => {
        const isBinary = !s.task_type || s.task_type === "binary";
        return isBinary ? completions[s.id]?.completed : (completions[s.id]?.entries || []).length > 0;
      });
      return { ...t, subtask_completions: completions, completed: allDone };
    });
    updateLogMutation.mutate({ tasks: updatedTasks });
  };

  const handleRemoveSubtaskEntry = (templateId, subtaskId, entryIdx) => {
    const updatedTasks = todayLog.tasks.map(t => {
      if (t.template_id !== templateId) return t;
      const prev = (t.subtask_completions || {});
      const prevEntry = prev[subtaskId] || {};
      const entries = (prevEntry.entries || []).filter((_, i) => i !== entryIdx);
      const completions = { ...prev, [subtaskId]: { ...prevEntry, entries } };
      return { ...t, subtask_completions: completions };
    });
    updateLogMutation.mutate({ tasks: updatedTasks });
  };

  const handleAddEntry = (templateId, entry) => {
    const updatedTasks = todayLog.tasks.map(t =>
      t.template_id === templateId
        ? { ...t, entries: [...(t.entries || []), entry] }
        : t
    );
    updateLogMutation.mutate({ tasks: updatedTasks });
  };

  const handleRemoveEntry = (templateId, entryIdx) => {
    const updatedTasks = todayLog.tasks.map(t =>
      t.template_id === templateId
        ? { ...t, entries: (t.entries || []).filter((_, i) => i !== entryIdx) }
        : t
    );
    updateLogMutation.mutate({ tasks: updatedTasks });
  };

  const handleQuickAddEntry = (templateId, entry) => {
    handleAddEntry(templateId, entry);
    setShowAddEntry(false);
  };

  const tasks = todayLog?.tasks || [];
  const binaryTasks = tasks.filter(t => t.task_type === "binary");
  let completedBinary = 0;
  let totalBinaryScore = 0;
  binaryTasks.forEach(t => {
    if (t.subtasks && t.subtasks.length > 0) {
      t.subtasks.forEach(s => {
        totalBinaryScore += 1;
        const isBinary = !s.task_type || s.task_type === "binary";
        const comp = (t.subtask_completions || {})[s.id];
        if (isBinary ? comp?.completed : (comp?.entries || []).length > 0) completedBinary += 1;
      });
    } else {
      totalBinaryScore += 1;
      if (t.completed) completedBinary += 1;
    }
  });

  const categories = ["health", "routine", "diet", "spending"];
  const groupedTasks = {};
  categories.forEach(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    if (catTasks.length > 0) groupedTasks[cat] = catTasks;
  });

  const nonBinaryTasks = tasks.filter(t => t.task_type !== "binary");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {format(new Date(), "EEEE")}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {format(new Date(), "MMMM d")}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 text-xs h-8"
          onClick={() => setShowNewDay(true)}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Day
        </Button>
      </div>

      {!todayLog ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Start Your Day</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            {templates.length > 0
              ? "Initialize today's dashboard from your task templates."
              : "Set up your tasks in Settings first, then start your day here."}
          </p>
          <Button
            className="mt-5 rounded-xl"
            onClick={() => createDayMutation.mutate()}
            disabled={templates.length === 0 || createDayMutation.isPending}
          >
            {createDayMutation.isPending ? "Creating..." : "Start New Day"}
          </Button>
        </div>
      ) : (
        <>
          <DailyScore completed={completedBinary} total={totalBinaryScore} />
          <StreakBadges streaks={streaks} />
          <QuickTotals tasks={tasks} currencySymbol={currencySymbol} />

          <div className="space-y-3">
            {categories.map(cat =>
              groupedTasks[cat] ? (
                <CategorySection
                  key={cat}
                  category={cat}
                  tasks={groupedTasks[cat]}
                  onToggleTask={handleToggleTask}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtaskEntry={handleAddSubtaskEntry}
                  onRemoveSubtaskEntry={handleRemoveSubtaskEntry}
                  onAddEntry={handleAddEntry}
                  onRemoveEntry={handleRemoveEntry}
                  currencySymbol={currencySymbol}
                />
              ) : null
            )}
          </div>
        </>
      )}

      {/* FAB for quick entry */}
      {todayLog && nonBinaryTasks.length > 0 && (
        <button
          onClick={() => setShowAddEntry(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showAddEntry && (
        <AddEntryDialog
          tasks={nonBinaryTasks}
          onAdd={handleQuickAddEntry}
          onClose={() => setShowAddEntry(false)}
          currencySymbol={currencySymbol}
        />
      )}

      {/* New Day Confirmation */}
      <Dialog open={showNewDay} onOpenChange={setShowNewDay}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Start New Day?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create a fresh dashboard for today based on your task templates.
            {todayLog && " The current day's data will be replaced."}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewDay(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (todayLog) {
                  await base44.entities.DailyLog.delete(todayLog.id);
                }
                createDayMutation.mutate();
              }}
              disabled={createDayMutation.isPending}
            >
              {createDayMutation.isPending ? "Creating..." : "Start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function calculateStreaks(allLogs, todayLog) {
  const streakTasks = todayLog?.tasks?.filter(t => t.track_streak) || [];
  if (streakTasks.length === 0) return [];

  const sortedLogs = [...allLogs].sort((a, b) => b.date.localeCompare(a.date));

  return streakTasks.map(task => {
    let count = 0;
    for (const log of sortedLogs) {
      const logTask = log.tasks?.find(t => t.template_id === task.template_id);
      if (!logTask) break;
      const isCompleted = logTask.task_type === "binary"
        ? logTask.completed
        : logTask.daily_goal && (logTask.entries || []).reduce((s, e) => s + (e.value || 0), 0) >= logTask.daily_goal;
      if (isCompleted) count++;
      else break;
    }
    return { name: task.name, count };
  });
}