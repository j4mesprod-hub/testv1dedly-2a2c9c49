import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Mail, Bell, Slack, Chrome, Github, Check, Trash2, Loader2, Send } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createProCheckout, syncProAfterCheckout } from "@/lib/stripe.functions";
import { deleteMyAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  getTelegramBotUsername,
  sendTestTelegramMessage,
  linkTelegramAccount,
  unlinkTelegramAccount,
  sendDailySummaryNow,
} from "@/lib/telegram.functions";
import { useT } from "@/lib/i18n";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — Deadly" },
      { name: "description", content: "Configurez votre profil, vos emails de rappel, vos tests d’envoi et votre abonnement Deadly." },
      { property: "og:title", content: "Paramètres — Deadly" },
      { property: "og:description", content: "Gérez les réglages de compte, notifications et abonnement de votre espace Deadly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setTimezone(profile.timezone ?? "Europe/Paris");
      setLanguage(profile.language ?? "fr");
    }
  }, [profile]);

  const save = async () => {
    try {
      await update.mutateAsync({ display_name: displayName || null, timezone, language });
      toast.success("Profil mis à jour");
    } catch (e) {
      toast.error("Enregistrement impossible", { description: e instanceof Error ? e.message : "" });
    }
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Chargement…</div>;

  return (
    <div className="max-w-4xl">
      <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
        <div>
          <h3 className="font-display text-xl font-bold mb-1">Informations personnelles</h3>
          <p className="text-sm text-muted-foreground">Personnalisez votre profil.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Nom d'affichage</Label>
            <Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className="h-10 rounded-xl"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Email du compte</Label>
            <Input value={profile?.email ?? profile?.reminder_email ?? ""} disabled className="h-10 rounded-xl"/>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Langue / Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Fuseau horaire</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Paris">Paris (Europe/Paris)</SelectItem>
                <SelectItem value="America/New_York">New York (America/New_York)</SelectItem>
                <SelectItem value="America/Los_Angeles">Los Angeles (America/Los_Angeles)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button className="rounded-full bg-ink text-cream hover:bg-ink/90" onClick={save} disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>

        <div className="pt-5 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground max-w-sm">
            La suppression de votre compte efface définitivement vos deadlines et vos réglages.
          </p>
          <DeleteAccountButton/>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!window.confirm("Supprimer définitivement votre compte et toutes vos deadlines ?")) return;
    setBusy(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      toast.error("Suppression impossible", { description: e instanceof Error ? e.message : "" });
      setBusy(false);
    }
  };
  return (
    <Button
      variant="ghost"
      onClick={() => { void remove(); }}
      disabled={busy}
      className="rounded-full text-brand-red hover:bg-brand-red/10 h-9 px-4 text-sm"
    >
      <Trash2 className="h-4 w-4 mr-2"/>{busy ? "Suppression…" : "Supprimer mon compte"}
    </Button>
  );
}

