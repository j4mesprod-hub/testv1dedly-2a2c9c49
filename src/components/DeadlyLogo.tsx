import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  showText?: boolean;
  variant?: "dark" | "light";
}

export function DeadlyLogo({ className, showText = true, variant = "dark" }: Props) {
  const fg = variant === "dark" ? "text-ink" : "text-cream";
  const check = variant === "dark" ? "#fcfbf8" : "#111";
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className={cn("h-7 w-7", fg)} fill="none" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="9" className="fill-current" />
        <path d="M10 16.5 L14.5 21 L22.5 12" stroke={check} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && (
        <span className={cn("font-display text-xl font-extrabold tracking-tight", fg)}>Deadly</span>
      )}
    </div>
  );
}
