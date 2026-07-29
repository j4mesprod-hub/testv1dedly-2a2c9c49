const TELEGRAM_API_BASE = "https://api.telegram.org";

function reminderText(opts: {
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
  const catLine = opts.category ? `\nCatégorie : ${opts.category}` : "";
  return (
    `⚠️ *ACTION REQUISE*\n\n` +
    `*${opts.title}* expire ${when}.\n` +
    `Client : ${opts.clientName}${catLine}\n` +
    `Date d'expiration : ${opts.dueDateStr}\n` +
    `Jours restants : ${opts.daysAway}`
  );
}

export async function sendTelegram(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Telegram ${res.status}: ${t}`);
  }
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(`Telegram: ${json.description ?? "unknown"}`);
}

export function parisHour(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  return parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
}

export function parisMinute(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  return parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
}

export function parisDateStr(now: Date): string {
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

function utcMidnightFromDateStr(value: string): number {
  const [year, month, day] = value.split("-").map((part) => parseInt(part, 10));
  return Date.UTC(year, month - 1, day);
}

export function parisDaysBetween(fromDateStr: string, to: Date): number {
  const toDateStr = parisDateStr(to);
  return Math.round(
    (utcMidnightFromDateStr(toDateStr) - utcMidnightFromDateStr(fromDateStr)) / 86400000,
  );
}

export interface ProcessOptions {
  overrideHour?: number;
  forceUserId?: string;
  /** Override recipient chat_id (test mode). */
  dryRunChatId?: number | string;
  dryRun?: boolean;
  forceSend?: boolean;
  deadlineId?: string;
}

export interface ProcessResult {
  totalSent: number;
  details: Array<{ deadlineId: string; combo: string; chatId: string }>;
  currentHour: number;
  todayStr: string;
  dryRun: boolean;
}

export async function processReminders(opts: ProcessOptions = {}): Promise<ProcessResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const currentHour = opts.overrideHour ?? parisHour(now);
  const todayStr = parisDateStr(now);
  const dryRun = opts.dryRun === true || opts.dryRunChatId !== undefined;
  const forceSend = opts.forceSend === true;

  console.log(
    `[reminders] serverUTC=${now.toISOString()} parisHour=${currentHour} parisDate=${todayStr} dryRun=${dryRun} forceSend=${forceSend}`,
  );

  let profilesQuery = supabaseAdmin
    .from("profiles")
    .select("id, display_name, telegram_chat_id")
    .not("telegram_chat_id", "is", null);
  // Le filtre abonnement ne s'applique qu'aux envois automatiques globaux.
  if (!opts.forceUserId) profilesQuery = profilesQuery.eq("has_active_sub", true);
  if (opts.forceUserId) profilesQuery = profilesQuery.eq("id", opts.forceUserId);

  const { data: profiles, error: pErr } = await profilesQuery;
  if (pErr) throw new Error(pErr.message);

  let totalSent = 0;
  const details: ProcessResult["details"] = [];

  for (const profile of profiles ?? []) {
    const chatId = opts.dryRunChatId ?? profile.telegram_chat_id;
    if (chatId === null || chatId === undefined) continue;

    let query = supabaseAdmin
      .from("deadlines")
      .select("id, title, category, client_name, due_at, alert_rules, alert_hour, alerts_sent, status")
      .eq("user_id", profile.id)
      .neq("status", "completed");
    if (opts.deadlineId) query = query.eq("id", opts.deadlineId);

    const { data: deadlines, error: dErr } = await query;
    if (dErr) throw new Error(dErr.message);

    for (const d of deadlines ?? []) {
      const dueDate = new Date(d.due_at);
      const daysAway = parisDaysBetween(todayStr, dueDate);
      const rules: number[] = (d.alert_rules as number[] | null) ?? [];
      const alertHour: number = (d.alert_hour as number | null) ?? 9;
      const sent: string[] = (d.alerts_sent as string[] | null) ?? [];

      if (!forceSend) {
        if (!rules.includes(daysAway)) continue;
        if (currentHour !== alertHour) continue;
      }

      const effectiveHour = forceSend ? currentHour : alertHour;
      const combo = `${daysAway}-${effectiveHour}`;

      if (!dryRun && sent.includes(combo)) continue;

      const dueDateStr = dueDate.toLocaleDateString("fr-FR", {
        timeZone: "Europe/Paris",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const clientName = d.client_name ?? "—";

      try {
        await sendTelegram(
          chatId,
          reminderText({
            clientName,
            title: d.title,
            category: d.category,
            dueDateStr,
            daysAway,
          }),
        );

        if (!dryRun) {
          const nextSent = [...sent, combo];
          const { error: updateError } = await supabaseAdmin
            .from("deadlines")
            .update({ alerts_sent: nextSent })
            .eq("id", d.id);
          if (updateError) throw new Error(updateError.message);
        }

        totalSent++;
        details.push({ deadlineId: d.id, combo, chatId: String(chatId) });
      } catch (err) {
        console.error(`[reminders] send failed for deadline ${d.id}`, err);
      }
    }
  }

  return { totalSent, details, currentHour, todayStr, dryRun };
}
