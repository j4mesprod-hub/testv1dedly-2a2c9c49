import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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

function NavIcon({
  to,
  label,
  icon: Icon,
  active,
  expanded,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className={cn(
            "group flex h-11 items-center rounded-full transition",
            expanded ? "w-full justify-start gap-3 px-3" : "w-11 justify-center",
            active ? "bg-cream text-ink" : "text-cream/60 hover:bg-cream/10 hover:text-cream",
          )}
          aria-label={label}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span
            className={cn(
              "truncate text-sm font-semibold transition-opacity",
              expanded ? "opacity-100" : "sr-only opacity-0",
            )}
          >
            {label}
          </span>
        </Link>
      </TooltipTrigger>
      {!expanded && (
        <TooltipContent side="right" className="border-ink bg-ink text-cream">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
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
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard/tasks", search: { q: query || undefined } as never });
  };

  const inits = initials(profile?.display_name, profile?.reminder_email);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        {/* ---------- Desktop / tablet: floating rail ---------- */}
        <aside
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          className={cn(
            "fixed bottom-4 left-4 top-4 z-40 hidden flex-col justify-between rounded-[28px] bg-ink py-4 text-cream shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] transition-[width,padding] duration-300 ease-out md:flex",
            sidebarExpanded ? "w-56 px-3" : "w-16 items-center px-2",
          )}
        >
          <div className="flex w-full flex-col items-center gap-2">
            <Link
              to="/"
              aria-label="Deadly"
              className={cn(
                "flex h-11 items-center rounded-full bg-cream text-ink transition-all",
                sidebarExpanded ? "w-full justify-start gap-3 px-3" : "w-11 justify-center",
              )}
            >
              <CheckCircle2 className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} />
              <span className={cn("truncate text-sm font-extrabold", sidebarExpanded ? "block" : "sr-only")}>
                Deadly
              </span>
            </Link>
            <NewDeadlineDialog
              trigger={
                <button
                  aria-label={t("nav.newDeadline")}
                  className={cn(
                    "flex h-11 items-center rounded-full border border-cream/25 text-cream transition-all hover:bg-cream/10",
                    sidebarExpanded ? "w-full justify-start gap-3 px-3" : "w-11 justify-center",
                  )}
                >
                  <Plus className="h-[18px] w-[18px] shrink-0" />
                  <span className={cn("truncate text-sm font-semibold", sidebarExpanded ? "block" : "sr-only")}>
                    {t("nav.new")}
                  </span>
                </button>
              }
            />
            <div className="my-1 h-px w-6 bg-cream/10" />
            {nav.map((item) => (
              <NavIcon
                key={item.to}
                to={item.to}
                label={t(item.key)}
                icon={item.icon}
                active={isActive(item.to, item.exact)}
                expanded={sidebarExpanded}
              />
            ))}
          </div>
          <div className="flex w-full flex-col items-center gap-2">
            <NavIcon
              to="/dashboard/settings"
              label={t("nav.settings")}
              icon={Settings}
              active={isActive("/dashboard/settings")}
              expanded={sidebarExpanded}
            />
          </div>
        </aside>

        <div className="md:pl-24">
          {/* ---------- Mobile top bar ---------- */}
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
                    <button className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-ink text-xs font-bold text-cream">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        inits
                      )}
                    </button>
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

          {/* ---------- Desktop top bar ---------- */}
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
                    <button className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-ink text-xs font-bold text-cream">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        inits
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="truncate">
                      {profile?.display_name ?? t("common.user")}
                      <div className="truncate text-xs font-normal text-muted-foreground">
                        {profile?.email ?? profile?.reminder_email}
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

          {/* ---------- Page ---------- */}
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

        {/* ---------- Mobile bottom tab bar ---------- */}
        <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 liquid-glass rounded-[26px] px-1.5 py-1.5 md:hidden">
          <div className="grid grid-cols-5">
            {[...nav, { to: "/dashboard/settings", key: "nav.settings" as const, short: "Réglages", icon: Settings }].map(
              (item) => {
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
              },
            )}
          </div>
        </nav>


        {/* One-time animated Telegram tutorial */}
        <TelegramOnboarding />
      </div>
    </TooltipProvider>
  );
}
