import { storage } from "./storage";
import { chat as llmChat, DEFAULT_MODEL } from "./llm";

interface ExtractionResult {
  sessionsProcessed: number;
  entriesCreated: number;
  entries: Array<{ category: string; question: string; answer: string }>;
}

const EXTRACTION_PROMPT = `Eres un analista de soporte al cliente. Analiza la siguiente conversación de chat entre un cliente y el equipo de soporte.

Tu tarea es extraer CONOCIMIENTO ÚTIL que pueda ayudar a responder mejor a futuros clientes. Busca:

1. **Preguntas frecuentes (faq)**: Preguntas que otros clientes podrían hacer
2. **Soluciones a problemas (troubleshooting)**: Pasos para resolver problemas técnicos o de cuenta
3. **Información de productos (product_info)**: Detalles sobre productos, precios, disponibilidad que los clientes preguntan
4. **Políticas (policy)**: Reglas del negocio, tiempos de entrega, métodos de pago, etc.
5. **General (general)**: Cualquier otro conocimiento útil

REGLAS:
- Solo extrae conocimiento que sea GENUINAMENTE ÚTIL para futuras conversaciones
- NO extraigas saludos, despedidas o intercambios triviales
- La respuesta debe ser auto-contenida (que se entienda sin ver la conversación original)
- Escribe en español chileno natural
- Si la conversación no tiene conocimiento útil que extraer, devuelve un array vacío
- Máximo 5 entradas por conversación
- Incluye palabras clave relevantes para búsqueda

Responde SOLO con un JSON objeto válido con este formato exacto:
{
  "entries": [
    {
      "category": "faq|troubleshooting|product_info|policy|general",
      "question": "La pregunta o tema que el cliente planteó",
      "answer": "La respuesta o solución completa y útil",
      "keywords": ["palabra1", "palabra2", "palabra3"],
      "confidence": 70-100
    }
  ]
}

Si no hay conocimiento útil, responde: {"entries": []}`;

export async function extractKnowledgeFromSessions(options?: { limit?: number }): Promise<ExtractionResult> {
  const limit = options?.limit || 10;
  const result: ExtractionResult = { sessionsProcessed: 0, entriesCreated: 0, entries: [] };

  const lastProcessedAt = await storage.getSetting("knowledge_last_processed_at");
  const lastDate = lastProcessedAt ? new Date(lastProcessedAt) : new Date(0);

  const allSessions = await storage.getAllSessions("closed");

  const eligibleSessions = allSessions
    .filter(s => {
      const sessionDate = s.firstMessage ? new Date(s.firstMessage) : new Date(0);
      return sessionDate > lastDate && s.messageCount >= 4;
    })
    .sort((a, b) => {
      const dateA = a.firstMessage ? new Date(a.firstMessage).getTime() : 0;
      const dateB = b.firstMessage ? new Date(b.firstMessage).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, limit);

  if (eligibleSessions.length === 0) {
    return result;
  }

  let latestSessionDate = lastDate;

  for (const session of eligibleSessions) {
    try {
      const messages = await storage.getMessagesBySessionId(session.sessionId);

      if (messages.length < 4) continue;

      const conversationText = messages
        .map(m => {
          const sender = m.sender === "user" ? (session.userName || "Cliente") : "Soporte";
          let content = m.content;
          content = content.replace(/\{\{QUICK_REPLIES:.*?\}\}/g, "").trim();
          content = content.replace(/\{\{SHOW_RATING\}\}/g, "").trim();
          return `${sender}: ${content}`;
        })
        .join("\n");

      const llmResult = await llmChat({
        tenantId: null,
        model: DEFAULT_MODEL,
        kind: "knowledge_extraction",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: `Conversación (${messages.length} mensajes):\n\n${conversationText}` },
        ],
        temperature: 0.3,
        maxTokens: 1500,
        responseFormat: "json_object",
      });

      const responseText = llmResult.content;
      if (!responseText) continue;

      let entries: any[];
      try {
        const parsed = JSON.parse(responseText);
        entries = Array.isArray(parsed) ? parsed : (parsed.entries || parsed.knowledge || parsed.data || []);
        if (!Array.isArray(entries)) entries = [];
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry.question || !entry.answer) continue;

        const validCategories = ["faq", "troubleshooting", "product_info", "policy", "general"];
        const category = validCategories.includes(entry.category) ? entry.category : "general";

        await storage.createKnowledgeEntry({
          category: category as any,
          question: entry.question,
          answer: entry.answer,
          keywords: Array.isArray(entry.keywords) ? entry.keywords : [],
          confidence: typeof entry.confidence === "number" ? Math.min(100, Math.max(0, entry.confidence)) : 80,
          status: "pending",
          sourceSessionId: session.sessionId,
        });

        result.entries.push({ category, question: entry.question, answer: entry.answer });
        result.entriesCreated++;
      }

      result.sessionsProcessed++;

      const sessionDate = session.firstMessage ? new Date(session.firstMessage) : new Date();
      if (sessionDate > latestSessionDate) {
        latestSessionDate = sessionDate;
      }
    } catch (error) {
      console.error(`Error processing session ${session.sessionId}:`, error);
    }
  }

  if (result.sessionsProcessed > 0) {
    await storage.setSetting("knowledge_last_processed_at", latestSessionDate.toISOString());
  }

  return result;
}
