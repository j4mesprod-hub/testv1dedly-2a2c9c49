import { useProfile } from "@/hooks/use-profile";
import { useDeadlines } from "@/hooks/use-deadlines";
import { useNotifications } from "@/hooks/use-notifications";

export function useDashboardData() {
  const profile = useProfile();
  const deadlines = useDeadlines();
  const notifications = useNotifications();

  const isLoading = profile.isLoading || deadlines.isLoading;

  if (profile.isLoading || deadlines.isLoading) {
    console.log("[useDashboardData] loading gate:", {
      profileLoading: profile.isLoading,
      deadlinesLoading: deadlines.isLoading,
      profileStatus: profile.status,
      deadlinesStatus: deadlines.status,
      profileError: profile.error?.message,
      deadlinesError: deadlines.error?.message,
    });
  }

  return {
    profile: profile.data,
    deadlines: deadlines.data ?? [],
    notifications: notifications.data ?? [],
    isLoading,
    profileLoading: profile.isLoading,
    deadlinesLoading: deadlines.isLoading,
  };
}
