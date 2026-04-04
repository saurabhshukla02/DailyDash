import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart3, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/Dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/Analytics", icon: BarChart3, label: "Analytics" },
  { path: "/History", icon: CalendarDays, label: "History" },
  { path: "/Settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}