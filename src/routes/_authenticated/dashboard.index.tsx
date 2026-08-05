import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar as CalIcon,
  Send,
  ArrowUpRight,
  Globe,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useT, type TKey } from "@/lib/i18n";
import { sendDailySummaryNow } from "@/lib/telegram.functions";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { type Deadline } from "@/hooks/use-deadlines";
import { useUpdateProfile } from "@/hooks/use-profile";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { NewDeadlineDialog } from "@/components/NewDeadlineDialog";
import { formatDistanceToNow, format, subDays, startOfDay, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Vue d’ensemble — Deadly" },
      { name: "description", content: "Résumé de vos deadlines, statuts et échéances prioritaires dans Deadly." },
      { property: "og:title", content: "Vue d’ensemble — Deadly" },
      { property: "og:description", content: "Visualisez vos échéances à venir, en retard et respectées dans Deadly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function categoryIcon(d: Deadline) {
  const c = `${d.category ?? ""} ${d.title}`.toLowerCase();
  if (c.includes("ssl") || c.includes("certificat")) return ShieldCheck;
  if (c.includes("hébergement") || c.includes("hosting") || c.includes("serveur")) return Server;
  return Globe;
}

function daysLabel(due: string, t: (k: TKey) => string) {
  const n = differenceInCalendarDays(new Date(due), new Date());
  if (n < 0) return { text: `${Math.abs(n)} ${t("overview.daysLate")}`, tone: "red" as const };
  if (n === 0) return { text: t("common.today"), tone: "red" as const };
  if (n <= 7) return { text: `${n} ${t("common.days")}`, tone: "yellow" as const };
  return { text: `${n} ${t("common.days")}`, tone: "green" as const };
}

const TONE_TEXT = {
  red: "text-brand-red",
  yellow: "text-brand-yellow",
  green: "text-brand-green",
} as const;

const TONE_BG = {
  red: "bg-brand-red/10 text-brand-red",
  yellow: "bg-brand-yellow/15 text-brand-yellow",
  green: "bg-brand-green/12 text-brand-green",
} as const;

function Overview() {
  const { deadlines, profile, isLoading } = useDashboardData();
  const updateProfile = useUpdateProfile();
  const { t, dateLocale } = useT();
  const [summaryBusy, setSummaryBusy] = useState(false);
  const firstName = (profile?.display_name ?? "").split(" ")[0];

  const upcoming = deadlines.filter((d) => d.status === "upcoming").length;
  const inProgress = deadlines.filter((d) => d.status === "in_progress").length;
  const completed = deadlines.filter((d) => d.status === "completed").length;
  const overdue = deadlines.filter((d) => d.status === "overdue").length;
  const healthy = deadlines.filter(
    (d) => d.status !== "completed" && d.status !== "overdue" && differenceInCalendarDays(new Date(d.due_at), new Date()) > 7,
  ).length;

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    return {
      d: format(d, "EEE", { locale: dateLocale }),
      v: deadlines.filter(
        (x) => x.completed_at && startOfDay(new Date(x.completed_at)).getTime() === d.getTime(),
      ).length,
    };
  });

  const next = deadlines.filter((d) => d.status !== "completed").slice(0, 5);
  const isEmpty = !isLoading && deadlines.length === 0;

  if (isLoading) {
    return (
      <DashboardShell
        hideHeadingOnMobile
        title={t("overview.hello")}
        subtitle={t("overview.subtitle")}
      >
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  const total = deadlines.length || 1;
  const ratio = Math.round((completed / total) * 100);

  const sendSummary = async () => {
    setSummaryBusy(true);
    try {
      await sendDailySummaryNow();
      toast.success(t("summary.sent"));
    } catch (e) {
      toast.error(t("common.sendFailed"), { description: e instanceof Error ? e.message : "" });
    } finally {
      setSummaryBusy(false);
    }
  };

  const toggleSummary = (v: boolean) => {
    updateProfile.mutate(
      { summary_enabled: v },
      { onSuccess: () => toast.success(t(v ? "overview.summaryEnabled" : "overview.summaryDisabled")) },
    );
  };

  return (
    <DashboardShell
      hideHeadingOnMobile
      title={firstName ? `${t("overview.hello")} ${firstName} 👋` : `${t("overview.hello")} 👋`}
      subtitle={t("overview.subtitle")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void sendSummary()}
            disabled={summaryBusy}
            className="h-11 rounded-full px-5"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {summaryBusy ? t("common.sending") : t("overview.summaryBtn")}
          </Button>
          <NewDeadlineDialog
            trigger={
              <Button className="h-11 rounded-full bg-ink px-5 text-cream hover:bg-ink/90">
                <Plus className="mr-1.5 h-4 w-4" />
                {t("nav.newDeadline")}
              </Button>
            }
          />
        </div>
      }
    >
      {/* ================= MOBILE ================= */}
      <div className="md:hidden">
        <div className="animate-fade-in">
          <p className="text-sm font-semibold text-muted-foreground">
            {t("overview.hello")}
            {firstName ? ` ${firstName}` : ""},
          </p>
          <h1 className="mt-1 text-balance font-display text-[26px] font-extrabold leading-tight tracking-tight">
            {overdue > 0 ? t("overview.needsAttention") : t("overview.allUnderControl")}
          </h1>
        </div>

        {isEmpty ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MobileKpi value={healthy} label={t("overview.kpi.healthy")} tone="green" icon={<CheckCircle2 className="h-4 w-4" />} />
              <MobileKpi value={upcoming + inProgress} label={t("overview.kpi.upcoming")} tone="yellow" icon={<Clock className="h-4 w-4" />} />
              <MobileKpi value={overdue} label={t("overview.kpi.expired")} tone="red" icon={<AlertTriangle className="h-4 w-4" />} />
            </div>

            <section className="mt-6">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-extrabold">{t("overview.nextDeadlines")}</h2>
                <Link to="/dashboard/tasks" className="text-xs font-semibold text-muted-foreground">
                  {t("common.seeAll")}
                </Link>
              </div>
              <div className="space-y-2.5">
                {next.length === 0 && (
                  <div className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    {t("overview.allGood")}
                  </div>
                )}
                {next.map((d) => {
                  const Icon = categoryIcon(d);
                  const l = daysLabel(d.due_at, t);
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3.5 transition active:scale-[0.99]"
                    >
                      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", TONE_BG[l.tone])}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{d.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {d.category ?? d.client_name ?? format(new Date(d.due_at), "d MMM yyyy", { locale: dateLocale })}
                        </div>
                      </div>
                      <div className={cn("shrink-0 text-right text-xs font-bold", TONE_TEXT[l.tone])}>{l.text}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 rounded-3xl bg-ink p-5 text-cream">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cream/60">
                    <Send className="h-3.5 w-3.5" />
                    Telegram
                  </div>
                  <div className="mt-1 font-display text-base font-extrabold">{t("summary.title")}</div>
                  <p className="mt-1 text-xs leading-relaxed text-cream/70">
                    {profile?.telegram_chat_id
                      ? `${t("summary.sentDaily")} ${String(profile.summary_hour).padStart(2, "0")}:${String(profile.summary_minute).padStart(2, "0")}.`
                      : t("overview.telegramLinkText")}
                  </p>
                </div>
                {profile?.telegram_chat_id ? (
                  <Switch checked={!!profile?.summary_enabled} onCheckedChange={toggleSummary} />
                ) : (
                  <Link
                    to="/dashboard/settings"
                    search={{ tab: "notifications" } as never}
                    className="grid h-10 shrink-0 place-items-center rounded-full bg-cream px-4 text-xs font-bold text-ink"
                  >
                    {t("common.link")}
                  </Link>
                )}
              </div>
              {profile?.telegram_chat_id && (
                <button
                  onClick={() => void sendSummary()}
                  disabled={summaryBusy}
                  className="mt-4 h-10 w-full rounded-full bg-cream/10 text-xs font-bold text-cream transition hover:bg-cream/20 disabled:opacity-60"
                >
                  {summaryBusy ? t("common.sending") : t("summary.sendNow")}
                </button>
              )}
            </section>
          </>
        )}
      </div>

      {/* ================= DESKTOP / TABLET ================= */}
      <div className="hidden md:block">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StatusCard
                tone="green"
                value={healthy}
                title={t("overview.kpi.healthy")}
                text={t("overview.kpi.healthyText")}
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <StatusCard
                tone="yellow"
                value={upcoming + inProgress}
                title={t("overview.kpi.upcoming")}
                text={t("overview.kpi.upcomingText")}
                icon={<CalIcon className="h-5 w-5" />}
              />
              <StatusCard
                tone="red"
                value={overdue}
                title={t("overview.kpi.expired")}
                text={t("overview.kpi.expiredText")}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <section className="rounded-3xl border border-border bg-card p-6 xl:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-extrabold">{t("overview.latest")}</h3>
                    <p className="text-sm text-muted-foreground">{t("overview.latestSub")}</p>
                  </div>
                  <Link
                    to="/dashboard/tasks"
                    className="inline-flex h-9 items-center gap-1 rounded-full bg-secondary px-4 text-xs font-bold transition hover:bg-accent"
                  >
                    {t("common.seeAll")} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {next.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">{t("overview.allGood")}</div>
                  )}
                  {next.map((d) => {
                    const Icon = categoryIcon(d);
                    const l = daysLabel(d.due_at, t);
                    return (
                      <div key={d.id} className="flex items-center gap-4 py-3.5">
                        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", TONE_BG[l.tone])}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold">{d.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {d.client_name ?? d.category ?? t("common.deadline")} ·{" "}
                            {formatDistanceToNow(new Date(d.due_at), { addSuffix: true, locale: dateLocale })}
                          </div>
                        </div>
                        <div className="hidden text-xs text-muted-foreground sm:block">
                          {format(new Date(d.due_at), "d MMM yyyy", { locale: dateLocale })}
                        </div>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", TONE_BG[l.tone])}>{l.text}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-display text-xl font-extrabold">{t("overview.progress")}</h3>
                <p className="text-sm text-muted-foreground">{t("overview.progressSub")}</p>
                <div className="mt-6 grid place-items-center">
                  <Donut value={ratio} label={t("overview.completedShort")} />
                </div>
                <div className="mt-6 space-y-2 text-sm">
                  <Row label={t("overview.kpi.completed")} value={completed} dot="bg-brand-green" />
                  <Row label={t("overview.kpi.inProgress")} value={inProgress} dot="bg-brand-yellow" />
                  <Row label={t("overview.kpi.overdue")} value={overdue} dot="bg-brand-red" />
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-3xl border border-border bg-card p-6">
              <div className="mb-4">
                <h3 className="font-display text-xl font-extrabold">{t("overview.activity")}</h3>
                <p className="text-sm text-muted-foreground">{t("overview.activitySub")}</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={days}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} className="text-ink" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} className="text-ink" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--card)" }}
                    />
                    <Area type="monotone" dataKey="v" stroke="currentColor" className="text-ink" strokeWidth={2.5} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function MobileKpi({
  value,
  label,
  tone,
  icon,
}: {
  value: number;
  label: string;
  tone: keyof typeof TONE_BG;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-3.5">
      <span className={cn("grid h-9 w-9 place-items-center rounded-2xl", TONE_BG[tone])}>{icon}</span>
      <div className="mt-3 font-display text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusCard({
  value,
  title,
  text,
  tone,
  icon,
}: {
  value: number;
  title: string;
  text: string;
  tone: keyof typeof TONE_BG;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 transition hover:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", TONE_BG[tone])}>{icon}</span>
        <div className="font-display text-4xl font-extrabold leading-none">{value}</div>
      </div>
      <div className="mt-5 font-display text-lg font-extrabold">{title}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Row({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Donut({ value, label }: { value: number; label: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="14" className="stroke-secondary" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className="stroke-ink transition-[stroke-dashoffset] duration-1000 ease-out"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold leading-none">{value}%</div>
          <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-2xl font-extrabold">{t("overview.welcome")}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("overview.emptyText")}</p>
      <div className="mt-6 flex justify-center">
        <NewDeadlineDialog
          trigger={
            <Button className="h-11 rounded-full bg-ink px-6 text-cream hover:bg-ink/90">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("overview.firstDeadline")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
