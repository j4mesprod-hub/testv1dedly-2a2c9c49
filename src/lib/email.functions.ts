import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

async function sendBrevo(payload: { to: string; toName: string; subject: string; html: string }) {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.SENDER_EMAIL;
  if (!key) throw new Error("BREVO_API_KEY manquant");
  if (!sender) throw new Error("SENDER_EMAIL manquant");
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

function testHtml(name: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#fcfbf8;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #eee">
      <div style="font-weight:800;font-size:22px;color:#111">Deadly</div>
      <h1 style="font-size:22px;margin:20px 0 8px;color:#111">Bonjour ${name} 👋</h1>
      <p style="color:#555;line-height:1.55;font-size:15px">
        Ceci est un email de test. La configuration Brevo fonctionne correctement.
      </p>
    </div>
  </div>`;
}

/** Envoyer un email de test à l'adresse de rappel du profil courant. */
export const sendTestReminderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("display_name, reminder_email")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    const to = profile?.reminder_email;
    if (!to) throw new Error("Renseignez d'abord votre email de rappel");

    await sendBrevo({
      to,
      toName: profile?.display_name ?? "",
      subject: "Test — Deadly",
      html: testHtml(profile?.display_name ?? "vous"),
    });

    return { sent: true, to };
  });
