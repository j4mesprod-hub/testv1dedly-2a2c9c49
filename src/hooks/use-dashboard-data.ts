import { useProfile } from "@/hooks/use-profile";
import { useDeadlines } from "@/hooks/use-deadlines";
import { useNotifications } from "@/hooks/use-notifications";

export function useDashboardData() {
  const profile = useProfile();
  const deadlines = useDeadlines();
  const notifications = useNotifications();

  return {
    profile: profile.data,
    profileLoading: profile.isLoading,
    profileError: profile.error,

    deadlines: deadlines.data ?? [],
    deadlinesLoading: deadlines.isLoading,
    deadlinesError: deadlines.error,
    deadlinesRefetch: deadlines.refetch,

    notifications: notifications.data ?? [],
    notificationsLoading: notifications.isLoading,
    notificationsError: notifications.error,
    notificationsRefetch: notifications.refetch,

    isLoading: profile.isLoading || deadlines.isLoading || notifications.isLoading,
  };
}
