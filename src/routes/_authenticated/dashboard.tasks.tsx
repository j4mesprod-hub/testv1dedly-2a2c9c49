import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useDeadlines, useUpdateDeadlineStatus, useDeleteDeadline, type DeadlineStatus } from "@/hooks/use-deadlines";
import { NewDeadlineDialog } from "@/components/NewDeadlineDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDistanceToNow, format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/tasks")({
  head: () => ({
    meta: [
      { title: "Deadlines — Deadly" },
      { name: "description", content: "Liste et gestion de vos deadlines avec priorité, statut et rappels Telegram." },
      { property: "og:title", content: "Deadlines — Deadly" },
      { property: "og:description", content: "Créez, filtrez et suivez vos échéances critiques dans Deadly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tasks,
});

const STATUS_KEY: Record<DeadlineStatus, TKey> = {
  upcoming: "status.upcoming",
  in_progress: "status.in_progress",
  completed: "status.completed",
  overdue: "status.overdue",
};
const STATUS_TONE: Record<DeadlineStatus, string> = {
  upcoming: "bg-brand-blue/15 text-brand-blue",
  in_progress: "bg-brand-orange/15 text-brand-orange",
  completed: "bg-brand-green/15 text-brand-green",
  overdue: "bg-brand-red/15 text-brand-red",
};
const PRIORITY_DOT: Record<string, string> = {
  low: "bg-brand-green",
  medium: "bg-brand-yellow",
  high: "bg-brand-red",
  green: "bg-brand-green",
  yellow: "bg-brand-yellow",
  red: "bg-brand-red",
};

function Tasks() {
  const { data: items = [] } = useDeadlines();
  const [filter, setFilter] = useState<"all" | DeadlineStatus>("all");
  const update = useUpdateDeadlineStatus();
  const del = useDeleteDeadline();
  const { t, dateLocale, lang } = useT();

  const search = useRouterState({ select: (r) => r.location.search as { q?: string } });
  const [q, setQ] = useState(search?.q ?? "");
  useEffect(() => { setQ(search?.q ?? ""); }, [search?.q]);

  const filtered = items
    .filter((i) => filter === "all" ? true : i.status === filter)
    .filter((i) => !q.trim() ? true : (i.title + " " + (i.category ?? "") + " " + (i.description ?? "")).toLowerCase().includes(q.trim().toLowerCase()));

  const dateFmt = lang === "en" ? "d MMM yyyy 'at' HH:mm" : "d MMM yyyy 'à' HH:mm";

  return (
    <DashboardShell
      title={t("tasks.title")}
      subtitle={t("tasks.subtitle")}
      action={
        <NewDeadlineDialog trigger={
          <Button className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5"><Plus className="h-4 w-4 mr-1.5"/>{t("nav.new")}</Button>
        }/>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all", "upcoming", "in_progress", "completed", "overdue"] as const).map((k) => {
          const count = k === "all" ? items.length : items.filter((i) => i.status === k).length;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`h-9 px-4 rounded-full text-sm font-medium border transition ${filter === k ? "bg-ink text-cream border-ink" : "bg-card border-border hover:bg-secondary"}`}
            >
              {k === "all" ? t("tasks.all") : t(STATUS_KEY[k])} · {count}
            </button>
          );
        })}
        {q && (
          <div className="ml-auto flex items-center gap-2 text-xs bg-secondary rounded-full px-3 h-9">
            <span>{t("tasks.searchLabel")} : <b>{q}</b></span>
            <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {q ? `${t("tasks.noResult")} « ${q} ».` : t("tasks.emptyCategory")}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border divide-y divide-border">
          {filtered.map((d) => (
            <div key={d.id} className="flex items-center gap-4 p-4 animate-fade-in">
              <div className={`h-2 w-2 rounded-full ${PRIORITY_DOT[d.priority] ?? PRIORITY_DOT[d.color] ?? "bg-brand-yellow"}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold truncate">{d.title}</div>
                  {d.category && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">· {d.category}</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(d.due_at), dateFmt, { locale: dateLocale })} ·{" "}
                  {formatDistanceToNow(new Date(d.due_at), { addSuffix: true, locale: dateLocale })}
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[d.status]}`}>{t(STATUS_KEY[d.status])}</span>
              <Select value={d.status} onValueChange={(v) => update.mutate({ id: d.id, status: v as DeadlineStatus })}>
                <SelectTrigger className="h-9 w-36 rounded-full"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">{t("status.upcoming")}</SelectItem>
                  <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                  <SelectItem value="completed">{t("status.completed")}</SelectItem>
                  <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => del.mutate(d.id)} className="h-9 w-9 rounded-full grid place-items-center text-muted-foreground hover:bg-brand-red/10 hover:text-brand-red">
                <Trash2 className="h-4 w-4"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
