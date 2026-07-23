import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useDeadlines } from "@/hooks/use-deadlines";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewDeadlineDialog } from "@/components/NewDeadlineDialog";

export const Route = createFileRoute("/_authenticated/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { data: items = [] } = useDeadlines();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startWeekday = (startOfMonth(month).getDay() + 6) % 7; // Monday first

  return (
    <DashboardShell
      title="Calendrier"
      subtitle="Vos deadlines dans le temps."
      action={<NewDeadlineDialog trigger={<Button className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5"><Plus className="h-4 w-4 mr-1.5"/>Nouvelle</Button>}/>}
    >
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold capitalize">{format(month, "MMMM yyyy", { locale: fr })}</h3>
          <div className="flex gap-1">
            <button onClick={() => setMonth((m) => subMonths(m, 1))} className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary"><ChevronLeft className="h-4 w-4"/></button>
            <button onClick={() => setMonth(startOfMonth(new Date()))} className="h-9 px-3 rounded-full text-sm hover:bg-secondary">Aujourd'hui</button>
            <button onClick={() => setMonth((m) => addMonths(m, 1))} className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary"><ChevronRight className="h-4 w-4"/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-muted-foreground mb-2">
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => <div key={d} className="p-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => <div key={"e"+i}/>)}
          {days.map((d) => {
            const events = items.filter((e) => isSameDay(new Date(e.due_at), d));
            const isToday = isSameDay(d, new Date());
            return (
              <div key={d.toISOString()} className={`min-h-24 p-2 rounded-xl border ${isToday ? "border-ink bg-secondary/50" : "border-border/60"} animate-fade-in`}>
                <div className={`text-xs font-semibold ${isToday ? "text-ink" : "text-muted-foreground"}`}>{format(d, "d")}</div>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 2).map((e) => (
                    <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded bg-brand-${e.color}/15 text-brand-${e.color} truncate`}>{e.title}</div>
                  ))}
                  {events.length > 2 && <div className="text-[10px] text-muted-foreground">+{events.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
