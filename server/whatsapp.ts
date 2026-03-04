import Twilio from "twilio";
import { storage } from "./storage";
import { getAIReply } from "./aiReply";
import { log } from "./index";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "";

let twilioClient: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio | null {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export function isWhatsAppConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER);
}

const conversationHistory = new Map<string, { role: string; content: string; ts: number }[]>();

const HISTORY_TTL = 30 * 60 * 1000;

function getHistory(phoneNumber: string): { sender: string; content: string }[] {
  const history = conversationHistory.get(phoneNumber) || [];
  const now = Date.now();
  const filtered = history.filter((h) => now - h.ts < HISTORY_TTL);
  conversationHistory.set(phoneNumber, filtered);
  return filtered.map((h) => ({ sender: h.role, content: h.content }));
}

function addToHistory(phoneNumber: string, role: string, content: string) {
  if (!conversationHistory.has(phoneNumber)) {
    conversationHistory.set(phoneNumber, []);
  }
  const history = conversationHistory.get(phoneNumber)!;
  history.push({ role, content, ts: Date.now() });
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const client = getClient();
  if (!client) {
    log("Twilio not configured, cannot send WhatsApp message", "whatsapp");
    return false;
  }
  try {
    const fromNumber = TWILIO_WHATSAPP_NUMBER.startsWith("whatsapp:")
      ? TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body,
    });
    log(`WhatsApp message sent to ${to}`, "whatsapp");
    return true;
  } catch (error: any) {
    log(`Error sending WhatsApp message: ${error.message}`, "whatsapp");
    return false;
  }
}

export async function handleIncomingWhatsApp(
  from: string,
  body: string,
  tenantId?: number
): Promise<string> {
  try {
    const cleanPhone = from.replace("whatsapp:", "");

    let tenant = null;
    if (tenantId) {
      tenant = await storage.getTenantById(tenantId);
    }

    if (!tenant) {
      return "Lo siento, no hay un negocio configurado para atender por WhatsApp en este momento.";
    }

    if (!tenant.aiEnabled) {
      return tenant.whatsappGreeting || "Gracias por escribirnos. Un ejecutivo te atenderá pronto.";
    }

    const history = getHistory(cleanPhone);

    addToHistory(cleanPhone, "user", body);

    const greeting = tenant.whatsappGreeting || "";
    const botContext = tenant.botContext || "";
    const contextPrefix = greeting
      ? `${greeting}\n\n${botContext}`
      : botContext;

    const aiResponse = await getAIReply(body, history, undefined, undefined, {
      tenantId: tenant.id,
      botContext: contextPrefix || undefined,
      companyName: tenant.companyName,
      businessHoursConfig: tenant.businessHoursConfig || undefined,
    });

    addToHistory(cleanPhone, "support", aiResponse);

    return aiResponse;
  } catch (error: any) {
    log(`Error handling incoming WhatsApp: ${error.message}`, "whatsapp");
    return "Lo siento, ocurrió un error procesando tu mensaje. Por favor intenta de nuevo.";
  }
}

setInterval(() => {
  const now = Date.now();
  conversationHistory.forEach((history, phone) => {
    const filtered = history.filter((h) => now - h.ts < HISTORY_TTL);
    if (filtered.length === 0) {
      conversationHistory.delete(phone);
    } else {
      conversationHistory.set(phone, filtered);
    }
  });
}, 5 * 60 * 1000);
