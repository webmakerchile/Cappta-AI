// Facebook Messenger integration via Meta Graph API
import type { TenantChannel } from "@shared/schema";
import { log } from "../index";
import { persistInboundMessage } from "./index";

const FB_API = "https://graph.facebook.com/v19.0";

export async function sendMessengerMessage(channel: TenantChannel, recipientPsid: string, content: string): Promise<boolean> {
  if (!channel.accessToken || !channel.pageId) return false;
  try {
    const r = await fetch(`${FB_API}/${channel.pageId}/messages?access_token=${encodeURIComponent(channel.accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        messaging_type: "RESPONSE",
        message: { text: content },
      }),
    });
    const j: any = await r.json();
    if (j.error) {
      log(`sendMessengerMessage error: ${j.error.message}`, "messenger");
      return false;
    }
    return true;
  } catch (error: any) {
    log(`sendMessengerMessage error: ${error.message}`, "messenger");
    return false;
  }
}

export async function handleMessengerEvent(channel: TenantChannel, entry: any): Promise<{ sessionId: string; messageId: number } | null> {
  const messaging = entry?.messaging?.[0];
  if (!messaging?.message || messaging.message.is_echo) return null;
  const psid = messaging.sender?.id;
  if (!psid) return null;

  const externalMessageId = messaging.message.mid || `msg_${Date.now()}`;
  const content = messaging.message.text || (messaging.message.attachments?.length ? "[Adjunto]" : "[Mensaje]");
  const fromName = `Messenger ${psid.slice(-6)}`;
  const fromIdentifier = `msg_${psid}@messenger`;

  const result = await persistInboundMessage({
    tenantId: channel.tenantId,
    channel: "messenger",
    externalThreadId: psid,
    externalMessageId,
    fromName,
    fromIdentifier,
    content,
  });
  return { sessionId: result.session.sessionId, messageId: result.message.id };
}
