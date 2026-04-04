import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StreakBadges({ streaks }) {
  if (!streaks || streaks.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {streaks.map((s, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
            s.count > 0
              ? "bg-orange-50 text-orange-600 border-orange-100"
              : "bg-secondary text-muted-foreground border-border"
          )}
        >
          <Flame className={cn("w-3 h-3", s.count > 0 && "text-orange-500")} />
          <span>{s.name}</span>
          <span className="font-bold">{s.count}</span>
        </div>
      ))}
    </div>
  );
}