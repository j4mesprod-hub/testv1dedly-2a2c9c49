import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileWithEmail = Profile & { email: string | null };

async function loadProfile(): Promise<ProfileWithEmail | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const email = user.email ?? null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;

  if (data) return { ...data, email };

  // No profile row yet (e.g. trigger missing) → create it once so settings persist.
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: meta.full_name ?? meta.name ?? email?.split("@")[0] ?? null,
        avatar_url: meta.avatar_url ?? null,
        reminder_email: email,
      },
      { onConflict: "id" },
    )
    .select("*")
    .maybeSingle();
  if (insertError) throw insertError;
  return created ? { ...created, email } : null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: loadProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, reminder_email: user.email ?? null, ...patch })
          .select("*")
          .maybeSingle();
        if (insertError) throw insertError;
        if (!created) throw new Error("Profil introuvable : mise à jour refusée");
        return { ...created, email: user.email ?? null } as ProfileWithEmail;
      }
      return { ...data, email: user.email ?? null } as ProfileWithEmail;
    },
    onSuccess: (row) => {
      qc.setQueryData(["profile"], row);
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
