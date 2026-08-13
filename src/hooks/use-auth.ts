import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Single shared client-side session store for the whole app.
 *
 * SECURITY NOTE: this store only mirrors Supabase's local, SDK-managed
 * session (kept fresh via onAuthStateChange / autoRefreshToken). It exists
 * purely to avoid redundant network calls / subscriptions and to keep
 * navigation fast — it is NOT a security boundary. Sensitive reads, writes,
 * and authorization decisions must still go through Supabase's own
 * enforcement (RLS policies, server-side session/user validation in edge
 * functions, etc.). This refactor removes no existing auth/authorization
 * check anywhere in the app.
 */

type AuthState = { user: User | null; ready: boolean };

let state: AuthState = { user: null, ready: false };
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: AuthState) {
  state = next;
  emit();
}

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  supabase.auth.getSession().then(({ data }) => {
    setState({ user: data.session?.user ?? null, ready: true });
  });

  // Single source of truth for session changes (sign-in, sign-out, token
  // refresh, expiry) across the entire app — replaces the previous
  // per-hook-instance subscriptions.
  supabase.auth.onAuthStateChange((_event, session) => {
    setState({ user: session?.user ?? null, ready: true });
  });
}

function subscribe(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
