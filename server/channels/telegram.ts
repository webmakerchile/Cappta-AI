// Telegram Bot API integration
import type { TenantChannel } from "@shared/schema";
import { log } from "../index";
import { storage } from "../storage";
import { persistInboundMessage } from "./index";

const TG_API = "https://api.telegram.org";

export async function setTelegramWebhook(botToken: string, webhookUrl: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> {
  try {
    const body: any = { url: webhookUrl, allowed_updates: ["message"] };
    if (secretToken) body.secret_token = secretToken;
    const r = await fetch(`${TG_API}/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (error: any) {
    log(`setTelegramWebhook error: ${error.message}`, "telegram");
    return { ok: false, description: error.message };
  }
}

export async function getTelegramBotInfo(botToken: string): Promise<{ ok: boolean; result?: { id: number; username: string; first_name: string }; description?: string }> {
  try {
    const r = await fetch(`${TG_API}/bot${botToken}/getMe`);
    return await r.json();
  } catch (error: any) {
    return { ok: false, description: error.message };
  }
}

export async function sendTelegramMessage(channel: TenantChannel, chatId: string, content: string, imageUrl?: string): Promise<boolean> {
  if (!channel.botToken) return false;
  try {
    if (imageUrl) {
      const r = await fetch(`${TG_API}/bot${channel.botToken}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption: content || "" }),
      });
      const j: any = await r.json();
      return !!j.ok;
    }
    const r = await fetch(`${TG_API}/bot${channel.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: content, parse_mode: "HTML" }),
    });
    const j: any = await r.json();
    return !!j.ok;
  } catch (error: any) {
    log(`sendTelegramMessage error: ${error.message}`, "telegram");
    return false;
  }
}

/**
 * Handle a Telegram update payload from the webhook.
 * Returns the persisted message info or null if ignored.
 */
export async function handleTelegramUpdate(tenantId: number, update: any): Promise<{ sessionId: string; messageId: number } | null> {
  const msg = update?.message;
  if (!msg || !msg.chat?.id) return null;

  const chatId = String(msg.chat.id);
  const fromName = msg.from?.first_name
    ? `${msg.from.first_name}${msg.from.last_name ? " " + msg.from.last_name : ""}`
    : (msg.from?.username || `Telegram ${chatId}`);
  const fromIdentifier = msg.from?.username
    ? `${msg.from.username}@telegram`
    : `tg_${chatId}@telegram`;
  const content = msg.text || msg.caption || (msg.photo ? "[Imagen]" : "[Mensaje multimedia]");
  const externalMessageId = String(msg.message_id);

  const result = await persistInboundMessage({
    tenantId,
    channel: "telegram",
    externalThreadId: chatId,
    externalMessageId,
    fromName,
    fromIdentifier,
    content,
  });

  return { sessionId: result.session.sessionId, messageId: result.message.id };
}
