import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send, Search, MessageSquare, KeyRound, Check, X, ArrowRight } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "deadly.onboarding.telegram.v2";
const storageKey = (userId?: string) => (userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX);
export const BOT_USERNAME = "DeadlyAlertBot";

type Step = {
  icon: typeof Send;
  kicker: string;
  title: string;
  text: string;
  scene: "search" | "start" | "code" | "done";
};

const STEPS: Step[] = [
  {
    icon: Search,
    kicker: "Étape 1",
    title: `Ouvrez Telegram et cherchez @${BOT_USERNAME}`,
    text: "Dans la barre de recherche de Telegram, tapez le nom du bot officiel Deadly, puis ouvrez la conversation.",
    scene: "search",
  },
  {
    icon: MessageSquare,
    kicker: "Étape 2",
    title: "Envoyez /start au bot",
    text: "Appuyez sur « Démarrer » (ou envoyez /start). Le bot vous répond immédiatement avec un code de liaison à 6 caractères.",
    scene: "start",
  },
  {
    icon: KeyRound,
    kicker: "Étape 3",
    title: "Collez le code dans Réglages → Notifications",
    text: "Copiez le code reçu, revenez ici, ouvrez Réglages puis l'onglet Notifications et collez-le pour lier votre compte.",
    scene: "code",
  },
  {
    icon: Check,
    kicker: "C'est prêt",
    title: "Votre résumé quotidien arrive sur Telegram",
    text: "Chaque jour à l'heure choisie, Deadly vous envoie la liste de vos échéances. Vous pouvez tout modifier dans Réglages.",
    scene: "done",
  },
];

function Scene({ scene }: { scene: Step["scene"] }) {
  return (
    <div key={scene} className="tuto-scene relative mx-auto w-full max-w-[260px] rounded-[28px] border border-border bg-background p-3 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

      {scene === "search" && (
        <div className="space-y-2">
          <div className="flex h-9 items-center gap-2 rounded-full bg-secondary px-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="tuto-type text-[12px] font-medium" data-text={`@${BOT_USERNAME}`} />
            <span className="tuto-caret" />
          </div>
          <div className="tuto-pop-1 flex items-center gap-2 rounded-2xl bg-card p-2.5 ring-1 ring-border">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-cream">
              <Send className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold">Deadly Alert</div>
              <div className="truncate text-[10px] text-muted-foreground">@{BOT_USERNAME}</div>
            </div>
          </div>
        </div>
      )}

      {scene === "start" && (
        <div className="space-y-2">
          <div className="tuto-pop-1 ml-auto w-fit rounded-2xl rounded-br-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-cream">/start</div>
          <div className="tuto-pop-2 w-fit rounded-2xl rounded-bl-md bg-secondary px-3 py-2 text-[11px] leading-relaxed">
            Bienvenue sur Deadly 👋
            <br />
            Votre code de liaison :
            <br />
            <span className="font-mono text-[13px] font-bold tracking-[0.2em]">7K2Q9A</span>
          </div>
        </div>
      )}

      {scene === "code" && (
        <div className="space-y-2">
          <div className="rounded-2xl bg-secondary p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Réglages → Notifications</div>
            <div className="mt-2 flex h-9 items-center rounded-full bg-card px-3 ring-1 ring-border">
              <span className="tuto-type font-mono text-[13px] font-bold tracking-[0.2em]" data-text="7K2Q9A" />
              <span className="tuto-caret" />
            </div>
          </div>
          <div className="tuto-pop-2 grid h-9 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">Lier mon compte</div>
        </div>
      )}

      {scene === "done" && (
        <div className="space-y-2">
          <div className="tuto-pop-1 mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-green/15 text-brand-green">
            <Check className="h-6 w-6" strokeWidth={3} />
          </div>
          <div className="tuto-pop-2 rounded-2xl bg-secondary px-3 py-2 text-[11px] leading-relaxed">
            <b>Résumé du jour</b>
            <br />• example.com — 12 jours
            <br />• Certificat SSL — 24 jours
          </div>
        </div>
      )}
    </div>
  );
}

export function TelegramOnboarding() {
  const { data: profile, isLoading } = useProfile();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const key = storageKey(profile?.id);

  useEffect(() => {
    if (isLoading || typeof window === "undefined" || !profile?.id) return;
    if (localStorage.getItem(storageKey(profile.id))) return;
    if (profile.telegram_chat_id) {
      localStorage.setItem(storageKey(profile.id), "1");
      return;
    }
    const id = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(id);
  }, [isLoading, profile?.id, profile?.telegram_chat_id]);

  useEffect(() => {
    const reopen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("deadly:open-telegram-tutorial", reopen);
    return () => window.removeEventListener("deadly:open-telegram-tutorial", reopen);
  }, []);

  const close = () => {
    if (typeof window !== "undefined") localStorage.setItem(key, "1");
    setOpen(false);
  };

  if (!open) return null;
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button aria-label="Fermer le tutoriel" onClick={close} className="tuto-backdrop absolute inset-0 bg-ink/45 backdrop-blur-sm" />

      <div className="tuto-panel relative w-full max-w-md overflow-hidden rounded-[32px] border border-border bg-card p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)] sm:p-8">
        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <Send className="h-3.5 w-3.5" />
          Connexion Telegram
        </div>

        <div className="mt-5">
          <Scene scene={current.scene} />
        </div>

        <div key={step} className="tuto-copy mt-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-cream">
              <Icon className="h-3 w-3" />
            </span>
            {current.kicker}
          </div>
          <h2 className="mt-2 text-balance font-display text-xl font-extrabold leading-tight">{current.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.text}</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.kicker}
                aria-label={`Aller à l'${s.kicker.toLowerCase()}`}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === step ? "w-7 bg-ink" : i < step ? "w-3 bg-ink/40" : "w-3 bg-border",
                )}
              />
            ))}
          </div>

          {last ? (
            <Link
              to="/dashboard/settings"
              search={{ tab: "notifications" } as never}
              onClick={close}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-cream transition hover:opacity-90"
            >
              Lier mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-cream transition hover:opacity-90"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ouvrir @{BOT_USERNAME}
          </a>
          <button onClick={close} className="text-muted-foreground transition hover:text-foreground">
            Passer le tutoriel
          </button>
        </div>
      </div>
    </div>
  );
}
