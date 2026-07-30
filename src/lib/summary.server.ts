import {
  sendTelegram,
  parisHour,
  parisMinute,
  parisDateStr,
  parisDaysBetween,
} from "@/lib/reminders.server";

export type Lang = "fr" | "en";

interface SummaryItem {
  title: string;
  clientName: string | null;
  daysAway: number;
}

const GREETINGS_FR = [
  "Bonjour {name} 👋",
  "Salut {name} ☀️",
  "Hello {name} 👋",
  "Bonjour {name}, on fait le point 📋",
  "Coucou {name} 🙌",
];
const INTRO_FR = [
  "Voici votre résumé du jour",
  "Voici le point sur vos échéances",
  "Petit récapitulatif de la journée",
  "Votre récap Deadly du jour",
];
const OUTRO_FR = [
  "Bonne fin de journée 👋",
  "Belle journée à vous ✨",
  "Bon courage pour la suite 💪",
  "À demain pour un nouveau récap 🙂",
];
const EMPTY_FR = [
  "Aujourd'hui vous n'avez aucun rappel. Profitez-en !",
  "Aucun rappel aujourd'hui — tout est sous contrôle ✅",
  "Rien à signaler aujourd'hui, aucune échéance à surveiller.",
];

const GREETINGS_EN = [
  "Hello {name} 👋",
  "Hi {name} ☀️",
  "Good day {name} 👋",
  "Hey {name}, here's your update 📋",
];
const INTRO_EN = [
  "Here is your daily summary",
  "Here's where your deadlines stand",
  "A quick recap for today",
  "Your Deadly recap for today",
];
const OUTRO_EN = [
  "Have a great day 👋",
  "Enjoy the rest of your day ✨",
  "Good luck out there 💪",
  "See you tomorrow for a new recap 🙂",
];
const EMPTY_EN = [
  "You have no reminders today. Enjoy!",
  "No reminders today — everything is under control ✅",
  "Nothing on the radar today, no deadline to watch.",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seedFromDate(todayStr: string): number {
  let h = 0;
  for (const ch of todayStr) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

function expiresLine(item: SummaryItem, lang: Lang): string {
  const client = item.clientName ? ` (${item.clientName})` : "";
  if (lang === "en") {
    const when =
      item.daysAway === 0
        ? "expires today"
        : item.daysAway === 1
          ? "expires tomorrow"
          : item.daysAway < 0
            ? `expired ${Math.abs(item.daysAway)} day${Math.abs(item.daysAway) > 1 ? "s" : ""} ago`
            : `expires in ${item.daysAway} days`;
    return `• *${item.title}*${client} ${when}`;
  }
  const when =
    item.daysAway === 0
      ? "expire aujourd'hui"
      : item.daysAway === 1
        ? "expire demain"
        : item.daysAway < 0
          ? `a expiré il y a ${Math.abs(item.daysAway)} jour${Math.abs(item.daysAway) > 1 ? "s" : ""}`
          : `expire dans ${item.daysAway} jours`;
  return `• *${item.title}*${client} ${when}`;
}

export function buildSummaryMessage(opts: {
  name: string;
  items: SummaryItem[];
  lang: Lang;
  todayStr: string;
}): string {
  const { name, items, lang, todayStr } = opts;
  const seed = seedFromDate(todayStr);
  const greetings = lang === "en" ? GREETINGS_EN : GREETINGS_FR;
  const intros = lang === "en" ? INTRO_EN : INTRO_FR;
  const outros = lang === "en" ? OUTRO_EN : OUTRO_FR;
  const empties = lang === "en" ? EMPTY_EN : EMPTY_FR;

  const greeting = pick(greetings, seed).replace("{name}", name);

  if (items.length === 0) {
    return `${greeting}\n\n${pick(empties, seed + 1)}\n\n${pick(outros, seed + 2)}`;
  }

  const count =
    lang === "en"
      ? `${pick(intros, seed + 1)}, you have ${items.length} reminder${items.length > 1 ? "s" : ""} today:`
      : `${pick(intros, seed + 1)}, vous avez ${items.length} rappel${items.length > 1 ? "s" : ""} aujourd'hui :`;

  const lines = items.map((i) => expiresLine(i, lang)).join("\n");
  return `${greeting}\n\n${count}\n${lines}\n\n${pick(outros, seed + 2)}`;
}

interface DeadlineRow {
  title: string;
  client_name: string | null;
  due_at: string;
  alert_rules: number[] | null;
  status: string;
}

function toItems(
  rows: DeadlineRow[],
  todayStr: string,
  matchRules: boolean,
  tz = "Europe/Paris",
): SummaryItem[] {
  return rows
    .map((d) => ({
      title: d.title,
      clientName: d.client_name,
      daysAway: parisDaysBetween(todayStr, new Date(d.due_at), tz),
      rules: (d.alert_rules as number[] | null) ?? [],
    }))
    .filter((d) => (matchRules ? d.rules.includes(d.daysAway) : d.daysAway >= 0 && d.daysAway <= 30))
    .sort((a, b) => a.daysAway - b.daysAway)
    .map(({ title, clientName, daysAway }) => ({ title, clientName, daysAway }));
}

export interface SummaryOptions {
  /** Envoi immédiat pour un seul utilisateur (bouton « Recevoir le résumé »). */
  forceUserId?: string;
  /** Ignore la planification et le verrou quotidien. */
  force?: boolean;
}

export interface SummaryResult {
  sent: number;
  skipped: number;
  parisTime: string;
}

export async function processDailySummaries(opts: SummaryOptions = {}): Promise<SummaryResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { tzHour, tzMinute, tzDateStr } = await import("@/lib/reminders.server");
  const now = new Date();
  const parisTime = `${String(parisHour(now)).padStart(2, "0")}:${String(parisMinute(now)).padStart(2, "0")}`;

  console.log(`[summary] parisTime=${parisTime} force=${opts.force === true}`);

  let q = supabaseAdmin
    .from("profiles")
    .select(
      "id, display_name, telegram_chat_id, language, timezone, summary_enabled, summary_hour, summary_minute, summary_last_sent_on",
    )
    .not("telegram_chat_id", "is", null);
  if (opts.forceUserId) q = q.eq("id", opts.forceUserId);
  else q = q.eq("summary_enabled", true);

  const { data: profiles, error } = await q;
  if (error) throw new Error(error.message);

  let sent = 0;
  let skipped = 0;

  for (const p of profiles ?? []) {
    if (!p.telegram_chat_id) {
      skipped++;
      continue;
    }

    const tz = p.timezone ?? "Europe/Paris";
    const todayStr = tzDateStr(now, tz);

    if (!opts.force) {
      const scheduled = (p.summary_hour ?? 9) * 60 + (p.summary_minute ?? 0);
      const current = tzHour(now, tz) * 60 + tzMinute(now, tz);
      // Envoi dès que l'heure planifiée est atteinte (le cron tourne toutes les 5 min),
      // une seule fois par jour grâce au verrou summary_last_sent_on.
      if (current < scheduled) {
        skipped++;
        continue;
      }
      if (p.summary_last_sent_on === todayStr) {
        skipped++;
        continue;
      }
      // Réserve l'envoi de façon atomique pour éviter les doublons entre deux exécutions.
      const { data: claimed, error: claimErr } = await supabaseAdmin
        .from("profiles")
        .update({ summary_last_sent_on: todayStr })
        .eq("id", p.id)
        .or(`summary_last_sent_on.is.null,summary_last_sent_on.neq.${todayStr}`)
        .select("id");
      if (claimErr) throw new Error(claimErr.message);
      if (!claimed || claimed.length === 0) {
        skipped++;
        continue;
      }
    }

    const { data: rows, error: dErr } = await supabaseAdmin
      .from("deadlines")
      .select("title, client_name, due_at, alert_rules, status")
      .eq("user_id", p.id)
      .neq("status", "completed");
    if (dErr) throw new Error(dErr.message);

    const items = toItems((rows ?? []) as DeadlineRow[], todayStr, true, tz);
    const lang: Lang = p.language === "en" ? "en" : "fr";
    const name = p.display_name ?? (lang === "en" ? "there" : "à vous");

    try {
      await sendTelegram(p.telegram_chat_id, buildSummaryMessage({ name, items, lang, todayStr }));
      sent++;
    } catch (e) {
      console.error(`[summary] send failed for ${p.id}`, e);
      skipped++;
      if (!opts.force) {
        // Libère le verrou pour permettre une nouvelle tentative au prochain passage.
        await supabaseAdmin
          .from("profiles")
          .update({ summary_last_sent_on: null })
          .eq("id", p.id);
      }
    }
  }

  return { sent, skipped, parisTime };
}
