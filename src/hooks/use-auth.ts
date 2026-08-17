import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type SessionState = { user: User | null; ready: boolean };

let currentState: SessionState = { user: null, ready: false };
let initialized = false;
let initPromise: Promise<SessionState> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function init() {
  if (initialized) return;
  initialized = true;
  initPromise = supabase.auth.getSession().then(({ data }) => {
    currentState = { user: data.session?.user ?? null, ready: true };
    emit();
    return currentState;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    currentState = { user: session?.user ?? null, ready: true };
    emit();
  });
}

function subscribe(callback: () => void): () => void {
  init();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): SessionState {
  return currentState;
}

/** Synchronous read of the current session state (for non-React contexts). */
export function getSessionState(): SessionState {
  return currentState;
}

/** Resolves immediately if the session is already loaded; otherwise waits for the initial getSession(). */
export function waitForSession(): Promise<SessionState> {
  init();
  if (currentState.ready) return Promise.resolve(currentState);
  return initPromise!;
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
