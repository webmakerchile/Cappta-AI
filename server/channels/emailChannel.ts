// Email-to-Chat: inbound parsing + outbound replies via Resend.
import type { TenantChannel, Session } from "@shared/schema";
import { log } from "../index";
import { persistInboundMessage } from "./index";

let resend: any = null;
async function getResend() {
  if (resend) return resend;
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = await import("resend");
  resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

function stripQuoted(text: string): string {
  // Strip common reply markers: "On <date> wrote:", "From: ", lines beginning with ">"
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const ln of lines) {
    if (/^>+/.test(ln.trim())) break;
    if (/^(On .+wrote:|El .+escribi[oó]:|From:|De:|-----Original Message-----|Sent from)/i.test(ln.trim())) break;
    out.push(ln);
  }
  return out.join("\n").trim();
}

export interface InboundEmailPayload {
  from: string;          // sender email
  fromName?: string;     // sender display name
  to: string;            // our inbound address (route)
  subject?: string;
  text?: string;
  html?: string;
  messageId?: string;
  threadId?: string;     // optional parent thread id
}

/**
 * Identify which tenant + channel an inbound email belongs to.
 * Looks at the local part: support+t<TENANTID>@host or t<TENANTID>@host.
 * Falls back to scanning tenant_channels by inbound_address (full match) or alias.
 */
export async function resolveInboundEmailChannel(toAddress: string): Promise<TenantChannel | null> {
  const { storage } = await import("../storage");
  const lower = toAddress.toLowerCase().trim();

  // Direct match on inbound_address
  const all = await (await import("../db")).db.execute(
    (await import("drizzle-orm")).sql`SELECT * FROM tenant_channels WHERE channel = 'email' AND lower(inbound_address) = ${lower} LIMIT 1`
  );
  const rows = (all as any).rows ?? all;
  if (rows && rows.length > 0) return rows[0] as TenantChannel;

  // Plus-addressing pattern: anything+t<id>@host or t<id>@host
  const local = lower.split("@")[0];
  const m = local.match(/(?:^|\+)t(\d+)$/);
  if (m) {
    const tenantId = parseInt(m[1], 10);
    return await storage.getTenantChannel(tenantId, "email");
  }
  return null;
}

export async function handleInboundEmail(payload: InboundEmailPayload): Promise<{ sessionId: string; messageId: number } | null> {
  const channel = await resolveInboundEmailChannel(payload.to);
  if (!channel) {
    log(`Inbound email to ${payload.to}: no matching tenant`, "email-channel");
    return null;
  }
  const content = stripQuoted(payload.text || (payload.html ? payload.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") : "")) || "(sin contenido)";
  const fromName = payload.fromName || payload.from.split("@")[0];
  const fromEmail = payload.from.toLowerCase();
  // Use threadId or sender email as the thread key, so replies group naturally
  const externalThreadId = payload.threadId || fromEmail;

  const result = await persistInboundMessage({
    tenantId: channel.tenantId,
    channel: "email",
    externalThreadId,
    externalMessageId: payload.messageId,
    fromName,
    fromIdentifier: fromEmail,
    content: payload.subject ? `**${payload.subject}**\n\n${content}` : content,
  });
  return { sessionId: result.session.sessionId, messageId: result.message.id };
}

export async function sendEmailReply(channel: TenantChannel, session: Session, content: string): Promise<boolean> {
  const r = await getResend();
  if (!r) {
    log(`sendEmailReply: RESEND_API_KEY missing`, "email-channel");
    return false;
  }
  const fromAddress = channel.inboundAddress || `noreply@cappta.cl`;
  const fromName = channel.displayName || "Soporte";
  try {
    await r.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: session.userEmail,
      subject: `Re: tu consulta`,
      text: content,
      html: `<p>${content.replace(/\n/g, "<br/>")}</p>`,
    });
    return true;
  } catch (error: any) {
    log(`sendEmailReply error: ${error.message}`, "email-channel");
    return false;
  }
}
