import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

let cachedUser: User | null = null;
let cachedReady = false;

export function useSession() {
  const [state, setState] = useState({ user: cachedUser, ready: cachedReady });

  useEffect(() => {
    if (cachedReady) {
      setState({ user: cachedUser, ready: true });
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      cachedUser = data.session?.user ?? null;
      cachedReady = true;
      setState({ user: cachedUser, ready: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      cachedUser = session?.user ?? null;
      cachedReady = true;
      setState({ user: cachedUser, ready: true });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
