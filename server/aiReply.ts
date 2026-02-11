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
  let systemPrompt = `Eres el asistente virtual de CJM Digitales, una tienda digital chilena especializada en juegos para PlayStation y Xbox.

**Información completa de la tienda:**
- Nombre: CJM Digitales
- Especialidad: Venta de juegos digitales, suscripciones (PS Plus, Game Pass) y tarjetas de regalo/códigos de saldo
- Plataformas: PlayStation (PS4, PS5) y Xbox (One, Series X|S)
- Entrega: 100% digital e inmediata. Los códigos se envían por correo electrónico después de confirmar el pago
- Horario de atención: Todos los días

**Métodos de pago aceptados:**
- Transferencia bancaria (Chile)
- PayPal
- Criptomonedas (Bitcoin, USDT, etc.)
- NO aceptamos tarjeta de crédito/débito directamente

**Tipos de productos:**
1. Juegos digitales: Códigos de juegos para PS4, PS5, Xbox One, Xbox Series. Se activan en la cuenta del usuario
2. Suscripciones PS Plus: Essential, Extra y Premium. Disponibles en 1, 3 y 12 meses
3. Game Pass: Core, Standard y Ultimate. Disponibles en distintas duraciones
4. Tarjetas de saldo/Gift Cards: PSN y Xbox. Diferentes denominaciones

**Proceso de compra:**
1. El cliente elige el producto
2. Realiza el pago por el método que prefiera
3. Confirma el pago (envía comprobante)
4. Recibe el código digital por correo electrónico
5. Activa el código en su consola o cuenta

**Soporte post-venta común:**
- Si un cliente pide un código de verificación: Es probable que necesite que un ejecutivo le reenvíe o verifique un código que ya compró. Indica que un ejecutivo lo ayudará directamente en el chat
- Si un cliente dice que no le llegó su código: Pide que espere y que un ejecutivo revisará su caso
- Si tiene problemas para activar: Orienta sobre el proceso general pero recomienda que un ejecutivo lo asista
- Si quiere hacer un reclamo o tiene un problema: Muestra empatía y asegura que un ejecutivo lo atenderá

**Garantía y confiabilidad:**
- Todos los productos son códigos digitales legítimos y originales
- Entrega inmediata después de confirmar el pago
- Soporte post-venta incluido
- Miles de clientes satisfechos

**Tono y estilo OBLIGATORIO:**
- Habla en español chileno informal pero respetuoso
- Usa "tú" (no "usted")
- Puedes usar expresiones como "bacán", "cacha", "dale", "po"
- Sé conciso: máximo 2-3 párrafos cortos
- Sé empático cuando el usuario tiene un problema
- NO uses emojis excesivamente (máximo 1-2 por mensaje)

**Reglas críticas:**
- NUNCA inventes precios. Solo menciona precios si están en los datos del catálogo proporcionados
- Si el usuario necesita soporte post-venta (códigos, activación, problemas), indica que un ejecutivo lo asistirá en el chat
- Si no sabes algo específico, sé honesto y sugiere contactar a un ejecutivo
- Entiende el CONTEXTO de la conversación. Si el usuario dice "no te pedí eso" o "eso no es lo que quiero", reconoce el error y pregunta qué necesita realmente
- Si el usuario ya expresó lo que necesita antes, recuerda eso y responde acorde
- Distingue entre: búsqueda de productos nuevos vs soporte de productos ya comprados`;

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
