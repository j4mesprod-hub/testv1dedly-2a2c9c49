import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Connexion en cours — Deadly" },
      { name: "description", content: "Finalisation sécurisée de votre connexion à Deadly." },
      { property: "og:title", content: "Connexion en cours — Deadly" },
      { property: "og:description", content: "Finalisation sécurisée de votre connexion à Deadly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorDescription =
        url.searchParams.get("error_description") || url.searchParams.get("error");

      // Direct Supabase OAuth (non-Lovable hosting) returns ?code= to exchange.
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          /* detectSessionInUrl may already have consumed it */
        }
        window.history.replaceState({}, "", "/auth/callback");
      } else if (errorDescription) {
        navigate({ to: "/auth", replace: true });
        return;
      }

      const tick = async () => {
        if (cancelled) return;
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        attempts += 1;
        if (attempts > 50) {
          navigate({ to: "/auth", replace: true });
          return;
        }
        setTimeout(tick, 200);
      };
      tick();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin"/> Connexion en cours…
      </div>
    </div>
  );
}
