import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const state = await waitForSession();
    if (!state.user) throw redirect({ to: "/auth" });
    return { user: state.user };
  },
  component: () => <Outlet />,
});
