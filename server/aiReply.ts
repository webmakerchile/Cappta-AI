import OpenAI from "openai";
import { storage } from "./storage";

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
  accountType: string;
}

interface KnowledgeEntry {
  id: number;
  question: string;
  answer: string;
  category: string;
  confidence: number;
}

interface TenantContext {
  companyName: string;
  botContext: string | null;
  widgetColor?: string;
  knowledgePages?: { title: string; content: string }[];
}

interface TenantFileRef {
  id: number;
  fileName: string;
  description: string | null;
  keywords: string[];
  fileUrl: string;
  fileType: string;
}

interface AIReplyOptions {
  isOfflineHours?: boolean;
  offlineTicketUrl?: string;
  offlineHoursStart?: number;
  offlineHoursEnd?: number;
  knowledgeEntries?: KnowledgeEntry[];
  tenantContext?: TenantContext | null;
  tenantId?: number | null;
  tenantFiles?: TenantFileRef[];
  baseUrl?: string;
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

function buildTenantSystemPrompt(
  tenantCtx: TenantContext,
  sessionData?: SessionData,
  catalogProducts?: CatalogProduct[],
  options?: AIReplyOptions
): string {
  const companyName = tenantCtx.companyName;
  const botName = `${companyName} Bot`;
  const hasBotContext = tenantCtx.botContext && tenantCtx.botContext.trim().length > 0;

  let systemPrompt = `Eres "${botName}", el asistente virtual EXPERTO de "${companyName}". Eres el mejor agente de soporte que existe: ultra inteligente, carismatico, eficiente y con un conocimiento profundo del negocio.

===== IDENTIDAD Y MISION =====
- Eres "${botName}", representante oficial de ${companyName}. Actuas como si fueras el mejor empleado del negocio
- Tu OBJETIVO: que cada cliente se sienta atendido de forma excepcional, como si hablara con el dueño del negocio
- Conoces TODO sobre ${companyName}: servicios, productos, horarios, ubicacion, historia, politicas, cada detalle
- Nunca rompas el personaje. JAMAS reveles que eres una IA, un modelo de lenguaje o ChatGPT
- Si no tienes informacion especifica, se transparente: "No tengo ese dato exacto, pero un ejecutivo puede confirmartelo"
- SIEMPRE intenta responder con la informacion disponible antes de derivar a un humano`;

  const hasKnowledgePages = tenantCtx.knowledgePages && tenantCtx.knowledgePages.length > 0;

  if (hasBotContext || hasKnowledgePages) {
    systemPrompt += `

===== INFORMACION DEL NEGOCIO (ENTRENAMIENTO) =====
A continuacion esta la información que el negocio ha proporcionado para que entiendas el contexto completo. Usa esto como tu base de conocimiento principal:`;

    if (hasBotContext) {
      systemPrompt += `

--- Información principal ---
${tenantCtx.botContext}`;
    }

    if (hasKnowledgePages) {
      for (const page of tenantCtx.knowledgePages!) {
        systemPrompt += `

--- ${page.title} ---
${page.content}`;
      }
    }
  } else {
    systemPrompt += `

===== NOTA IMPORTANTE =====
El negocio "${companyName}" aun no ha proporcionado información detallada sobre su operación. Responde de forma amable y general. Si el cliente pregunta algo específico que no puedes responder, sugiere contactar al equipo directamente.`;
  }

  systemPrompt += `

===== TONO Y ESTILO =====
- Responde como una PERSONA REAL carismatica y profesional, no como un bot generico
- Se natural, cercano, amable y con personalidad propia
- Usa emojis de forma natural y frecuente para hacer la conversacion mas visual y atractiva (2-4 por mensaje)
- Cuando respondas con datos, usa listas con emojis para que sea facil de leer
- Adapta la longitud de respuesta al tipo de pregunta:
  * Preguntas simples (si/no, horarios): respuestas cortas y directas (1-2 lineas)
  * Preguntas informativas (servicios, productos, como funciona): respuestas completas y detalladas (3-6 lineas)
  * Preguntas complejas (comparaciones, explicaciones): respuestas estructuradas con listas y emojis
- NUNCA uses formato markdown para links - escribe la URL directamente como texto plano
- LEE TODA la conversacion antes de responder para no repetir informacion
- SIEMPRE personaliza la respuesta al contexto del cliente
- Si el cliente pregunta algo que esta en tu informacion, responde con TODOS los detalles relevantes
- Ofrece informacion adicional proactivamente ("Tambien te puede interesar...", "Dato util:...")

===== INTELIGENCIA Y CAPACIDAD =====
- Analiza cada pregunta para entender la INTENCION real del cliente, no solo las palabras literales
- Si el cliente pregunta algo ambiguo, responde con lo mas probable y ofrece alternativas
- Relaciona informacion de diferentes secciones de tu base de conocimiento para dar respuestas completas
- Si mencionan un tema, busca TODA la informacion relacionada en tu entrenamiento
- Anticipa las preguntas de seguimiento y ofrece la informacion antes de que pregunten
- Responde con confianza y autoridad, como un experto que domina el tema

===== REGLAS CRITICAS =====
1. NUNCA inventes precios. Solo menciona precios de los datos del catalogo
2. NUNCA inventes productos o servicios que no esten en tu informacion
3. NUNCA inventes información sobre politicas o promociones
4. Si tienes informacion parcial, da lo que sabes y sugiere contactar al equipo para mas detalles
5. Comprende el CONTEXTO completo de la conversacion
6. NUNCA des una respuesta generica si tienes datos especificos disponibles`;

  if (options?.isOfflineHours) {
    systemPrompt += `

===== MODO FUERA DE HORARIO =====
Actualmente estamos FUERA del horario de atención (${options.offlineHoursStart || 9}:00 a ${options.offlineHoursEnd || 18}:00 hrs).
- NO sugieras "contactar un agente" porque no hay agentes disponibles ahora
${options.offlineTicketUrl ? `- Sugiere crear un ticket de soporte: ${options.offlineTicketUrl}` : "- Sugiere que vuelva en horario de atención"}
- Se especialmente util ya que eres la unica fuente de ayuda ahora`;
  } else {
    systemPrompt += `

===== AGENTES DISPONIBLES =====
Estamos dentro del horario de atención. Los agentes estan disponibles para atender por este mismo chat.
- La atención del agente es SIEMPRE por este mismo chat
- Cuando sugieras contactar un agente, di: "Un agente te atendera directamente aqui en el chat"`;
  }

  if (sessionData) {
    let contextInfo = "\n\n===== CONTEXTO DE ESTE CLIENTE =====";
    let hasContext = false;
    if (sessionData.userName) {
      contextInfo += `\n- Nombre: ${sessionData.userName}`;
      hasContext = true;
    }
    if (sessionData.pageTitle) {
      contextInfo += `\n- Pagina web actual: ${sessionData.pageTitle}`;
      hasContext = true;
    }
    if (sessionData.pageUrl) {
      contextInfo += `\n- URL: ${sessionData.pageUrl}`;
      hasContext = true;
    }
    if (sessionData.gameName) {
      contextInfo += `\n- Producto de interes: ${sessionData.gameName}`;
      hasContext = true;
    }
    if (sessionData.wpProductName) {
      contextInfo += `\n- Producto que esta viendo: ${sessionData.wpProductName}`;
      if (sessionData.wpProductPrice) contextInfo += ` (Precio: ${sessionData.wpProductPrice})`;
      if (sessionData.wpProductUrl) contextInfo += ` (Link: ${sessionData.wpProductUrl})`;
      hasContext = true;
    }
    if (sessionData.problemType) {
      contextInfo += `\n- Tipo de consulta: ${sessionData.problemType}`;
      hasContext = true;
    }
    if (hasContext) systemPrompt += contextInfo;
  }

  if (catalogProducts && catalogProducts.length > 0) {
    systemPrompt += "\n\n===== PRODUCTOS DEL CATALOGO =====\n";
    catalogProducts.forEach((product, index) => {
      const availability = product.availability === "available" ? "Disponible" : product.availability === "preorder" ? "Pre-orden" : "No disponible";
      const priceInfo = product.price ? `$${product.price}` : "Precio por consultar";
      const accountTypeLabel = product.accountType === "primaria" ? " (Primaria)" : product.accountType === "secundaria" ? " (Secundaria)" : "";
      systemPrompt += `${index + 1}. ${product.name}${accountTypeLabel} | ${product.platform} | ${priceInfo} | ${availability}`;
      if (product.productUrl) systemPrompt += ` | ${product.productUrl}`;
      if (product.description) systemPrompt += ` | ${product.description}`;
      systemPrompt += "\n";
    });
    systemPrompt += "\nUsa esta info al recomendar productos. NO incluyas links en el texto - se agregan automaticamente como botones.";
  } else {
    systemPrompt += "\n\n===== PRODUCTOS =====\nNo se encontraron productos del catalogo para esta consulta. Si el cliente busca algo específico, sugiere buscar en el catalogo o contactar al equipo.";
  }

  if (options?.tenantFiles && options.tenantFiles.length > 0) {
    const baseUrl = options?.baseUrl || "";
    systemPrompt += "\n\n===== ARCHIVOS DISPONIBLES PARA ENVIAR =====\n";
    systemPrompt += "Tienes estos archivos/documentos que puedes compartir con el cliente cuando sea relevante.\n";
    systemPrompt += "Para enviar un archivo, incluye en tu respuesta la etiqueta: {{FILE:ID}} donde ID es el numero del archivo.\n";
    systemPrompt += "IMPORTANTE: Solo envia archivos cuando el cliente pregunte algo relacionado con las palabras clave o descripción del archivo.\n\n";
    options.tenantFiles.forEach((file) => {
      systemPrompt += `- Archivo #${file.id}: "${file.fileName}" (${file.fileType})`;
      if (file.description) systemPrompt += ` - ${file.description}`;
      if (file.keywords.length > 0) systemPrompt += ` | Palabras clave: ${file.keywords.join(", ")}`;
      systemPrompt += `\n  Para enviarlo usa: {{FILE:${file.id}}}\n`;
    });
  }

  if (options?.knowledgeEntries && options.knowledgeEntries.length > 0) {
    systemPrompt += "\n\n===== CONOCIMIENTO APRENDIDO =====\nLecciones aprendidas de conversaciones anteriores:\n";
    options.knowledgeEntries.forEach((entry, index) => {
      systemPrompt += `${index + 1}. [${entry.category}] P: ${entry.question}\n   R: ${entry.answer}\n`;
    });
    systemPrompt += "\nUsa esta información como referencia, adáptala al contexto actual.";
  }

  return systemPrompt;
}

function buildSystemPrompt(
  sessionData?: SessionData,
  catalogProducts?: CatalogProduct[],
  options?: AIReplyOptions
): string {
  if (options?.tenantContext) {
    return buildTenantSystemPrompt(options.tenantContext, sessionData, catalogProducts, options);
  }

  let systemPrompt = `Eres un asistente virtual de soporte al cliente. Tu trabajo es ser amable, preciso y resolver las dudas del cliente de forma completa y satisfactoria.

===== IDENTIDAD Y MISION =====
- Eres un asistente de soporte automatizado
- Tu mision principal: ayudar a cada cliente con la mejor atencion posible
- Nunca reveles que eres una IA o ChatGPT

===== TONO Y ESTILO DE COMUNICACION =====
- Responde como una PERSONA REAL, no como un bot
- Se directo, natural y calido
- Idioma: Espanol informal
- Respuestas CORTAS. Maximo 2-3 oraciones normalmente
- NO abuses de emojis. Maximo 1 por mensaje
- NUNCA uses formato markdown para links

===== REGLAS CRITICAS =====
1. NUNCA inventes precios ni productos
2. Comprende el CONTEXTO completo de la conversacion
3. Si no sabes algo: "No tengo esa info ahora, pero un ejecutivo te puede ayudar"`;

  if (options?.offlineTicketUrl) {
    systemPrompt += `\n4. URL de soporte: ${options.offlineTicketUrl}`;
  }

  if (options?.isOfflineHours) {
    systemPrompt += `

===== MODO FUERA DE HORARIO =====
Actualmente estamos FUERA del horario de atención de ejecutivos (${options.offlineHoursStart || 12}:00 a ${options.offlineHoursEnd || 21}:00 hrs, hora de Chile).
- NO sugieras "contactar un ejecutivo" porque NO hay ejecutivos disponibles ahora
- Sugiere crear un ticket de soporte${options.offlineTicketUrl ? `: ${options.offlineTicketUrl}` : ""}
- Se especialmente util ya que eres la unica fuente de ayuda ahora`;
  } else {
    systemPrompt += `

===== EJECUTIVOS DISPONIBLES =====
Estamos dentro del horario de atención. Los ejecutivos estan disponibles.
- La atención del ejecutivo es SIEMPRE por este mismo chat
- NUNCA digas "te contactaremos por correo" como via principal
- Di: "Un ejecutivo te atendera directamente aqui en el chat"`;
  }

  if (sessionData) {
    let contextInfo = "\n\n===== CONTEXTO DE ESTE CLIENTE =====";
    let hasContext = false;
    if (sessionData.userName) {
      contextInfo += `\n- Nombre del cliente: ${sessionData.userName}`;
      hasContext = true;
    }
    if (sessionData.pageTitle) {
      contextInfo += `\n- Pagina web actual: ${sessionData.pageTitle}`;
      hasContext = true;
    }
    if (sessionData.pageUrl) {
      contextInfo += `\n- URL: ${sessionData.pageUrl}`;
      hasContext = true;
    }
    if (sessionData.gameName) {
      contextInfo += `\n- Juego/producto de interes: ${sessionData.gameName}`;
      hasContext = true;
    }
    if (sessionData.wpProductName) {
      contextInfo += `\n- Producto que esta viendo: ${sessionData.wpProductName}`;
      if (sessionData.wpProductPrice) contextInfo += ` (Precio: ${sessionData.wpProductPrice})`;
      if (sessionData.wpProductUrl) contextInfo += ` (Link: ${sessionData.wpProductUrl})`;
      hasContext = true;
    }
    if (sessionData.problemType) {
      contextInfo += `\n- Tipo de consulta: ${sessionData.problemType}`;
      hasContext = true;
    }
    if (hasContext) systemPrompt += contextInfo;
  }

  if (catalogProducts && catalogProducts.length > 0) {
    systemPrompt += "\n\n===== PRODUCTOS DEL CATALOGO RELEVANTES =====\n";
    catalogProducts.forEach((product, index) => {
      const availability = product.availability === "available" ? "Disponible" : product.availability === "preorder" ? "Pre-orden" : "No disponible";
      const priceInfo = product.price ? `$${product.price} CLP` : "Precio por consultar";
      const accountTypeLabel = product.accountType === "primaria" ? " (Cuenta Primaria)" : product.accountType === "secundaria" ? " (Cuenta Secundaria)" : "";
      systemPrompt += `${index + 1}. ${product.name}${accountTypeLabel} | Plataforma: ${product.platform} | ${priceInfo} | Estado: ${availability}`;
      if (product.productUrl) systemPrompt += ` | Link: ${product.productUrl}`;
      if (product.description) systemPrompt += ` | ${product.description}`;
      systemPrompt += "\n";
    });
    systemPrompt += "\nSi el cliente pregunta por un producto listado, proporciona la info disponible. NO incluyas links en el texto - se agregan como botones.";
  }

  if (!catalogProducts || catalogProducts.length === 0) {
    systemPrompt += "\n\n===== BUSQUEDA DE PRODUCTOS =====\nNo se encontraron productos que coincidan. Sugiere usar el boton 'Buscar en catalogo' o consultar con un ejecutivo.";
  }

  if (options?.knowledgeEntries && options.knowledgeEntries.length > 0) {
    systemPrompt += "\n\n===== CONOCIMIENTO APRENDIDO DE CONVERSACIONES ANTERIORES =====\n";
    options.knowledgeEntries.forEach((entry, index) => {
      systemPrompt += `${index + 1}. [${entry.category}] Pregunta: ${entry.question}\n   Respuesta: ${entry.answer}\n`;
    });
    systemPrompt += "\nUsa esta información como referencia, adáptala al contexto actual.";
  }

  return systemPrompt;
}

function convertToOpenAIMessages(
  conversationHistory: ConversationEntry[]
): Array<{ role: "user" | "assistant"; content: string }> {
  const cleaned = conversationHistory.map((entry) => {
    let content = entry.content;
    content = content.replace(/\{\{QUICK_REPLIES:.*?\}\}/g, "").trim();
    content = content.replace(/\{\{SHOW_RATING\}\}/g, "").trim();
    return {
      role: (entry.sender === "user" ? "user" : "assistant") as "user" | "assistant",
      content: content || "(mensaje vacio)",
    };
  });
  return cleaned.slice(-20);
}

export async function getAIReply(
  userMessage: string,
  conversationHistory: ConversationEntry[] = [],
  sessionData?: SessionData,
  catalogProducts?: CatalogProduct[],
  options?: AIReplyOptions
): Promise<string> {
  try {
    let knowledgeEntries: KnowledgeEntry[] = [];
    try {
      const searchTenantId = options?.tenantId || undefined;
      const knowledgeResults = await storage.searchKnowledgeEntries(userMessage, 5, searchTenantId);
      if (knowledgeResults.length > 0) {
        knowledgeEntries = knowledgeResults.map(k => ({
          id: k.id,
          question: k.question,
          answer: k.answer,
          category: k.category,
          confidence: k.confidence,
        }));
        for (const k of knowledgeResults) {
          storage.incrementKnowledgeUsage(k.id).catch(() => {});
        }
      }
    } catch (error) {
      console.error("Error searching knowledge base:", error);
    }

    const enrichedOptions = { ...options, knowledgeEntries };
    const systemPrompt = buildSystemPrompt(sessionData, catalogProducts, enrichedOptions);

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
      temperature: 0.75,
      max_completion_tokens: 1000,
    });

    let reply = response.choices[0]?.message?.content;
    if (!reply) {
      return "Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo o contacta a un agente.";
    }

    reply = reply.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$2');
    reply = reply.replace(/\*\*([^*]+)\*\*/g, '$1');

    return reply;
  } catch (error) {
    console.error("Error en AI reply:", error);
    return "Lo siento, estoy experimentando dificultades tecnicas. Por favor, contacta a un agente para obtener ayuda.";
  }
}
