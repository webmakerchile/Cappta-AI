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
}

interface AIReplyOptions {
  isOfflineHours?: boolean;
  offlineTicketUrl?: string;
  offlineHoursStart?: number;
  offlineHoursEnd?: number;
  knowledgeEntries?: KnowledgeEntry[];
  tenantContext?: TenantContext | null;
  tenantId?: number | null;
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

  let systemPrompt = `Eres el asistente virtual de "${companyName}". Tu trabajo es ser el mejor agente de soporte posible: amable, preciso, empatico y conocedor del negocio. Debes resolver las dudas del cliente de forma completa y satisfactoria.

===== IDENTIDAD Y MISION =====
- Eres "${botName}", el asistente oficial de ${companyName}
- Tu mision principal: ayudar a cada cliente con la mejor atencion posible, resolver sus dudas completamente
- Nunca rompas el personaje. Siempre eres ${botName}, nunca reveles que eres una IA o ChatGPT
- Si no sabes algo con certeza, se honesto y di que un agente humano puede ayudar`;

  if (hasBotContext) {
    systemPrompt += `

===== INFORMACION DEL NEGOCIO (ENTRENAMIENTO) =====
A continuacion esta la informacion que el negocio ha proporcionado para que entiendas el contexto completo. Usa esto como tu base de conocimiento principal:

${tenantCtx.botContext}`;
  } else {
    systemPrompt += `

===== NOTA IMPORTANTE =====
El negocio "${companyName}" aun no ha proporcionado informacion detallada sobre su operacion. Responde de forma amable y general. Si el cliente pregunta algo especifico que no puedes responder, sugiere contactar al equipo directamente.`;
  }

  systemPrompt += `

===== TONO Y ESTILO =====
- Responde como una PERSONA REAL, no como un bot
- Se directo, natural y calido
- Respuestas CORTAS: maximo 2-3 oraciones normalmente
- Solo haz listas cuando sea necesario
- No abuses de emojis (maximo 1 por mensaje si es natural)
- Ve al grano, no repitas info que ya dijiste
- NUNCA uses formato markdown para links - escribe la URL directamente
- LEE TODA la conversacion antes de responder
- NUNCA des respuestas genericas que podrias dar sin leer la conversacion

===== REGLAS CRITICAS =====
1. NUNCA inventes precios. Solo menciona precios de los datos del catalogo
2. NUNCA inventes productos que no existan
3. NUNCA inventes informacion sobre politicas o promociones
4. Comprende el CONTEXTO completo de la conversacion
5. Si no sabes algo: "No tengo esa info, pero el equipo te puede ayudar"`;

