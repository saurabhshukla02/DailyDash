import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { Footprints, Beef, Wallet, CheckCircle2 } from "lucide-react";

const CURRENCY_SYMBOLS = { USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥", CAD:"CA$", AUD:"A$", CHF:"Fr", CNY:"¥", BRL:"R$", MXN:"MX$", SGD:"S$" };

export default function Analytics() {
  const [range, setRange] = useState("week");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.currency) setCurrencySymbol(CURRENCY_SYMBOLS[user.currency] || user.currency);
    });
  }, []);

  const { data: allLogs = [], isLoading } = useQuery({
    queryKey: ["analytics-logs"],
    queryFn: () => base44.entities.DailyLog.list("-date", 90),
  });

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const weekAgoStr = format(subDays(now, 6), "yyyy-MM-dd");
  const monthAgoStr = format(subDays(now, 29), "yyyy-MM-dd");

  const filteredLogs = allLogs.filter(log => {
    if (range === "week") return log.date >= weekAgoStr && log.date <= todayStr;
    if (range === "month") return log.date >= monthAgoStr && log.date <= todayStr;
    return true; // "all"
  }).sort((a, b) => a.date.localeCompare(b.date));

  const chartData = filteredLogs.map(log => {
    const tasks = log.tasks || [];
    const steps = tasks.filter(t => t.task_type === "steps").reduce((s, t) => s + (t.entries || []).reduce((a, e) => a + (e.value || 0), 0), 0);
    const protein = tasks.filter(t => t.task_type === "protein").reduce((s, t) => s + (t.entries || []).reduce((a, e) => a + (e.value || 0), 0), 0);
    const spending = tasks.filter(t => t.task_type === "spending").reduce((s, t) => s + (t.entries || []).reduce((a, e) => a + (e.value || 0), 0), 0);
    const binary = tasks.filter(t => t.task_type === "binary");
    const completionRate = binary.length > 0 ? Math.round((binary.filter(t => t.completed).length / binary.length) * 100) : 0;

    return {
      date: format(parseISO(log.date), "MMM d"),
      steps,
      protein,
      spending,
      completionRate,
    };
  });

  const charts = [
    { key: "completionRate", label: "Completion Rate", icon: CheckCircle2, color: "hsl(220, 65%, 54%)", suffix: "%" },
    { key: "steps", label: "Steps", icon: Footprints, color: "hsl(152, 55%, 48%)", suffix: "" },
    { key: "protein", label: "Protein (g)", icon: Beef, color: "hsl(43, 96%, 56%)", suffix: "g" },
    { key: "spending", label: `Spending (${currencySymbol})`, icon: Wallet, color: "hsl(220, 10%, 54%)", suffix: "" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your progress over time</p>
      </div>

      <Tabs value={range} onValueChange={setRange}>
        <TabsList className="w-full grid grid-cols-3 rounded-xl">
          <TabsTrigger value="week" className="rounded-lg text-xs">Week</TabsTrigger>
          <TabsTrigger value="month" className="rounded-lg text-xs">Month</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {chartData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No data yet for this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {charts.map(({ key, label, icon: Icon, color, suffix }) => (
            <div key={key} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={35} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#grad-${key})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}