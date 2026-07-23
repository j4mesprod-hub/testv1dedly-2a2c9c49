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
    const tick = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) navigate({ to: "/dashboard", replace: true });
      else setTimeout(tick, 200);
    };
    tick();
  }, [navigate]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin"/> Connexion en cours…
      </div>
    </div>
  );
}
