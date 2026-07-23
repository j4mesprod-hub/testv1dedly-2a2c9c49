import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateDeadline } from "@/hooks/use-deadlines";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const REMINDER_PRESETS = [
  { v: 30, label: "30 jours" },
  { v: 14, label: "14 jours" },
  { v: 7, label: "7 jours" },
  { v: 1, label: "24h" },
  { v: 0, label: "Le jour J" },
];

export function NewDeadlineDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("medium");
  const [alertRules, setAlertRules] = useState<number[]>([30, 7, 1, 0]);
  const [alertHour, setAlertHour] = useState<number>(9);
  const create = useCreateDeadline();

  const toggle = (v: number) =>
    setAlertRules((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v].sort((a, b) => b - a)));

  const submit = async () => {
    if (!title.trim() || !dueAt) {
      toast.error("Titre et date requis");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        due_at: new Date(dueAt).toISOString(),
        priority,
        color: "blue",
        alert_rules: alertRules,
        alert_hour: alertHour,
      });
      toast.success("Deadline créée");
      setOpen(false);
      setTitle(""); setDueAt("");
      setPriority("medium"); setAlertRules([30, 7, 1, 0]); setAlertHour(9);
    } catch (e) {
      toast.error("Erreur", { description: e instanceof Error ? e.message : "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl p-6 md:p-8">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">Nouvelle deadline</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-normal">Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Renouvellement du domaine acme.com" className="h-12 rounded-full px-5"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-normal">Date & heure</Label>
              <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="h-12 rounded-full px-5"/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-normal">Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-12 rounded-full px-5"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
            <div className="space-y-2 min-w-0">
              <Label className="text-xs text-muted-foreground font-normal">Rappels</Label>
              <div className="flex flex-wrap gap-2">
                {REMINDER_PRESETS.map((p) => {
                  const active = alertRules.includes(p.v);
                  return (
                    <button
                      type="button"
                      key={p.v}
                      onClick={() => toggle(p.v)}
                      className={`px-3 h-9 rounded-full text-xs font-semibold border transition ${active ? "bg-ink text-cream border-ink" : "bg-background border-border text-foreground hover:bg-secondary"}`}
                    >{p.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-normal">Heure d'envoi</Label>
              <Select value={String(alertHour)} onValueChange={(v) => setAlertHour(parseInt(v, 10))}>
                <SelectTrigger className="h-9 rounded-full px-4 w-full sm:w-[110px]"><SelectValue/></SelectTrigger>
                <SelectContent className="max-h-64">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-4 gap-2 sm:gap-3">
          <Button type="button" variant="outline" className="rounded-full h-11 px-5" onClick={() => setOpen(false)}>Annuler</Button>
          <Button type="button" className="rounded-full h-11 px-5 bg-ink text-cream hover:bg-ink/90 gap-2" disabled={create.isPending} onClick={() => { void submit(); }}>
            <ClipboardCheck className="h-4 w-4" />
            {create.isPending ? "Création…" : "Créer la deadline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