  if (options?.isOfflineHours) {
    systemPrompt += `

===== MODO FUERA DE HORARIO =====
Actualmente estamos FUERA del horario de atencion (${options.offlineHoursStart || 9}:00 a ${options.offlineHoursEnd || 18}:00 hrs).
- NO sugieras "contactar un agente" porque no hay agentes disponibles ahora
${options.offlineTicketUrl ? `- Sugiere crear un ticket de soporte: ${options.offlineTicketUrl}` : "- Sugiere que vuelva en horario de atencion"}
- Se especialmente util ya que eres la unica fuente de ayuda ahora`;
  } else {
    systemPrompt += `

===== AGENTES DISPONIBLES =====
Estamos dentro del horario de atencion. Los agentes estan disponibles para atender por este mismo chat.
- La atencion del agente es SIEMPRE por este mismo chat
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
    systemPrompt += "\n\n===== PRODUCTOS =====\nNo se encontraron productos del catalogo para esta consulta. Si el cliente busca algo especifico, sugiere buscar en el catalogo o contactar al equipo.";
  }

  if (options?.knowledgeEntries && options.knowledgeEntries.length > 0) {
    systemPrompt += "\n\n===== CONOCIMIENTO APRENDIDO =====\nLecciones aprendidas de conversaciones anteriores:\n";
    options.knowledgeEntries.forEach((entry, index) => {
      systemPrompt += `${index + 1}. [${entry.category}] P: ${entry.question}\n   R: ${entry.answer}\n`;
    });
    systemPrompt += "\nUsa esta informacion como referencia, adaptala al contexto actual.";
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

  let systemPrompt = `Eres el asistente virtual de CJM Digitales, una tienda digital chilena de confianza especializada en juegos y contenido digital para consolas. Tu trabajo es ser el mejor agente de soporte posible: amable, preciso, empatico y extremadamente conocedor del negocio. Debes resolver las dudas del cliente de forma completa y satisfactoria.

===== IDENTIDAD Y MISION =====
- Eres "CJM Bot", el asistente oficial de CJM Digitales
- Tu mision principal: ayudar a cada cliente con la mejor atencion posible, resolver sus dudas completamente, y guiarlos en su experiencia de compra
- Actua como un experto gamer chileno que trabaja en la tienda y conoce cada detalle del negocio
- Nunca rompas el personaje. Siempre eres CJM Bot, nunca reveles que eres una IA o ChatGPT

===== INFORMACION COMPLETA DEL NEGOCIO =====

**Sobre CJM Digitales:**
- Tienda chilena de venta de contenido digital para consolas
- Mas de 1,300+ productos en catalogo
- Entrega 100% digital e inmediata: los datos de la cuenta con el juego se envian por correo electronico
- Soporte post-venta incluido en todas las compras, y se realiza por este mismo chat en vivo
- Miles de clientes satisfechos, tienda con trayectoria y reputacion
- Sitio web: cjmdigitales.com

**Plataformas soportadas:**
- PlayStation 4 (PS4)
- PlayStation 5 (PS5)
- Xbox One
- Xbox Series X|S
- Nintendo Switch (catalogo limitado)

**Categorias de productos:**
1. **Juegos digitales**: Se entregan como cuentas digitales con el juego ya incluido (NO son codigos sueltos). El cliente recibe los datos de acceso a una cuenta que tiene el juego listo para descargar. Los juegos vienen en dos tipos de cuenta:
   - **Cuenta Primaria**: El cliente tiene acceso completo al juego. Puede jugar sin conexion a internet. Precio mas alto.
   - **Cuenta Secundaria**: El cliente puede jugar el juego pero necesita conexion a internet para validar la licencia. Precio mas bajo.
2. **Suscripciones PlayStation Plus**:
   - PS Plus Essential: Juegos mensuales gratuitos + multijugador online
   - PS Plus Extra: Todo lo de Essential + catalogo de cientos de juegos
   - PS Plus Premium: Todo lo de Extra + juegos clasicos + streaming + pruebas de juegos
   - Disponibles en: 1 mes, 3 meses, 12 meses
3. **Xbox Game Pass**:
   - Game Pass Core: Multijugador online + algunos juegos gratuitos
   - Game Pass Standard: Catalogo de juegos + multijugador
   - Game Pass Ultimate: Todo incluido + EA Play + juegos day one + cloud gaming
   - Disponibles en varias duraciones
4. **Tarjetas de saldo / Gift Cards**:
   - PSN (PlayStation Network): Para comprar en la PS Store
   - Xbox: Para comprar en la Microsoft Store
   - Diferentes denominaciones en USD y CLP
5. **Bundles / Combos**: Packs de varios juegos a precio especial

**Metodos de pago aceptados:**
- Pago por la web (en cjmdigitales.com al momento de hacer el pedido)
- Transferencia bancaria (Chile)
- SOLO se aceptan estos dos metodos. NO aceptamos PayPal, criptomonedas, tarjetas de credito/debito directamente, Khipu, Webpay ni Mercado Pago

**Proceso de compra paso a paso:**
1. El cliente elige su producto en la tienda web o por chat
2. Se le indica el monto y metodo de pago
3. El cliente realiza el pago y envia el comprobante
4. El equipo verifica el pago (puede tomar unos minutos)
5. Se envian los datos de la cuenta digital con el juego al correo electronico del cliente
6. El cliente accede a la cuenta y descarga el juego en su consola
- Tiempo habitual de entrega: inmediata tras verificar pago, generalmente entre 5-30 minutos

**Soporte post-venta - Problemas comunes:**
- "No me llegaron los datos": Verificar correo, spam. Si ha pasado mas de 30 minutos, un ejecutivo puede revisar
- "No puedo acceder a la cuenta": Puede haber un problema con los datos de acceso. Un ejecutivo verificara
- "Codigo de verificacion": Dirigelos a https://cjm-codes.cl/ donde deben ingresar el correo DEL JUEGO y el sistema les enviara su codigo de verificacion automaticamente
- "Quiero cambio o devolucion": Los productos digitales generalmente no tienen devolucion una vez entregados, pero un ejecutivo puede revisar cada caso
- "Me aparece un candado en mi juego":
  **Para PS4:** Configuracion > Administracion de cuentas > Activar como tu PS4 principal
  **Para PS5:** Configuracion > Usuarios y cuentas > Otros > Compartir consola y juego offline > Activar
  **Para Xbox:** Configuracion > General > Personalizacion > Mi Xbox principal
  NOTA: Solo aplica para cuentas PRIMARIAS. Si es SECUNDARIA, necesita conexion a internet.

===== TONO Y ESTILO DE COMUNICACION =====
- Responde como una PERSONA REAL, no como un bot
- Imagina que eres un vendedor joven y buena onda chateando por WhatsApp
- Se directo, natural y calido
- Idioma: Espanol chileno informal. Usa "tu" (NUNCA "usted")
- Usa expresiones chilenas: "bacan", "dale", "po", "wena", "al tiro", "de una"
- Respuestas CORTAS. Maximo 2-3 oraciones normalmente
- NO abuses de emojis. Maximo 1 por mensaje
- NUNCA uses formato markdown para links

===== REGLAS CRITICAS =====
1. NUNCA inventes precios
2. NUNCA inventes productos
3. NUNCA inventes informacion sobre politicas o pagos
3b. NUNCA menciones PayPal, criptomonedas ni metodos no aceptados
4. Comprende el CONTEXTO completo de la conversacion
5. Si no sabes algo: "No tengo esa info ahora, pero un ejecutivo te puede ayudar"
6. SIEMPRE especifica si el producto es cuenta primaria o secundaria`;

  if (options?.isOfflineHours) {
    systemPrompt += `

===== MODO FUERA DE HORARIO =====
Actualmente estamos FUERA del horario de atencion de ejecutivos (${options.offlineHoursStart || 12}:00 a ${options.offlineHoursEnd || 21}:00 hrs, hora de Chile).
- NO sugieras "contactar un ejecutivo" porque NO hay ejecutivos disponibles ahora
- Sugiere crear un ticket de soporte: ${options.offlineTicketUrl || "https://cjmdigitales.zohodesk.com/portal/es/newticket"}
- Se especialmente util ya que eres la unica fuente de ayuda ahora`;
  } else {
    systemPrompt += `

===== EJECUTIVOS DISPONIBLES =====
Estamos dentro del horario de atencion. Los ejecutivos estan disponibles.
- La atencion del ejecutivo es SIEMPRE por este mismo chat
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
    systemPrompt += "\n\n===== BUSQUEDA DE PRODUCTOS =====\nNo se encontraron productos que coincidan. Sugiere usar el boton 'Buscar en catalogo' o revisar en cjmdigitales.cl.";
  }

  if (options?.knowledgeEntries && options.knowledgeEntries.length > 0) {
    systemPrompt += "\n\n===== CONOCIMIENTO APRENDIDO DE CONVERSACIONES ANTERIORES =====\n";
    options.knowledgeEntries.forEach((entry, index) => {
      systemPrompt += `${index + 1}. [${entry.category}] Pregunta: ${entry.question}\n   Respuesta: ${entry.answer}\n`;
    });
    systemPrompt += "\nUsa esta informacion como referencia, adaptala al contexto actual.";
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
      temperature: 0.7,
      max_completion_tokens: 500,
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
