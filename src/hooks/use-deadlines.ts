import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];
export type DeadlineStatus = Database["public"]["Enums"]["deadline_status"];

export function useDeadlines() {
  return useQuery({
    queryKey: ["deadlines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadlines")
        .select("*")
        .order("due_at", { ascending: true });
      if (error) throw error;
      const now = Date.now();
      return (data ?? []).map((d) => {
        if (d.status !== "completed" && new Date(d.due_at).getTime() < now && d.status !== "overdue") {
          return { ...d, status: "overdue" as DeadlineStatus };
        }
        return d;
      });
    },
    staleTime: 60_000,
  });
}

export function useCreateDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      category?: string;
      client_name?: string;
      due_at: string;
      priority: string;
      color: string;
      alert_rules: number[];
      alert_hour: number;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("deadlines")
        .insert({ ...input, user_id: session.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines"] }),
  });
}

export function useUpdateDeadlineStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeadlineStatus }) => {
      const patch: Database["public"]["Tables"]["deadlines"]["Update"] = { status };
      if (status === "completed") patch.completed_at = new Date().toISOString();
      const { error } = await supabase.from("deadlines").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines"] }),
  });
}

export function useDeleteDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deadlines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines"] }),
  });
}
