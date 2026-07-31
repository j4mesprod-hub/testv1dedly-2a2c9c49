import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useDeadlines } from "@/hooks/use-deadlines";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/stats")({
  head: () => ({
    meta: [
      { title: "Statistiques — Deadly" },
      { name: "description", content: "Analysez vos deadlines respectées, manquées et à venir avec les statistiques Deadly." },
      { property: "og:title", content: "Statistiques — Deadly" },
      { property: "og:description", content: "Suivez la performance de gestion de vos échéances dans Deadly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Stats,
});

const COLORS = { upcoming: "var(--brand-blue)", in_progress: "var(--brand-orange)", completed: "var(--brand-green)", overdue: "var(--brand-red)" } as const;

function Stats() {
  const { data: items = [] } = useDeadlines();
  const { t, dateLocale } = useT();

  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const overdue = items.filter((i) => i.status === "overdue").length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  const pieData = (["upcoming", "in_progress", "completed", "overdue"] as const).map((s) => ({
    name: t(`status.${s}` as const),
    value: items.filter((i) => i.status === s).length,
    fill: COLORS[s],
  }));

  const months = Array.from({ length: 6 }).map((_, i) => {
    const m = startOfMonth(subMonths(new Date(), 5 - i));
    const next = startOfMonth(subMonths(new Date(), 4 - i));
    const inMonth = items.filter((x) => {
      const ts = new Date(x.due_at).getTime();
      return ts >= m.getTime() && ts < next.getTime();
    });
    return {
      m: format(m, "MMM", { locale: dateLocale }),
      respected: inMonth.filter((x) => x.status === "completed").length,
      missed: inMonth.filter((x) => x.status === "overdue").length,
    };
  });

  return (
    <DashboardShell title={t("stats.title")} subtitle={t("stats.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <BigStat label={t("stats.rate")} value={`${rate}%`} tone="green"/>
        <BigStat label={t("stats.total")} value={total} tone="blue"/>
        <BigStat label={t("stats.completed")} value={completed} tone="green"/>
        <BigStat label={t("stats.missed")} value={overdue} tone="red"/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-display text-xl font-bold mb-1">{t("stats.history")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("stats.historySub")}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}/>
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}/>
                <Bar dataKey="respected" fill="var(--brand-green)" radius={[8,8,0,0]} isAnimationActive animationDuration={900}/>
                <Bar dataKey="missed" fill="var(--brand-red)" radius={[8,8,0,0]} isAnimationActive animationDuration={900}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-display text-xl font-bold mb-1">{t("stats.breakdown")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("stats.breakdownSub")}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4} isAnimationActive animationDuration={900}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string | number; tone: "blue"|"green"|"red" }) {
  const map = { blue: "text-brand-blue", green: "text-brand-green", red: "text-brand-red" };
  return (
    <div className="rounded-2xl bg-card border border-border p-6 animate-fade-in">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-4xl font-extrabold ${map[tone]}`}>{value}</div>
    </div>
  );
}
