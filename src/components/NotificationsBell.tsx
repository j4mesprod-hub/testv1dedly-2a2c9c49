import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { useNotifications, useMarkAllRead } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function NotificationsBell() {
  const { data: items = [] } = useNotifications();
  const markAll = useMarkAllRead();
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(o) => { if (o && unread > 0) markAll.mutate(); }}>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 rounded-full bg-secondary grid place-items-center hover:bg-accent transition">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-brand-red text-white text-[9px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-display font-bold">Notifications</div>
          <div className="text-xs text-muted-foreground">{unread} non lue{unread > 1 ? "s" : ""}</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucune notification pour l'instant.
            </div>
          ) : items.map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b border-border/60 last:border-0 ${n.read ? "" : "bg-secondary/40"}`}>
              <div className="text-sm font-semibold">{n.title}</div>
              {n.message && <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>}
              <div className="text-[10px] text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