function NotifTab() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const linked = !!profile?.telegram_chat_id;

  const { data: botInfo } = useQuery({
    queryKey: ["telegram-bot-username"],
    queryFn: () => getTelegramBotUsername(),
    staleTime: Infinity,
  });
  const botUsername = botInfo?.username ?? "";
  const botUrl = botUsername ? `https://t.me/${botUsername}` : "";

  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const link = async () => {
    if (!code.trim()) { toast.error("Collez le code reçu dans Telegram"); return; }
    setLinking(true);
    try {
      await linkTelegramAccount({ data: { code: code.trim() } });
      toast.success("Compte Telegram lié 🎉");
      setCode("");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error("Liaison impossible", { description: e instanceof Error ? e.message : "" });
    } finally { setLinking(false); }
  };

  const unlink = async () => {
    setUnlinking(true);
    try {
      await unlinkTelegramAccount();
      toast.success("Compte Telegram délié");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error("Erreur", { description: e instanceof Error ? e.message : "" });
    } finally { setUnlinking(false); }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      await sendTestTelegramMessage();
      toast.success("Message Telegram envoyé");
    } catch (e) {
      toast.error("Envoi impossible", { description: e instanceof Error ? e.message : "" });
    } finally { setTesting(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
        <div>
          <h3 className="font-display text-xl font-bold mb-1 flex items-center gap-2"><Send className="h-5 w-5"/>Rappels via Telegram</h3>
          <p className="text-sm text-muted-foreground">Deadly vous envoie vos rappels directement dans Telegram.</p>
        </div>

        {linked ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-green/10 border border-brand-green/30 px-4 py-3 flex items-center gap-3">
              <Check className="h-5 w-5 text-brand-green"/>
              <div className="text-sm">
                <div className="font-semibold">Compte Telegram lié</div>
                <div className="text-muted-foreground text-xs">Chat ID : {profile?.telegram_chat_id}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full h-11 px-5" onClick={sendTest} disabled={testing}>
                {testing ? "Envoi…" : "Envoyer un message test"}
              </Button>
              <Button variant="outline" className="rounded-full h-11 px-5 border-brand-red/40 text-brand-red hover:bg-brand-red/10" onClick={unlink} disabled={unlinking}>
                {unlinking ? "…" : "Délier"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
              <li>
                Ouvrez Telegram, cherchez{" "}
                {botUrl ? (
                  <a href={botUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline underline-offset-2">@{botUsername}</a>
                ) : (
                  <span className="font-semibold text-foreground">le bot Deadly</span>
                )}.
              </li>
              <li>Cliquez sur <span className="font-semibold text-foreground">Démarrer</span> (ou envoyez <code>/start</code>).</li>
              <li>Copiez le code que le bot vous renvoie et collez-le ci-dessous.</li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Code de liaison</Label>
                <Input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} placeholder="ABC123" className="h-11 rounded-xl font-mono tracking-widest uppercase"/>
              </div>
              <Button className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5" onClick={link} disabled={linking}>
                {linking ? "Liaison…" : "Lier mon compte"}
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">Les horaires de rappel (J-30, J-7, J-1…) se choisissent au moment de la création de chaque deadline.</p>
      </div>
      {linked && <SummaryCard/>}
    </div>
  );
}

function SummaryCard() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const { t } = useT();
  const [enabled, setEnabled] = useState(true);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setEnabled(profile.summary_enabled ?? true);
      setHour(profile.summary_hour ?? 9);
      setMinute(profile.summary_minute ?? 0);
    }
  }, [profile]);

  const save = async () => {
    await update.mutateAsync({
      summary_enabled: enabled,
      summary_hour: hour,
      summary_minute: minute,
    });
    toast.success("Heure du résumé enregistrée");
  };

  const sendNow = async () => {
    setBusy(true);
    try {
      await sendDailySummaryNow();
      toast.success(t("summary.sent"));
    } catch (e) {
      toast.error("Envoi impossible", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
      <div>
        <h3 className="font-display text-xl font-bold mb-1">{t("summary.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("summary.desc")}</p>
      </div>

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <Checkbox checked={enabled} onCheckedChange={(v) => setEnabled(v === true)} />
        <span className="font-medium">{t("summary.enabled")}</span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2 max-w-md">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{t("summary.hour")}</Label>
          <Select value={String(hour)} onValueChange={(v) => setHour(parseInt(v, 10))}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger>
            <SelectContent className="max-h-64">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")} h</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{t("summary.minute")}</Label>
          <Select value={String(minute)} onValueChange={(v) => setMinute(parseInt(v, 10))}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue/></SelectTrigger>
            <SelectContent className="max-h-64">
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Envoi prévu à <span className="font-semibold text-foreground">{String(hour).padStart(2, "0")}h{String(minute).padStart(2, "0")}</span> ({(profile?.timezone ?? "Europe/Paris").split("/")[1]?.replace("_", " ") ?? "Paris"}).
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button onClick={save} disabled={update.isPending} className="rounded-full bg-ink text-cream hover:bg-ink/90 h-11 px-5">
          {update.isPending ? t("common.saving") : t("common.save")}
        </Button>
        <Button variant="outline" onClick={sendNow} disabled={busy} className="rounded-full h-11 px-5">
          {busy ? t("common.sending") : t("summary.sendNow")}
        </Button>
      </div>
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
      <div className={`flex flex-col rounded-2xl border p-6 bg-card ${!isPro ? "border-ink" : "border-border"}`}>
        {!isPro && <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-2">Votre plan</div>}
        <h3 className="font-display text-3xl font-extrabold">Gratuit</h3>
        <div className="mt-2 text-4xl font-bold">0 €<span className="text-base font-normal text-muted-foreground"> / mois</span></div>
        <ul className="mt-6 mb-6 space-y-2.5 text-sm">
          {freeFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green"/>{f}</li>
          ))}
        </ul>
        <Button disabled variant="outline" className="w-full rounded-full mt-auto">{isPro ? "Rétrograder" : "Plan actuel"}</Button>
      </div>

      <div className={`relative flex flex-col rounded-2xl border-2 p-6 bg-card ${isPro ? "border-ink" : "border-brand-blue"}`}>
        {isPro ? (
          <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-2">Votre plan</div>
        ) : (
          <div className="absolute -top-3 left-6 rounded-full bg-brand-blue text-white text-xs font-semibold px-3 py-1">Recommandé</div>
        )}
        <h3 className="font-display text-3xl font-extrabold">Pro</h3>
        <div className="mt-2 text-4xl font-bold">9 €<span className="text-base font-normal text-muted-foreground"> / mois</span></div>
        <ul className="mt-6 mb-6 space-y-2.5 text-sm">
          {proFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green"/>{f}</li>
          ))}
        </ul>
        <Button
          onClick={upgrade}
          disabled={loading || isPro}
          className={`w-full rounded-full mt-auto ${isPro ? "" : "bg-ink text-cream hover:bg-ink/90"}`}
          variant={isPro ? "outline" : "default"}
        >
          {isPro ? "Abonnement actif" : loading ? "Redirection…" : "Passer au Pro — 9 €/mois"}
        </Button>
      </div>
    </div>
  );
}
