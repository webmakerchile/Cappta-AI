// Omnichannel runtime: shared types and helpers
import { storage } from "../storage";
import type { Session, Message, TenantChannel } from "@shared/schema";
import { log } from "../index";

export type ChannelType = "web" | "whatsapp" | "whatsapp_cloud" | "instagram" | "messenger" | "telegram" | "email";

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  whatsapp_cloud: "WhatsApp Cloud",
  instagram: "Instagram",
  messenger: "Messenger",
  telegram: "Telegram",
  email: "Email",
};

export interface InboundMessage {
  tenantId: number;
  channel: ChannelType;
  externalThreadId: string;
  externalMessageId?: string;
  fromName: string;
  fromIdentifier: string; // email-ish unique id we use as userEmail
  content: string;
  imageUrl?: string;
}

/**
 * Persist an inbound message: ensures session exists with matching channel + external_thread,
 * then creates the message and returns { session, message }.
 */
export async function persistInboundMessage(input: InboundMessage): Promise<{ session: Session; message: Message; isNewSession: boolean }> {
  let session = await storage.findSessionByExternalThread(input.tenantId, input.channel, input.externalThreadId);
  let isNewSession = false;
  const sessionId = session?.sessionId || `${input.channel}:${input.tenantId}:${input.externalThreadId}`;

  if (!session) {
    session = await storage.upsertSession({
      sessionId,
      userEmail: input.fromIdentifier,
      userName: input.fromName,
      tenantId: input.tenantId,
    });
    // Persist channel/external thread info via raw SQL since upsertSession doesn't accept them
    const { db } = await import("../db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`UPDATE sessions SET channel = ${input.channel}, external_thread_id = ${input.externalThreadId} WHERE session_id = ${sessionId}`);
    session = await storage.getSession(sessionId);
    isNewSession = true;
  }

  if (!session) throw new Error("Failed to upsert session");

  const message = await storage.createMessage({
    sessionId,
    tenantId: input.tenantId,
    userEmail: input.fromIdentifier,
    userName: input.fromName,
    sender: "user",
    content: input.content,
    imageUrl: input.imageUrl ?? null,
    channel: input.channel,
    externalMessageId: input.externalMessageId ?? null,
  } as any);

  await storage.touchSession(sessionId);
  return { session, message, isNewSession };
}

/**
 * Send an outbound message via the configured channel for a session.
 * Returns true if sent successfully, false otherwise (or if channel disabled).
 */
export async function sendOutboundForSession(session: Session, content: string, imageUrl?: string | null): Promise<boolean> {
  if (!session.tenantId) return false;
  const channel = (session.channel || "web") as ChannelType;
  if (channel === "web") return true; // web messages handled via socket.io directly
  if (!session.externalThreadId) {
    log(`No external thread for session ${session.sessionId} (channel ${channel})`, "channels");
    return false;
  }
  const cfg = await storage.getTenantChannel(session.tenantId, channel);
  if (!cfg || !cfg.enabled || cfg.status !== "connected") {
    log(`Channel ${channel} not connected for tenant ${session.tenantId}`, "channels");
    return false;
  }
  try {
    switch (channel) {
      case "telegram": {
        const { sendTelegramMessage } = await import("./telegram");
        return await sendTelegramMessage(cfg, session.externalThreadId, content, imageUrl ?? undefined);
      }
      case "instagram": {
        const { sendInstagramMessage } = await import("./instagram");
        return await sendInstagramMessage(cfg, session.externalThreadId, content);
      }
      case "messenger": {
        const { sendMessengerMessage } = await import("./messenger");
        return await sendMessengerMessage(cfg, session.externalThreadId, content);
      }
      case "email": {
        const { sendEmailReply } = await import("./emailChannel");
        return await sendEmailReply(cfg, session, content);
      }
      case "whatsapp_cloud": {
        const { sendWhatsAppCloudMessage } = await import("./whatsappCloud");
        return await sendWhatsAppCloudMessage(cfg, session.externalThreadId, content);
      }
      default:
        return false;
    }
  } catch (error: any) {
    log(`sendOutboundForSession ${channel} error: ${error.message}`, "channels");
    return false;
  }
}
