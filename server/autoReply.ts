import { containsProfanity } from "./profanityFilter";
import { getAIReply } from "./aiReply";
import { storage } from "./storage";

type Intent =
  | "greeting"
  | "product_inquiry"
  | "purchase_intent"
  | "price_inquiry"
  | "support_issue"
  | "payment_question"
  | "delivery_question"
  | "trust_question"
  | "farewell"
  | "gratitude"
  | "followup"
  | "unknown";

type Platform = "ps" | "xbox" | "unknown";

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

interface CatalogLookup {
  searchByName: (query: string) => Promise<CatalogProduct[]>;
  getByPlatform: (platform: string) => Promise<CatalogProduct[]>;
  getByCategory: (category: string) => Promise<CatalogProduct[]>;
  getTotalCount: () => Promise<number>;
}

interface ConversationEntry {
  sender: string;
  content: string;
}

interface DetectedProduct {
  name: string;
  type: "game" | "subscription" | "card" | "generic";
  platform: Platform;
  version?: string;
  duration?: string | null;
  amount?: string | null;
}

interface ConversationState {
  intent: Intent;
  product: DetectedProduct | null;
  platform: Platform;
  previousProducts: DetectedProduct[];
  previousIntents: Intent[];
  usedResponses: Set<string>;
  unknownCount: number;
  genericCount: number;
  userMessageCount: number;
  lastTopicProduct: DetectedProduct | null;
}

function withButtons(text: string, buttons: Array<{label: string, value?: string, url?: string}>): string {
  return `${text}{{QUICK_REPLIES:${JSON.stringify(buttons)}}}`;
}

