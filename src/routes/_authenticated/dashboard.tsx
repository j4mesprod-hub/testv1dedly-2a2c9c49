import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Deadly" },
      { name: "description", content: "Vue d’ensemble Deadly pour suivre vos échéances et renouvellements critiques." },
      { property: "og:title", content: "Dashboard Deadly" },
      { property: "og:description", content: "Pilotez vos deadlines, rappels et abonnements depuis votre dashboard Deadly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Outlet />,
});
