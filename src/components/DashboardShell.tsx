import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Calendar, ListChecks, BarChart3, Settings, Search, Plus, LogOut, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "./NotificationsBell";
import { NewDeadlineDialog } from "./NewDeadlineDialog";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const nav = [
  { to: "/dashboard", key: "nav.overview" as const, icon: LayoutDashboard, exact: true },
  { to: "/dashboard/calendar", key: "nav.calendar" as const, icon: Calendar },
  { to: "/dashboard/tasks", key: "nav.deadlines" as const, icon: ListChecks },
  { to: "/dashboard/stats", key: "nav.stats" as const, icon: BarChart3 },
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
            active
              ? "bg-cream text-ink"
              : "text-cream/60 hover:text-cream hover:bg-cream/10",
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
        <TooltipContent side="right" className="bg-ink text-cream border-ink">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export function DashboardShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: profile } = useProfile();
  const { t } = useT();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname === to || pathname.startsWith(to + "/"));

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
        {/* Desktop floating sidebar */}
        <aside
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          className={cn(
            "hidden md:flex fixed top-4 bottom-4 left-4 z-40 flex-col justify-between rounded-[28px] bg-ink text-cream py-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] transition-[width,padding] duration-300 ease-out",
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
              <span className={cn("truncate text-sm font-extrabold", sidebarExpanded ? "block" : "sr-only")}>Deadly</span>
            </Link>
            <NewDeadlineDialog trigger={
              <button
                aria-label={t("nav.newDeadline")}
                className={cn(
                  "flex h-11 items-center rounded-full border border-cream/25 text-cream hover:bg-cream/10 transition-all",
                  sidebarExpanded ? "w-full justify-start gap-3 px-3" : "w-11 justify-center",
                )}
              >
                <Plus className="h-[18px] w-[18px] shrink-0" />
                <span className={cn("truncate text-sm font-semibold", sidebarExpanded ? "block" : "sr-only")}>{t("nav.new")}</span>
              </button>
            }/>
            <div className="h-px w-6 bg-cream/10 my-1" />
            {nav.map((item) => (
              <NavIcon key={item.to} to={item.to} label={t(item.key)} icon={item.icon} active={isActive(item.to, item.exact)} expanded={sidebarExpanded} />
            ))}
          </div>
          <div className="flex w-full flex-col items-center gap-2">
            <NavIcon to="/dashboard/settings" label={t("nav.settings")} icon={Settings} active={isActive("/dashboard/settings")} expanded={sidebarExpanded} />
          </div>
        </aside>

        <div className="md:pl-24">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
            <div className="h-16 flex items-center gap-3 px-4 md:px-8">
              <form onSubmit={submitSearch} className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("common.search")}
                  className="w-full h-10 rounded-full bg-secondary pl-10 pr-4 text-sm outline-none border border-transparent focus:border-ink/20"
                />
              </form>
              <div className="flex items-center gap-2 shrink-0">
                {profile?.plan !== "pro" && (
                  <Link to="/dashboard/settings" search={{ tab: "abonnement" } as never} className="hidden sm:grid rounded-full h-9 px-4 bg-ink text-cream hover:bg-ink/90 text-sm font-semibold place-items-center">
                    Upgrade
                  </Link>
                )}
                <NotificationsBell/>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover"/>
                      ) : (
                        <div className="h-full w-full bg-brand-orange/80 grid place-items-center text-ink font-semibold text-xs">{inits}</div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="text-sm font-semibold truncate">{profile?.display_name ?? t("common.user")}</div>
                      <div className="text-xs text-muted-foreground font-normal truncate">{profile?.reminder_email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    {profile?.plan !== "pro" && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings", search: { tab: "abonnement" } as never })} className="sm:hidden">
                        Upgrade
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
                      <Settings className="h-4 w-4 mr-2"/> {t("nav.settings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-brand-red">
                      <LogOut className="h-4 w-4 mr-2"/> {t("common.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="px-4 md:px-8 py-6 md:py-8 pb-28 md:pb-8">
            <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
              <div className="min-w-0">
                <h1 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight truncate">{title}</h1>
                {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
            {children}
          </main>
        </div>

        {/* Mobile bottom floating nav */}
        <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-ink text-cream px-2 py-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={t(item.key)}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full transition",
                  active ? "bg-cream text-ink" : "text-cream/70 hover:text-cream",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </Link>
            );
          })}
          <NewDeadlineDialog trigger={
            <button aria-label={t("nav.newDeadline")} className="grid h-10 w-10 place-items-center rounded-full bg-brand-orange text-ink">
              <Plus className="h-[18px] w-[18px]" />
            </button>
          }/>
          <Link
            to="/dashboard/settings"
            aria-label={t("nav.settings")}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition",
              isActive("/dashboard/settings") ? "bg-cream text-ink" : "text-cream/70",
            )}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Link>
        </nav>
      </div>
    </TooltipProvider>
  );
}
