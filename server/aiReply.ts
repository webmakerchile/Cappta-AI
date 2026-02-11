import OpenAI from "openai";

interface ConversationEntry {
  sender: string;
  content: string;
}

interface SessionData {
  problemType?: string | null;
  gameName?: string | null;
  pageTitle?: string | null;
  pageUrl?: string | null;
  userName?: string | null;
  wpProductName?: string | null;
  wpProductPrice?: string | null;
  wpProductUrl?: string | null;
}

interface CatalogProduct {
  name: string;
  price: string | null;
  productUrl: string | null;
  availability: string;
  platform: string;
  description: string | null;
  category: string;
}

let _openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

function buildSystemPrompt(
  sessionData?: SessionData,
  catalogProducts?: CatalogProduct[]
): string {
  let systemPrompt = `Eres un asistente de CJM Digitales, una tienda digital chilena de juegos para PlayStation y Xbox.

**Información de la tienda:**
- Nombre: CJM Digitales
- Especialidad: Venta de juegos digitales, suscripciones (PS Plus, Game Pass) y tarjetas de regalo/códigos de saldo
- Plataformas: PlayStation y Xbox
- Entrega: Digital e inmediata por correo electrónico
- Métodos de pago: Transferencia bancaria, PayPal, criptomonedas

**Garantía y confiabilidad:**
- Todos los productos son códigos digitales legítimos
- Entrega inmediata después del pago
- Productos originales y confiables

**Tono y estilo:**
- Amigable y casual, con lingo de videojuegos
- Responde siempre en español (variante chilena)
- Útil, orientado a ventas
- Conciso: máximo 2-3 párrafos cortos

**Reglas importantes:**
- Responde siempre en español
- No inventes precios a menos que estén en los datos del catálogo
- Si el usuario pregunta algo complejo o tiene problemas, recomienda contactar a un ejecutivo
- Sé conversacional pero mantén el enfoque en ayudar y vender`;

  // Add user context if available
  if (sessionData) {
    let contextInfo = "\n\n**Contexto del usuario:**";
    if (sessionData.userName) {
      contextInfo += `\n- Nombre: ${sessionData.userName}`;
    }
    if (sessionData.pageTitle) {
      contextInfo += `\n- Página actual: ${sessionData.pageTitle}`;
    }
    if (sessionData.gameName) {
      contextInfo += `\n- Juego de interés: ${sessionData.gameName}`;
    }
    if (sessionData.wpProductName) {
      contextInfo += `\n- Producto que ve: ${sessionData.wpProductName}`;
      if (sessionData.wpProductPrice) {
        contextInfo += ` (Precio: ${sessionData.wpProductPrice})`;
      }
    }
    if (sessionData.problemType) {
      contextInfo += `\n- Tipo de problema/interés: ${sessionData.problemType}`;
    }
    if (contextInfo !== "\n\n**Contexto del usuario:**") {
      systemPrompt += contextInfo;
    }
  }

  // Add catalog information if available
  if (catalogProducts && catalogProducts.length > 0) {
    systemPrompt += "\n\n**Productos disponibles en el catálogo:**\n";
    catalogProducts.forEach((product, index) => {
      const availability =
        product.availability === "available"
          ? "Disponible"
          : product.availability === "preorder"
            ? "Pre-orden"
            : "No disponible";
      const priceInfo = product.price ? `$${product.price}` : "Consultar";
      systemPrompt += `${index + 1}. ${product.name} (${product.platform}) - ${priceInfo} - ${availability}`;
      if (product.description) {
        systemPrompt += ` - ${product.description}`;
      }
      systemPrompt += "\n";
    });
    systemPrompt +=
      "\nPuede referirse a estos productos por su nombre. Si el usuario pregunta por algo no listado, honestamente dile que no está en el catálogo actual.";
  }

  return systemPrompt;
}

function convertToOpenAIMessages(
  conversationHistory: ConversationEntry[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return conversationHistory.map((entry) => ({
    role: entry.sender === "user" ? "user" : "assistant",
    content: entry.content,
  }));
}

export async function getAIReply(
  userMessage: string,
  conversationHistory: ConversationEntry[] = [],
  sessionData?: SessionData,
  catalogProducts?: CatalogProduct[]
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(sessionData, catalogProducts);

    // Convert conversation history to OpenAI format
    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...convertToOpenAIMessages(conversationHistory),
      {
        role: "user",
        content: userMessage,
      },
    ];

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.7,
      max_completion_tokens: 500,
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) {
      return "Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo o contacta a un ejecutivo para obtener ayuda personalizada.";
    }

    return reply;
  } catch (error) {
    console.error("Error en AI reply:", error);
    return "Lo siento, estoy experimentando dificultades técnicas. Por favor, contacta a un ejecutivo haciendo clic en 'Contactar un Ejecutivo' para que te brinde la mejor atención personalizada.";
  }
}
