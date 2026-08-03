import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_description: typeof search.error_description === "string" ? search.error_description : undefined,
    next: typeof search.next === "string" && search.next.startsWith("/") && !search.next.startsWith("//")
      ? search.next
      : "/dashboard",
  }),
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
  const search = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const finishSignIn = async () => {
      if (search.error) {
        setError(search.error_description ?? search.error);
        return;
      }

      if (search.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(search.code);
        if (exchangeError) {
          if (active) setError(exchangeError.message);
          return;
        }
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError || !data.user) {
        setError(userError?.message ?? "La session Google n’a pas pu être créée. Réessayez la connexion.");
        return;
      }

      window.location.replace(search.next);
    };

    void finishSignIn();
    return () => { active = false; };
  }, [search.code, search.error, search.error_description, search.next]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      {error ? (
        <div className="mx-4 max-w-md space-y-4 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="text-xl font-semibold">Connexion impossible</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.assign("/auth")} className="rounded-full">
            Réessayer
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin"/> Connexion en cours…
        </div>
      )}
    </div>
  );
}
