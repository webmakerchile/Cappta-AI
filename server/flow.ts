const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY || "";
const BASE_URL = "https://api.mercadopago.com";

export const PLAN_LIMITS: Record<string, { maxSessions: number; maxMessages: number; maxAgents: number }> = {
  free: { maxSessions: 10, maxMessages: 100, maxAgents: 1 },
  basic: { maxSessions: 500, maxMessages: 5000, maxAgents: 3 },
  pro: { maxSessions: Infinity, maxMessages: Infinity, maxAgents: 10 },
};

export const PLAN_PRICES: Record<string, { amount: number; label: string; reason: string }> = {
  basic: {
    amount: 19990,
    label: "Fox Pro",
    reason: "Fox Pro - Suscripcion Mensual",
  },
  pro: {
    amount: 49990,
    label: "Fox Enterprise",
    reason: "Fox Enterprise - Suscripcion Mensual",
  },
  basic_whatsapp: {
    amount: 34990,
    label: "Fox Pro + WhatsApp",
    reason: "Fox Pro + WhatsApp - Suscripcion Mensual",
  },
  pro_whatsapp: {
    amount: 64990,
    label: "Fox Enterprise + WhatsApp",
    reason: "Fox Enterprise + WhatsApp - Suscripcion Mensual",
  },
};

export const WHATSAPP_ADDON_PRICE = 14990;
export const FREE_TRIAL_DAYS = 7;

async function mpFetch(path: string, method: string = "GET", body?: any): Promise<any> {
  const opts: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`MercadoPago API error: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function createSubscription(
  planKey: string,
  email: string,
  tenantId: number
): Promise<{ subscriptionId: string; initPoint: string }> {
  if (!MP_ACCESS_TOKEN) throw new Error("Mercado Pago no configurado");

  const planInfo = PLAN_PRICES[planKey];
  if (!planInfo) throw new Error(`Plan not found: ${planKey}`);

  const subscription = await mpFetch("/preapproval", "POST", {
    reason: planInfo.reason,
    external_reference: `foxbot_${tenantId}_${planKey}`,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: planInfo.amount,
      currency_id: "CLP",
      free_trial: {
        frequency: FREE_TRIAL_DAYS,
        frequency_type: "days",
      },
    },
    back_url: "https://foxbot.cl/api/mercadopago/return",
    status: "pending",
  });

  return {
    subscriptionId: subscription.id,
    initPoint: subscription.init_point,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  if (!MP_ACCESS_TOKEN || !subscriptionId) return false;
  try {
    await mpFetch(`/preapproval/${subscriptionId}`, "PUT", { status: "cancelled" });
    return true;
  } catch {
    return false;
  }
}

export async function getSubscriptionStatus(subscriptionId: string): Promise<any> {
  if (!MP_ACCESS_TOKEN || !subscriptionId) return null;
  try {
    return await mpFetch(`/preapproval/${subscriptionId}`);
  } catch {
    return null;
  }
}

export function isMercadoPagoConfigured(): boolean {
  return !!(MP_ACCESS_TOKEN && MP_PUBLIC_KEY);
}

export function getMpPublicKey(): string {
  return MP_PUBLIC_KEY;
}
