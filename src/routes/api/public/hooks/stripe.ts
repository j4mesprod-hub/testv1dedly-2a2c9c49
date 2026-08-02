import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

/** Verify Stripe's `Stripe-Signature` header (scheme v1, HMAC-SHA256 over `${t}.${body}`). */
function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = header.split(",").map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  // Reject replays older than 5 minutes.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some((sig) => safeEqualHex(sig, expected));
}

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

function userIdFrom(obj: Record<string, unknown>): string | null {
  const meta = (obj.metadata ?? {}) as Record<string, unknown>;
  const fromMeta = typeof meta.user_id === "string" ? meta.user_id : null;
  const ref = typeof obj.client_reference_id === "string" ? obj.client_reference_id : null;
  return fromMeta ?? ref;
}

export const Route = createFileRoute("/api/public/hooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const signature = request.headers.get("stripe-signature");
        const body = await request.text();
        if (!signature || !verifyStripeSignature(body, signature, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: StripeEvent;
        try {
          event = JSON.parse(body) as StripeEvent;
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const obj = event.data?.object ?? {};
        const userId = userIdFrom(obj);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const activate = async (id: string) => {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ plan: "pro", plan_since: new Date().toISOString(), has_active_sub: true })
            .eq("id", id);
          if (error) console.error("[stripe-webhook] activate failed", error.message);
        };
        const deactivate = async (id: string) => {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ plan: "free", has_active_sub: false })
            .eq("id", id);
          if (error) console.error("[stripe-webhook] deactivate failed", error.message);
        };

        switch (event.type) {
          case "checkout.session.completed":
          case "invoice.paid":
            if (userId) await activate(userId);
            break;
          case "customer.subscription.updated": {
            const status = typeof obj.status === "string" ? obj.status : "";
            if (userId) {
              if (status === "active" || status === "trialing") await activate(userId);
              else await deactivate(userId);
            }
            break;
          }
          case "customer.subscription.deleted":
          case "invoice.payment_failed":
            if (userId) await deactivate(userId);
            break;
          default:
            break;
        }

        if (!userId) console.warn("[stripe-webhook] no user_id on event", event.type, event.id);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
