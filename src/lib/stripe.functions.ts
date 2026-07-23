import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STRIPE_API = "https://api.stripe.com/v1";

/** Encode a nested object into Stripe's form-urlencoded bracket notation. */
function encodeStripe(obj: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      parts.push(encodeStripe(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          parts.push(encodeStripe(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

async function stripeCall<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeStripe(body),
  });
  const json = (await res.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!res.ok) {
    throw new Error(json?.error?.message || `Stripe error ${res.status}`);
  }
  return json as T;
}

async function stripeGet<T = unknown>(path: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = (await res.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!res.ok) throw new Error(json?.error?.message || `Stripe error ${res.status}`);
  return json as T;
}

/** Create a Stripe Checkout Session for the Pro plan and return the redirect URL. */
export const createProCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { origin: string }) =>
    z.object({ origin: z.string().url() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims as { email?: string }).email;

    const session = await stripeCall<{ id: string; url: string }>("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": 900,
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": "Deadly Pro",
      "line_items[0][price_data][product_data][description]": "Deadlines illimitées, alertes personnalisables, intégrations",
      "line_items[0][quantity]": 1,
      client_reference_id: userId,
      customer_email: email,
      success_url: `${data.origin}/dashboard/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/dashboard/settings?checkout=cancel`,
      "metadata[user_id]": userId,
      "subscription_data[metadata][user_id]": userId,
      allow_promotion_codes: "true",
    });

    return { url: session.url };
  });

/** After Stripe redirects back, verify the session was paid and mark the profile as pro. */
export const syncProAfterCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) =>
    z.object({ sessionId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const session = await stripeGet<{
      payment_status: string;
      status: string;
      client_reference_id?: string;
      customer?: string;
      subscription?: string;
    }>(`/checkout/sessions/${encodeURIComponent(data.sessionId)}`);

    if (session.client_reference_id !== context.userId) {
      throw new Error("Session does not belong to current user");
    }
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { upgraded: false as const };
    }

    const { error } = await context.supabase
      .from("profiles")
      .update({ plan: "pro", plan_since: new Date().toISOString(), has_active_sub: true })
      .eq("id", context.userId);
    if (error) throw error;

    return { upgraded: true as const };
  });
