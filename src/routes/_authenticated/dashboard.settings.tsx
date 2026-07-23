import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Mail, Bell, Slack, Chrome, Github, Check, Trash2, Loader2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import { createProCheckout, syncProAfterCheckout } from "@/lib/stripe.functions";
import { sendTestReminderEmail, triggerReminderDryRun } from "@/lib/email.functions";
import { useDeadlines } from "@/hooks/use-deadlines";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [tab, setTab] = useState<"profil"|"notifications"|"integrations"|"abonnement">(() => {
    if (typeof window === "undefined") return "profil";
    const params = new URL(window.location.href).searchParams;
    if (params.get("checkout")) return "abonnement";
    const t = params.get("tab");
    return t === "notifications" || t === "integrations" || t === "abonnement" ? t : "profil";
  });
  useEffect(() => {
    const onPop = () => {
      const params = new URL(window.location.href).searchParams;
      if (params.get("checkout")) {
        setTab("abonnement");
        return;
      }
      const t = params.get("tab");
      if (t === "notifications" || t === "integrations" || t === "abonnement" || t === "profil") setTab(t as typeof tab);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return (
    <DashboardShell title="Paramètres" subtitle="Gérez votre compte, vos rappels et votre abonnement.">
      <div className="flex gap-2 mb-6 border-b border-border">
        {([
          ["profil","Profil"],
          ["notifications","Notifications"],
          ["integrations","Intégrations"],
          ["abonnement","Abonnement"],
        ] as const).map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-3 text-sm font-medium -mb-px border-b-2 transition ${tab===k?"border-ink text-foreground":"border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      {tab === "profil" && <ProfileTab/>}
      {tab === "notifications" && <NotifTab/>}
      {tab === "integrations" && <IntegrationsTab/>}
      {tab === "abonnement" && <BillingTab/>}
    </DashboardShell>
  );
}

function ProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setTimezone(profile.timezone ?? "Europe/Paris");
    }
  }, [profile]);

  const save = async () => {
    await update.mutateAsync({ display_name: displayName || null, avatar_url: avatarUrl || null, timezone });
    toast.success("Profil mis à jour");
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Chargement…</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
        <div>
          <h3 className="font-display text-xl font-bold mb-1">Informations personnelles</h3>
          <p className="text-sm text-muted-foreground">Personnalisez votre profil.</p>
        </div>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover"/>
          ) : (
            <div className="h-16 w-16 rounded-full bg-brand-orange/80 grid place-items-center text-ink font-bold text-xl">
              {(displayName || profile?.reminder_email || "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">URL avatar</Label>
            <Input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} placeholder="https://…" className="h-10 rounded-xl"/>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Nom d'affichage</Label>
            <Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className="h-10 rounded-xl"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Email de connexion</Label>
            <Input value={profile?.reminder_email ?? ""} disabled className="h-10 rounded-xl"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Fuseau horaire</Label>
            <Input value={timezone} onChange={(e)=>setTimezone(e.target.value)} className="h-10 rounded-xl"/>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button className="rounded-full bg-ink text-cream hover:bg-ink/90" onClick={save} disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
      <div className="rounded-2xl bg-brand-red/10 border border-brand-red/30 p-5 self-start">
        <h4 className="font-display font-bold text-brand-red mb-1">Zone dangereuse</h4>
        <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
        <Button variant="outline" className="rounded-full border-brand-red/40 text-brand-red hover:bg-brand-red/10"><Trash2 className="h-4 w-4 mr-2"/>Supprimer mon compte</Button>
      </div>
    </div>
  );
}

function NotifTab() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [email, setEmail] = useState("");
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableInApp, setEnableInApp] = useState(true);

  useEffect(() => {
    if (profile?.reminder_email) setEmail(profile.reminder_email);
  }, [profile]);

  const save = async () => {
    if (!email.includes("@")) { toast.error("Email invalide"); return; }
    await update.mutateAsync({ reminder_email: email });
    toast.success("Email de rappel mis à jour");
  };

  const [testing, setTesting] = useState(false);
  const sendTest = async () => {
    setTesting(true);
    try {
      const r = await sendTestReminderEmail();
      toast.success("Email envoyé", { description: `À ${r.to}` });
    } catch (e) {
      toast.error("Envoi impossible", { description: e instanceof Error ? e.message : "" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
        <div>
          <h3 className="font-display text-xl font-bold mb-1">Email de rappel</h3>
          <p className="text-sm text-muted-foreground">Adresse à laquelle Deadly enverra les rappels de vos deadlines.</p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="h-11 rounded-xl"/>
          </div>
          <Button className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5" onClick={save} disabled={update.isPending}>Enregistrer</Button>
          <Button variant="outline" className="rounded-full h-11 px-5" onClick={sendTest} disabled={testing}>
            {testing ? "Envoi…" : "Envoyer un test"}
          </Button>
        </div>
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="font-display font-bold">Canaux</h4>
          <NotifRow icon={<Mail/>} title="Email" desc="Rappels à l'adresse ci-dessus" checked={enableEmail} onChange={setEnableEmail}/>
          <NotifRow icon={<Bell/>} title="Notifications dans l'app" desc="Cloche en haut à droite" checked={enableInApp} onChange={setEnableInApp}/>
        </div>
        <p className="text-xs text-muted-foreground pt-4 border-t border-border">Les horaires de rappel (J-30, J-7, J-1…) se choisissent au moment de la création de chaque deadline.</p>
      </div>
      <DryRunCard defaultEmail={profile?.reminder_email ?? ""}/>
    </div>
  );
}

function DryRunCard({ defaultEmail }: { defaultEmail: string }) {
  const { data: deadlines } = useDeadlines();
  const nowParisHour = () => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).formatToParts(new Date());
    return parseInt(parts.find((p) => p.type === "hour")?.value ?? "9", 10) % 24;
  };
  const [testEmail, setTestEmail] = useState(defaultEmail);
  const [deadlineId, setDeadlineId] = useState<string>("all");
  const [overrideHour, setOverrideHour] = useState<number>(nowParisHour());
  const [forceSend, setForceSend] = useState(true);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ sent: number; to: string } | null>(null);

  useEffect(() => { if (defaultEmail && !testEmail) setTestEmail(defaultEmail); }, [defaultEmail, testEmail]);

  const activeDeadlines = (deadlines ?? []).filter((d) => d.status !== "completed");

  const run = async () => {
    if (!testEmail.includes("@")) { toast.error("Adresse de test invalide"); return; }
    setBusy(true);
    try {
      const r = await triggerReminderDryRun({
        data: {
          testEmail,
          deadlineId: deadlineId === "all" ? undefined : deadlineId,
          overrideHour,
          forceSend,
        },
      });
      setLast({ sent: r.sent, to: testEmail });
      if (r.sent === 0) {
        toast.info("Aucun email envoyé", {
          description: "Aucun rappel ne correspond aux critères. Coche « Forcer l'envoi » pour ignorer les filtres.",
        });
      } else {
        toast.success(`${r.sent} email${r.sent > 1 ? "s" : ""} envoyé${r.sent > 1 ? "s" : ""}`, { description: `À ${testEmail}` });
      }
    } catch (e) {
      toast.error("Test impossible", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold mb-1">Tester l'envoi des rappels</h3>
        <p className="text-sm text-muted-foreground">
          Déclenche un envoi simulé (dryRun) sur une adresse de test. La déduplication n'est pas modifiée : le vrai
          déclenchement horaire enverra l'email comme prévu.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground">Adresse de test</Label>
          <Input type="email" value={testEmail} onChange={(e)=>setTestEmail(e.target.value)} placeholder="vous@exemple.com" className="h-11 rounded-xl"/>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Rappel à simuler</Label>
          <Select value={deadlineId} onValueChange={setDeadlineId}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">Tous mes rappels</SelectItem>
              {activeDeadlines.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Heure simulée (Paris)</Label>
          <Select value={String(overrideHour)} onValueChange={(v) => setOverrideHour(parseInt(v, 10))}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger>
            <SelectContent className="max-h-64">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <Checkbox checked={forceSend} onCheckedChange={(v) => setForceSend(v === true)} className="mt-0.5"/>
        <span>
          <span className="font-medium">Forcer l'envoi</span>
          <span className="block text-xs text-muted-foreground">Ignore les filtres <code>alert_rules</code> et <code>alert_hour</code> pour envoyer un exemple immédiatement.</span>
        </span>
      </label>
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={run} disabled={busy} className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5">
          {busy ? "Envoi…" : "Envoyer un test"}
        </Button>
        {last && (
          <span className="text-xs text-muted-foreground">
            Dernier essai : {last.sent} email{last.sent > 1 ? "s" : ""} → {last.to}
          </span>
        )}
      </div>
    </div>
  );
}

function NotifRow({ icon, title, desc, checked, onChange }: { icon: React.ReactNode; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-background grid place-items-center">{icon}</div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange}/>
    </div>
  );
}

function IntegrationsTab() {
  const items = [
    { n:"Google Calendar", d:"Synchronisez vos échéances", i:<Chrome/> },
    { n:"Slack", d:"Alertes dans vos canaux", i:<Slack/> },
    { n:"Notion", d:"Importez vos bases", i:<Github/> },
    { n:"GitHub", d:"Suivez vos issues et PR", i:<Github/> },
    { n:"Outlook", d:"Synchronisez vos réunions", i:<Mail/> },
    { n:"Zapier", d:"Connectez 5000+ apps", i:<Bell/> },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-secondary/60 border border-border px-5 py-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest bg-ink text-cream px-2.5 py-1 rounded-full">Bientôt</span>
        <p className="text-sm text-muted-foreground">Les intégrations arrivent prochainement pour tous les abonnés Pro.</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.n} className="rounded-2xl bg-card border border-border p-5 opacity-80">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center">{it.i}</div>
              <div>
                <div className="font-semibold">{it.n}</div>
                <div className="text-xs text-muted-foreground">{it.d}</div>
              </div>
            </div>
            <Button disabled variant="outline" className="w-full rounded-full">À venir</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingTab() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const isPro = profile?.plan === "pro";
  const [loading, setLoading] = useState(false);

  // Handle Stripe callback (?checkout=success&session_id=…)
  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("checkout");
    const sessionId = url.searchParams.get("session_id");
    if (status === "success" && sessionId) {
      syncProAfterCheckout({ data: { sessionId } })
        .then((r) => {
          if (r.upgraded) {
            toast.success("Bienvenue chez Pro 🎉");
            qc.invalidateQueries({ queryKey: ["profile"] });
          }
        })
        .catch((e) => toast.error("Sync abonnement", { description: e instanceof Error ? e.message : "" }))
        .finally(() => {
          url.searchParams.delete("checkout");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        });
    } else if (status === "cancel") {
      toast.info("Paiement annulé");
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, [qc]);

  const upgrade = async () => {
    setLoading(true);
    try {
      let origin = window.location.origin;
      try { if (window.top) origin = window.top.location.origin; } catch { /* cross-origin */ }
      const { url } = await createProCheckout({ data: { origin } });
      // Escape the Lovable preview iframe so Stripe Checkout loads at top level.
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = url;
          return;
        }
      } catch {
        window.open(url, "_blank", "noopener");
        setLoading(false);
        return;
      }
      window.location.href = url;
    } catch (e) {
      toast.error("Impossible d'ouvrir le paiement", { description: e instanceof Error ? e.message : "" });
      setLoading(false);
    }
  };

  const proFeatures = [
    "Deadlines illimitées",
    "Dates d'alerte personnalisables",
    "Profil entièrement personnalisable",
    "Accès aux intégrations (à venir)",
  ];
  const freeFeatures = [
    "5 deadlines par mois",
    "1 rappel par deadline",
    "Tableau de bord personnel",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
      <div className={`rounded-2xl border p-6 bg-card ${!isPro ? "border-ink" : "border-border"}`}>
        {!isPro && <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-2">Votre plan</div>}
        <h3 className="font-display text-3xl font-extrabold">Gratuit</h3>
        <div className="mt-2 text-4xl font-bold">0 €<span className="text-base font-normal text-muted-foreground"> / mois</span></div>
        <ul className="mt-6 space-y-2.5 text-sm">
          {freeFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green"/>{f}</li>
          ))}
        </ul>
        <Button disabled variant="outline" className="w-full rounded-full mt-6">{isPro ? "Rétrograder" : "Plan actuel"}</Button>
      </div>

      <div className={`rounded-2xl border-2 p-6 bg-card relative ${isPro ? "border-ink" : "border-brand-blue"}`}>
        {isPro ? (
          <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-2">Votre plan</div>
        ) : (
          <div className="absolute -top-3 left-6 rounded-full bg-brand-blue text-white text-xs font-semibold px-3 py-1">Recommandé</div>
        )}
        <h3 className="font-display text-3xl font-extrabold">Pro</h3>
        <div className="mt-2 text-4xl font-bold">9 €<span className="text-base font-normal text-muted-foreground"> / mois</span></div>
        <ul className="mt-6 space-y-2.5 text-sm">
          {proFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green"/>{f}</li>
          ))}
        </ul>
        <Button
          onClick={upgrade}
          disabled={loading || isPro}
          className={`w-full rounded-full mt-6 ${isPro ? "" : "bg-ink text-cream hover:bg-ink/90"}`}
          variant={isPro ? "outline" : "default"}
        >
          {isPro ? "Abonnement actif" : loading ? "Redirection…" : "Passer au Pro — 9 €/mois"}
        </Button>
      </div>
    </div>
  );
}
