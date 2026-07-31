import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateDeadline } from "@/hooks/use-deadlines";
import { useT, type TKey } from "@/lib/i18n";
import { toast } from "sonner";

const REMINDER_PRESETS: { v: number; key: TKey }[] = [
  { v: 30, key: "dialog.preset.30" },
  { v: 14, key: "dialog.preset.14" },
  { v: 7, key: "dialog.preset.7" },
  { v: 1, key: "dialog.preset.1" },
  { v: 0, key: "dialog.preset.0" },
];

const PRIORITY_COLOR: Record<string, string> = {
  low: "green",
  medium: "yellow",
  high: "red",
};

export function NewDeadlineDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("medium");
  const [alertRules, setAlertRules] = useState<number[]>([]);
  const create = useCreateDeadline();
  const { t } = useT();

  const toggle = (v: number) =>
    setAlertRules((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v].sort((a, b) => b - a)));

  const submit = async () => {
    if (!title.trim() || !dueAt) {
      toast.error(t("dialog.required"));
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        due_at: new Date(`${dueAt}T12:00:00`).toISOString(),
        priority,
        color: PRIORITY_COLOR[priority] ?? "yellow",
        alert_rules: alertRules,
        alert_hour: 9,
      });
      toast.success(t("dialog.created"));
      setOpen(false);
      setTitle(""); setDueAt("");
      setPriority("medium"); setAlertRules([]);
    } catch (e) {
      toast.error(t("common.error"), { description: e instanceof Error ? e.message : "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl p-6 md:p-8">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">{t("dialog.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("dialog.desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-normal">{t("dialog.name")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("dialog.namePlaceholder")} className="h-12 rounded-full px-5"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-normal">{t("dialog.date")}</Label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="h-12 rounded-full px-5"/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-normal">{t("dialog.priority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-12 rounded-full px-5"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("dialog.priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("dialog.priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("dialog.priority.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 min-w-0">
            <Label className="text-xs text-muted-foreground font-normal">{t("dialog.reminders")}</Label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((p) => {
                const active = alertRules.includes(p.v);
                return (
                  <button
                    type="button"
                    key={p.v}
                    onClick={() => toggle(p.v)}
                    className={`px-3 h-9 rounded-full text-xs font-semibold border transition ${active ? "bg-ink text-cream border-ink" : "bg-background border-border text-foreground hover:bg-secondary"}`}
                  >{t(p.key)}</button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="pt-4 gap-2 sm:gap-2">
          <Button variant="ghost" className="rounded-full h-11 px-5" onClick={() => setOpen(false)}>
            {t("dialog.cancel")}
          </Button>
          <Button
            className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-6"
            onClick={() => void submit()}
            disabled={create.isPending}
          >
            {create.isPending ? t("dialog.creating") : t("dialog.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
