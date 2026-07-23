import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, CheckCircle2, Clock, Calendar as CalIcon, Sparkles } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { useDeadlines } from "@/hooks/use-deadlines";
import { useProfile } from "@/hooks/use-profile";
import { NewDeadlineDialog } from "@/components/NewDeadlineDialog";
import { formatDistanceToNow, format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const { data: deadlines = [], isLoading } = useDeadlines();
  const { data: profile } = useProfile();
  const firstName = (profile?.display_name ?? "").split(" ")[0];

  const upcoming = deadlines.filter((d) => d.status === "upcoming").length;
  const inProgress = deadlines.filter((d) => d.status === "in_progress").length;
  const completed = deadlines.filter((d) => d.status === "completed").length;
  const overdue = deadlines.filter((d) => d.status === "overdue").length;

  // last 7 days completion chart
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    return {
      d: format(d, "EEE", { locale: fr }),
      v: deadlines.filter((x) => x.completed_at && startOfDay(new Date(x.completed_at)).getTime() === d.getTime()).length,
    };
  });

  const priorities = deadlines
    .filter((d) => d.status !== "completed")
    .slice(0, 4);

  const isEmpty = !isLoading && deadlines.length === 0;

  return (
    <DashboardShell
      title={firstName ? `Bonjour ${firstName} 👋` : "Bonjour 👋"}
      subtitle="Voici un aperçu de vos deadlines."
      action={
        <NewDeadlineDialog trigger={
          <Button className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5"><Plus className="h-4 w-4 mr-1.5"/>Nouvelle deadline</Button>
        }/>
      }
    >
      {isEmpty ? (
        <EmptyState/>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <KPI label="À venir" value={upcoming} tone="blue" icon={<CalIcon className="h-4 w-4"/>}/>
            <KPI label="En cours" value={inProgress} tone="orange" icon={<Clock className="h-4 w-4"/>}/>
            <KPI label="Respectées" value={completed} tone="green" icon={<CheckCircle2 className="h-4 w-4"/>}/>
            <KPI label="En retard" value={overdue} tone="red" icon={<AlertTriangle className="h-4 w-4"/>}/>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl bg-card border border-border p-6">
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold">Activité de la semaine</h3>
                <p className="text-sm text-muted-foreground">Deadlines respectées par jour</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={days}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.35}/>
                        <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false}/>
                    <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}/>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}/>
                    <Area type="monotone" dataKey="v" stroke="var(--brand-blue)" strokeWidth={2.5} fill="url(#g1)" isAnimationActive animationDuration={900}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl font-bold mb-4">À traiter en priorité</h3>
              <div className="space-y-3">
                {priorities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tout est à jour ✨</p>
                ) : priorities.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full bg-brand-${p.color}`}/>
                      <span className="text-sm font-medium truncate">{p.title}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {formatDistanceToNow(new Date(p.due_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center animate-fade-in">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-ink text-cream grid place-items-center mb-6">
        <Sparkles className="h-7 w-7"/>
      </div>
      <h2 className="font-display text-3xl font-extrabold tracking-tight">Bienvenue sur Deadly</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Votre dashboard est vierge. Créez votre première deadline pour commencer — Deadly s'occupe des rappels.
      </p>
      <div className="mt-6">
        <NewDeadlineDialog trigger={
          <Button className="rounded-full bg-ink text-cream hover:bg-ink/90 h-12 px-6"><Plus className="h-4 w-4 mr-2"/>Créer ma première deadline</Button>
        }/>
      </div>
    </div>
  );
}

function KPI({ label, value, tone, icon }: { label: string; value: number; tone: "blue"|"orange"|"green"|"red"; icon: React.ReactNode }) {
  const map = { blue: "bg-brand-blue/15 text-brand-blue", orange: "bg-brand-orange/15 text-brand-orange", green: "bg-brand-green/15 text-brand-green", red: "bg-brand-red/15 text-brand-red" };
  return (
    <div className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`h-8 w-8 rounded-lg grid place-items-center ${map[tone]}`}>{icon}</div>
      </div>
      <div className="mt-3 font-display text-4xl font-extrabold">{value}</div>
    </div>
  );
}
