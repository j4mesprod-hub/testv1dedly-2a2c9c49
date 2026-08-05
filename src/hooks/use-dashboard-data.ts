import { useProfile } from "@/hooks/use-profile";
import { useDeadlines } from "@/hooks/use-deadlines";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * Loads profile, deadlines, and notifications in parallel via React Query.
 * All three queries fire simultaneously (React Query parallelism) and we
 * expose a single `isLoading` gate so the dashboard can show a skeleton
 * until everything is ready.
 */
export function useDashboardData() {
  const profile = useProfile();
  const deadlines = useDeadlines();
  const notifications = useNotifications();

  const isLoading = profile.isLoading || deadlines.isLoading;

  return {
    profile: profile.data,
    deadlines: deadlines.data ?? [],
    notifications: notifications.data ?? [],
    isLoading,
    profileLoading: profile.isLoading,
    deadlinesLoading: deadlines.isLoading,
  };
}
