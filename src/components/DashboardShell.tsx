import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Calendar, ListChecks, BarChart3, Settings, Search, Plus, LogOut } from "lucide-react";
import { DeadlyLogo } from "./DeadlyLogo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "./NotificationsBell";
import { NewDeadlineDialog } from "./NewDeadlineDialog";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/calendar", label: "Calendrier", icon: Calendar },
  { to: "/dashboard/tasks", label: "Deadlines", icon: ListChecks },
  { to: "/dashboard/stats", label: "Statistiques", icon: BarChart3 },
];

function initials(name?: string | null, email?: string | null) {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function DashboardShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

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
    <div className="min-h-screen bg-background text-foreground flex">
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-ink text-cream flex flex-col transition-[width] duration-300 ease-out",
          hovered ? "w-60" : "w-16",
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-cream/10 overflow-hidden">
          <Link to="/" className="flex items-center gap-2">
            <DeadlyLogo variant="light" showText={hovered} />
          </Link>
        </div>

        <div className="p-3">
          <NewDeadlineDialog trigger={
            <button className="w-full h-10 rounded-xl bg-brand-orange text-ink flex items-center justify-center gap-2 font-semibold text-sm hover:bg-brand-orange/90 transition">
              <Plus className="h-4 w-4" />
              <span className={cn("whitespace-nowrap transition-opacity", hovered ? "opacity-100" : "opacity-0 w-0")}>Nouvelle deadline</span>
            </button>
          }/>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition",
                  active ? "bg-cream text-ink" : "text-cream/70 hover:bg-cream/10 hover:text-cream",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn("whitespace-nowrap transition-opacity", hovered ? "opacity-100" : "opacity-0")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-cream/10 space-y-1">
          <Link
            to="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition",
              isActive("/dashboard/settings") ? "bg-cream text-ink" : "text-cream/70 hover:bg-cream/10 hover:text-cream",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className={cn("whitespace-nowrap transition-opacity", hovered ? "opacity-100" : "opacity-0")}>Paramètres</span>
          </Link>
          <div className="flex items-center gap-3 h-12 px-2 mt-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0"/>
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-orange/80 grid place-items-center text-ink font-semibold text-xs shrink-0">{inits}</div>
            )}
            <div className={cn("min-w-0 transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
              <div className="text-sm font-semibold truncate">{profile?.display_name ?? "Utilisateur"}</div>
              <div className="text-[10px] text-cream/50 truncate">{profile?.reminder_email ?? ""}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 pl-16">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-8">
          <form onSubmit={submitSearch} className="relative w-96 max-w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une deadline…"
              className="w-full h-10 rounded-full bg-secondary pl-10 pr-4 text-sm outline-none border border-transparent focus:border-ink/20"
            />
          </form>
          <div className="flex items-center gap-3">
            {profile?.plan !== "pro" && (
              <Link to="/dashboard/settings" search={{ tab: "abonnement" } as never} className="rounded-full h-9 px-4 bg-ink text-cream hover:bg-ink/90 text-sm font-semibold grid place-items-center">
                Upgrade
              </Link>
            )}
            <NotificationsBell/>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover"/>
                  ) : (
                    <div className="h-full w-full bg-brand-orange/80 grid place-items-center text-ink font-semibold text-xs">{inits}</div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{profile?.display_name ?? "Utilisateur"}</div>
                  <div className="text-xs text-muted-foreground font-normal">{profile?.reminder_email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
                  <Settings className="h-4 w-4 mr-2"/> Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-brand-red">
                  <LogOut className="h-4 w-4 mr-2"/> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
