import { createFileRoute } from "@tanstack/react-router";
import { processReminders } from "@/lib/reminders.server";

async function authorize(request: Request): Promise<Response | null> {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (token !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}

export const Route = createFileRoute("/api/public/hooks/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authorize(request);
        if (denied) return denied;

        let body: {
          overrideHour?: number;
          forceUserId?: string;
          dryRunTo?: string;
          dryRun?: boolean;
          forceSend?: boolean;
          deadlineId?: string;
        } = {};
        try {
          const raw = await request.text();
          if (raw) body = JSON.parse(raw);
        } catch {
          body = {};
        }

        try {
          const result = await processReminders(body);
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[reminders] failed", msg);
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
      GET: async ({ request }) => {
        const denied = await authorize(request);
        if (denied) return denied;
        return new Response(JSON.stringify({ ok: true, hint: "POST to run" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
