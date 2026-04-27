import { storage, salesEngine } from "../storage";
import type { LeadScoreFactor } from "@shared/schema";
import { isTenantPaid } from "./safety";
import { chat as llmChat, resolveModelForTenant } from "../llm";

const pendingScores = new Map<string, NodeJS.Timeout>();

interface LeadScoreResult {
  score: number;
  temperature: "cold" | "warm" | "hot";
  intent: string;
  factors: LeadScoreFactor[];
  reasoning: string;
  nextAction: string;
}

export function scheduleLeadScore(tenantId: number, sessionId: string, debounceMs = 25000) {
  const key = `${tenantId}:${sessionId}`;
  const existing = pendingScores.get(key);
  if (existing) clearTimeout(existing);
  const t = setTimeout(async () => {
    pendingScores.delete(key);
    try {
      if (!(await isTenantPaid(tenantId))) return;
      await calculateAndStoreLeadScore(tenantId, sessionId);
    } catch (e: any) {
      console.error(`[leadScorer] error tenant=${tenantId} session=${sessionId}: ${e?.message}`);
    }
  }, debounceMs);
  pendingScores.set(key, t);
}

export async function calculateAndStoreLeadScore(tenantId: number, sessionId: string): Promise<LeadScoreResult | null> {
  const session = await storage.getSession(sessionId);
  if (!session || session.tenantId !== tenantId) return null;
  const messages = await storage.getMessagesBySessionId(sessionId);
  if (messages.length < 2) return null;

  const tenant = await storage.getTenantById(tenantId);
  const conversation = messages
    .filter(m => !m.content.startsWith("{{"))
    .slice(-25)
    .map(m => `${m.sender === "user" ? "Cliente" : "Asistente"}: ${m.content.replace(/\{\{[^}]+\}\}/g, "").slice(0, 400)}`)
    .join("\n");

  const business = tenant?.botContext || tenant?.companyName || "Negocio";
  const sys = `Eres un experto en sales engineering para ${business}. Analiza esta conversacion y entrega un puntaje de lead (0-100) en JSON estricto.

Reglas:
- 0-39: cold (curiosidad, sin intencion clara)
- 40-69: warm (interes real, dudas concretas, comparando opciones)
- 70-100: hot (intencion explicita de comprar/agendar/contratar, urgencia, presupuesto, decision tomada)
- factors: lista de 3-5 senales (positive: true=suma, false=resta), con weight 0-20.
- intent: una frase corta (max 8 palabras) describiendo la intencion principal.
- nextAction: una recomendacion accionable para el equipo de ventas (max 18 palabras).
- reasoning: justificacion en 1-2 oraciones.

Responde SOLO con un objeto JSON con: score, temperature, intent, factors, reasoning, nextAction.`;

  try {
    const model = resolveModelForTenant(tenant || null);
    const resp = await llmChat({
      tenantId,
      model,
      kind: "lead_score",
      responseFormat: "json_object",
      maxTokens: 400,
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Conversacion:\n${conversation}\n\nPerfil cliente: nombre=${session.userName}, email=${session.userEmail}, problema=${session.problemType || ""}.` },
      ],
    });
    const raw = resp.content || "{}";
    const parsed = JSON.parse(raw);
    let score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    let temperature = parsed.temperature as "cold" | "warm" | "hot";
    if (!["cold", "warm", "hot"].includes(temperature)) {
      temperature = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
    }
    const factors: LeadScoreFactor[] = Array.isArray(parsed.factors) ? parsed.factors.slice(0, 6).map((f: any) => ({
      factor: String(f.factor || "").slice(0, 120),
      weight: Math.max(0, Math.min(20, Number(f.weight) || 0)),
      positive: Boolean(f.positive),
    })) : [];
    const intent = String(parsed.intent || "indeterminado").slice(0, 80);
    const reasoning = String(parsed.reasoning || "").slice(0, 400);
    const nextAction = String(parsed.nextAction || "").slice(0, 200);

    const result: LeadScoreResult = { score, temperature, intent, factors, reasoning, nextAction };

    const previous = await salesEngine.getLatestLeadScore(tenantId, sessionId);
    await salesEngine.upsertLeadScore({
      tenantId,
      sessionId,
      userEmail: session.userEmail,
      score,
      temperature,
      intent,
      factors: JSON.stringify(factors),
      reasoning,
      nextAction,
    });

    if (previous?.temperature !== "hot" && temperature === "hot") {
      try {
        const { dispatchWebhookEvent } = await import("./webhookDispatcher");
        await dispatchWebhookEvent(tenantId, "lead.hot", {
          sessionId,
          userEmail: session.userEmail,
          userName: session.userName,
          score,
          intent,
          nextAction,
        });
        await dispatchWebhookEvent(tenantId, "lead.qualified", {
          sessionId,
          userEmail: session.userEmail,
          userName: session.userName,
          score,
          intent,
          nextAction,
        });
      } catch {}
      try {
        const { triggerSequencesForEvent } = await import("./sequenceEngine");
        await triggerSequencesForEvent(tenantId, "lead_hot", {
          sessionId,
          userEmail: session.userEmail,
          userName: session.userName,
        });
      } catch {}
      try {
        const { triggerFlowsForEvent } = await import("./flowEngine");
        await triggerFlowsForEvent(tenantId, "lead_hot", {
          sessionId,
          userEmail: session.userEmail,
          userName: session.userName,
          score,
          intent,
        });
      } catch {}
    }

    if (previous?.temperature !== "warm" && temperature === "warm") {
      try {
        const { triggerSequencesForEvent } = await import("./sequenceEngine");
        await triggerSequencesForEvent(tenantId, "lead_warm", {
          sessionId,
          userEmail: session.userEmail,
          userName: session.userName,
        });
      } catch {}
    }

    try {
      const { dispatchWebhookEvent } = await import("./webhookDispatcher");
      await dispatchWebhookEvent(tenantId, "lead.scored", {
        sessionId,
        userEmail: session.userEmail,
        score,
        temperature,
        intent,
      });
    } catch {}

    return result;
  } catch (e: any) {
    console.error(`[leadScorer] AI failed: ${e?.message}`);
    return null;
  }
}
