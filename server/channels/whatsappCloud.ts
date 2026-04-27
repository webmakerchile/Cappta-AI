// WhatsApp Cloud API direct (Meta Graph) integration
import type { TenantChannel } from "@shared/schema";
import { log } from "../index";
import { persistInboundMessage } from "./index";

const FB_API = "https://graph.facebook.com/v19.0";

export async function sendWhatsAppCloudMessage(channel: TenantChannel, toPhone: string, content: string): Promise<boolean> {
  if (!channel.accessToken || !channel.phoneNumberId) return false;
  try {
    const r = await fetch(`${FB_API}/${channel.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${channel.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
        type: "text",
        text: { body: content },
      }),
    });
    const j: any = await r.json();
    if (j.error) {
      log(`sendWhatsAppCloudMessage error: ${j.error.message}`, "wa-cloud");
      return false;
    }
    return true;
  } catch (error: any) {
    log(`sendWhatsAppCloudMessage error: ${error.message}`, "wa-cloud");
    return false;
  }
}

export async function handleWhatsAppCloudEvent(channel: TenantChannel, entry: any): Promise<{ sessionId: string; messageId: number } | null> {
  const value = entry?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return null;
  const fromPhone = message.from;
  if (!fromPhone) return null;
  const content = message.text?.body
    || message.image?.caption
    || message.button?.text
    || message.interactive?.button_reply?.title
    || message.interactive?.list_reply?.title
    || "[Mensaje multimedia]";
  const externalMessageId = message.id;
  const contactName = value.contacts?.[0]?.profile?.name || `WhatsApp ${fromPhone}`;
  const fromIdentifier = `${fromPhone}@whatsapp`;

  const result = await persistInboundMessage({
    tenantId: channel.tenantId,
    channel: "whatsapp_cloud",
    externalThreadId: fromPhone,
    externalMessageId,
    fromName: contactName,
    fromIdentifier,
    content,
  });
  return { sessionId: result.session.sessionId, messageId: result.message.id };
}
