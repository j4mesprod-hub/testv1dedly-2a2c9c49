import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateDeadline } from "@/hooks/use-deadlines";
import { toast } from "sonner";

const COLORS = [
  { v: "blue", label: "Bleu" },
  { v: "orange", label: "Orange" },
  { v: "red", label: "Rouge" },
  { v: "green", label: "Vert" },
  { v: "purple", label: "Violet" },
];

const REMINDER_PRESETS = [
  { v: 30, label: "30 jours avant" },
  { v: 14, label: "14 jours avant" },
  { v: 7, label: "7 jours avant" },
  { v: 1, label: "24h avant" },
  { v: 0, label: "À l'échéance" },
];

export function NewDeadlineDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [clientName, setClientName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("medium");
  const [color, setColor] = useState("blue");
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
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        client_name: clientName.trim() || undefined,
        due_at: new Date(dueAt).toISOString(),
        priority,
        color,
        alert_rules: alertRules,
        alert_hour: alertHour,
      });
      toast.success("Deadline créée");
      setOpen(false);
      setTitle(""); setDescription(""); setCategory(""); setClientName(""); setDueAt("");
      setPriority("medium"); setColor("blue"); setAlertRules([30, 7, 1, 0]); setAlertHour(9);
    } catch (e) {
      toast.error("Erreur", { description: e instanceof Error ? e.message : "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nouvelle deadline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Renouvellement domaine acme.com" className="h-11 rounded-xl"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & heure</Label>
              <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="h-11 rounded-xl"/>
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Client, Domaine…" className="h-11 rounded-xl"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Couleur</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (optionnel)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-xl"/>
          </div>
          <div className="space-y-2">
            <Label>Rappels</Label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((p) => {
                const active = reminders.includes(p.v);
                return (
                  <button
                    type="button"
                    key={p.v}
                    onClick={() => toggle(p.v)}
                    className={`px-3 h-8 rounded-full text-xs font-medium border transition ${active ? "bg-ink text-cream border-ink" : "bg-background border-border hover:bg-secondary"}`}
                  >{p.label}</button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Annuler</Button>
          <Button type="button" className="rounded-full bg-ink text-cream hover:bg-ink/90" disabled={create.isPending} onClick={() => { void submit(); }}>
            {create.isPending ? "Création…" : "Créer la deadline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
