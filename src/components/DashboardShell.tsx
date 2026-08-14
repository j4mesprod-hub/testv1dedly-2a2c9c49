import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode, type FormEvent } from "react";
import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  BarChart3,
  Settings,
  Search,
  Plus,
  LogOut,
  CheckCircle2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "./NotificationsBell";
import { NewDeadlineDialog } from "./NewDeadlineDialog";
import { TelegramOnboarding } from "./dashboard/TelegramOnboarding";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const nav = [
  { to: "/dashboard", key: "nav.overview" as const, short: "Accueil", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/tasks", key: "nav.deadlines" as const, short: "Actifs", icon: ListChecks },
  { to: "/dashboard/calendar", key: "nav.calendar" as const, short: "Agenda", icon: Calendar },
  { to: "/dashboard/stats", key: "nav.stats" as const, short: "Stats", icon: BarChart3 },
];

function initials(name?: string | null, email?: string | null) {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

function Avatar({ profile, inits, size = "h-9 w-9" }: { profile: { avatar_url?: string | null } | null | undefined; inits: string; size?: string }) {
  return (
    <button className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-xs font-bold text-cream", size)}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        inits
      )}
    </button>
  );
}

export function DashboardShell({
  children,
  title,
  subtitle,
  action,
  hideHeadingOnMobile = false,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  hideHeadingOnMobile?: boolean;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: profile } = useProfile();
  const { t } = useT();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard/tasks", search: { q: query || undefined } as never });
  };

  const inits = initials(profile?.display_name, profile?.reminder_email);
  const allNav = [...nav, { to: "/dashboard/settings", key: "nav.settings" as const, short: "Réglages", icon: Settings }];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Desktop floating sidebar */}
        <aside className="fixed bottom-4 left-4 top-4 z-40 hidden w-16 flex-col items-center justify-between rounded-[28px] bg-ink py-4 text-cream shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] md:flex">
          <div className="flex w-full flex-col items-center gap-2">
            <Link
              to="/"
              aria-label="Deadly"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-ink"
            >
              <CheckCircle2 className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} />
            </Link>
            <NewDeadlineDialog
              trigger={
                <button
                  aria-label={t("nav.newDeadline")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream transition hover:bg-cream/10"
                >
                  <Plus className="h-[18px] w-[18px] shrink-0" />
                </button>
              }
            />
            <div className="my-1 h-px w-6 bg-cream/10" />
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full transition",
                        active ? "bg-cream text-ink" : "text-cream/60 hover:bg-cream/10 hover:text-cream",
                      )}
                      aria-label={t(item.key)}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="border-ink bg-ink text-cream">
                    {t(item.key)}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/dashboard/settings"
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition",
                  isActive("/dashboard/settings") ? "bg-cream text-ink" : "text-cream/60 hover:bg-cream/10 hover:text-cream",
                )}
                aria-label={t("nav.settings")}
              >
                <Settings className="h-[18px] w-[18px] shrink-0" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-ink bg-ink text-cream">
              {t("nav.settings")}
            </TooltipContent>
          </Tooltip>
        </aside>

        <div className="md:pl-24">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 liquid-glass border-x-0 border-t-0 md:hidden">
            <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
              <Link to="/" className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-cream">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <span className="truncate font-display text-lg font-extrabold tracking-tight">Deadly</span>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/dashboard/settings"
                  search={{ tab: "notifications" } as never}
                  aria-label="Telegram"
                  className="liquid-pill grid h-9 w-9 place-items-center"
                >
                  <Send className="h-4 w-4" />
                </Link>
                <NotificationsBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar profile={profile} inits={inits} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">
                      {profile?.display_name ?? t("common.user")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings">{t("nav.settings")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("common.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Desktop top bar */}
          <header className="sticky top-0 z-20 hidden border-b border-border bg-background/80 backdrop-blur md:block">
            <div className="flex h-16 items-center gap-3 px-4 md:px-8">
              <form onSubmit={submitSearch} className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("common.search")}
                  className="h-10 w-full rounded-full border border-transparent bg-secondary pl-10 pr-4 text-sm outline-none focus:border-ink/20"
                />
              </form>
              <div className="flex shrink-0 items-center gap-2">
                {profile?.plan !== "pro" && (
                  <Link
                    to="/dashboard/settings"
                    search={{ tab: "abonnement" } as never}
                    className="hidden h-9 place-items-center rounded-full bg-ink px-4 text-sm font-semibold text-cream hover:bg-ink/90 sm:grid"
                  >
                    {t("common.upgrade")}
                  </Link>
                )}
                <NotificationsBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar profile={profile} inits={inits} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="truncate">
                      {profile?.display_name ?? t("common.user")}
                      <div className="truncate text-xs font-normal text-muted-foreground">
                        {profile?.reminder_email}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings">{t("nav.settings")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("common.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content — single tree, responsive */}
          <main className="px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
            <div
              className={cn(
                "mb-6 gap-4 md:flex md:flex-wrap md:items-end md:justify-between",
                hideHeadingOnMobile ? "hidden md:flex" : "block",
              )}
            >
              <div className="min-w-0">
                <h1 className="text-balance font-display text-2xl font-extrabold tracking-tight md:text-4xl">
                  {title}
                </h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
              </div>
              {action && <div className="mt-4 md:mt-0">{action}</div>}
            </div>
            {children}
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 liquid-glass rounded-[26px] px-1.5 py-1.5 md:hidden">
          <div className="grid grid-cols-5">
            {allNav.map((item) => {
              const active = isActive(item.to, "exact" in item ? item.exact : undefined);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-1 py-1.5"
                  aria-label={item.short}
                >
                  <span
                    className={cn(
                      "grid h-9 w-12 place-items-center rounded-full transition-all duration-300",
                      active ? "liquid-tab-active text-cream" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className={cn("text-[10px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
                    {item.short}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <TelegramOnboarding />
      </div>
    </TooltipProvider>
  );
}
