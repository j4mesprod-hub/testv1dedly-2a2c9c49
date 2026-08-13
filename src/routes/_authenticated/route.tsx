import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // NOTE: this is a client-side navigation guard only, used to decide
  // whether to redirect to /auth and to avoid re-checking on every
  // in-app navigation. `getSession()` reads the SDK's local, auto-refreshed
  // session and does NOT perform a network round-trip, so it is not a
  // server-side identity verification and must never be treated as one.
  // All sensitive data access, mutations, and authorization decisions
  // continue to be enforced server-side (Supabase RLS / edge functions),
  // independently of this guard. `onAuthStateChange` (see use-auth.ts)
  // keeps the underlying session in sync immediately on sign-in, sign-out,
  // token refresh, or expiry, so this cache never goes stale between
  // those events.
  staleTime: Infinity,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
