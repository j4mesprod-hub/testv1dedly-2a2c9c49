import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DeadlyLogo } from "@/components/DeadlyLogo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion Deadly" },
      { name: "description", content: "Connectez-vous à Deadly avec Google pour gérer vos deadlines et rappels de renouvellement." },
      { property: "og:title", content: "Connexion Deadly" },
      { property: "og:description", content: "Accédez à votre espace Deadly pour suivre vos domaines, SSL, hébergements et licences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useT();

  useEffect(() => {
    // If already signed in, bounce to dashboard
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

const signIn = async () => {
  setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/auth/callback",
    },
  });

  if (error) {
    setLoading(false);
    toast.error(t("auth.failed"), {
      description: error.message,
    });
  }
};

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-cream p-12">
        <DeadlyLogo variant="light" />
        <div>
          <h2 className="font-display text-5xl font-extrabold tracking-tight leading-[1.05]">
            {t("landing.h1a")}<br/>{t("landing.h1b")}
          </h2>
          <p className="mt-6 text-cream/70 max-w-md">{t("auth.sideText")}</p>
        </div>
        <p className="text-sm text-cream/50">© 2026 Deadly</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden"><DeadlyLogo /></div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("auth.welcome")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("auth.sub")}</p>
          </div>
          <Button
            onClick={signIn}
            disabled={loading}
            className="w-full h-12 rounded-full bg-ink text-cream hover:bg-ink/90 gap-3 text-base font-semibold"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : <GoogleIcon/>}
            {t("auth.google")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">{t("auth.legal")}</p>
          <div className="pt-4 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              {t("auth.back")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
