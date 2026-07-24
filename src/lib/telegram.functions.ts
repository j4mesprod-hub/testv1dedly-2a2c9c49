import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { processReminders } from "@/lib/reminders.server";

const TELEGRAM_API_BASE = "https://api.telegram.org";

async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN manquant");
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Telegram ${res.status}: ${t}`);
  }
}

/** Renvoie le username du bot pour l'UI. */
export const getTelegramBotUsername = createServerFn({ method: "GET" }).handler(async () => {
  return { username: process.env.TELEGRAM_BOT_USERNAME ?? "" };
});

/** Envoie un message de test Telegram au chat lié du compte. */
export const sendTestTelegramMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("display_name, telegram_chat_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.telegram_chat_id) {
      throw new Error("Aucun compte Telegram lié");
    }
    const name = profile.display_name ?? "vous";
    await sendTelegramMessage(
      profile.telegram_chat_id,
      `👋 Bonjour ${name}\n\nCe message de test confirme que Deadly peut vous envoyer vos rappels via Telegram.`,
    );
    return { sent: true };
  });

/** Lie le chat_id Telegram au compte via un code à usage unique. */
export const linkTelegramAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const code = data.code.trim().toUpperCase();
    if (!code) throw new Error("Code manquant");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("telegram_link_codes")
      .select("code, chat_id, expires_at")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Code invalide");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("telegram_link_codes").delete().eq("code", code);
      throw new Error("Code expiré — relancez /start dans Telegram");
    }

    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({ telegram_chat_id: row.chat_id })
      .eq("id", context.userId);
    if (upErr) throw new Error(upErr.message);

    await supabaseAdmin.from("telegram_link_codes").delete().eq("code", code);

    try {
      await sendTelegramMessage(
        row.chat_id,
        "✅ Compte Deadly lié. Vous recevrez ici vos rappels d'échéances.",
      );
    } catch (e) {
      console.error("[telegram] confirm send failed", e);
    }

    return { linked: true, chatId: String(row.chat_id) };
  });

/** Dissocie le compte Telegram. */
export const unlinkTelegramAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ telegram_chat_id: null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { unlinked: true };
  });

/**
 * Déclenche un envoi de rappels en mode dryRun depuis l'UI.
 * - N'écrit jamais dans `alerts_sent`.
 * - Restreint aux deadlines de l'utilisateur connecté.
 * - Envoie vers son chat Telegram lié.
 */
export const triggerReminderDryRun = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      deadlineId?: string;
      overrideHour?: number;
      forceSend?: boolean;
    }) => input,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!profile?.telegram_chat_id) {
      throw new Error("Liez d'abord votre compte Telegram");
    }
    const result = await processReminders({
      forceUserId: context.userId,
      dryRun: true,
      dryRunChatId: profile.telegram_chat_id,
      deadlineId: data.deadlineId,
      overrideHour: data.overrideHour,
      forceSend: data.forceSend === true,
    });
    return {
      sent: result.totalSent,
      details: result.details,
      currentHour: result.currentHour,
    };
  });
