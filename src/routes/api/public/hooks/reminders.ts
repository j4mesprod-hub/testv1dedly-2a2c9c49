import { createFileRoute } from "@tanstack/react-router";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function reminderHtml(opts: {
  clientName: string;
  title: string;
  category: string | null;
  dueDateStr: string;
  daysAway: number;
}) {
  const when =
    opts.daysAway === 0
      ? "aujourd'hui"
      : `dans ${opts.daysAway} jour${opts.daysAway > 1 ? "s" : ""}`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#fcfbf8;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #eee">
      <div style="font-weight:800;font-size:22px;color:#111;letter-spacing:-0.02em">Deadly</div>
      <h1 style="font-size:22px;margin:20px 0 8px;color:#111;letter-spacing:-0.02em">⚠️ Action requise</h1>
      <p style="color:#555;line-height:1.55;font-size:15px">
        Votre échéance <strong>${opts.title}</strong>${opts.category ? ` (${opts.category})` : ""}
        pour le client <strong>${opts.clientName}</strong> expire ${when}.
      </p>
      <div style="margin:20px 0;padding:16px 18px;border-radius:14px;background:#f6f5f0">
        <div style="font-weight:700;color:#111;font-size:16px">${opts.title}</div>
        <div style="color:#555;font-size:13px;margin-top:4px">Client&nbsp;: ${opts.clientName}</div>
        <div style="color:#888;font-size:13px;margin-top:2px">Date d'expiration exacte&nbsp;: ${opts.dueDateStr}</div>
      </div>
      <p style="color:#666;font-size:13px">Connectez-vous à Deadly pour renouveler ou marquer ce rappel comme traité.</p>
      <p style="color:#aaa;font-size:12px;margin-top:24px">— L'équipe Deadly</p>
    </div>
  </div>`;
}

async function sendBrevoEmail(payload: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}) {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.SENDER_EMAIL;
  if (!key) throw new Error("BREVO_API_KEY missing");
  if (!sender) throw new Error("SENDER_EMAIL missing");

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      sender: { email: sender, name: "Deadly" },
      to: [{ email: payload.to, name: payload.toName || undefined }],
      subject: payload.subject,
      htmlContent: payload.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo ${res.status}: ${text}`);
  }
}

/** Hour (0-23) at Paris time right now. */
function parisHour(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  return parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
}

/** YYYY-MM-DD (Paris) for the current calendar day. */
function parisDateStr(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

async function processReminders(opts: {
  overrideHour?: number;
  forceUserId?: string;
  dryRunTo?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const currentHour = opts.overrideHour ?? parisHour(now);
  const todayStr = parisDateStr(now);
  const startToday = Date.parse(`${todayStr}T00:00:00+01:00`); // Paris (approx; DST accepted for day math)

  // Active subs only (join implicit via profile filter)
  const { data: profiles, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, reminder_email")
    .eq("has_active_sub", true)
    .not("reminder_email", "is", null);
  if (pErr) throw new Error(pErr.message);

  const scope = opts.forceUserId
    ? (profiles ?? []).filter((p) => p.id === opts.forceUserId)
    : (profiles ?? []);

  let totalSent = 0;
  const details: Array<{ deadlineId: string; combo: string; to: string }> = [];

  for (const profile of scope) {
    const to = opts.dryRunTo ?? profile.reminder_email;
    if (!to) continue;

    const { data: deadlines, error: dErr } = await supabaseAdmin
      .from("deadlines")
      .select("id, title, category, client_name, due_at, alert_rules, alert_hour, alerts_sent, status")
      .eq("user_id", profile.id)
      .neq("status", "completed");
    if (dErr) throw new Error(dErr.message);

    for (const d of deadlines ?? []) {
      const dueMs = new Date(d.due_at).getTime();
      const daysAway = Math.round((dueMs - startToday) / 86400000);
      const rules: number[] = (d.alert_rules as number[] | null) ?? [];
      const alertHour: number = (d.alert_hour as number | null) ?? 9;
      const sent: string[] = (d.alerts_sent as string[] | null) ?? [];

      if (!rules.includes(daysAway)) continue;
      if (currentHour !== alertHour) continue;

      const combo = `${daysAway}-${alertHour}`;
      if (sent.includes(combo)) continue;

      const dueDateStr = new Date(d.due_at).toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const clientName = d.client_name ?? "—";

      const subject = `⚠️ ACTION REQUISE : ${d.title} expire dans ${daysAway} jour${daysAway > 1 ? "s" : ""} (Client: ${clientName})`;

      try {
        await sendBrevoEmail({
          to,
          toName: profile.display_name ?? "",
          subject,
          html: reminderHtml({
            clientName,
            title: d.title,
            category: d.category,
            dueDateStr,
            daysAway,
          }),
        });

        const nextSent = [...sent, combo];
        await supabaseAdmin
          .from("deadlines")
          .update({ alerts_sent: nextSent })
          .eq("id", d.id);

        totalSent++;
        details.push({ deadlineId: d.id, combo, to });
      } catch (err) {
        console.error(`[reminders] send failed for deadline ${d.id}`, err);
      }
    }
  }

  return { totalSent, details, currentHour, todayStr };
}

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
