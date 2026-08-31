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

    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorDescription =
        url.searchParams.get("error_description") || url.searchParams.get("error");

      if (errorDescription) {
        navigate({ to: "/auth", replace: true });
        return;
      }

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (e) {
          console.error("[auth/callback] exchangeCodeForSession failed", e);
        }
        window.history.replaceState({}, "", "/auth/callback");
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (cancelled) return;

      if (user) {
        // Ensure profile row exists for this user
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const fallbackName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "Utilisateur";
          await supabase.from("profiles").upsert({
            id: user.id,
            display_name: fallbackName,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            reminder_email: user.email ?? null,
          });
        }

        navigate({ to: "/dashboard", replace: true });
      } else {
        navigate({ to: "/auth", replace: true });
      }
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
