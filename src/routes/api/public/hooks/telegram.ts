import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

const TELEGRAM_API_BASE = "https://api.telegram.org";

function deriveWebhookSecret(token: string): string {
  return createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function randomCode(): string {
  // 6-char base32-ish, avoid ambiguous chars
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!res.ok) {
    console.error("[telegram-webhook] sendMessage failed", res.status, await res.text());
  }
}

export const Route = createFileRoute("/api/public/hooks/telegram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
          return new Response("Bot not configured", { status: 500 });
        }
        const expected = deriveWebhookSecret(token);
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(actual, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let update: {
          message?: {
            chat?: { id?: number };
            from?: { username?: string; first_name?: string };
            text?: string;
          };
        } = {};
        try {
          update = await request.json();
        } catch {
          return Response.json({ ok: true, ignored: true });
        }

        const msg = update.message;
        const chatId = msg?.chat?.id;
        const text = (msg?.text ?? "").trim();
        if (!chatId || !text) return Response.json({ ok: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (text.startsWith("/start")) {
          // If chat already linked to a profile, tell them.
          const { data: linked } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("telegram_chat_id", chatId)
            .maybeSingle();
          if (linked) {
            await sendMessage(
              chatId,
              "✅ Ce Telegram est déjà lié à un compte Deadly. Vous recevrez ici vos rappels.",
            );
            return Response.json({ ok: true });
          }

          // Purge existing codes for this chat, insert a new one.
          await supabaseAdmin.from("telegram_link_codes").delete().eq("chat_id", chatId);
          let code = randomCode();
          for (let i = 0; i < 5; i++) {
            const { error } = await supabaseAdmin.from("telegram_link_codes").insert({
              code,
              chat_id: chatId,
              telegram_username: msg?.from?.username ?? null,
            });
            if (!error) break;
            code = randomCode();
          }

          await sendMessage(
            chatId,
            `👋 Bienvenue sur *Deadly*.\n\nVoici votre code de liaison :\n\n\`${code}\`\n\nCollez ce code dans *Paramètres → Notifications* de l'app pour lier votre compte. Il expire dans 15 minutes.`,
          );
          return Response.json({ ok: true });
        }

        // Unknown command
        await sendMessage(
          chatId,
          "Envoyez /start pour recevoir un code de liaison avec votre compte Deadly.",
        );
        return Response.json({ ok: true });
      },
    },
  },
});
