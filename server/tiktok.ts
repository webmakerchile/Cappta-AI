import crypto from "crypto";

const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || "";
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || "";
const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface TikTokEventParams {
  event: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentType?: string;
}

export async function trackTikTokEvent(params: TikTokEventParams): Promise<boolean> {
  if (!TIKTOK_ACCESS_TOKEN || !TIKTOK_PIXEL_ID) return false;

  try {
    const user: any = {};
    if (params.email) user.email = hashSHA256(params.email);
    if (params.ip) user.ip = params.ip;
    if (params.userAgent) user.user_agent = params.userAgent;

    const properties: any = {};
    if (params.value !== undefined) properties.value = String(params.value);
    if (params.currency) properties.currency = params.currency;
    if (params.contentName) properties.content_name = params.contentName;
    if (params.contentType) properties.content_type = params.contentType;

    const eventData = {
      event: params.event,
      event_id: `${params.event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event_time: Math.floor(Date.now() / 1000),
      user,
      page: { url: params.url || "https://foxbot.cl" },
      properties,
    };

    const body = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [eventData],
    };

    const res = await fetch(TIKTOK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.code !== 0) {
      console.log(`[tiktok] Event ${params.event} error: ${JSON.stringify(data)}`);
      return false;
    }
    console.log(`[tiktok] Event ${params.event} sent successfully`);
    return true;
  } catch (err: any) {
    console.log(`[tiktok] Error sending event: ${err.message}`);
    return false;
  }
}
