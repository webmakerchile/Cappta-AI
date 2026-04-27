// Instagram DM integration via Meta Graph API
import type { TenantChannel } from "@shared/schema";
import { log } from "../index";
import { persistInboundMessage } from "./index";

const FB_API = "https://graph.facebook.com/v19.0";

export async function sendInstagramMessage(channel: TenantChannel, igRecipientId: string, content: string): Promise<boolean> {
  if (!channel.accessToken || !channel.igUserId) return false;
  try {
    const r = await fetch(`${FB_API}/${channel.igUserId}/messages?access_token=${encodeURIComponent(channel.accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: igRecipientId },
        message: { text: content },
      }),
    });
    const j: any = await r.json();
    if (j.error) {
      log(`sendInstagramMessage error: ${j.error.message}`, "instagram");
      return false;
    }
    return true;
  } catch (error: any) {
    log(`sendInstagramMessage error: ${error.message}`, "instagram");
    return false;
  }
}

export async function handleInstagramEvent(channel: TenantChannel, entry: any): Promise<{ sessionId: string; messageId: number } | null> {
  const messaging = entry?.messaging?.[0];
  if (!messaging?.message || messaging.message.is_echo) return null;
  const igRecipientId = messaging.sender?.id;
  if (!igRecipientId) return null;

  const externalMessageId = messaging.message.mid || `ig_${Date.now()}`;
  const content = messaging.message.text || (messaging.message.attachments?.length ? "[Adjunto]" : "[Mensaje]");
  const fromName = `Instagram ${igRecipientId.slice(-6)}`;
  const fromIdentifier = `ig_${igRecipientId}@instagram`;

  const result = await persistInboundMessage({
    tenantId: channel.tenantId,
    channel: "instagram",
    externalThreadId: igRecipientId,
    externalMessageId,
    fromName,
    fromIdentifier,
    content,
  });
  return { sessionId: result.session.sessionId, messageId: result.message.id };
}
