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

  if (/\bcomprar\b|\bquiero\b.*\b(comprar|adquirir|obtener)\b|\bme\s*interesa\b|\blo\s*quiero\b|\bme\s*lo\s*llevo\b|\bproceder\b/.test(msg)) {
    return "purchase_intent";
  }

  if (/\bprecio\b|\bcosto\b|\bcuanto\b|\bcuánto\b|\bvale\b|\bcobran\b|\bbarato\b|\bcaro\b/.test(msg)) {
    return "price_inquiry";
  }

  if (/\bpago\b|\bpagar\b|\bmetodo\b|\btransferencia\b|\bpaypal\b|\bcripto\b|\bbitcoin\b|\befectivo\b|\btarjeta\s*de\s*credito\b|\bdebito\b|\bnequi\b|\bdaviplata\b/.test(msg)) {
    return "payment_question";
  }

  if (/\bentrega\b|\benvio\b|\brecibir\b|\bcomo\s*llega\b|\bdemora\b|\btarda\b|\brapido\b|\binmediato\b/.test(msg)) {
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
      usedResponses.add(entry.content);
      if (entry.content.includes("Estoy aqui para ayudarte con nuestros productos") ||
          entry.content.includes("puedo ayudarte") && entry.content.length < 100) {
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

const ESCALATION_RESPONSES = [
  "Entiendo que es dificil explicar lo que buscas por chat. Si prefieres atencion personalizada, puedes hacer clic en 'Contactar un Ejecutivo' y un agente te atendera directamente. Tambien puedes escribirnos a cjmdigitales@gmail.com.",
  "Parece que no estoy pudiendo ayudarte como necesitas. Te recomiendo hacer clic en 'Contactar un Ejecutivo' para que un agente real pueda asistirte de forma personalizada.",
  "Para brindarte la mejor atencion, te sugiero contactar a uno de nuestros ejecutivos. Haz clic en 'Contactar un Ejecutivo' y recibiras ayuda directa por correo.",
];

function getGreetingResponse(state: ConversationState, sessionData?: SessionData): string {
  const userName = sessionData?.userName;
  const nameGreeting = userName ? `, ${userName}` : "";
  const pageContext = sessionData?.pageTitle ? ` Veo que estas navegando en "${sessionData.pageTitle}".` : "";

  if (state.product) {
    const productName = formatGameWithVersion(state.product);
    if (state.product.type === "game") {
      return `¡Hola${nameGreeting}! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Veo que te interesa ${productName}. Tenemos juegos digitales disponibles para PS4, PS5, Xbox One y Xbox Series. ¿Te gustaria saber mas sobre ${productName} o buscas otro titulo?`;
    }
  }

  if (state.platform === "ps") {
    const options = [
      `¡Hola${nameGreeting}! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Tenemos un amplio catalogo de juegos y suscripciones para PS4 y PS5. ¿Que estas buscando? Puedo ayudarte con juegos, tarjetas PlayStation, o suscripciones PS Plus.`,
      `¡Hola${nameGreeting}! Que gusto tenerte aqui.${pageContext} Somos tu tienda de juegos digitales para PlayStation. ¿Buscas algun juego en particular, suscripciones PS Plus, o tarjetas de saldo PSN?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (state.platform === "xbox") {
    const options = [
      `¡Hola${nameGreeting}! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Contamos con juegos y suscripciones para Xbox One y Xbox Series S|X. ¿Te interesa algun juego, tarjeta Xbox, o suscripcion Game Pass?`,
      `¡Hola${nameGreeting}! Que bueno verte.${pageContext} Tenemos todo para Xbox: juegos digitales, Game Pass, y tarjetas de saldo. ¿En que te puedo ayudar?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  const options = [
    `¡Hola${nameGreeting}! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Tenemos juegos y suscripciones para PS4, PS5, Xbox One y Xbox Series. ¿En que puedo ayudarte hoy?`,
    `¡Hola${nameGreeting}! Gracias por visitarnos.${pageContext} Somos una tienda de juegos digitales con catalogo para PlayStation y Xbox. ¿Que te gustaria saber?`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getGameInquiryResponse(state: ConversationState): string {
  if (!state.product || state.product.type !== "game") {
    const platSuffix = state.platform === "ps" ? " para PS4 y PS5" : state.platform === "xbox" ? " para Xbox One y Xbox Series" : " para PS4, PS5, Xbox One y Xbox Series";
    const options = [
      `Tenemos un amplio catalogo de juegos digitales${platSuffix}. ¿Buscas algun titulo en particular? Dime el nombre del juego y la plataforma y te doy toda la info.`,
      `¡Claro! Contamos con muchos titulos${platSuffix}. ¿Cual juego te interesa? Si me dices el nombre exacto, puedo verificar disponibilidad.`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  const gameName = formatGameWithVersion(state.product);
  const platSuffix = formatPlatformSuffix(state.product);

  const options = [
    `¡${gameName}${platSuffix}! Es un excelente titulo. Tenemos juegos digitales disponibles con entrega inmediata por correo electronico. ¿Te gustaria comprarlo o necesitas mas informacion?`,
    `¡Buena eleccion! ${gameName} es un juegazo. Lo manejamos en version digital${platSuffix} con entrega instantanea. ¿Quieres que te ayude con la compra?`,
    `${gameName}${platSuffix}, entendido. Trabajamos con codigos digitales que se entregan al instante por email. ¿Te gustaria proceder con la compra o tienes alguna duda?`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getSubscriptionResponse(state: ConversationState): string {
  if (!state.product || state.product.type !== "subscription") {
    return getProductInquiryGeneric(state);
  }

  const sub = state.product;

  if (sub.name === "PS Plus Essential") {
    if (sub.duration) {
      const options = [
        `¡Excelente eleccion! La suscripcion PS Plus Essential de ${sub.duration} te da acceso a juego online multijugador, 2-3 juegos gratis cada mes, descuentos exclusivos en PlayStation Store y almacenamiento en la nube. ¿Quieres que te ayude con el proceso de compra?`,
        `PS Plus Essential de ${sub.duration} es perfecta para jugar online. Incluye juegos mensuales gratis y descuentos en PS Store. La entrega es digital e inmediata. ¿Procedemos?`,
      ];
      return pickUnused(options, state.usedResponses);
    }
    const options = [
      `PS Plus Essential es el plan base de PlayStation. Incluye juego online multijugador, juegos mensuales gratis, y descuentos en PS Store. Tenemos disponible en planes de 1 mes, 3 meses y 12 meses. ¿Cual te interesa?`,
      `Con PS Plus Essential puedes jugar online, recibir juegos gratis cada mes y obtener descuentos exclusivos. ¿De que duracion lo necesitas: 1, 3 o 12 meses?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (sub.name === "PS Plus Extra") {
    if (sub.duration) {
      const options = [
        `¡Buena eleccion! PS Plus Extra de ${sub.duration} incluye todo lo de Essential MAS un catalogo de hasta 400 juegos de PS4 y PS5 para descargar y jugar. Es como tener Netflix de juegos. ¿Te gustaria proceder con la compra?`,
        `PS Plus Extra de ${sub.duration} te da acceso a cientos de juegos ademas de todo lo de Essential. Entrega digital inmediata. ¿Quieres comprarlo?`,
      ];
      return pickUnused(options, state.usedResponses);
    }
    const options = [
      `PS Plus Extra incluye todo lo de Essential mas acceso a un catalogo de ~400 juegos descargables de PS4 y PS5. Disponible en 1, 3 y 12 meses. ¿De cual duracion te gustaria saber mas?`,
      `Con PS Plus Extra tienes juego online + un catalogo enorme de juegos para descargar. ¿Que duracion prefieres: 1, 3 o 12 meses?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (sub.name === "PS Plus Premium") {
    if (sub.duration) {
      const options = [
        `PS Plus Premium de ${sub.duration} es el plan mas completo. Incluye todo lo de Extra mas streaming de juegos en la nube, juegos clasicos de PS1/PS2/PS3/PSP, y pruebas de juegos por tiempo limitado. ¿Quieres mas detalles sobre la compra?`,
        `¡El plan Premium de ${sub.duration}! Es lo maximo de PlayStation: catalogo completo + clasicos + streaming en la nube. Entrega digital inmediata. ¿Lo quieres?`,
      ];
      return pickUnused(options, state.usedResponses);
    }
    const options = [
      `PS Plus Premium es el plan mas completo de PlayStation. Incluye todo de Extra mas juegos clasicos, streaming en la nube y pruebas de juegos. Disponible en 1, 3 y 12 meses. ¿Cual duracion te interesa?`,
      `Premium es la experiencia completa de PlayStation: todos los juegos de Extra + clasicos retro + streaming + demos anticipadas. ¿Lo necesitas de 1, 3 o 12 meses?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (sub.name === "PS Plus") {
    const options = [
      `Tenemos los 3 niveles de PS Plus disponibles:\n\n- Essential: Juego online + juegos mensuales gratis\n- Extra: Todo de Essential + catalogo de ~400 juegos\n- Premium: Todo de Extra + clasicos + streaming\n\nCada uno disponible en 1, 3 y 12 meses. ¿Cual nivel te interesa?`,
      `PS Plus viene en 3 niveles. Essential es para jugar online y recibir juegos gratis. Extra agrega un catalogo enorme de juegos. Premium le suma clasicos y streaming. ¿Cual se ajusta mas a lo que buscas?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (sub.name === "Game Pass Ultimate") {
    if (sub.duration) {
      const options = [
        `¡Game Pass Ultimate de ${sub.duration} es la mejor opcion! Incluye acceso a cientos de juegos en consola, PC y nube, juego online, EA Play, y juegos de Xbox Studios desde el dia de lanzamiento. ¿Te ayudo con la compra?`,
        `Ultimate de ${sub.duration} lo tiene todo: juegos en consola + PC + nube + EA Play + online. Es el plan mas completo de Xbox. ¿Procedemos con la compra?`,
      ];
      return pickUnused(options, state.usedResponses);
    }
    const options = [
      `Xbox Game Pass Ultimate incluye juegos en consola + PC + nube, juego online, EA Play y juegos day-one de Microsoft. Tenemos planes de 1, 3 y 12 meses. ¿Cual te interesa?`,
      `Game Pass Ultimate es el todo-en-uno de Xbox. Juegos en todas las plataformas, EA Play incluido, y los titulos de Microsoft desde el dia 1. ¿De cuantos meses lo necesitas?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (sub.name === "Game Pass Core") {
    const options = [
      `Xbox Game Pass Core reemplaza a Xbox Live Gold. Incluye juego online multijugador y acceso a un catalogo selecto de juegos. Es el plan base para jugar online en Xbox. ¿Quieres saber los precios disponibles?`,
      `Game Pass Core te da acceso al multijugador online de Xbox y un grupo selecto de juegos. Es lo minimo que necesitas para jugar online. ¿Te interesa?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (sub.name === "Game Pass") {
    const options = [
      `Tenemos suscripciones Xbox Game Pass disponibles:\n\n- Game Pass Core: Juego online + catalogo selecto\n- Game Pass Standard: Catalogo de cientos de juegos\n- Game Pass Ultimate: Todo incluido + PC + nube + EA Play\n\n¿Cual plan te interesa?`,
      `Game Pass viene en 3 planes: Core para jugar online, Standard para acceder a cientos de juegos, y Ultimate que lo incluye todo (consola + PC + nube + EA Play). ¿Cual te conviene mas?`,
    ];
    return pickUnused(options, state.usedResponses);
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
      const options = [
        `¡Tenemos tarjetas PSN de $${card.amount}! Las tarjetas de PlayStation Store te permiten agregar saldo a tu cuenta para comprar juegos, DLCs, y contenido digital. La entrega es digital e inmediata por correo. ¿Quieres proceder con la compra?`,
        `Tarjeta PSN de $${card.amount}, perfecto. Con ella puedes comprar lo que quieras en la PS Store. Entrega instantanea por email. ¿La quieres?`,
      ];
      return pickUnused(options, state.usedResponses);
    }
    const options = [
      `Contamos con tarjetas de saldo para PlayStation Store (PSN) en varias denominaciones. Puedes usarlas para comprar juegos, DLCs, y contenido en PS Store. ¿De cuanto saldo necesitas?`,
      `Tenemos tarjetas PSN de diferentes montos. ¿Cuanto saldo necesitas agregar a tu cuenta PlayStation?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (card.platform === "xbox") {
    if (card.amount) {
      const options = [
        `¡Tenemos tarjetas Xbox de $${card.amount}! Te permite agregar saldo a tu cuenta Microsoft para comprar juegos y contenido en la tienda Xbox. Entrega digital inmediata. ¿Quieres que te ayude con la compra?`,
        `Tarjeta Xbox de $${card.amount}, anotado. Sirve para comprar lo que necesites en la Microsoft Store. Entrega por email al instante. ¿Procedemos?`,
      ];
      return pickUnused(options, state.usedResponses);
    }
    const options = [
      `Tenemos tarjetas de saldo Xbox en varias denominaciones. Sirven para comprar juegos, DLCs y contenido en la Microsoft Store. ¿Que monto necesitas?`,
      `Contamos con tarjetas Xbox de diferentes montos. ¿De cuanto necesitas la tarjeta?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  const options = [
    `Tenemos tarjetas digitales para PlayStation y Xbox:\n\n- Tarjetas de saldo PSN (PlayStation Store)\n- Tarjetas de saldo Xbox (Microsoft Store)\n- Suscripciones PS Plus (Essential/Extra/Premium)\n- Suscripciones Xbox Game Pass\n\n¿Cual te interesa?`,
    `Manejamos tarjetas de saldo y suscripciones para ambas plataformas. ¿Necesitas una tarjeta PSN, Xbox, o una suscripcion como PS Plus o Game Pass?`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getProductInquiryGeneric(state: ConversationState): string {
  if (/\bpromocion\b|\boferta\b|\bdescuento\b|\brebaja\b|\bsale\b/.test(state.intent)) {
    const options = [
      `¡Siempre tenemos ofertas disponibles! Las promociones cambian frecuentemente. ¿Te interesa alguna plataforma en particular (PlayStation o Xbox)? Puedo ver que ofertas tenemos activas.`,
      `Tenemos descuentos y ofertas en varios titulos. ¿Para que plataforma buscas ofertas?`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  const platSuffix = state.platform === "ps" ? " para PS4 y PS5" : state.platform === "xbox" ? " para Xbox One y Xbox Series" : " para PS4, PS5, Xbox One y Xbox Series";
  const options = [
    `Tenemos un amplio catalogo de juegos digitales${platSuffix}, ademas de suscripciones y tarjetas de saldo. ¿Que producto te interesa?`,
    `Contamos con juegos, suscripciones y tarjetas${platSuffix}. Si me dices que buscas especificamente, te doy toda la info.`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getPurchaseResponse(state: ConversationState): string {
  const product = state.product || state.lastTopicProduct;

  if (product) {
    const productName = product.type === "game" ? formatGameWithVersion(product) : product.name;
    const platSuffix = formatPlatformSuffix(product);

    const options = [
      `¡Perfecto! Para comprar ${productName}${platSuffix}, el proceso es sencillo: realizas el pago y recibiras tu codigo digital por correo electronico de forma inmediata. ¿Te gustaria saber los metodos de pago disponibles?`,
      `¡Genial que quieras ${productName}${platSuffix}! La entrega es digital e instantanea a tu email. Para continuar con la compra, puedes contactar a un ejecutivo haciendo clic en 'Contactar un Ejecutivo' y te guiara paso a paso.`,
      `${productName}${platSuffix}, excelente eleccion. Para completar tu compra, te recomiendo hacer clic en 'Contactar un Ejecutivo' para que un agente te guie con el pago y la entrega inmediata del codigo. Tambien puedes escribirnos a cjmdigitales@gmail.com.`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  const options = [
    `¡Genial que quieras comprar! ¿Me puedes indicar que producto te interesa? Asi te doy el precio y te guio en el proceso de compra.`,
    `¡Claro! Para ayudarte con la compra necesito saber que producto buscas. ¿Es un juego, suscripcion o tarjeta de saldo?`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getPriceResponse(state: ConversationState): string {
  const product = state.product || state.lastTopicProduct;

  if (product) {
    const productName = product.type === "game" ? formatGameWithVersion(product) : product.name;
    const platSuffix = formatPlatformSuffix(product);

    const options = [
      `Para saber el precio exacto de ${productName}${platSuffix}, te recomiendo contactar a un ejecutivo haciendo clic en 'Contactar un Ejecutivo'. Los precios pueden variar y un agente te dara la informacion actualizada al momento.`,
      `El precio de ${productName}${platSuffix} puede variar. Para darte el precio exacto y actualizado, haz clic en 'Contactar un Ejecutivo' o escribenos a cjmdigitales@gmail.com. Te responderemos rapido.`,
      `Los precios de ${productName}${platSuffix} los maneja directamente nuestro equipo. Contacta a un ejecutivo para obtener el precio actual y cualquier oferta disponible.`,
    ];
    return pickUnused(options, state.usedResponses);
  }

  if (state.platform === "ps") {
    return pickUnused([
      `Los precios de nuestros productos PlayStation varian segun el titulo y tipo. ¿Me dices que producto te interesa para darte la info exacta?`,
      `Para darte precios exactos de PlayStation, necesito saber si buscas un juego especifico, PS Plus, o tarjeta PSN. ¿Cual es?`,
    ], state.usedResponses);
  }

  if (state.platform === "xbox") {
    return pickUnused([
      `Los precios de Xbox dependen del producto. ¿Buscas un juego, Game Pass, o tarjeta de saldo Xbox?`,
      `Para precios exactos de Xbox, dime que producto te interesa: juego, suscripcion Game Pass, o tarjeta de saldo.`,
    ], state.usedResponses);
  }

  return pickUnused([
    `Los precios dependen del producto y plataforma. ¿Me puedes indicar que producto te interesa? Asi te doy la informacion exacta.`,
    `Para darte el precio correcto necesito saber que estas buscando. ¿Es un juego, suscripcion o tarjeta? ¿Para PlayStation o Xbox?`,
  ], state.usedResponses);
}

function getPaymentResponse(state: ConversationState): string {
  const options = [
    `Aceptamos varios metodos de pago para que elijas el que te sea mas comodo. Para conocer los metodos disponibles y proceder con tu compra, te recomiendo hacer clic en 'Contactar un Ejecutivo' y un agente te guiara con todo el proceso.`,
    `Los metodos de pago los gestiona directamente nuestro equipo. Haz clic en 'Contactar un Ejecutivo' o escribenos a cjmdigitales@gmail.com para que te den todas las opciones de pago disponibles.`,
    `Tenemos varias formas de pago disponibles. Un ejecutivo puede explicarte todas las opciones. Haz clic en 'Contactar un Ejecutivo' para recibir atencion directa.`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getDeliveryResponse(state: ConversationState): string {
  const options = [
    `La entrega de todos nuestros productos es digital e inmediata. Recibiras tu codigo o producto por correo electronico al completar la compra. El proceso suele tomar unos pocos minutos. ¿Necesitas ayuda con algo mas?`,
    `¡Todo es digital! Una vez que completas la compra, recibiras tu codigo por email en cuestion de minutos. No hay envio fisico, todo es instantaneo. ¿Alguna otra duda?`,
    `Nuestra entrega es 100% digital e inmediata. Al pagar, recibes tu codigo en tu correo electronico automaticamente. Sin esperas. ¿Te puedo ayudar con otra cosa?`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getSupportResponse(state: ConversationState, sessionData?: SessionData): string {
  const problemContext = sessionData?.problemType ? ` Veo que tu consulta es sobre: ${sessionData.problemType}.` : "";

  const options = [
    `Lamentamos si tienes algun inconveniente.${problemContext} Todos nuestros productos tienen garantia de funcionamiento. Para ayudarte mejor, te recomiendo hacer clic en 'Contactar un Ejecutivo' para recibir asistencia personalizada.`,
    `Sentimos los problemas.${problemContext} Queremos resolverlo lo antes posible. Haz clic en 'Contactar un Ejecutivo' para que un agente revise tu caso personalmente. Tambien puedes escribir a cjmdigitales@gmail.com con los detalles.`,
    `Entendemos tu frustracion.${problemContext} Para resolver tu problema de la manera mas rapida, contacta a un ejecutivo directamente. Ellos tienen acceso a tu historial de compras y pueden ayudarte.`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getTrustResponse(state: ConversationState): string {
  const options = [
    `¡Somos una tienda 100% confiable y segura! Todos nuestros productos son codigos digitales oficiales. Tenemos una larga trayectoria y miles de clientes satisfechos. Si quieres, puedes contactar a un ejecutivo para resolver cualquier duda.`,
    `Entendemos tu preocupacion. Somos una tienda establecida con muchos clientes satisfechos. Todos nuestros codigos son oficiales y la entrega es inmediata. Puedes verificar nuestra reputacion y contactar a un ejecutivo si necesitas mas confianza.`,
    `Tu seguridad es nuestra prioridad. Vendemos codigos digitales oficiales y garantizamos cada producto. Si tienes dudas, escribenos a cjmdigitales@gmail.com o contacta a un ejecutivo para una charla mas personal.`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getGratitudeResponse(state: ConversationState): string {
  const options = [
    `¡Con gusto! Estamos aqui para ayudarte. Si tienes mas preguntas sobre nuestros productos, no dudes en escribir. ¡Buen dia!`,
    `¡De nada! Fue un placer ayudarte. Si necesitas algo mas en el futuro, aqui estaremos. ¡Que disfrutes tus juegos!`,
    `¡Para eso estamos! No dudes en volver cuando necesites algo. ¡Pasa un excelente dia!`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getFarewellResponse(state: ConversationState): string {
  const options = [
    `¡Hasta pronto! Fue un placer ayudarte. Si necesitas algo mas, no dudes en volver a escribirnos. ¡Que tengas un excelente dia!`,
    `¡Chao! Esperamos verte de nuevo. Si necesitas juegos o suscripciones, ya sabes donde encontrarnos. ¡Buen dia!`,
    `¡Hasta luego! Fue un gusto atenderte. Vuelve cuando quieras, siempre tendremos las mejores ofertas en juegos digitales.`,
  ];
  return pickUnused(options, state.usedResponses);
}

function getFollowupResponse(state: ConversationState, msg: string): string {
  if (state.lastTopicProduct) {
    const productName = state.lastTopicProduct.type === "game"
      ? formatGameWithVersion(state.lastTopicProduct)
      : state.lastTopicProduct.name;
    const platSuffix = formatPlatformSuffix(state.lastTopicProduct);

    if (/\bsi\b|\bdale\b|\bok\b|\bclaro\b|\bbueno\b|\bva\b|\bvale\b/.test(msg)) {
      const options = [
        `¡Perfecto! Para continuar con ${productName}${platSuffix}, te recomiendo hacer clic en 'Contactar un Ejecutivo' para que un agente te guie con el proceso de compra y pago.`,
        `¡Genial! Para completar la compra de ${productName}${platSuffix}, contacta a un ejecutivo haciendo clic en el boton de abajo. Te atenderan rapidamente.`,
      ];
      return pickUnused(options, state.usedResponses);
    }

    if (/\bno\b|\bgracias\b.*\bno\b|\bno\s*gracias\b|\bnah\b/.test(msg)) {
      return pickUnused([
        `Entendido. ¿Hay algo mas en lo que pueda ayudarte? Tenemos juegos, suscripciones y tarjetas para PlayStation y Xbox.`,
        `Sin problema. ¿Te gustaria ver otro producto o tienes alguna otra pregunta?`,
      ], state.usedResponses);
    }

    return pickUnused([
      `Siguiendo con lo de ${productName}${platSuffix}, ¿en que mas puedo ayudarte? Si quieres proceder con la compra, puedes hacer clic en 'Contactar un Ejecutivo'.`,
      `Sobre ${productName}${platSuffix}, ¿tienes alguna otra duda? Estoy aqui para ayudarte.`,
    ], state.usedResponses);
  }

  return pickUnused([
    `¿Hay algo especifico en lo que pueda ayudarte? Tenemos juegos digitales, suscripciones PS Plus y Game Pass, y tarjetas de saldo.`,
    `¿En que mas te puedo ayudar? Dime que producto o servicio te interesa y te doy toda la informacion.`,
  ], state.usedResponses);
}

function getUnknownResponse(state: ConversationState): string {
  if (shouldEscalate(state)) {
    return pickUnused(ESCALATION_RESPONSES, state.usedResponses);
  }

  const pageContext = "";
  const options = [
    `Gracias por tu mensaje. Estoy aqui para ayudarte con nuestros productos digitales: juegos, suscripciones PS Plus, Xbox Game Pass, tarjetas de saldo y mas. ¿Que te gustaria saber?`,
    `No estoy seguro de entender completamente tu consulta. ¿Puedes decirme si buscas un juego especifico, una suscripcion, o una tarjeta de saldo? Asi te puedo ayudar mejor.`,
    `Disculpa, ¿me puedes dar mas detalles sobre lo que necesitas? Vendemos juegos digitales, PS Plus, Game Pass y tarjetas de saldo para PlayStation y Xbox.`,
  ];
  return pickUnused(options, state.usedResponses);
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
    return pickUnused([
      `Tenemos suscripciones de ${duration} para PS Plus en los 3 niveles: Essential, Extra y Premium. ¿Cual nivel te interesa?`,
      `PS Plus de ${duration} esta disponible en Essential, Extra y Premium. Cada nivel incluye diferentes beneficios. ¿Cual quieres?`,
    ], state.usedResponses);
  }

  if (state.platform === "xbox") {
    return pickUnused([
      `Tenemos suscripciones de ${duration} para Xbox Game Pass: Core, Standard y Ultimate. ¿Cual plan te interesa?`,
      `Game Pass de ${duration} esta disponible. ¿Te interesa Core, Standard o Ultimate? Puedo explicarte las diferencias.`,
    ], state.usedResponses);
  }

  return pickUnused([
    `Tenemos suscripciones de ${duration} tanto para PlayStation (PS Plus) como para Xbox (Game Pass). ¿Para cual plataforma necesitas?`,
    `Suscripciones de ${duration} disponibles para PS Plus y Game Pass. ¿Cual plataforma prefieres?`,
  ], state.usedResponses);
}

export async function getSmartAutoReply(
  userMessage: string,
  conversationHistory: Array<{ sender: string; content: string }>,
  sessionData?: SessionData
): Promise<string> {
  const msg = normalize(userMessage);
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

  switch (state.intent) {
    case "greeting":
      return getGreetingResponse(state, sessionData);

    case "product_inquiry": {
      if (state.product) {
        if (state.product.type === "game") {
          return getGameInquiryResponse(state);
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

    case "purchase_intent":
      return getPurchaseResponse(state);

    case "price_inquiry":
      return getPriceResponse(state);

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

    case "followup":
      return getFollowupResponse(state, msg);

    case "unknown":
    default:
      return getUnknownResponse(state);
  }
}

export default getSmartAutoReply;
