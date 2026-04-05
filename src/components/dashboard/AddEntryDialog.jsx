import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const unitLabels = { steps: "steps", protein: "g" };

export default function AddEntryDialog({ tasks, onAdd, onClose, currencySymbol = "$" }) {

  const [selectedId, setSelectedId] = useState(tasks[0]?.template_id || "");
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");

  const selectedTask = tasks.find(t => t.template_id === selectedId);
  const unit = selectedTask
    ? (selectedTask.task_type === "spending"
        ? currencySymbol
        : (unitLabels[selectedTask.task_type] || selectedTask.unit || ""))
    : "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value || !selectedId) return;
    onAdd(selectedId, { description: desc, value: parseFloat(value) });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Log Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
            <SelectContent>
              {tasks.map(t => (
                <SelectItem key={t.template_id} value={t.template_id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <Input
            placeholder={`Amount (${unit})`}
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            required
          />
          <Button type="submit" className="w-full rounded-xl">Add Entry</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}