const STRIPE_API = "https://api.stripe.com/v1";

function encodeStripe(obj: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [keyPart, value] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${keyPart}]` : keyPart;
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      parts.push(encodeStripe(value as Record<string, unknown>, key));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${key}[${index}]`;
        if (typeof item === "object" && item !== null) {
          parts.push(encodeStripe(item as Record<string, unknown>, arrayKey));
        } else {
          parts.push(`${encodeURIComponent(arrayKey)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

function stripeKey(): string {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error("Le paiement Stripe n'est pas configuré.");
  return key;
}

export async function stripePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeStripe(body),
  });
  const json = (await response.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!response.ok) throw new Error(json.error?.message ?? `Stripe error ${response.status}`);
  return json as T;
}

export async function stripeGet<T>(path: string): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${stripeKey()}` },
  });
  const json = (await response.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!response.ok) throw new Error(json.error?.message ?? `Stripe error ${response.status}`);
  return json as T;
}