import { type ReactNode } from "react";
import { AlertTriangle, Plus, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Réessayer",
  className,
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-red/10 text-brand-red">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-4 text-xs font-semibold transition hover:bg-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </span>
      <div>
        <h3 className="font-display text-lg font-extrabold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-cream transition hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SectionSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded bg-secondary" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
      <div className="mt-2 h-10 w-16 animate-pulse rounded bg-secondary" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="h-5 w-40 animate-pulse rounded bg-secondary" />
      <div className="mt-1 h-4 w-56 animate-pulse rounded bg-secondary" />
      <div className="mt-4 h-64 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}

export function QueryBoundary({
  isLoading,
  isError,
  isEmpty,
  empty,
  error,
  skeleton,
  children,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  empty: ReactNode;
  error: ReactNode;
  skeleton: ReactNode;
  children: ReactNode;
  onRetry?: () => void;
}) {
  if (isLoading) return <>{skeleton}</>;
  if (isError) return <>{error}</>;
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}