const GAME_PATTERNS: Array<{ patterns: RegExp[]; name: string; aliases: string[] }> = [
  {
    patterns: [/\bfc\s*\d+/i, /\bea\s*fc/i, /\bea\s*sports?\s*fc/i, /\bfifa\s*\d*/i],
    name: "EA Sports FC",
    aliases: ["fifa", "fc", "ea fc", "ea sports fc"],
  },
  {
    patterns: [/\bgta\s*\d*/i, /\bgrand\s*theft/i],
    name: "GTA",
    aliases: ["gta", "grand theft auto"],
  },
  {
    patterns: [/\bcod\b/i, /\bcall\s*of\s*duty/i, /\bwarzone/i, /\bmodern\s*warfare/i, /\bblack\s*ops/i],
    name: "Call of Duty",
    aliases: ["cod", "call of duty", "warzone"],
  },
  {
    patterns: [/\bspider\s*-?\s*man/i, /\bspiderman/i, /\bspider\b/i, /\bmiles\s*morales/i],
    name: "Marvel's Spider-Man",
    aliases: ["spiderman", "spider-man", "spider"],
  },
  {
    patterns: [/\bgod\s*of\s*war/i, /\bgow\b/i, /\bragnarok/i],
    name: "God of War",
    aliases: ["god of war", "gow", "ragnarok"],
  },
  {
    patterns: [/\bhogwarts/i, /\bharry\s*potter/i],
    name: "Hogwarts Legacy",
    aliases: ["hogwarts", "hogwarts legacy"],
  },
  {
    patterns: [/\bfortnite/i],
    name: "Fortnite",
    aliases: ["fortnite"],
  },
  {
    patterns: [/\bminecraft/i],
    name: "Minecraft",
    aliases: ["minecraft"],
  },
  {
    patterns: [/\bred\s*dead/i, /\brdr\s*\d*/i],
    name: "Red Dead Redemption",
    aliases: ["red dead", "rdr", "red dead redemption"],
  },
  {
    patterns: [/\belden\s*ring/i],
    name: "Elden Ring",
    aliases: ["elden ring"],
  },
  {
    patterns: [/\blast\s*of\s*us/i, /\btlou/i],
    name: "The Last of Us",
    aliases: ["last of us", "tlou"],
  },
  {
    patterns: [/\bhorizon/i, /\bforbidden\s*west/i],
    name: "Horizon",
    aliases: ["horizon", "forbidden west"],
  },
  {
    patterns: [/\bassassin/i, /\bassassins?\s*creed/i],
    name: "Assassin's Creed",
    aliases: ["assassins creed", "assassin"],
  },
  {
    patterns: [/\bresident\s*evil/i, /\bre\s*\d/i],
    name: "Resident Evil",
    aliases: ["resident evil"],
  },
  {
    patterns: [/\bmortal\s*kombat/i, /\bmk\s*\d+/i],
    name: "Mortal Kombat",
    aliases: ["mortal kombat"],
  },
  {
    patterns: [/\bnba\s*2k/i, /\bnba2k/i],
    name: "NBA 2K",
    aliases: ["nba 2k", "nba2k"],
  },
  {
    patterns: [/\bmadden/i],
    name: "Madden NFL",
    aliases: ["madden"],
  },
  {
    patterns: [/\bcyberpunk/i],
    name: "Cyberpunk 2077",
    aliases: ["cyberpunk"],
  },
  {
    patterns: [/\bdiablo/i],
    name: "Diablo",
    aliases: ["diablo"],
  },
  {
    patterns: [/\bstarfield/i],
    name: "Starfield",
    aliases: ["starfield"],
  },
  {
    patterns: [/\bhalo\b/i],
    name: "Halo",
    aliases: ["halo"],
  },
  {
    patterns: [/\bfinal\s*fantasy/i, /\bff\s*\d+/i],
    name: "Final Fantasy",
    aliases: ["final fantasy"],
  },
  {
    patterns: [/\bzelda/i, /\btears\s*of\s*the\s*kingdom/i],
    name: "The Legend of Zelda",
    aliases: ["zelda"],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function extractDuration(msg: string): string | null {
  if (/1\s*mes|\bun\s*mes\b|\bmensual\b/.test(msg)) return "1 mes";
  if (/3\s*mes(?:es)?|\btres\s*mes\b|\btrimestral\b/.test(msg)) return "3 meses";
  if (/12\s*mes(?:es)?|\bdoce\s*mes\b|\bun\s*a[nñ]o\b|\b1\s*a[nñ]o\b|\banual\b/.test(msg)) return "12 meses";
  return null;
}

export function extractMoneyAmount(msg: string): string | null {
  const match = msg.match(/\$?\s*(\d+)/);
  return match ? match[1] : null;
}

function detectPlatform(msg: string, url: string, title: string): Platform {
  const combined = `${msg} ${url} ${title}`;
  const isPS = /\bps[45]\b|\bplaystation\b|\bplay\s*station\b|\bsony\b|\bpsn\b|\bps\s*plus\b|\bpsplus\b|\bps\s*store\b/.test(combined);
  const isXbox = /\bxbox\b|\bmicrosoft\b|\bgame\s*pass\b|\bgamepass\b/.test(combined);
  if (isPS && !isXbox) return "ps";
  if (isXbox && !isPS) return "xbox";
  return "unknown";
}

function extractVersionNumber(msg: string, gameName: string): string | null {
  if (gameName === "EA Sports FC") {
    const match = msg.match(/\bfc\s*(\d+)/i) || msg.match(/\bfifa\s*(\d+)/i);
    return match ? match[1] : null;
  }
  if (gameName === "GTA") {
    const match = msg.match(/\bgta\s*(\d+)/i);
    return match ? match[1] : null;
  }
  const genericMatch = msg.match(new RegExp(gameName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\s*(\\d+)", "i"));
  return genericMatch ? genericMatch[1] : null;
}

function detectGame(msg: string): { name: string; version: string | null } | null {
  for (const game of GAME_PATTERNS) {
    for (const pattern of game.patterns) {
      if (pattern.test(msg)) {
        const version = extractVersionNumber(msg, game.name);
        return { name: game.name, version };
      }
    }
  }
  return null;
}

function detectSubscription(msg: string, platform: Platform): DetectedProduct | null {
  const duration = extractDuration(msg);

  if (/\bplus\s*essential\b|\bps\s*plus\s*essential\b|\bpsplus\s*essential\b/.test(msg) ||
      (/\bessential\b/.test(msg) && (/\bplus\b/.test(msg) || platform === "ps"))) {
    return { name: "PS Plus Essential", type: "subscription", platform: "ps", duration };
  }
  if (/\bplus\s*extra\b|\bps\s*plus\s*extra\b|\bpsplus\s*extra\b/.test(msg) ||
      (/\bextra\b/.test(msg) && (/\bplus\b/.test(msg) || platform === "ps"))) {
    return { name: "PS Plus Extra", type: "subscription", platform: "ps", duration };
  }
  if (/\bplus\s*premium\b|\bps\s*plus\s*premium\b|\bpsplus\s*premium\b|\bplus\s*deluxe\b/.test(msg) ||
      (/\bpremium\b/.test(msg) && (/\bplus\b/.test(msg) || platform === "ps"))) {
    return { name: "PS Plus Premium", type: "subscription", platform: "ps", duration };
  }
  if (/\bps\s*plus\b|\bpsplus\b|\bplaystation\s*plus\b/.test(msg) ||
      (/\bplus\b/.test(msg) && platform === "ps")) {
    return { name: "PS Plus", type: "subscription", platform: "ps", duration };
  }

  if (/\bgame\s*pass\s*ultimate\b|\bgamepass\s*ultimate\b/.test(msg)) {
    return { name: "Game Pass Ultimate", type: "subscription", platform: "xbox", duration };
  }
  if (/\bgame\s*pass\s*core\b|\bgamepass\s*core\b/.test(msg)) {
    return { name: "Game Pass Core", type: "subscription", platform: "xbox", duration };
  }
  if (/\bgame\s*pass\s*standard\b|\bgamepass\s*standard\b/.test(msg)) {
    return { name: "Game Pass Standard", type: "subscription", platform: "xbox", duration };
  }
  if (/\bgame\s*pass\b|\bgamepass\b|\bxbox\s*pass\b/.test(msg)) {
    return { name: "Game Pass", type: "subscription", platform: "xbox", duration };
  }
  if (/\bxbox\s*live\b|\blive\s*gold\b/.test(msg) || (/\bgold\b/.test(msg) && platform === "xbox")) {
    return { name: "Game Pass Core", type: "subscription", platform: "xbox", duration };
  }

  return null;
}

function detectCard(msg: string, platform: Platform): DetectedProduct | null {
  if (!/\btarjeta\b|\bgift\s*card\b|\bgiftcard\b|\bcodigo\b|\bsaldo\b|\brecarga\b|\bwallet\b/.test(msg)) {
    return null;
  }
  const duration = extractDuration(msg);
  const amount = extractMoneyAmount(msg);

  if (duration) {
    if (/\bpsn\b|\bplaystation\b|\bps\s*store\b/.test(msg) || platform === "ps") {
      return { name: "Suscripcion PlayStation", type: "subscription", platform: "ps", duration };
    }
    if (/\bxbox\b/.test(msg) || platform === "xbox") {
      return { name: "Suscripcion Xbox", type: "subscription", platform: "xbox", duration };
    }
    return { name: "Suscripcion", type: "subscription", platform: "unknown", duration };
  }

  if (/\bpsn\b|\bplaystation\b|\bps\s*store\b/.test(msg) || platform === "ps") {
    return { name: "Tarjeta PSN", type: "card", platform: "ps", amount };
  }
  if (/\bxbox\b/.test(msg) || platform === "xbox") {
    return { name: "Tarjeta Xbox", type: "card", platform: "xbox", amount };
  }
  return { name: "Tarjeta digital", type: "card", platform: "unknown", amount };
}

function detectPlatformFromMessage(msg: string): Platform {
  if (/\bps[45]\b|\bplaystation\b|\bplay\b|\bsony\b|\bpsn\b/.test(msg)) return "ps";
  if (/\bxbox\b|\bmicrosoft\b/.test(msg)) return "xbox";
  return "unknown";
}

function detectIntent(msg: string, history: ConversationEntry[], product: DetectedProduct | null): Intent {
  if (/\bhola\b|\bbuenas?\b|\bhey\b|\bhello\b|\bhi\b|\bbuen\s*dia\b|\bbuenos\s*dias\b/.test(msg) && history.filter(h => h.sender === "user").length <= 1) {
    return "greeting";
  }

  if (/\bcomprar\w*\b|\bquiero\b.*\b(comprar\w*|adquirir\w*|obtener\w*)\b|\bme\s*interesa\b|\blo\s*quiero\b|\bme\s*lo\s*llevo\b|\bproceder\b/.test(msg)) {
    return "purchase_intent";
  }

  const lastBotMsg = [...history].reverse().find(h => h.sender === "support");
  if (lastBotMsg && /te\s*gustaria\s*comprar|quieres\s*(que\s*te\s*ayude|proceder)|quieres\s*comprar|gustaria\s*proceder/i.test(lastBotMsg.content)) {
    if (/^\s*(si|sí|dale|ok|claro|bueno|va|vale|por\s*favor|porfa|afirmativo|obvio|de\s*una|hagale|listo)\s*$/i.test(msg) ||
        /\b(si|sí)\b.*\b(quiero|porfa|favor|dale)\b/i.test(msg)) {
      return "purchase_intent";
    }
  }

  if (/\bprecio\b|\bcosto\b|\bcuanto\b|\bcuánto\b|\bvale\b|\bcobran\b|\bbarato\b|\bcaro\b/.test(msg)) {
    return "price_inquiry";
  }

  if (/\bpago\b|\bpagar\b|\bmetodo\b|\btransferencia\b|\bpaypal\b|\bcripto\b|\bbitcoin\b|\befectivo\b|\btarjeta\s*de\s*credito\b|\bdebito\b|\bnequi\b|\bdaviplata\b/.test(msg)) {
    return "payment_question";
  }

  if (/\bentrega\b|\benvio\b|\brecibi\w*\b|\bcomo\s*llega\b|\bdemora\b|\btarda\b|\brapido\b|\binmediato\b|\bno\s*(?:me\s*)?(?:ha\s*)?llega\w*\b/.test(msg)) {
    return "delivery_question";
  }

  if (/\bgarantia\b|\bdevolucion\b|\breembolso\b|\bcambio\b|\bproblema\b|\bno\s*funciona\b|\berror\b|\bno\s*me\s*llego\b|\bno\s*sirve\b|\bayuda\b.*\b(compra|producto)\b/.test(msg)) {
    return "support_issue";
  }

  if (/\bseguro\b|\bconfiable\b|\bestafa\b|\breal\b|\blegitiimo\b|\blegitimo\b|\bfraude\b/.test(msg)) {
    return "trust_question";
  }

  if (/\bgracias\b|\bmuchas\s*gracias\b|\bgenial\b|\bperfecto\b|\bexcelente\b|\bbuenisimo\b|\bchevere\b|\bdale\b.*\bgracias\b/.test(msg)) {
    return "gratitude";
  }

  if (/\badios\b|\bbye\b|\bchao\b|\bhasta\s*luego\b|\bnos\s*vemos\b|\bhasta\s*pronto\b|\bme\s*voy\b/.test(msg)) {
    return "farewell";
  }

  if (product) {
    return "product_inquiry";
  }

  if (/\btienen\b|\bhay\b|\bdisponible\b|\bcatalogo\b|\bjuego\b|\bgame\b|\btitulo\b/.test(msg)) {
    return "product_inquiry";
  }

  if (/\bpromocion\b|\boferta\b|\bdescuento\b|\brebaja\b|\bsale\b/.test(msg)) {
    return "product_inquiry";
  }

  const userMsgs = history.filter(h => h.sender === "user");
  if (userMsgs.length > 1 && msg.length < 30) {
    return "followup";
  }

  return "unknown";
}

function buildConversationState(
  msg: string,
  history: ConversationEntry[],
  sessionData?: SessionData
): ConversationState {
  const url = normalize(sessionData?.pageUrl || "");
  const title = normalize(sessionData?.pageTitle || "");
  const platform = detectPlatform(msg, url, title);

  const game = detectGame(msg);
  const subscription = detectSubscription(msg, platform);
  const card = detectCard(msg, platform);

  let product: DetectedProduct | null = null;
  if (game) {
    const gamePlatform = detectPlatformFromMessage(msg) || platform;
    product = { name: game.name, type: "game", platform: gamePlatform, version: game.version || undefined };
  } else if (subscription) {
    product = subscription;
  } else if (card) {
    product = card;
  }

  if (!product && sessionData?.gameName) {
    const sessionGame = detectGame(normalize(sessionData.gameName));
    if (sessionGame) {
      product = { name: sessionGame.name, type: "game", platform, version: sessionGame.version || undefined };
    } else {
      product = { name: sessionData.gameName, type: "game", platform };
    }
  }

  const previousProducts: DetectedProduct[] = [];
  const previousIntents: Intent[] = [];
  const usedResponses = new Set<string>();
  let unknownCount = 0;
  let genericCount = 0;
  let userMessageCount = 0;
  let lastTopicProduct: DetectedProduct | null = null;

  for (const entry of history) {
    if (entry.sender === "user") {
      userMessageCount++;
      const entryMsg = normalize(entry.content);
      const entryGame = detectGame(entryMsg);
      const entryPlatform = detectPlatform(entryMsg, url, title);
      const entrySub = detectSubscription(entryMsg, entryPlatform);
      const entryCard = detectCard(entryMsg, entryPlatform);

      if (entryGame) {
        const ep = detectPlatformFromMessage(entryMsg) || entryPlatform;
        const p: DetectedProduct = { name: entryGame.name, type: "game", platform: ep, version: entryGame.version || undefined };
        previousProducts.push(p);
        lastTopicProduct = p;
      } else if (entrySub) {
        previousProducts.push(entrySub);
        lastTopicProduct = entrySub;
      } else if (entryCard) {
        previousProducts.push(entryCard);
        lastTopicProduct = entryCard;
      }

      const entryIntent = detectIntent(entryMsg, history.slice(0, history.indexOf(entry)), null);
      previousIntents.push(entryIntent);
      if (entryIntent === "unknown") unknownCount++;
    } else {
      const cleanContent = entry.content.replace(/\{\{QUICK_REPLIES:.*\}\}$/, "").trim();
      usedResponses.add(cleanContent);
      usedResponses.add(entry.content);
      if (cleanContent.includes("Estoy aqui para ayudarte con nuestros productos") ||
          cleanContent.includes("puedo ayudarte") && cleanContent.length < 100) {
        genericCount++;
      }
    }
  }

  if (!product && lastTopicProduct) {
    const intent = detectIntent(msg, history, null);
    if (intent === "price_inquiry" || intent === "purchase_intent" || intent === "followup" || intent === "delivery_question") {
      product = lastTopicProduct;
    }
  }

  const intent = detectIntent(msg, history, product);

  return {
    intent,
    product,
    platform,
    previousProducts,
    previousIntents,
    usedResponses,
    unknownCount,
    genericCount,
    userMessageCount,
    lastTopicProduct,
  };
}

function pickUnused(options: string[], used: Set<string>): string {
  for (const opt of options) {
    if (!used.has(opt)) return opt;
  }
  return options[options.length - 1] + " Si necesitas mas ayuda, haz clic en 'Contactar un Ejecutivo' para hablar con un agente.";
}

function formatPlatformName(p: Platform): string {
  if (p === "ps") return "PlayStation";
  if (p === "xbox") return "Xbox";
  return "";
}

function formatGameWithVersion(product: DetectedProduct): string {
  if (product.version) {
    return `${product.name} ${product.version}`;
  }
  return product.name;
}

function formatPlatformSuffix(product: DetectedProduct): string {
  if (product.platform === "ps") return " para PlayStation";
  if (product.platform === "xbox") return " para Xbox";
  return "";
}

function shouldEscalate(state: ConversationState): boolean {
  if (state.unknownCount >= 3) return true;
  if (state.genericCount >= 3) return true;
  if (state.userMessageCount >= 5 && state.unknownCount >= 2) return true;
  return false;
}

function truncateDescription(desc: string | null | undefined, maxLen: number = 300): string {
  if (!desc) return "";
  const trimmed = desc.trim();
  if (trimmed.length === 0) return "";
  const seemsTruncated = trimmed.length >= 497 || (!/[.!?]$/.test(trimmed) && trimmed.length > 100);
  if (trimmed.length <= maxLen) {
    return seemsTruncated ? trimmed + "..." : trimmed;
  }
  const sub = trimmed.substring(0, maxLen);
  const lastSentence = Math.max(sub.lastIndexOf(". "), sub.lastIndexOf("! "), sub.lastIndexOf("? "), sub.lastIndexOf(".\n"), sub.lastIndexOf("!\n"), sub.lastIndexOf("?\n"));
  if (lastSentence > maxLen * 0.4) {
    return sub.substring(0, lastSentence + 1) + "..";
  }
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.5) {
    return sub.substring(0, lastSpace) + "...";
  }
  return sub + "...";
}

function formatProductDetail(product: { name: string; price: string | null; availability: string; description: string | null }): string {
  const priceText = product.price ? `${product.price}` : "Consultar";
  let availEmoji = "✅";
  let availLabel = "Disponible";
  if (product.availability === "preorder") {
    availEmoji = "🔜";
    availLabel = "Pre-orden";
  } else if (product.availability !== "available") {
    availEmoji = "❌";
    availLabel = "No disponible";
  }
  const desc = truncateDescription(product.description);
  let text = `🎮 ${product.name}\n💰 Precio: ${priceText} | ${availEmoji} ${availLabel}`;
  if (desc) {
    text += `\n\n${desc}`;
  }
  return text;
}

const ESCALATION_RESPONSES = [
  "💬 Entiendo que es dificil explicar lo que buscas por chat. Si prefieres atencion personalizada, puedes hacer clic en 'Contactar un Ejecutivo' y un agente te atendera directamente. Tambien puedes escribirnos a cjmdigitales@gmail.com 📧",
  "💬 Parece que no estoy pudiendo ayudarte como necesitas. Te recomiendo hacer clic en 'Contactar un Ejecutivo' para que un agente real pueda asistirte de forma personalizada.",
  "💬 Para brindarte la mejor atencion, te sugiero contactar a uno de nuestros ejecutivos. Haz clic en 'Contactar un Ejecutivo' y recibiras ayuda directa por correo 📧",
];

const PERSISTENCE_NOTICE = "\n\n💡 Puedes salir y volver cuando quieras, tu conversacion no se pierde. Si un agente te responde mientras no estas conectado, la respuesta te estara esperando aqui.";

function getGreetingResponse(state: ConversationState, sessionData?: SessionData, catalogProduct?: CatalogProduct | null): string {
  const userName = sessionData?.userName;
  const nameGreeting = userName ? `, ${userName}` : "";
  const pageContext = sessionData?.pageTitle ? ` Veo que estas navegando en "${sessionData.pageTitle}".` : "";
  const problemType = sessionData?.problemType;

  const catalogName = catalogProduct?.name || null;
  const catalogPrice = catalogProduct?.price || null;

  if (problemType && problemType !== "otro") {
    const productName = catalogName || (state.product ? formatGameWithVersion(state.product) : null);
    const platSuffix = !catalogName && state.product ? formatPlatformSuffix(state.product) : "";

    if (problemType === "compra") {
      if (productName) {
        const priceInfo = catalogPrice ? ` 💰 Precio: ${catalogPrice}.` : "";
        const text = pickUnused([
          `👋 ¡Hola${nameGreeting}! 🛒 ¡Que emocion que quieras comprar ${productName}${platSuffix}!${priceInfo} ⚡ Tenemos entrega digital inmediata a tu correo 📧 ¿Te ayudo con la compra?`,
          `👋 ¡Hola${nameGreeting}! 🎮 ¡Excelente eleccion! ${productName}${platSuffix} esta disponible en nuestra tienda.${priceInfo} ⚡ Entrega instantanea por correo 📧 ¿Quieres proceder con la compra?`,
        ], state.usedResponses);
        const buttons: Array<{label: string, value?: string, url?: string}> = [];
        if (catalogProduct?.productUrl) {
          buttons.push({label: "Comprar ahora", url: catalogProduct.productUrl});
        }
        buttons.push({label: "Si, quiero comprarlo", value: "si quiero comprarlo"});
        buttons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
        return withButtons(text + PERSISTENCE_NOTICE, buttons);
      }
      const text = pickUnused([
        `👋 ¡Hola${nameGreeting}! 🛒 ¡Bienvenido a nuestra tienda! Estamos listos para ayudarte con tu compra.${pageContext} 🎮 ¿Que producto te interesa?`,
        `👋 ¡Hola${nameGreeting}! 💜 ¡Que bueno que nos visitas! Tenemos juegos y suscripciones digitales con entrega inmediata ⚡${pageContext} 🎮 ¿Que te gustaria comprar?`,
      ], state.usedResponses);
      return withButtons(text + PERSISTENCE_NOTICE, [
        {label: "Juegos PS5", value: "__qr:platform:ps5"},
        {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
        {label: "Suscripciones", value: "__qr:category:subscription"},
      ]);
    }

    if (problemType === "codigo_verificacion") {
      const text = pickUnused([
        `👋 ¡Hola${nameGreeting}! 🔑 Entiendo que necesitas un nuevo codigo de verificacion. No te preocupes, un ejecutivo te ayudara con eso directamente aqui en el chat. Por favor, no te desconectes ni cierres la ventana para que podamos atenderte. Recibiras una notificacion con sonido cada vez que haya una respuesta nueva.`,
        `👋 ¡Hola${nameGreeting}! 🔑 Veo que necesitas un codigo de verificacion nuevo. Nuestro equipo esta listo para ayudarte. Un agente te respondera directamente aqui en el chat. Te pedimos que no te salgas de esta conversacion para poder asistirte. Si no estas viendo el chat, escucharas un sonido de notificacion cuando recibas una respuesta.`,
      ], state.usedResponses);
      return withButtons(text + PERSISTENCE_NOTICE, [
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }

    if (problemType === "candado_juego") {
      const text = pickUnused([
        `👋 ¡Hola${nameGreeting}! 🔒 Lamento que te aparezca un candado en tu juego. No te preocupes, vamos a resolverlo. Un ejecutivo se pondra en contacto contigo desde este mismo chat para ayudarte. Por favor, no te desconectes ni cierres la ventana. Recibiras una notificacion con sonido cada vez que haya una respuesta nueva.`,
        `👋 ¡Hola${nameGreeting}! 🔒 Entiendo que tienes un problema con un candado en tu juego. Nuestro equipo esta listo para ayudarte. Un agente te respondera directamente aqui en el chat. Te pedimos que no te salgas de esta conversacion para poder asistirte. Si no estas viendo el chat, escucharas un sonido de notificacion cuando recibas una respuesta.`,
      ], state.usedResponses);
      return withButtons(text + PERSISTENCE_NOTICE, [
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }

    if (problemType === "estado_pedido") {
      const text = pickUnused([
        `👋 ¡Hola${nameGreeting}! 📦 Entiendo que quieres saber el estado de tu pedido. Recuerda que todos nuestros productos son digitales y la entrega es instantanea a tu correo electronico ⚡📧 Si no has recibido tu producto, quedate en este chat y un ejecutivo te ayudara directamente aqui. Recibiras un sonido de notificacion cuando haya una respuesta nueva.`,
        `👋 ¡Hola${nameGreeting}! 📦 Veo que quieres consultar el estado de tu pedido. Nuestros productos digitales se entregan al instante por email ⚡ Si hay algun inconveniente, no te desconectes de este chat, un ejecutivo revisara tu caso directamente aqui. Te notificaremos con sonido cuando recibas una respuesta.`,
      ], state.usedResponses);
      return withButtons(text + PERSISTENCE_NOTICE, [
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }

    if (problemType === "problema_plus") {
      const text = pickUnused([
        `👋 ¡Hola${nameGreeting}! 🎮 Lamento que estes teniendo problemas con tu Plus. No te preocupes, vamos a resolverlo. Un ejecutivo se pondra en contacto contigo desde este mismo chat. Por favor, no te desconectes ni cierres la ventana para que podamos atender tu problema. Recibiras una notificacion con sonido cada vez que haya una respuesta nueva.`,
        `👋 ¡Hola${nameGreeting}! 🎮 Entiendo que tienes un inconveniente con tu Plus. Nuestro equipo esta listo para ayudarte. Un agente te respondera directamente aqui en el chat. Te pedimos que no te salgas de esta conversacion para poder asistirte. Si no estas viendo el chat, escucharas un sonido de notificacion cuando recibas una respuesta.`,
      ], state.usedResponses);
      return withButtons(text + PERSISTENCE_NOTICE, [
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
  }

  if (state.product) {
    const productName = formatGameWithVersion(state.product);
    if (state.product.type === "game") {
      return `👋 ¡Hola${nameGreeting}! 🎮 Bienvenido a CJM Digitales.${pageContext} Veo que te interesa ${productName}. Tenemos juegos digitales disponibles para PS4, PS5, Xbox One y Xbox Series ⚡ ¿Te gustaria saber mas sobre ${productName} o buscas otro titulo?${PERSISTENCE_NOTICE}`;
    }
  }

  if (state.platform === "ps") {
    const text = pickUnused([
      `👋 ¡Hola${nameGreeting}! 🎮 Bienvenido a CJM Digitales.${pageContext} Tenemos un amplio catalogo para PlayStation 🕹️ ¿Que estas buscando?`,
      `👋 ¡Hola${nameGreeting}! 💜 Que gusto tenerte aqui.${pageContext} Somos tu tienda de juegos digitales para PlayStation 🎮 ¿En que te puedo ayudar?`,
    ], state.usedResponses);
    return withButtons(text + PERSISTENCE_NOTICE, [
      {label: "Juegos PS5", value: "__qr:platform:ps5"},
      {label: "PS Plus", value: "__qr:category:subscription"},
      {label: "Ver todo", value: "__qr:platform:ps5"},
    ]);
  }

  if (state.platform === "xbox") {
    const text = pickUnused([
      `👋 ¡Hola${nameGreeting}! 🎮 Bienvenido a CJM Digitales.${pageContext} Contamos con juegos y suscripciones para Xbox 🕹️ ¿En que te puedo ayudar?`,
      `👋 ¡Hola${nameGreeting}! 💜 Que bueno verte.${pageContext} Tenemos todo para Xbox: juegos digitales y Game Pass 🎮`,
    ], state.usedResponses);
    return withButtons(text + PERSISTENCE_NOTICE, [
      {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
      {label: "Game Pass", value: "__qr:category:subscription"},
      {label: "Ver todo", value: "__qr:platform:xbox_series"},
    ]);
  }

  const text = pickUnused([
    `👋 ¡Hola${nameGreeting}! 🎮 Bienvenido a CJM Digitales.${pageContext} Tenemos juegos y suscripciones para PlayStation y Xbox ⚡ ¿En que puedo ayudarte hoy?`,
    `👋 ¡Hola${nameGreeting}! 💜 Gracias por visitarnos.${pageContext} Somos tu tienda de juegos digitales con catalogo para PlayStation y Xbox 🕹️ ¿Que te gustaria saber?`,
  ], state.usedResponses);
  return withButtons(text + PERSISTENCE_NOTICE, [
    {label: "Juegos PS5", value: "__qr:platform:ps5"},
    {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
    {label: "Suscripciones", value: "__qr:category:subscription"},
  ]);
}

function getGameInquiryResponse(state: ConversationState, catalogProduct?: CatalogProduct | null): string {
  if (!state.product || state.product.type !== "game") {
    const platSuffix = state.platform === "ps" ? " para PS4 y PS5" : state.platform === "xbox" ? " para Xbox One y Xbox Series" : " para PS4, PS5, Xbox One y Xbox Series";
    const text = pickUnused([
      `🎮 Tenemos un amplio catalogo de juegos digitales${platSuffix}. ¿Buscas algun titulo en particular? Dime el nombre del juego y te doy toda la info 🕹️`,
      `🎮 ¡Claro! Contamos con muchos titulos${platSuffix}. ¿Cual juego te interesa? 🕹️`,
    ], state.usedResponses);
    return withButtons(text, [
      {label: "Juegos PS5", value: "__qr:platform:ps5"},
      {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
    ]);
  }

  const gameName = formatGameWithVersion(state.product);
  const platSuffix = formatPlatformSuffix(state.product);

  if (catalogProduct) {
    const displayName = catalogProduct.name;
    const priceInfo = catalogProduct.price ? ` Precio: ${catalogProduct.price}.` : "";

    if (catalogProduct.availability !== "available" && catalogProduct.availability !== "preorder") {
      const text = `🎮 ${displayName}${platSuffix}.${priceInfo}\n\n❌ Este producto no esta disponible actualmente. Para consultar disponibilidad o buscar una alternativa, te recomendamos contactar a uno de nuestros ejecutivos 💬`;
      return withButtons(text, [
        {label: "Contactar ejecutivo", value: "__qr:contact"},
        {label: "Buscar en catalogo", value: "__qr:browse"},
        {label: "Ver categorias", value: "__qr:back"},
      ]);
    }

    const availInfo = catalogProduct.availability === "available"
      ? " ✅ Disponible para entrega digital inmediata ⚡"
      : " 🔜 Disponible para pre-orden.";

    const responseText = pickUnused([
      `🎮 ¡${displayName}${platSuffix}!${priceInfo}${availInfo} ¿Te gustaria comprarlo?`,
      `🕹️ ¡Tenemos ${displayName}${platSuffix}!${priceInfo}${availInfo} ¿Quieres que te ayude con la compra?`,
    ], state.usedResponses);

    if (catalogProduct.productUrl && (catalogProduct.availability === "available" || catalogProduct.availability === "preorder")) {
      return withButtons(responseText, [
        {label: "Comprar ahora", url: catalogProduct.productUrl},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    return withButtons(responseText, [
      {label: "Contactar ejecutivo", value: "__qr:contact"},
    ]);
  }

  const text = pickUnused([
    `🎮 ¡${gameName}${platSuffix}! Es un excelente titulo 🔥 Tenemos juegos digitales con entrega inmediata por correo ⚡📧 ¿Te gustaria comprarlo o necesitas mas informacion?`,
    `🕹️ ¡Buena eleccion! ${gameName} es un juegazo 🔥 Lo manejamos en version digital${platSuffix} con entrega instantanea ⚡ ¿Quieres que te ayude con la compra?`,
    `🎮 ${gameName}${platSuffix}, entendido. Trabajamos con codigos digitales que se entregan al instante por email ⚡📧 ¿Te gustaria proceder con la compra?`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

function getSubscriptionResponse(state: ConversationState): string {
  if (!state.product || state.product.type !== "subscription") {
    return getProductInquiryGeneric(state);
  }

  const sub = state.product;

  if (sub.name === "PS Plus Essential") {
    if (sub.duration) {
      const text = `🎮 PS Plus Essential de ${sub.duration}: juego online, juegos mensuales gratis, descuentos en PS Store y almacenamiento en la nube. ⚡ Entrega digital inmediata 📧`;
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    const text = `🎮 PS Plus Essential es el plan base de PlayStation: juego online, juegos mensuales gratis y descuentos en PS Store. ¿De que duracion lo necesitas?`;
    return withButtons(text, [
      {label: "1 mes", value: "1 mes"},
      {label: "3 meses", value: "3 meses"},
      {label: "12 meses", value: "12 meses"},
    ]);
  }

  if (sub.name === "PS Plus Extra") {
    if (sub.duration) {
      const text = `🕹️ PS Plus Extra de ${sub.duration}: todo lo de Essential mas un catalogo de ~400 juegos de PS4 y PS5 para descargar 🔥 ⚡ Entrega digital inmediata 📧`;
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    const text = `🕹️ PS Plus Extra incluye todo lo de Essential mas acceso a un catalogo de ~400 juegos descargables 🔥 ¿Que duracion prefieres?`;
    return withButtons(text, [
      {label: "1 mes", value: "1 mes"},
      {label: "3 meses", value: "3 meses"},
      {label: "12 meses", value: "12 meses"},
    ]);
  }

  if (sub.name === "PS Plus Premium") {
    if (sub.duration) {
      const text = `⭐ PS Plus Premium de ${sub.duration}: todo lo de Extra mas streaming en la nube, juegos clasicos de PS1/PS2/PS3/PSP y pruebas de juegos 🔥 ⚡ Entrega digital inmediata 📧`;
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    const text = `⭐ PS Plus Premium es el plan mas completo: todo de Extra mas clasicos retro, streaming y demos anticipadas 🔥 ¿De cuantos meses lo necesitas?`;
    return withButtons(text, [
      {label: "1 mes", value: "1 mes"},
      {label: "3 meses", value: "3 meses"},
      {label: "12 meses", value: "12 meses"},
    ]);
  }

  if (sub.name === "PS Plus") {
    const text = `🎮 PS Plus viene en 3 niveles:\n\n🟢 Essential: juego online + juegos gratis\n🔵 Extra: + catalogo de ~400 juegos\n⭐ Premium: + clasicos + streaming\n\nCada uno en 1, 3 y 12 meses. ¿Cual nivel te interesa?`;
    return withButtons(text, [
      {label: "Essential", value: "PS Plus Essential"},
      {label: "Extra", value: "PS Plus Extra"},
      {label: "Premium", value: "PS Plus Premium"},
    ]);
  }

  if (sub.name === "Game Pass Ultimate") {
    if (sub.duration) {
      const text = `⭐ Game Pass Ultimate de ${sub.duration}: cientos de juegos en consola, PC y nube, juego online, EA Play y juegos de Xbox Studios day-one 🔥 ⚡ Entrega digital inmediata 📧`;
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    const text = `⭐ Xbox Game Pass Ultimate incluye juegos en consola + PC + nube, juego online, EA Play y juegos day-one de Microsoft 🔥 ¿De cuantos meses lo necesitas?`;
    return withButtons(text, [
      {label: "1 mes", value: "1 mes"},
      {label: "3 meses", value: "3 meses"},
      {label: "12 meses", value: "12 meses"},
    ]);
  }

  if (sub.name === "Game Pass Core") {
    const text = `🎮 Game Pass Core reemplaza a Xbox Live Gold: juego online y acceso a un catalogo selecto de juegos. Es lo minimo para jugar online en Xbox 🕹️`;
    return withButtons(text, [
      {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
      {label: "Contactar ejecutivo", value: "__qr:contact"},
    ]);
  }

  if (sub.name === "Game Pass") {
    const text = `🎮 Game Pass viene en 3 planes:\n\n🟢 Core: juego online\n🔵 Standard: catalogo de juegos\n⭐ Ultimate: todo incluido + PC + nube + EA Play\n\n¿Cual plan te interesa?`;
    return withButtons(text, [
      {label: "Core", value: "Game Pass Core"},
      {label: "Standard", value: "Game Pass Standard"},
      {label: "Ultimate", value: "Game Pass Ultimate"},
    ]);
  }

  return getProductInquiryGeneric(state);
}

function getCardResponse(state: ConversationState): string {
  if (!state.product || state.product.type !== "card") {
    return getProductInquiryGeneric(state);
  }

  const card = state.product;

  if (card.platform === "ps") {
    if (card.amount) {
      const text = `💳 Tarjeta PSN de $${card.amount}: agrega saldo a tu cuenta PlayStation para comprar juegos, DLCs y contenido digital. ⚡ Entrega digital inmediata por correo 📧`;
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    const text = `💳 Tenemos tarjetas de saldo PSN en varias denominaciones para comprar en PS Store. ¿De cuanto saldo necesitas?`;
    return withButtons(text, [
      {label: "Contactar ejecutivo", value: "__qr:contact"},
      {label: "Ver otros productos", value: "__qr:back"},
    ]);
  }

  if (card.platform === "xbox") {
    if (card.amount) {
      const text = `💳 Tarjeta Xbox de $${card.amount}: agrega saldo a tu cuenta Microsoft para comprar juegos y contenido. ⚡ Entrega digital inmediata 📧`;
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }
    const text = `💳 Tenemos tarjetas de saldo Xbox en varias denominaciones. ¿Que monto necesitas?`;
    return withButtons(text, [
      {label: "Contactar ejecutivo", value: "__qr:contact"},
      {label: "Ver otros productos", value: "__qr:back"},
    ]);
  }

  const text = `💳 Manejamos tarjetas de saldo para PlayStation (PSN) y Xbox (Microsoft Store). ¿Cual plataforma necesitas?`;
  return withButtons(text, [
    {label: "Tarjeta PSN", value: "quiero tarjeta PSN"},
    {label: "Tarjeta Xbox", value: "quiero tarjeta Xbox"},
  ]);
}

function getProductInquiryGeneric(state: ConversationState): string {
  if (/\bpromocion\b|\boferta\b|\bdescuento\b|\brebaja\b|\bsale\b/.test(state.intent)) {
    const text = pickUnused([
      `🔥 ¡Siempre tenemos ofertas disponibles! ¿Te interesa alguna plataforma en particular? 🎮`,
      `🔥 Tenemos descuentos en varios titulos. ¿Para que plataforma buscas ofertas? 🕹️`,
    ], state.usedResponses);
    return withButtons(text, [
      {label: "Juegos PS5", value: "__qr:platform:ps5"},
      {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
      {label: "Suscripciones", value: "__qr:category:subscription"},
    ]);
  }

  const platSuffix = state.platform === "ps" ? " para PS4 y PS5" : state.platform === "xbox" ? " para Xbox One y Xbox Series" : " para PS4, PS5, Xbox One y Xbox Series";
  const text = pickUnused([
    `🎮 Tenemos un amplio catalogo de juegos digitales${platSuffix}, ademas de suscripciones. ¿Que producto te interesa? 🕹️`,
    `🎮 Contamos con juegos y suscripciones${platSuffix}. Si me dices que buscas, te doy toda la info 🕹️`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Juegos PS5", value: "__qr:platform:ps5"},
    {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
    {label: "Suscripciones", value: "__qr:category:subscription"},
  ]);
}

function getPurchaseResponse(state: ConversationState, catalogProduct?: CatalogProduct | null, purchaseStage?: number): string {
  const product = state.product || state.lastTopicProduct;

  if (product) {
    const productName = product.type === "game" ? formatGameWithVersion(product) : product.name;
    const platSuffix = formatPlatformSuffix(product);

    if (catalogProduct) {
      const displayName = catalogProduct.name;
      const priceInfo = catalogProduct.price ? ` tiene un precio de ${catalogProduct.price}` : "";

      if ((purchaseStage || 0) >= 2) {
        if (catalogProduct.productUrl) {
          const text = `🛒 ¡Aqui tienes el link directo para comprar ${displayName}! ⚡ La entrega es digital e inmediata a tu correo 📧`;
          return withButtons(text, [
            {label: "Ir a comprar", url: catalogProduct.productUrl},
          ]);
        }
        return `🛒 Para completar la compra de ${displayName}, haz clic en 'Contactar un Ejecutivo' y un agente te guiara con el pago. ⚡ Entrega digital inmediata 📧`;
      }

      const responseText = pickUnused([
        `🛒 ¡Perfecto! ${displayName}${platSuffix}${priceInfo}. ⚡ Entrega digital inmediata a tu correo 📧`,
        `🛒 ¡Genial! ${displayName}${platSuffix}${priceInfo}. ⚡ Entrega digital inmediata por email 📧`,
      ], state.usedResponses);

      if (catalogProduct.productUrl) {
        return withButtons(responseText, [
          {label: "Ir a comprar", url: catalogProduct.productUrl},
        ]);
      }
      return responseText;
    }

    const text = pickUnused([
      `🛒 ¡Perfecto! Para comprar ${productName}${platSuffix}, realizas el pago y recibiras tu codigo digital por correo de forma inmediata ⚡📧 ¿Te gustaria saber los metodos de pago?`,
      `🛒 ¡Genial que quieras ${productName}${platSuffix}! La entrega es digital e instantanea a tu email ⚡ Contacta a un ejecutivo para completar la compra 💬`,
    ], state.usedResponses);
    return withButtons(text, [
      {label: "Contactar ejecutivo", value: "__qr:contact"},
      {label: "Ver otros productos", value: "__qr:back"},
    ]);
  }

  const text = pickUnused([
    `🛒 ¡Genial que quieras comprar! ¿Me puedes indicar que producto te interesa? 🎮`,
    `🛒 ¡Claro! ¿Que producto buscas? ¿Es un juego o una suscripcion? 🕹️`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Juegos PS5", value: "__qr:platform:ps5"},
    {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
    {label: "Suscripciones", value: "__qr:category:subscription"},
  ]);
}

function getPriceResponse(state: ConversationState, catalogProduct?: CatalogProduct | null): string {
  const product = state.product || state.lastTopicProduct;

  if (product) {
    const productName = product.type === "game" ? formatGameWithVersion(product) : product.name;
    const platSuffix = formatPlatformSuffix(product);

    if (catalogProduct && catalogProduct.price) {
      const displayName = catalogProduct.name;
      const responseText = pickUnused([
        `💰 El precio de ${displayName}${platSuffix} es ${catalogProduct.price}. ⚡ Entrega digital inmediata. ¿Te gustaria comprarlo?`,
        `💰 ${displayName}${platSuffix} tiene un precio de ${catalogProduct.price}. ¿Quieres proceder con la compra? 🛒`,
      ], state.usedResponses);

      const buttons: Array<{label: string, value?: string, url?: string}> = [];
      if (catalogProduct.productUrl) buttons.push({label: "Comprar", url: catalogProduct.productUrl});
      buttons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
      return withButtons(responseText, buttons);
    }

    const text = pickUnused([
      `💰 Para el precio exacto de ${productName}${platSuffix}, te recomiendo contactar a un ejecutivo. Los precios pueden variar y un agente te dara la info actualizada 💬`,
      `💰 El precio de ${productName}${platSuffix} puede variar. Contacta a un ejecutivo para el precio actual y ofertas disponibles 💬`,
    ], state.usedResponses);
    return withButtons(text, [
      {label: "Contactar ejecutivo", value: "__qr:contact"},
    ]);
  }

  if (state.platform === "ps") {
    const text = `💰 Los precios de PlayStation varian segun el titulo. ¿Me dices que producto te interesa para darte la info exacta? 🎮`;
    return withButtons(text, [
      {label: "Juegos PS5", value: "__qr:platform:ps5"},
      {label: "PS Plus", value: "__qr:category:subscription"},
    ]);
  }

  if (state.platform === "xbox") {
    const text = `💰 Los precios de Xbox dependen del producto. ¿Buscas un juego o Game Pass? 🎮`;
    return withButtons(text, [
      {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
      {label: "Game Pass", value: "__qr:category:subscription"},
    ]);
  }

  const text = `💰 Los precios dependen del producto y plataforma. ¿Que estas buscando? 🎮`;
  return withButtons(text, [
    {label: "Juegos PS5", value: "__qr:platform:ps5"},
    {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
    {label: "Suscripciones", value: "__qr:category:subscription"},
  ]);
}

function getPaymentResponse(state: ConversationState): string {
  const text = pickUnused([
    `💳 Aceptamos varios metodos de pago. Para conocer las opciones disponibles y proceder con tu compra, te recomiendo contactar a un ejecutivo 💬`,
    `💳 Los metodos de pago los gestiona nuestro equipo. Contacta a un ejecutivo para que te den todas las opciones disponibles 💬`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

function getDeliveryResponse(state: ConversationState): string {
  const text = pickUnused([
    `⚡ La entrega de todos nuestros productos es digital e inmediata. Recibiras tu codigo por correo electronico al completar la compra, en cuestion de minutos 📧`,
    `⚡ ¡Todo es digital! Al completar la compra, recibiras tu codigo por email en minutos 📧 Sin envio fisico, todo es instantaneo.`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Ver productos", value: "__qr:back"},
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

function getSupportResponse(state: ConversationState, sessionData?: SessionData): string {
  const problemContext = sessionData?.problemType ? ` Veo que tu consulta es sobre: ${sessionData.problemType}.` : "";

  const text = pickUnused([
    `🔧 Lamentamos si tienes algun inconveniente.${problemContext} Todos nuestros productos tienen garantia ✅ Te recomiendo contactar a un ejecutivo para asistencia personalizada 💬`,
    `🔧 Sentimos los problemas.${problemContext} Queremos resolverlo lo antes posible. Contacta a un ejecutivo para que revise tu caso 💬`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

function getTrustResponse(state: ConversationState): string {
  const text = pickUnused([
    `🤝 ¡Somos una tienda 100% confiable! ✅ Todos nuestros productos son codigos digitales oficiales. Tenemos una larga trayectoria y miles de clientes satisfechos ⭐`,
    `🤝 Tu seguridad es nuestra prioridad. ✅ Vendemos codigos digitales oficiales y garantizamos cada producto. Puedes verificar nuestra reputacion ⭐`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Ver productos", value: "__qr:back"},
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

function getGratitudeResponse(state: ConversationState): string {
  return pickUnused([
    `🙏 ¡Con gusto! Me alegra haberte ayudado 💜 Si deseas, puedes finalizar el chat y dejarnos tu valoracion usando el boton al final del chat ⭐`,
    `🙏 ¡De nada! Fue un placer ayudarte 💜 Recuerda que puedes valorar tu experiencia con el boton "Finalizar y Valorar" que aparece abajo ⭐`,
  ], state.usedResponses);
}

function getFarewellResponse(state: ConversationState): string {
  return pickUnused([
    `👋 ¡Hasta pronto! Si lo deseas, puedes calificarnos usando el boton "Finalizar y Valorar" al final del chat ⭐ ¡Que tengas un excelente dia! 💜`,
    `👋 ¡Chao! Nos encantaria saber que te parecio nuestra atencion. Usa el boton "Finalizar y Valorar" abajo para dejarnos tu opinion ⭐ ¡Hasta la proxima! 💜`,
  ], state.usedResponses);
}

function getFollowupResponse(state: ConversationState, msg: string): string {
  if (state.lastTopicProduct) {
    const productName = state.lastTopicProduct.type === "game"
      ? formatGameWithVersion(state.lastTopicProduct)
      : state.lastTopicProduct.name;
    const platSuffix = formatPlatformSuffix(state.lastTopicProduct);

    if (/\bsi\b|\bdale\b|\bok\b|\bclaro\b|\bbueno\b|\bva\b|\bvale\b/.test(msg)) {
      const text = pickUnused([
        `🛒 ¡Perfecto! Para continuar con ${productName}${platSuffix}, contacta a un ejecutivo para que te guie con el proceso de compra 💬`,
        `🛒 ¡Genial! Para completar la compra de ${productName}${platSuffix}, contacta a un ejecutivo 💬`,
      ], state.usedResponses);
      return withButtons(text, [
        {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
        {label: "Ver otros productos", value: "__qr:back"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }

    if (/\bno\b|\bgracias\b.*\bno\b|\bno\s*gracias\b|\bnah\b/.test(msg)) {
      const text = pickUnused([
        `🎮 Entendido. ¿Hay algo mas en lo que pueda ayudarte?`,
        `🎮 Sin problema. ¿Te gustaria ver otro producto? 🕹️`,
      ], state.usedResponses);
      return withButtons(text, [
        {label: "Ver otros productos", value: "__qr:back"},
        {label: "Contactar ejecutivo", value: "__qr:contact"},
      ]);
    }

    const text = pickUnused([
      `🎮 Sobre ${productName}${platSuffix}, ¿en que mas puedo ayudarte?`,
      `🎮 Siguiendo con ${productName}${platSuffix}, ¿tienes alguna otra duda?`,
    ], state.usedResponses);
    return withButtons(text, [
      {label: "Si, quiero comprarlo", value: "si quiero comprarlo"},
      {label: "Ver otros productos", value: "__qr:back"},
      {label: "Contactar ejecutivo", value: "__qr:contact"},
    ]);
  }

  const text = pickUnused([
    `🎯 ¿Hay algo especifico en lo que pueda ayudarte? 🎮`,
    `🎯 ¿En que mas te puedo ayudar? Dime que producto te interesa 🕹️`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Ver juegos", value: "__qr:category:game"},
    {label: "Suscripciones", value: "__qr:category:subscription"},
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

function getUnknownResponse(state: ConversationState): string {
  if (shouldEscalate(state)) {
    return pickUnused(ESCALATION_RESPONSES, state.usedResponses);
  }

  const text = pickUnused([
    `🎯 Gracias por tu mensaje. Estoy aqui para ayudarte con juegos digitales y suscripciones 🎮 ¿Que te gustaria saber?`,
    `🎯 No estoy seguro de entender tu consulta. ¿Puedes decirme si buscas un juego o una suscripcion? 🕹️`,
    `🎯 Disculpa, ¿me puedes dar mas detalles? Vendemos juegos digitales, PS Plus y Game Pass 🎮`,
  ], state.usedResponses);
  return withButtons(text, [
    {label: "Ver juegos", value: "__qr:category:game"},
    {label: "Suscripciones", value: "__qr:category:subscription"},
    {label: "Contactar ejecutivo", value: "__qr:contact"},
  ]);
}

async function getAIResponse(
  userMessage: string,
  conversationHistory: ConversationEntry[],
  sessionData?: SessionData,
  catalogProducts?: CatalogProduct[]
): Promise<string> {
  try {
    const aiResponse = await getAIReply(
      userMessage,
      conversationHistory,
      sessionData ? {
        problemType: sessionData.problemType,
        gameName: sessionData.gameName,
        pageTitle: sessionData.pageTitle,
        pageUrl: sessionData.pageUrl,
        userName: sessionData.userName,
        wpProductName: sessionData.wpProductName,
        wpProductPrice: sessionData.wpProductPrice,
        wpProductUrl: sessionData.wpProductUrl,
      } : undefined,
      catalogProducts
    );
    return withButtons(aiResponse, [
      {label: "Ver juegos", value: "__qr:category:game"},
      {label: "Suscripciones", value: "__qr:category:subscription"},
      {label: "Contactar ejecutivo", value: "__qr:contact"},
    ]);
  } catch (err) {
    return getUnknownResponse({
      intent: "unknown",
      product: null,
      platform: "unknown",
      previousProducts: [],
      previousIntents: [],
      usedResponses: new Set(),
      unknownCount: 0,
      genericCount: 0,
      userMessageCount: 0,
      lastTopicProduct: null,
    });
  }
}

function getDurationResponse(state: ConversationState, msg: string): string | null {
  const duration = extractDuration(msg);
  if (!duration) return null;

  if (!/\b(1|un|3|tres|12|doce)\s*mes/.test(msg) && !/\bmensual\b|\btrimestral\b|\banual\b/.test(msg)) {
    return null;
  }

  if (state.product && state.product.type === "subscription") {
    state.product.duration = duration;
    return getSubscriptionResponse(state);
  }

  if (state.platform === "ps") {
    const text = `🎮 Tenemos suscripciones de ${duration} para PS Plus. ¿Cual nivel te interesa?`;
    return withButtons(text, [
      {label: "Essential", value: "PS Plus Essential"},
      {label: "Extra", value: "PS Plus Extra"},
      {label: "Premium", value: "PS Plus Premium"},
    ]);
  }

  if (state.platform === "xbox") {
    const text = `🎮 Tenemos suscripciones de ${duration} para Xbox Game Pass. ¿Cual plan te interesa?`;
    return withButtons(text, [
      {label: "Core", value: "Game Pass Core"},
      {label: "Standard", value: "Game Pass Standard"},
      {label: "Ultimate", value: "Game Pass Ultimate"},
    ]);
  }

  const text = `🎮 Tenemos suscripciones de ${duration} para PS Plus y Game Pass. ¿Cual plataforma prefieres?`;
  return withButtons(text, [
    {label: "PS Plus", value: "PS Plus"},
    {label: "Game Pass", value: "Game Pass"},
  ]);
}

function detectPurchaseStage(conversationHistory: ConversationEntry[]): number {
  let hasShownProductInfo = false;
  let hasShownPurchaseLink = false;

  for (const entry of conversationHistory) {
    if (entry.sender === "support") {
      const content = entry.content.toLowerCase();
      if (content.includes("precio:") || content.includes("precio de") || content.includes("tiene un precio") || content.includes("puedes verlo aqui") || content.includes("entrega digital inmediata")) {
        hasShownProductInfo = true;
      }
      if (content.includes("puedes comprarlo directamente") || content.includes("comprarlo aqui") || content.includes("link de compra") || content.includes("comprar ahora") || content.includes("ir a comprar")) {
        hasShownPurchaseLink = true;
      }
    }
  }

  if (hasShownPurchaseLink) return 3;
  if (hasShownProductInfo) return 2;
  return 0;
}

function extractProductNameFromHistory(history: ConversationEntry[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.sender !== "support") continue;
    const content = entry.content;

    const nameMatch = content.match(/^(.+?)\s*\|\s*Precio:/);
    if (nameMatch) return nameMatch[1].trim();

    const comprarMatch = content.match(/comprar\s+(.+?)(?:\s*[!.]|\s+La\s+entrega)/i);
    if (comprarMatch) return comprarMatch[1].trim();

    const tieneMatch = content.match(/!\s+(.+?)\s+tiene\s+un\s+precio/);
    if (tieneMatch) return tieneMatch[1].trim();

    const precioDeMatch = content.match(/(?:El precio de|precio de)\s+(.+?)\s+es\s/i);
    if (precioDeMatch) return precioDeMatch[1].trim();

    const perfectoMatch = content.match(/(?:Perfecto|Genial)[!]?\s+(.+?)(?:\s+tiene\s|\s*[|.]|\s+Precio)/);
    if (perfectoMatch) return perfectoMatch[1].trim();

    const recomMatch = content.match(/Te recomiendo este producto:\s*(.+?)\.\s*Precio:/);
    if (recomMatch) return recomMatch[1].trim();
  }
  return null;
}

async function lookupCatalogProduct(
  state: ConversationState,
  sessionData: SessionData | undefined,
  catalogLookup?: CatalogLookup,
  conversationHistory?: ConversationEntry[]
): Promise<CatalogProduct | null> {
  if (!catalogLookup) return null;

  const queries: string[] = [];

  if (conversationHistory && conversationHistory.length > 0) {
    const mentionedProduct = extractProductNameFromHistory(conversationHistory);
    if (mentionedProduct) {
      queries.unshift(mentionedProduct);
    }
  }

  if (sessionData?.gameName) {
    queries.push(sessionData.gameName);
  }

  if (sessionData?.wpProductName) {
    queries.unshift(sessionData.wpProductName);
  }

  if (state.product) {
    queries.push(state.product.name);
    if (state.product.type === "game" && state.product.version) {
      queries.push(`${state.product.name} ${state.product.version}`);
    }
  }

  if (state.lastTopicProduct) {
    queries.push(state.lastTopicProduct.name);
  }

  const seen = new Set<string>();
  for (const query of queries) {
    const key = query.toLowerCase().trim();
    if (seen.has(key) || key.length < 2) continue;
    seen.add(key);
    try {
      const results = await catalogLookup.searchByName(query);
      if (results.length > 0) return results[0];
    } catch {}
  }

  return null;
}

export async function getSmartAutoReply(
  userMessage: string,
  conversationHistory: Array<{ sender: string; content: string }>,
  sessionData?: SessionData,
  catalogLookup?: CatalogLookup
): Promise<string> {
  const msg = normalize(userMessage);

  if (msg === "__qr:rate") {
    return "{{SHOW_RATING}}";
  }

  if (msg === "__qr:farewell_skip") {
    return "👋 ¡Hasta pronto! Si necesitas algo mas, no dudes en volver a escribirnos. ¡Que tengas un excelente dia! 💜";
  }

  if (msg.startsWith("__qr:") && catalogLookup) {
    if (msg.startsWith("__qr:platform:")) {
      const platform = msg.replace("__qr:platform:", "");
      const products = await catalogLookup.getByPlatform(platform);
      if (products.length === 0) {
        const text = "🎮 No tenemos productos disponibles para esa plataforma en este momento.";
        return withButtons(text, [
          {label: "Juegos PS5", value: "__qr:platform:ps5"},
          {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
          {label: "Suscripciones", value: "__qr:category:subscription"},
        ]);
      }
      const productButtons = products.slice(0, 6).map(p => ({
        label: `${p.name} - ${p.price || "Consultar precio"}`,
        value: `__qr:product:${p.name}`
      }));
      productButtons.push({label: "Buscar otro producto", value: "__qr:back"});
      const platformName = platform.includes("ps") ? "PlayStation" : "Xbox";
      const totalCount = await catalogLookup.getTotalCount();
      const text = `📋 Catalogo ${platformName} 🎮\n\nContamos con ${products.length} productos disponibles para ${platformName}.\n\nA continuacion te mostramos algunos de nuestros titulos destacados 🔥\n\n🎯 ¿Buscas algo en especifico? Contamos con mas de ${totalCount} productos en nuestra tienda. Escribe el nombre del juego que te interesa para encontrarlo rapidamente.`;
      return withButtons(text, productButtons);
    }

    if (msg.startsWith("__qr:category:")) {
      const category = msg.replace("__qr:category:", "");
      const products = await catalogLookup.getByCategory(category);
      if (products.length === 0) {
        const text = "🎮 No tenemos productos disponibles en esa categoria en este momento.";
        return withButtons(text, [
          {label: "Juegos PS5", value: "__qr:platform:ps5"},
          {label: "Juegos Xbox", value: "__qr:platform:xbox_series"},
          {label: "Contactar ejecutivo", value: "__qr:contact"},
        ]);
      }
      const productButtons = products.slice(0, 6).map(p => ({
        label: `${p.name} - ${p.price || "Consultar precio"}`,
        value: `__qr:product:${p.name}`
      }));
      const categoryNames: Record<string, string> = {
        game: "Juegos",
        subscription: "Suscripciones",
        card: "Tarjetas de saldo",
        bundle: "Bundles",
      };
      const categoryName = categoryNames[category] || category;
      productButtons.push({label: "Buscar otro producto", value: "__qr:back"});
      const totalCount = await catalogLookup.getTotalCount();
      const text = `📋 Catalogo de ${categoryName} 🎮\n\nContamos con ${products.length} productos disponibles en esta categoria.\n\nA continuacion te mostramos algunas opciones destacadas 🔥\n\n🎯 ¿Buscas algo en especifico? Contamos con mas de ${totalCount} productos en nuestra tienda. Escribe el nombre del producto que te interesa para encontrarlo rapidamente.`;
      return withButtons(text, productButtons);
    }

    if (msg.startsWith("__qr:product:")) {
      const productName = msg.replace("__qr:product:", "");
      const results = await catalogLookup.searchByName(productName);
      if (results.length > 0) {
        const p = results[0];

        if (p.availability !== "available" && p.availability !== "preorder") {
          const detail = formatProductDetail(p);
          const text = `${detail}\n\n❌ Este producto no esta disponible actualmente. Para consultar disponibilidad o buscar una alternativa, contacta a uno de nuestros ejecutivos 💬`;
          return withButtons(text, [
            {label: "Contactar ejecutivo", value: "__qr:contact"},
            {label: "Buscar en catalogo", value: "__qr:browse"},
            {label: "Ver categorias", value: "__qr:back"},
          ]);
        }

        const detail = formatProductDetail(p);
        const text = p.description ? detail : `${detail}\n\n⚡ Entrega digital inmediata 📧`;

        const buttons: Array<{label: string, value?: string, url?: string}> = [];
        if (p.productUrl) {
          buttons.push({label: "Comprar ahora", url: p.productUrl});
        }
        buttons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
        buttons.push({label: "Ver mas productos", value: "__qr:back"});

        return withButtons(text, buttons);
      }
      return withButtons(
        "🎯 No encontre ese producto en nuestro catalogo. Puedes buscar directamente en nuestro catalogo completo o darme mas detalles del producto que buscas.",
        [
          {label: "Buscar en catalogo", value: "__qr:browse"},
          {label: "Ver categorias", value: "__qr:back"},
          {label: "Contactar ejecutivo", value: "__qr:contact"},
        ]
      );
    }

    if (msg === "__qr:contact") {
      return withButtons(
        "💬 Para hablar con un agente, haz clic en el boton 'Contactar un Ejecutivo' que aparece abajo del chat. Un ejecutivo se pondra en contacto contigo por correo 📧",
        [
          {label: "Ver productos", value: "__qr:back"},
        ]
      );
    }

    if (msg === "__qr:back") {
      const text = `📋 ¿Que categoria te gustaria explorar? 🎮\n\nContamos con un amplio catalogo de juegos digitales, suscripciones y mas para PlayStation y Xbox.`;
      return withButtons(text, [
        {label: "Juegos PS5", value: "__qr:platform:ps5"},
        {label: "Juegos PS4", value: "__qr:platform:ps4"},
        {label: "Juegos Xbox Series", value: "__qr:platform:xbox_series"},
        {label: "Juegos Xbox One", value: "__qr:platform:xbox_one"},
        {label: "Suscripciones", value: "__qr:category:subscription"},
        {label: "Bundles", value: "__qr:category:bundle"},
      ]);
    }
  }

  const profanityResult = containsProfanity(msg);
  if (profanityResult.hasProfanity) {
    return "Por favor, mantengamos una conversacion respetuosa. Estoy aqui para ayudarte con tus consultas sobre nuestros productos y servicios. ¿En que puedo asistirte?";
  }

  const state = buildConversationState(msg, conversationHistory, sessionData);

  if (shouldEscalate(state) && state.intent === "unknown") {
    return pickUnused(ESCALATION_RESPONSES, state.usedResponses);
  }

  if (state.intent !== "greeting" && state.intent !== "farewell" && state.intent !== "gratitude") {
    const durationResponse = getDurationResponse(state, msg);
    if (durationResponse && state.intent !== "product_inquiry") {
      return durationResponse;
    }
  }

  if (catalogLookup && !msg.startsWith("__qr:") && state.intent !== "greeting" && state.intent !== "farewell" && state.intent !== "gratitude" && state.intent !== "payment_question" && state.intent !== "delivery_question" && state.intent !== "support_issue" && state.intent !== "trust_question") {
    const categoryKeywords: Record<string, string> = {
      "suscripcion": "subscription", "suscripciones": "subscription", "subscripcion": "subscription",
      "plus": "subscription", "ps plus": "subscription", "game pass": "subscription", "gamepass": "subscription",
      "membresia": "subscription", "membresias": "subscription",
      "tarjeta": "card", "tarjetas": "card", "gift card": "card", "giftcard": "card",
      "saldo": "card", "recarga": "card", "recargas": "card", "codigo": "card", "codigos": "card",
      "wallet": "card",
    };

    let matchedCategory: string | null = null;
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (msg.includes(keyword)) {
        matchedCategory = category;
        break;
      }
    }

    if (matchedCategory) {
      const categoryProducts = await catalogLookup.getByCategory(matchedCategory);
      if (categoryProducts.length > 0) {
        const categoryNames: Record<string, string> = {
          subscription: "Suscripciones",
          card: "Tarjetas de saldo",
        };
        const productButtons = categoryProducts.slice(0, 8).map(p => ({
          label: `${p.name} - ${p.price || "Consultar"}`,
          value: `__qr:product:${p.name}`
        }));
        productButtons.push({label: "Buscar otro producto", value: "__qr:back"});
        productButtons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
        const totalCount = await catalogLookup.getTotalCount();
        const catDisplayName = categoryNames[matchedCategory] || matchedCategory;
        const text = `📋 Catalogo de ${catDisplayName} 🎮\n\nContamos con ${categoryProducts.length} productos disponibles en esta categoria.\n\nA continuacion te mostramos algunas opciones destacadas 🔥\n\n🎯 ¿Buscas algo en especifico? Contamos con mas de ${totalCount} productos en nuestra tienda. Escribe el nombre del producto que te interesa para encontrarlo rapidamente.`;
        return withButtons(text, productButtons);
      }
    }

    const isPurchaseConfirmation = state.intent === "purchase_intent" && /^\s*(si|sí)?\s*(quiero|dale|ok|claro|bueno|va|vale|por\s*favor|porfa|listo|de\s*una|obvio|afirmativo)\s*(comprar\w*|adquirir\w*|obtener\w*|llevar\w*|proceder)?\s*$/i.test(msg);

    const aiEnabledSetting = await storage.getSetting("ai_enabled");
    const aiAvailable = !!process.env.OPENAI_API_KEY && aiEnabledSetting !== "false";
    const isProductQuery = msg.length >= 3 && !isPurchaseConfirmation && (
      state.intent === "product_inquiry" ||
      state.intent === "price_inquiry" ||
      state.intent === "purchase_intent" ||
      (!aiAvailable && (state.intent === "followup" || state.intent === "unknown"))
    );

    if (isProductQuery) {
      const skipWords = new Set(["hola", "quiero", "busco", "necesito", "tienen", "hay", "ver", "dame", "dime", "muestrame",
        "los", "las", "para", "con", "del", "una", "uno", "mas", "que", "como", "por", "favor",
        "productos", "juegos", "catalogo", "informacion", "info", "porfavor",
        "si", "no", "ok", "vale", "bueno", "claro", "listo", "dale", "obvio", "afirmativo",
        "digital", "ps4", "ps5", "xbox", "xone", "xseries", "nintendo", "switch", "pc",
        "playstation", "play", "comprar", "comprarlo", "compralo", "comprarle", "adquirir", "adquirirlo",
        "obtener", "obtenerlo", "llevar", "llevarlo", "proceder",
        "precio", "cuanto", "cuesta", "donde", "esta"]);
      const queryWords = msg.split(/\s+/).filter(w => w.length >= 2 && !skipWords.has(w));
      const searchQuery = queryWords.join(" ");

      if (searchQuery.length >= 2) {
        try {
          const catalogResults = await catalogLookup.searchByName(searchQuery);

          if (catalogResults.length === 0 && queryWords.length > 1) {
            for (const word of queryWords) {
              if (word.length >= 3) {
                const wordResults = await catalogLookup.searchByName(word);
                if (wordResults.length > 0) {
                  const productButtons = wordResults.slice(0, 8).map(p => ({
                    label: `${p.name} - ${p.price || "Consultar"}`,
                    value: `__qr:product:${p.name}`
                  }));
                  productButtons.push({label: "Ver mas opciones", value: "__qr:back"});
                  productButtons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
                  return withButtons(
                    `🎯 Encontre estos productos relacionados con "${word}":`,
                    productButtons
                  );
                }
              }
            }
          }

          if (catalogResults.length === 1) {
            const p = catalogResults[0];

            if (p.availability !== "available" && p.availability !== "preorder") {
              const detail = formatProductDetail(p);
              const text = `${detail}\n\n❌ Este producto no esta disponible actualmente. Para consultar disponibilidad o buscar una alternativa, contacta a uno de nuestros ejecutivos 💬`;
              return withButtons(text, [
                {label: "Contactar ejecutivo", value: "__qr:contact"},
                {label: "Buscar en catalogo", value: "__qr:browse"},
                {label: "Ver categorias", value: "__qr:back"},
              ]);
            }

            const detail = formatProductDetail(p);
            const text = p.description ? detail : `${detail}\n\n⚡ Entrega digital inmediata 📧`;
            const buttons: Array<{label: string, value?: string, url?: string}> = [];
            if (p.productUrl) {
              buttons.push({label: "Comprar ahora", url: p.productUrl});
            }
            buttons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
            buttons.push({label: "Ver mas productos", value: "__qr:back"});
            return withButtons(text, buttons);
          }

          if (catalogResults.length > 1) {
            const productButtons = catalogResults.slice(0, 8).map(p => ({
              label: `${p.name} - ${p.price || "Consultar"}`,
              value: `__qr:product:${p.name}`
            }));
            productButtons.push({label: "Buscar otro producto", value: "__qr:back"});
            productButtons.push({label: "Contactar ejecutivo", value: "__qr:contact"});
            return withButtons(
              `🎯 Encontramos ${catalogResults.length} resultados para tu busqueda.\n\nSelecciona el producto que te interesa para ver mas detalles:`,
              productButtons
            );
          }
          if (catalogResults.length === 0 && searchQuery.length >= 3) {
            return withButtons(
              `🎯 No encontre "${searchQuery}" en nuestro catalogo. Puedes buscar directamente en nuestro catalogo completo o contactar a un ejecutivo para asistencia personalizada 💬`,
              [
                {label: "Buscar en catalogo", value: "__qr:browse"},
                {label: "Ver categorias", value: "__qr:back"},
                {label: "Contactar ejecutivo", value: "__qr:contact"},
              ]
            );
          }
        } catch {}
      }
    }

    const platformBrowseMatch = msg.match(/(?:juegos?\s+(?:de\s+|para\s+)?|quiero\s+(?:un\s+)?(?:juego\s+(?:de\s+|para\s+)?)?)?(play\s*(?:station)?\s*[45]|ps\s*[45]|xbox\s*(?:one|series|360)?)\b/i);
    if (platformBrowseMatch && catalogLookup) {
      const platformText = platformBrowseMatch[1].toLowerCase().replace(/\s+/g, "");
      let browsePlatform = "ps5";
      if (/play4|ps4|playstation4/.test(platformText)) browsePlatform = "ps4";
      else if (/play5|ps5|playstation5/.test(platformText)) browsePlatform = "ps5";
      else if (/xboxone/.test(platformText)) browsePlatform = "xbox_one";
      else if (/xboxseries/.test(platformText)) browsePlatform = "xbox_series";
      else if (/xbox/.test(platformText)) browsePlatform = "xbox_series";

      const platformProducts = await catalogLookup.getByPlatform(browsePlatform);
      const platformDisplayName = browsePlatform.startsWith("ps") ? "PlayStation " + browsePlatform.replace("ps", "") : browsePlatform.includes("xbox") ? "Xbox" : browsePlatform;
      if (platformProducts.length > 0) {
        const productButtons = platformProducts.slice(0, 6).map(p => ({
          label: `${p.name} - ${p.price || "Consultar"}`,
          value: `__qr:product:${p.name}`
        }));
        productButtons.push({label: "Buscar otro producto", value: "__qr:back"});
        const totalCount = await catalogLookup.getTotalCount();
        const text = `📋 Catalogo ${platformDisplayName} 🎮\n\nContamos con ${platformProducts.length} productos disponibles para ${platformDisplayName}.\n\nA continuacion te mostramos algunos de nuestros titulos destacados 🔥\n\n🎯 ¿Buscas algo en especifico? Contamos con mas de ${totalCount} productos en nuestra tienda. Escribe el nombre del juego que te interesa para encontrarlo rapidamente.`;
        return withButtons(text, productButtons);
      } else {
        return withButtons(
          `🎮 No tenemos productos disponibles para ${platformDisplayName} en este momento.`,
          [
            {label: "Contactar ejecutivo", value: "__qr:contact"},
            {label: "Ver otras plataformas", value: "__qr:back"},
          ]
        );
      }
    }
  }

  const catalogProduct = await lookupCatalogProduct(state, sessionData, catalogLookup, conversationHistory);

  if (sessionData?.wpProductName && !state.product && !state.lastTopicProduct) {
    const wpProduct: DetectedProduct = {
      name: sessionData.wpProductName,
      type: "game",
      platform: "unknown",
    };
    state.product = wpProduct;
    state.lastTopicProduct = wpProduct;
  }

  switch (state.intent) {
    case "greeting":
      return getGreetingResponse(state, sessionData, catalogProduct);

    case "product_inquiry": {
      if (state.product) {
        if (state.product.type === "game") {
          return getGameInquiryResponse(state, catalogProduct);
        }
        if (state.product.type === "subscription") {
          return getSubscriptionResponse(state);
        }
        if (state.product.type === "card") {
          return getCardResponse(state);
        }
      }

      const durationResp = getDurationResponse(state, msg);
      if (durationResp) return durationResp;

      return getProductInquiryGeneric(state);
    }

    case "purchase_intent": {
      const purchaseStage = detectPurchaseStage(conversationHistory);
      return getPurchaseResponse(state, catalogProduct, purchaseStage);
    }

    case "price_inquiry":
      return getPriceResponse(state, catalogProduct);

    case "payment_question":
      return getPaymentResponse(state);

    case "delivery_question":
      return getDeliveryResponse(state);

    case "support_issue":
      return getSupportResponse(state, sessionData);

    case "trust_question":
      return getTrustResponse(state);

    case "gratitude":
      return getGratitudeResponse(state);

    case "farewell":
      return getFarewellResponse(state);

    case "followup": {
      if (aiAvailable) {
        let relevantProducts: CatalogProduct[] = [];
        if (catalogLookup) {
          try {
            const searchTerms = [userMessage];
            if (state.lastTopicProduct) searchTerms.push(state.lastTopicProduct.name);
            for (const term of searchTerms) {
              const results = await catalogLookup.searchByName(term);
              if (results.length > 0) {
                relevantProducts = results.slice(0, 5);
                break;
              }
            }
          } catch {}
        }
        return getAIResponse(userMessage, conversationHistory, sessionData, relevantProducts);
      }
      return getFollowupResponse(state, msg);
    }

    case "unknown":
    default: {
      if (aiAvailable) {
        let relevantProducts: CatalogProduct[] = [];
        if (catalogLookup) {
          try {
            const results = await catalogLookup.searchByName(userMessage);
            if (results.length > 0) {
              relevantProducts = results.slice(0, 5);
            }
          } catch {}
        }
        return getAIResponse(userMessage, conversationHistory, sessionData, relevantProducts);
      }
      return getUnknownResponse(state);
    }
  }
}

export default getSmartAutoReply;
