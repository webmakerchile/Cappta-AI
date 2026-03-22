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
    label: "Cappta Pro",
    reason: "Cappta Pro - Suscripcion Mensual",
  },
  pro: {
    amount: 49990,
    label: "Cappta Enterprise",
    reason: "Cappta Enterprise - Suscripcion Mensual",
  },
  basic_whatsapp: {
    amount: 34990,
    label: "Cappta Pro + WhatsApp",
    reason: "Cappta Pro + WhatsApp - Suscripcion Mensual",
  },
  pro_whatsapp: {
    amount: 64990,
    label: "Cappta Enterprise + WhatsApp",
    reason: "Cappta Enterprise + WhatsApp - Suscripcion Mensual",
  },
};

export const WHATSAPP_ADDON_PRICE = 14990;
export const FREE_TRIAL_DAYS = 7;

export interface AddonDefinition {
  slug: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
  sortOrder: number;
}

export const ADDON_CATALOG: AddonDefinition[] = [
  { slug: "cappta-ads", name: "Cappta Ads", description: "Campañas inteligentes impulsadas por IA con segmentación avanzada y reportes en tiempo real.", price: 95000, icon: "Megaphone", category: "marketing", sortOrder: 1 },
  { slug: "cappta-connect", name: "Cappta Connect", description: "Integración nativa con WhatsApp Business API. Gestiona todo desde un solo panel.", price: 63000, icon: "Link", category: "comunicacion", sortOrder: 2 },
  { slug: "cappta-llamadas", name: "Cappta Llamadas", description: "500 minutos VoIP con grabación, transcripción automática y analíticas.", price: 50000, icon: "Phone", category: "comunicacion", sortOrder: 3 },
  { slug: "ig-comentarios", name: "IG Comentarios IA", description: "Respuestas inteligentes automáticas en Instagram. Aumenta engagement.", price: 50000, icon: "MessageCircle", category: "marketing", sortOrder: 4 },
  { slug: "pdf-ia", name: "PDF IA", description: "Genera cotizaciones, reportes y fichas técnicas al instante con IA.", price: 50000, icon: "FileText", category: "productividad", sortOrder: 5 },
  { slug: "razones-perdida", name: "Razones de Pérdida", description: "Analiza por qué se pierden conversaciones con métricas de abandono.", price: 27000, icon: "TrendingDown", category: "analytics", sortOrder: 6 },
  { slug: "nps-ia", name: "NPS IA", description: "Encuestas NPS automatizadas con análisis de sentimiento por IA.", price: 27000, icon: "BarChart3", category: "analytics", sortOrder: 7 },
  { slug: "formulas", name: "Fórmulas", description: "Flujos de automatización con lógica condicional para respuestas y asignaciones.", price: 27000, icon: "Workflow", category: "productividad", sortOrder: 8 },
  { slug: "meetings-bots", name: "Meetings Bots", description: "Bots que agendan reuniones automáticamente con Google Calendar y Zoom.", price: 19000, icon: "Calendar", category: "productividad", sortOrder: 9 },
];

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

export async function createCheckoutPreference(
  planKey: string,
  email: string,
  tenantId: number
): Promise<{ preferenceId: string; initPoint: string }> {
  if (!MP_ACCESS_TOKEN) throw new Error("Mercado Pago no configurado");

  const planInfo = PLAN_PRICES[planKey];
  if (!planInfo) throw new Error(`Plan not found: ${planKey}`);

  const preference = await mpFetch("/checkout/preferences", "POST", {
    items: [
      {
        title: planInfo.label,
        description: planInfo.reason,
        quantity: 1,
        unit_price: planInfo.amount,
        currency_id: "CLP",
      },
    ],
    payer: {
      email: email,
    },
    external_reference: `nexia_${tenantId}_${planKey}`,
    back_urls: {
      success: `https://www.cappta.ai/api/mercadopago/return?tenant_id=${tenantId}&plan=${planKey}&status=approved`,
      failure: `https://www.cappta.ai/api/mercadopago/return?tenant_id=${tenantId}&plan=${planKey}&status=rejected`,
      pending: `https://www.cappta.ai/api/mercadopago/return?tenant_id=${tenantId}&plan=${planKey}&status=pending`,
    },
    auto_return: "approved",
    notification_url: "https://www.cappta.ai/api/mercadopago/webhook",
    statement_descriptor: "CAPPTA AI",
    payment_methods: {
      excluded_payment_types: [],
      installments: 1,
    },
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
  };
}

export async function createAddonCheckoutPreference(
  addonSlug: string,
  addonName: string,
  addonPrice: number,
  email: string,
  tenantId: number
): Promise<{ preferenceId: string; initPoint: string }> {
  if (!MP_ACCESS_TOKEN) throw new Error("Mercado Pago no configurado");

  const preference = await mpFetch("/checkout/preferences", "POST", {
    items: [
      {
        title: `Cappta ${addonName}`,
        description: `Extensión ${addonName} - Suscripción Mensual`,
        quantity: 1,
        unit_price: addonPrice,
        currency_id: "CLP",
      },
    ],
    payer: { email },
    external_reference: `cappta_addon_${tenantId}_${addonSlug}`,
    back_urls: {
      success: `https://www.cappta.ai/api/mercadopago/addon-return?tenant_id=${tenantId}&addon=${addonSlug}&status=approved`,
      failure: `https://www.cappta.ai/api/mercadopago/addon-return?tenant_id=${tenantId}&addon=${addonSlug}&status=rejected`,
      pending: `https://www.cappta.ai/api/mercadopago/addon-return?tenant_id=${tenantId}&addon=${addonSlug}&status=pending`,
    },
    auto_return: "approved",
    notification_url: "https://www.cappta.ai/api/mercadopago/webhook",
    statement_descriptor: "CAPPTA AI",
    payment_methods: {
      excluded_payment_types: [],
      installments: 1,
    },
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
  };
}

export async function getPaymentInfo(paymentId: string): Promise<any> {
  if (!MP_ACCESS_TOKEN || !paymentId) return null;
  try {
    return await mpFetch(`/v1/payments/${paymentId}`);
  } catch {
    return null;
  }
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
