import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/hooks/use-auth";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile() {
  const { user, ready } = useSession();
  return useQuery({
    queryKey: ["profile"],
    enabled: !!user && ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (updated) => {
      if (updated) qc.setQueryData(["profile"], updated);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

