import { useProfile } from "@/hooks/use-profile";
import { useDeadlines } from "@/hooks/use-deadlines";
import { useNotifications } from "@/hooks/use-notifications";

export function useDashboardData() {
  const profile = useProfile();
  const deadlines = useDeadlines();
  const notifications = useNotifications();

  const isLoading = deadlines.isLoading;

  return {
    profile: profile.data,
    deadlines: deadlines.data ?? [],
    notifications: notifications.data ?? [],
    isLoading,
    profileLoading: profile.isLoading,
    deadlinesLoading: deadlines.isLoading,
  };
}
