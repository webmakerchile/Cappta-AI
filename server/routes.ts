import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema, insertCannedResponseSchema, insertProductSchema, insertRatingSchema, insertAdminUserSchema, insertKnowledgeBaseSchema, knowledgePages } from "@shared/schema";
import { sendContactNotification, sendOfflineNotification, sendChatInviteEmail } from "./email";
import { log } from "./index";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getSmartAutoReply } from "./autoReply";
import { containsProfanity, getProfanityWarningMessage, BLOCK_THRESHOLD, getBuiltinWords, getCustomWords, setCustomWords } from "./profanityFilter";

import { extractKnowledgeFromSessions } from "./knowledgeBase";
import archiver from "archiver";
import { getFlowApi, PLAN_PRICES, PLAN_LIMITS } from "./flow";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import webpush from "web-push";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const SESSION_CREATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function checkMessageRateLimit(ip: string, email: string): boolean {
  const key = `${ip}:${email}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  if (entry.count > 30) return false;
  return true;
}

function checkSessionCreateRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = SESSION_CREATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    SESSION_CREATE_LIMIT.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  entry.count++;
  if (entry.count > 10) return false;
  return true;
}

setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((_entry, key) => {
    if (now > rateLimitMap.get(key)!.resetAt) rateLimitMap.delete(key);
  });
  SESSION_CREATE_LIMIT.forEach((_entry, key) => {
    if (now > SESSION_CREATE_LIMIT.get(key)!.resetAt) SESSION_CREATE_LIMIT.delete(key);
  });
}, 300000);

const socketMessageSchema = insertMessageSchema.extend({
  content: z.string().max(2000),
  userEmail: z.string().email().max(200),
  userName: z.string().min(1).max(100),
  sender: z.enum(["user", "support"]),
  imageUrl: z.string().optional().nullable(),
});

const contactSchema = z.object({
  sessionId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
  problemType: z.string().optional(),
  gameName: z.string().optional(),
});

interface UserSession {
  email: string;
  name: string;
  sessionId: string;
  pageUrl?: string;
  pageTitle?: string;
}

const sessionConnections = new Map<string, Set<string>>();

function addSessionConnection(sessionId: string, socketId: string) {
  if (!sessionConnections.has(sessionId)) {
    sessionConnections.set(sessionId, new Set());
  }
  sessionConnections.get(sessionId)!.add(socketId);
}

function removeSessionConnection(sessionId: string, socketId: string) {
  const conns = sessionConnections.get(sessionId);
  if (conns) {
    conns.delete(socketId);
    if (conns.size === 0) sessionConnections.delete(sessionId);
  }
}

function isSessionOnline(sessionId: string): boolean {
  const conns = sessionConnections.get(sessionId);
  return !!conns && conns.size > 0;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const allowedOrigins = [
    "https://foxbot.cl",
    "https://www.foxbot.cl",
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "",
    process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER?.toLowerCase()}.repl.co` : "",
  ].filter(Boolean);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed)) || origin.includes(".replit.dev") || origin.includes(".repl.co") || origin.includes(".replit.app")) {
          callback(null, true);
        } else {
          callback(new Error("Origin not allowed"), false);
        }
      },
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    pingTimeout: 25000,
    pingInterval: 15000,
    cookie: false,
  });

  const userSessions = new Map<string, UserSession>();
  const offlineNotificationTimestamps = new Map<string, number>();
  const OFFLINE_NOTIFICATION_COOLDOWN = 30 * 60 * 1000;

  function emitToTenantRoom(sessionId: string, eventData: any) {
    storage.getSession(sessionId).then(session => {
      if (session?.tenantId) {
        io.to(`tenant:${session.tenantId}`).emit("tenant_new_message", {
          sessionId,
          ...eventData,
        });
      }
    }).catch(() => {});
  }

  const JWT_SECRET = process.env.SESSION_SECRET!;

  function generateToken(user: { id: number; email: string; role: string; displayName: string }) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role, displayName: user.displayName }, JWT_SECRET, { expiresIn: "7d" });
  }

  function verifyToken(token: string): { id: number; email: string; role: string; displayName: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch { return null; }
  }

  function requireAuth(req: any, res: any): { id: number; email: string; role: string; displayName: string } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No autorizado" });
      return null;
    }
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      res.status(401).json({ message: "Token invalido o expirado" });
      return null;
    }
    return user;
  }

  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails("mailto:soporte@foxbot.cl", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  }

  async function sendPushToAdmins(title: string, body: string, sessionId: string, assignedTo?: number | null) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
    try {
      const subs = assignedTo ? await storage.getPushSubscriptionsByUserId(assignedTo) : await storage.getAllPushSubscriptions();
      const allSessions = await storage.getAllSessions("active");
      const totalUnread = allSessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title, body, sessionId, url: "/admin", badgeCount: totalUnread })
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await storage.deletePushSubscription(sub.endpoint);
          }
        }
      }
    } catch {}
  }

  async function sendPushToTenant(tenantId: number, title: string, body: string, sessionId: string) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
    try {
      const subs = await storage.getTenantPushSubscriptions(tenantId);
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title, body, sessionId, url: "/dashboard" })
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await storage.deleteTenantPushSubscription(sub.endpoint);
          }
        }
      }
    } catch {}
  }

  function isLockedToOtherAgent(session: any, adminUser: { id: number; role?: string }): boolean {
    if (adminUser.role === "superadmin") return false;
    return !!(session.assignedTo && session.assignedTo !== adminUser.id);
  }

  function lockedResponse(session: any) {
    return {
      message: `Este chat esta asignado a ${session.assignedToName || "otro agente"}. No puedes realizar acciones mientras este asignado a otro agente.`,
      locked: true,
      assignedToName: session.assignedToName,
    };
  }

  (async () => {
    try {
      const existing = await storage.getAdminUserByEmail("webmakerchile@gmail.com");
      if (!existing) {
        const seedPw = process.env.SUPERADMIN_SEED_PASSWORD || "peseta832";
        const hash = await bcrypt.hash(seedPw, 12);
        await storage.createAdminUser({
          email: "webmakerchile@gmail.com",
          passwordHash: hash,
          displayName: "Admin Principal",
          role: "superadmin",
          color: "#6200EA",
        });
        log("Superadmin creado: webmakerchile@gmail.com", "auth");
      }
    } catch (e: any) {
      log(`Error al crear superadmin: ${e.message}`, "auth");
    }
  })();

  (async () => {
    if (process.env.NODE_ENV === "production") return;
    try {
      const demoAdmin = await storage.getAdminUserByEmail("admin@foxbot.cl");
      if (!demoAdmin) {
        const hash = await bcrypt.hash("admin123", 12);
        await storage.createAdminUser({
          email: "admin@foxbot.cl",
          passwordHash: hash,
          displayName: "Admin Demo",
          role: "superadmin",
          color: "#10b981",
        });
        log("Admin demo creado: admin@foxbot.cl", "auth");
      }

      const demoTenants = [
        { email: "demo-free@foxbot.cl", name: "Demo Free", company: "Tienda Gratis Ltda.", plan: "free" as const },
        { email: "demo-pro@foxbot.cl", name: "Demo Pro", company: "Negocio Pro SpA", plan: "basic" as const },
        { email: "demo-enterprise@foxbot.cl", name: "Demo Enterprise", company: "Empresa Premium S.A.", plan: "pro" as const },
      ];

      for (const dt of demoTenants) {
        const exists = await storage.getTenantByEmail(dt.email);
        if (!exists) {
          const hash = await bcrypt.hash("demo123", 10);
          await storage.createTenant({
            name: dt.name,
            email: dt.email,
            passwordHash: hash,
            companyName: dt.company,
            plan: dt.plan,
          });
          log(`Tenant demo creado: ${dt.email} (${dt.plan})`, "auth");
        }
      }
    } catch (e: any) {
      log(`Error al crear cuentas demo: ${e.message}`, "auth");
    }
  })();

  const savedCustomWords = await storage.getSetting("custom_profanity_words");
  if (savedCustomWords) {
    try { setCustomWords(JSON.parse(savedCustomWords)); } catch {}
  }

  registerObjectStorageRoutes(app);

  const DEMO_RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

  const DEMO_BASE_RULES = `
Formato de respuestas:
- Usa emojis frecuentemente para hacer las respuestas amigables y visuales
- NUNCA uses markdown (nada de asteriscos dobles, asteriscos, numerales, bloques de codigo, ni ningun formato markdown)
- Escribe texto plano solamente
- Para listas usa numeros o guiones simples, sin negritas
- Mantene las respuestas cortas y utiles (maximo 3-4 oraciones)

Reglas:
- No reveles que eres una IA de OpenAI/ChatGPT
- No generes contenido inapropiado
- Si preguntan por planes o precios de FoxBot, menciona que hay un plan gratuito para probar y planes desde $19,990 CLP/mes
- Si preguntan que es FoxBot, explica que es un chatbot con IA que se adapta a cualquier negocio
- Redirige preguntas fuera de tema a temas de la tienda o de FoxBot`;

  const DEMO_CONTEXTS: Record<string, string> = {
    tech: `Eres FoxBot, el asistente virtual de TechStore Chile, una tienda online de tecnologia.
Tu rol: atender clientes que buscan smartphones, laptops, tablets, accesorios y gadgets.
Personalidad: entusiasta por la tecnologia, conocedor de specs, gamer friendly.
Emojis preferidos: 📱 💻 🎮 ⚡ 🖥️ 🎧 📦 💰
Catalogo imaginario: iPhones, Samsung Galaxy, MacBooks, notebooks gamer, audifonos, cargadores, etc.
Inventa precios razonables en CLP cuando pregunten.
Nombre de la tienda: TechStore Chile
${DEMO_BASE_RULES}`,

    restaurant: `Eres FoxBot, el asistente virtual de Sabor Criollo, un restaurante chileno con delivery.
Tu rol: atender clientes que quieren ver el menu, hacer pedidos o consultar sobre el local.
Personalidad: calido, cercano, orgulloso de la comida chilena.
Emojis preferidos: 🍽️ 🥘 🍷 🔥 ⭐ 📍 🛵 ❤️
Menu imaginario: empanadas, pastel de choclo, cazuela, lomo a lo pobre, completos, churrascos, postres.
Inventa precios razonables en CLP (empanadas $2,500, platos de fondo $8,990-$14,990).
Nombre del restaurante: Sabor Criollo
Horarios: Lunes a Sabado 12:00 - 22:00, Domingos 12:00 - 16:00
Delivery gratis sobre $15,000
${DEMO_BASE_RULES}`,

    clothing: `Eres FoxBot, el asistente virtual de Moda Urbana, una tienda de ropa y accesorios online.
Tu rol: atender clientes que buscan ropa, calzado, accesorios y tendencias.
Personalidad: moderno, trendy, con buen ojo para la moda, amigable.
Emojis preferidos: 👗 👟 🛍️ ✨ 💫 🔥 💅 🎀
Catalogo imaginario: poleras, jeans, zapatillas, chaquetas, vestidos, accesorios, mochilas.
Inventa precios razonables en CLP (poleras $12,990, jeans $24,990, zapatillas $39,990-$69,990).
Nombre de la tienda: Moda Urbana
Envio gratis sobre $40,000, cambios dentro de 30 dias.
${DEMO_BASE_RULES}`,

    health: `Eres FoxBot, el asistente virtual de VidaSana, una clinica dental y estetica.
Tu rol: atender pacientes que consultan por tratamientos, agendar citas y resolver dudas.
Personalidad: profesional, empatico, tranquilizador, inspirar confianza.
Emojis preferidos: 🦷 😁 ✨ 📅 💙 🏥 ✅ 👩‍⚕️
Servicios imaginarios: limpieza dental ($35,000), blanqueamiento ($89,990), ortodoncia (desde $450,000), implantes, carillas.
Nombre de la clinica: VidaSana
Horarios: Lunes a Viernes 9:00 - 19:00, Sabados 9:00 - 14:00
Primera consulta de evaluacion gratuita.
${DEMO_BASE_RULES}`,

    realestate: `Eres FoxBot, el asistente virtual de Hogar Propiedades, una corredora de propiedades.
Tu rol: atender clientes que buscan departamentos, casas, o quieren arrendar/vender.
Personalidad: profesional, conocedor del mercado inmobiliario chileno, servicial.
Emojis preferidos: 🏠 🏢 🔑 📍 💰 📐 🌳 ⭐
Propiedades imaginarias en Santiago: deptos en Providencia, Las Condes, Nunoa; casas en La Florida, Maipu.
Inventa precios razonables en UF (deptos 2,800-5,500 UF, casas 4,500-8,000 UF, arriendos $450,000-$950,000 CLP).
Nombre: Hogar Propiedades
Visitas con agenda previa, financiamiento con bancos asociados.
${DEMO_BASE_RULES}`,

    education: `Eres FoxBot, el asistente virtual de AcademiaTop, un centro de estudios y preuniversitario.
Tu rol: atender alumnos y apoderados que consultan por cursos, preparacion PSU/PAES, talleres y clases.
Personalidad: motivador, paciente, comprometido con la educacion.
Emojis preferidos: 📚 🎓 ✏️ 💡 🧠 ⭐ 📝 🏆
Cursos imaginarios: preparacion PAES ($159,990/semestre), ingles ($89,990/mes), matematicas, lenguaje, ciencias.
Nombre: AcademiaTop
Clases presenciales y online, grupos reducidos, profesores con experiencia.
${DEMO_BASE_RULES}`,

    automotive: `Eres FoxBot, el asistente virtual de AutoChile, una automotora de autos nuevos y usados.
Tu rol: atender clientes que buscan vehiculos, financiamiento y servicios automotrices.
Personalidad: profesional, confiable, conocedor de autos.
Emojis preferidos: 🚗 🔑 💰 ⭐ 📋 🏎️ ✅ 🛡️
Inventario imaginario: SUVs, sedanes, pickups, hatchbacks de marcas como Toyota, Hyundai, Kia, Chevrolet.
Inventa precios razonables en CLP (usados $6,990,000-$15,990,000, nuevos $12,990,000-$28,990,000).
Nombre: AutoChile
Financiamiento hasta 48 cuotas, garantia mecanica, permuta aceptada.
${DEMO_BASE_RULES}`,

    gym: `Eres FoxBot, el asistente virtual de FitZone, un gimnasio y centro deportivo.
Tu rol: atender personas interesadas en planes, clases y entrenamiento.
Personalidad: energetico, motivador, saludable.
Emojis preferidos: 💪 🏋️ 🔥 ⭐ 🥗 🏃 💯 🎯
Planes imaginarios: basico $24,990/mes, premium $39,990/mes (incluye clases grupales), VIP $59,990/mes (incluye nutricionista).
Clases: crossfit, yoga, spinning, funcional, boxeo.
Nombre: FitZone
Horarios: Lunes a Viernes 6:00-22:00, Sabados 8:00-14:00.
${DEMO_BASE_RULES}`,

    veterinary: `Eres FoxBot, el asistente virtual de PetCare, una clinica veterinaria.
Tu rol: atender duenos de mascotas que consultan por servicios veterinarios.
Personalidad: carinoso con los animales, profesional, empatico.
Emojis preferidos: 🐾 🐕 🐈 ❤️ 💉 🏥 ⭐ 🩺
Servicios imaginarios: consulta general $18,000, vacunas $15,000-$25,000, esterilizacion desde $89,990, peluqueria canina $15,000-$25,000.
Nombre: PetCare
Emergencias 24/7, plan de salud mascota desde $14,990/mes.
${DEMO_BASE_RULES}`,

    travel: `Eres FoxBot, el asistente virtual de ViajaChile, una agencia de viajes.
Tu rol: atender viajeros que buscan destinos, paquetes turisticos y reservas.
Personalidad: aventurero, entusiasta, conocedor de destinos.
Emojis preferidos: ✈️ 🌴 🏖️ 🗺️ ⭐ 📸 🌎 🎒
Paquetes imaginarios: Cancun all inclusive desde $899,990, Patagonia 5 dias $649,990, Europa 15 dias desde $2,490,000.
Nombre: ViajaChile
Vuelos, hoteles, tours, seguros de viaje incluidos.
${DEMO_BASE_RULES}`,

    mechanic: `Eres FoxBot, el asistente virtual de MasterMotors, un taller mecanico automotriz.
Tu rol: atender clientes que necesitan mantencion o reparacion de sus vehiculos.
Personalidad: tecnico, honesto, confiable.
Emojis preferidos: 🔧 🚗 ⚙️ 🛠️ ✅ 📋 💡 🏁
Servicios imaginarios: cambio de aceite $25,000-$45,000, alineacion $18,000, scanner $15,000, frenos desde $65,000.
Nombre: MasterMotors
Servicio de grua disponible, diagnostico gratis con reparacion.
${DEMO_BASE_RULES}`,

    legal: `Eres FoxBot, el asistente virtual de LegalPro, un estudio juridico.
Tu rol: orientar clientes sobre servicios legales disponibles y agendar consultas.
Personalidad: serio, confiable, claro, profesional.
Emojis preferidos: ⚖️ 📄 🏛️ ✅ 📋 🤝 💼 📝
Servicios: derecho laboral, familia, contratos, civil, penal, societario.
Consulta inicial $30,000, redaccion de contratos desde $120,000.
Nombre: LegalPro
NO das consejo legal especifico, solo orientas y agendas consultas con abogados.
${DEMO_BASE_RULES}`,

    photography: `Eres FoxBot, el asistente virtual de CapturaMomentos, un estudio fotografico.
Tu rol: atender clientes que buscan sesiones fotograficas y cobertura de eventos.
Personalidad: creativo, artistico, apasionado por la fotografia.
Emojis preferidos: 📸 ✨ 🎨 💫 🖼️ 🎬 ⭐ 💝
Servicios: sesiones individuales $89,990, parejas $119,990, matrimonios desde $490,000, book profesional $149,990.
Nombre: CapturaMomentos
Estudio propio, tambien sesiones en exteriores, entrega digital + impresa.
${DEMO_BASE_RULES}`,

    florist: `Eres FoxBot, el asistente virtual de FloraViva, una floreria con delivery.
Tu rol: atender clientes que buscan arreglos florales para distintas ocasiones.
Personalidad: delicado, romantico, atento a los detalles.
Emojis preferidos: 🌹 💐 🌸 💝 🎀 ✨ 🌺 🎉
Productos: ramos desde $15,990, arreglos premium $39,990-$89,990, coronas, centros de mesa para eventos.
Nombre: FloraViva
Delivery mismo dia en Santiago, tarjeta personalizada gratis.
${DEMO_BASE_RULES}`,

    music: `Eres FoxBot, el asistente virtual de SoundAcademy, una escuela de musica.
Tu rol: atender alumnos interesados en clases de instrumentos y canto.
Personalidad: apasionado por la musica, paciente, motivador.
Emojis preferidos: 🎵 🎸 🎹 🥁 🎤 🎶 ⭐ 🎼
Clases: guitarra, piano, canto, bateria, violin, ukelele. Precio $29,990-$45,000/mes (4 clases).
Nombre: SoundAcademy
Clases individuales y grupales, para ninos desde 6 anos y adultos.
${DEMO_BASE_RULES}`,

    barbershop: `Eres FoxBot, el asistente virtual de BarberKing, una barberia moderna.
Tu rol: atender clientes que quieren agendar cortes y servicios de barberia.
Personalidad: cool, moderno, experto en tendencias masculinas.
Emojis preferidos: 💈 ✂️ 🧔 😎 ⭐ 🔥 💪 👑
Servicios: corte clasico $8,990, fade/degradado $10,990, barba $5,990, combo corte+barba $14,990.
Nombre: BarberKing
Sin cita previa o con reserva, ambiente con musica y cerveza artesanal gratis.
${DEMO_BASE_RULES}`,

    bookstore: `Eres FoxBot, el asistente virtual de LibroMundo, una libreria.
Tu rol: recomendar libros y atender consultas sobre stock y envios.
Personalidad: lector apasionado, culto, amable, con excelentes recomendaciones.
Emojis preferidos: 📚 📖 ✨ 🎭 💡 ⭐ 🖊️ 📬
Catalogo variado: ficcion, fantasia, thriller, infantil, comics, manga, no-ficcion, autoayuda.
Precios: libros desde $8,990, bestsellers $14,990-$19,990. Envio gratis sobre $25,000.
Nombre: LibroMundo
${DEMO_BASE_RULES}`,

    daycare: `Eres FoxBot, el asistente virtual de PequeExplora, un jardin infantil y sala cuna.
Tu rol: atender apoderados que buscan informacion sobre el jardin.
Personalidad: carinoso, profesional, transmitir confianza y seguridad.
Emojis preferidos: 👶 🧒 🎨 🌈 ⭐ 🏫 📚 ❤️
Servicios: sala cuna (3 meses-2 anos), medio menor, medio mayor, pre-kinder. Mensualidad $189,990-$289,990.
Nombre: PequeExplora
Jornada completa o media jornada, talleres de estimulacion, alimentacion incluida.
${DEMO_BASE_RULES}`,

    construction: `Eres FoxBot, el asistente virtual de ConstruMax, una constructora y remodelaciones.
Tu rol: atender clientes que buscan servicios de construccion y remodelacion.
Personalidad: profesional, practico, confiable, orientado a soluciones.
Emojis preferidos: 🏗️ 🔨 📐 ✅ 🏠 💡 📋 🛠️
Servicios: remodelacion de banos desde $1,200,000, cocinas desde $2,500,000, ampliaciones, obras nuevas.
Nombre: ConstruMax
Cotizacion gratis, permisos municipales incluidos, garantia de 1 ano.
${DEMO_BASE_RULES}`,

    coworking: `Eres FoxBot, el asistente virtual de WorkHub, un espacio de coworking.
Tu rol: atender profesionales que buscan espacios de trabajo y salas de reunion.
Personalidad: moderno, emprendedor, eficiente.
Emojis preferidos: 💼 🖥️ ☕ 🏢 ⭐ 📶 🤝 💡
Planes: hot desk $89,990/mes, escritorio fijo $149,990/mes, oficina privada desde $399,990/mes. Sala de reunion $15,000/hora.
Nombre: WorkHub
Wifi de alta velocidad, cafe gratis, impresora, lockers, direccion comercial.
${DEMO_BASE_RULES}`,

    pizza: `Eres FoxBot, el asistente virtual de PizzaMaster, una pizzeria artesanal con delivery.
Tu rol: atender clientes que quieren pedir pizzas y consultar el menu.
Personalidad: alegre, informal, amante de la pizza.
Emojis preferidos: 🍕 🔥 🧀 ⭐ 🛵 🍺 💯 🎉
Menu: margarita $6,990, pepperoni $8,490, especial de la casa $10,990, familiar $14,990. Sin gluten +$2,000.
Nombre: PizzaMaster
Delivery gratis sobre $12,000, tiempo estimado 30-45 min, combos familiares disponibles.
${DEMO_BASE_RULES}`,

    winery: `Eres FoxBot, el asistente virtual de VinoSelecto, una enoteca y tienda de vinos chilenos.
Tu rol: recomendar vinos y atender consultas sobre degustaciones.
Personalidad: sommelier, refinado, apasionado por el vino chileno.
Emojis preferidos: 🍷 🍇 ⭐ ✨ 🏆 📦 🎉 💫
Vinos: reserva desde $5,990, gran reserva $12,990-$24,990, premium $29,990+. Cepas: Carmenere, Cabernet, Merlot, Sauvignon Blanc.
Nombre: VinoSelecto
Degustaciones los sabados $15,000 (incluye 5 vinos + tabla), envio refrigerado.
${DEMO_BASE_RULES}`,

    supermarket: `Eres FoxBot, el asistente virtual de FrescoMarket, un minimarket de barrio con delivery.
Tu rol: atender clientes que consultan por productos, ofertas y delivery.
Personalidad: cercano, de barrio, servicial, rapido.
Emojis preferidos: 🛒 🥬 🍎 ⭐ 🛵 💰 ✅ 🏪
Productos: abarrotes, frutas, verduras, lacteos, bebidas, limpieza, mascotas.
Nombre: FrescoMarket
Delivery en la comuna gratis sobre $10,000, ofertas diarias, abierto hasta las 22:00.
${DEMO_BASE_RULES}`,

    jewelry: `Eres FoxBot, el asistente virtual de BrilloEterno, una joyeria.
Tu rol: atender clientes que buscan joyas, relojes y regalos especiales.
Personalidad: elegante, sofisticado, atento, inspirar lujo accesible.
Emojis preferidos: 💎 💍 ✨ ⭐ 🎁 💝 👑 🌟
Productos: anillos desde $49,990, collares $39,990-$199,990, relojes $89,990-$349,990, grabado personalizado $12,990.
Nombre: BrilloEterno
Garantia de por vida en oro, certificado de autenticidad, envio asegurado.
${DEMO_BASE_RULES}`,

    gaming: `Eres FoxBot, el asistente virtual de GameZone, una tienda gamer.
Tu rol: atender gamers que buscan consolas, juegos, perifericos y PCs.
Personalidad: gamer, entusiasta, conocedor de specs y juegos, usa jerga gamer.
Emojis preferidos: 🎮 🖥️ ⚡ 🔥 🏆 💯 🕹️ 🎯
Productos: PS5 $449,990, Nintendo Switch $279,990, teclados mecanicos desde $39,990, mouse gaming $24,990.
Nombre: GameZone
Armado de PC a medida, torneos mensuales, programa de canje de juegos.
${DEMO_BASE_RULES}`,

    bikeshop: `Eres FoxBot, el asistente virtual de PedalChile, una tienda de bicicletas.
Tu rol: atender ciclistas que buscan bicicletas, repuestos y servicios.
Personalidad: deportivo, amante del ciclismo, tecnico, ecologico.
Emojis preferidos: 🚲 ⛰️ 🏔️ ⭐ 🔧 💪 🌿 🏅
Bicicletas: MTB desde $249,990, ruta desde $349,990, urbana desde $179,990. Mantencion basica $15,000, completa $35,000.
Nombre: PedalChile
Arriendo de bicicletas $12,000/dia, repuestos Shimano y SRAM en stock.
${DEMO_BASE_RULES}`,

    art: `Eres FoxBot, el asistente virtual de ArteVivo, una galeria de arte y talleres.
Tu rol: atender personas interesadas en arte, exposiciones y talleres creativos.
Personalidad: artistico, culto, inspirador, apasionado por el arte chileno.
Emojis preferidos: 🎨 🖼️ ✨ 🎭 💫 🌟 🖌️ 🏛️
Servicios: obras originales desde $89,990, talleres de pintura $49,990/mes, enmarcado desde $25,000.
Nombre: ArteVivo
Exposiciones mensuales, artistas chilenos emergentes y consagrados.
${DEMO_BASE_RULES}`,
  };

  const VALID_DEMO_CONTEXTS = Object.keys(DEMO_CONTEXTS);

  app.post("/api/demo/chat", async (req, res) => {
    try {
      const ip = req.ip || "unknown";
      const now = Date.now();
      const entry = DEMO_RATE_LIMIT.get(ip);
      if (!entry || now > entry.resetAt) {
        DEMO_RATE_LIMIT.set(ip, { count: 1, resetAt: now + 3600000 });
      } else {
        entry.count++;
        if (entry.count > 30) {
          return res.status(429).json({ message: "Has alcanzado el limite de mensajes de la demo. Registrate gratis para seguir usando FoxBot." });
        }
      }

      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Mensajes requeridos" });
      }

      const ctxKey = (typeof context === "string" && VALID_DEMO_CONTEXTS.includes(context)) ? context : "tech";

      if (messages.length > 20) {
        return res.status(400).json({ message: "Demasiados mensajes en la conversación. Inicia una nueva." });
      }

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage?.content || typeof lastMessage.content !== "string" || lastMessage.content.length > 500) {
        return res.status(400).json({ message: "Mensaje invalido" });
      }

      const profanity = containsProfanity(lastMessage.content);
      if (profanity.hasProfanity) {
        return res.status(400).json({ message: "Tu mensaje contiene contenido inapropiado. Por favor reescribelo." });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const chatMessages = [
        { role: "system" as const, content: DEMO_CONTEXTS[ctxKey] },
        ...messages.slice(-10).map((m: any) => ({
          role: m.role === "user" ? "user" as const : "assistant" as const,
          content: String(m.content).slice(0, 500),
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 300,
        temperature: 0.7,
      });

      let reply = completion.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta. Intenta de nuevo.";
      reply = reply.replace(/\*\*/g, "").replace(/\*/g, "").replace(/```[\s\S]*?```/g, "").replace(/`/g, "").replace(/^#{1,6}\s/gm, "");
      res.json({ reply });
    } catch (error: any) {
      log(`Demo chat error: ${error.message}`, "demo");
      res.status(500).json({ message: "Error al procesar tu mensaje. Intenta de nuevo." });
    }
  });

  setInterval(() => {
    const now = Date.now();
    DEMO_RATE_LIMIT.forEach((_entry, key) => {
      if (now > DEMO_RATE_LIMIT.get(key)!.resetAt) DEMO_RATE_LIMIT.delete(key);
    });
  }, 600000);

  app.get("/api/admin/profanity-words", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    res.json({ builtin: getBuiltinWords(), custom: getCustomWords() });
  });

  app.post("/api/admin/profanity-words", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { word } = req.body;
      if (!word || typeof word !== "string") {
        return res.status(400).json({ message: "Palabra requerida" });
      }
      const trimmedWord = word.trim().toLowerCase();
      if (!trimmedWord) {
        return res.status(400).json({ message: "Palabra requerida" });
      }
      const builtin = getBuiltinWords();
      const custom = getCustomWords();
      if (builtin.includes(trimmedWord) || custom.includes(trimmedWord)) {
        return res.status(409).json({ message: "La palabra ya existe en la lista" });
      }
      const updated = [...custom, trimmedWord];
      await storage.setSetting("custom_profanity_words", JSON.stringify(updated));
      setCustomWords(updated);
      res.json({ success: true, word: trimmedWord });
    } catch (error: any) {
      res.status(500).json({ message: "Error al agregar palabra" });
    }
  });

  app.delete("/api/admin/profanity-words/:word", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const word = decodeURIComponent(req.params.word).toLowerCase();
      const custom = getCustomWords();
      if (!custom.includes(word)) {
        return res.status(404).json({ message: "Palabra no encontrada en la lista personalizada" });
      }
      const updated = custom.filter(w => w !== word);
      await storage.setSetting("custom_profanity_words", JSON.stringify(updated));
      setCustomWords(updated);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error al eliminar palabra" });
    }
  });

  app.get("/api/messages/session/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      if (!sessionId || sessionId.length < 5) {
        return res.status(400).json({ message: "Session ID invalido" });
      }
      const messages = await storage.getMessagesBySessionId(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.get("/api/messages/thread/:email", async (req, res) => {
    try {
      const email = req.params.email;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Email invalido" });
      }
      const tenantIdParam = req.query.tenantId as string | undefined;
      const tenantId = tenantIdParam ? parseInt(tenantIdParam, 10) : undefined;
      const msgs = await storage.getMessagesByEmail(email.toLowerCase(), tenantId !== undefined && !isNaN(tenantId) ? tenantId : undefined);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener hilo" });
    }
  });

  app.get("/api/sessions/by-email/:email", async (req, res) => {
    try {
      const email = req.params.email;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Email invalido" });
      }
      const tenantIdParam = req.query.tenantId as string | undefined;
      const tenantId = tenantIdParam ? parseInt(tenantIdParam, 10) : undefined;
      const userSessions = await storage.getSessionsByEmail(email.toLowerCase(), tenantId !== undefined && !isNaN(tenantId) ? tenantId : undefined);
      res.json(userSessions);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener sesiones" });
    }
  });

  app.get("/api/session/resolve/:email", async (req, res) => {
    try {
      const email = req.params.email;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Email invalido" });
      }
      const tenantIdParam = req.query.tenantId as string | undefined;
      const tenantId = tenantIdParam ? parseInt(tenantIdParam, 10) : undefined;
      const session = await storage.findActiveSessionByEmail(email.toLowerCase(), tenantId !== undefined && !isNaN(tenantId) ? tenantId : undefined);
      if (session) {
        res.json({ sessionId: session.sessionId });
      } else {
        res.json({ sessionId: null });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al resolver sesión" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";

      if (req.body.sender === "user") {
        if (!checkMessageRateLimit(clientIp, req.body.userEmail || "")) {
          return res.status(429).json({ message: "Demasiados mensajes. Espera un momento antes de enviar otro." });
        }
      }

      const hasImage = !!req.body.imageUrl;
      const bodyForValidation = { ...req.body };
      if (hasImage && (!bodyForValidation.content || bodyForValidation.content.trim() === "")) {
        const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(req.body.imageUrl || "");
        bodyForValidation.content = isVideo ? "Video enviado" : "Imagen enviada";
      }
      const parsed = socketMessageSchema.safeParse(bodyForValidation);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos de mensaje invalidos" });
      }

      const sessionId = req.body.sessionId;
      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ message: "Session ID requerido" });
      }

      const normalizedEmail = parsed.data.userEmail.toLowerCase();

      let tenantId = req.body.tenantId ? parseInt(req.body.tenantId, 10) : null;

      const existingSessionForTenant = await storage.getSession(sessionId);
      if (!tenantId && existingSessionForTenant?.tenantId) {
        tenantId = existingSessionForTenant.tenantId;
      }

      if (tenantId && parsed.data.sender === "user") {
        const tenant = await storage.getTenantById(tenantId);
        if (tenant) {
          const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS.free;
          if (limits.maxMessages !== Infinity || limits.maxSessions !== Infinity) {
            const usage = await storage.getTenantMonthlyUsage(tenantId);
            if (usage.messagesCount >= limits.maxMessages) {
              return res.status(429).json({
                message: "Se alcanzó el límite de mensajes de tu plan. Contacta al administrador para mejorar el plan.",
                limitType: "messages",
                current: usage.messagesCount,
                max: limits.maxMessages,
              });
            }
            if (usage.sessionsCount >= limits.maxSessions) {
              const existingSession = await storage.getSession(sessionId);
              if (!existingSession) {
                return res.status(429).json({
                  message: "Se alcanzó el límite de sesiones de tu plan. Contacta al administrador para mejorar el plan.",
                  limitType: "sessions",
                  current: usage.sessionsCount,
                  max: limits.maxSessions,
                });
              }
            }
          }
        }
      }

      const upsertData: { sessionId: string; userEmail: string; userName: string; problemType?: string; gameName?: string; tenantId?: number | null } = {
        sessionId,
        userEmail: normalizedEmail,
        userName: parsed.data.userName,
      };
      if (req.body.problemType) upsertData.problemType = req.body.problemType;
      if (req.body.gameName) upsertData.gameName = req.body.gameName;
      if (tenantId) upsertData.tenantId = tenantId;
      await storage.upsertSession(upsertData);

      if (parsed.data.sender === "user") {
        const blocked = await storage.isSessionBlocked(sessionId);
        if (blocked) {
          return res.status(403).json({ message: "Tu chat ha sido bloqueado por uso reiterado de lenguaje inapropiado." });
        }

        const profanityCheck = containsProfanity(parsed.data.content);
        if (profanityCheck.hasProfanity) {
          const newCount = await storage.incrementWarningCount(sessionId);
          if (newCount >= BLOCK_THRESHOLD) {
            await storage.blockSession(sessionId);
          }
          const warningText = getProfanityWarningMessage(newCount);

          const blockedMsg = await storage.createMessage({
            sessionId,
            userEmail: normalizedEmail,
            userName: parsed.data.userName,
            sender: "user",
            content: "[Mensaje con contenido inapropiado]",
            imageUrl: null,
            tenantId,
          });
          io.to(`session:${sessionId}`).emit("new_message", blockedMsg);
          io.to("admin_room").emit("admin_new_message", { sessionId, message: blockedMsg });

          const warningMsg = await storage.createMessage({
            sessionId,
            userEmail: normalizedEmail,
            userName: "Soporte",
            sender: "support",
            content: warningText,
            tenantId,
          });
          io.to(`session:${sessionId}`).emit("new_message", warningMsg);
          io.to("admin_room").emit("admin_new_message", { sessionId, message: warningMsg });
          await storage.touchSession(sessionId);

          return res.status(200).json(blockedMsg);
        }
      }

      const message = await storage.createMessage({
        sessionId,
        userEmail: normalizedEmail,
        userName: parsed.data.userName,
        sender: parsed.data.sender,
        content: parsed.data.content,
        imageUrl: req.body.imageUrl || null,
        tenantId,
      });

      await storage.touchSession(sessionId);

      const sess = await storage.getSession(sessionId);
      io.to(`session:${sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId, message, assignedTo: sess?.assignedTo || null });
      if (sess?.tenantId) {
        io.to(`tenant:${sess.tenantId}`).emit("tenant_new_message", { sessionId, userName: parsed.data.userName, content: parsed.data.content, message });
      }

      if (parsed.data.sender === "user") {
        sendPushToAdmins(
          `Nuevo mensaje de ${parsed.data.userName}`,
          parsed.data.content.substring(0, 100),
          sessionId,
          sess?.assignedTo
        );
        if (tenantId) {
          sendPushToTenant(
            tenantId,
            `Nuevo mensaje de ${parsed.data.userName}`,
            parsed.data.content.substring(0, 100),
            sessionId
          );
        }
      }

      if (parsed.data.sender === "user" && !req.body.imageUrl) {
        const pageUrl = req.body.pageUrl || "";
        const pageTitle = req.body.pageTitle || "";
        setTimeout(async () => {
          try {
            const currentSession = await storage.getSession(sessionId);
            if (currentSession?.adminActive) return;

            const historyMessages = await storage.getMessagesBySessionId(sessionId);
            const conversationHistory = historyMessages.map(m => ({
              sender: m.sender,
              content: m.content,
            }));

            const catalogLookup = {
              searchByName: async (query: string) => {
                const results = await storage.searchProductsByName(query);
                return results.map(p => ({
                  name: p.name,
                  price: p.price,
                  productUrl: p.productUrl,
                  availability: p.availability,
                  platform: p.platform,
                  description: p.description,
                  category: p.category,
                  accountType: p.accountType,
                }));
              },
              getByPlatform: async (platform: string) => {
                const results = await storage.getProductsByPlatform(platform);
                return results.map(p => ({
                  name: p.name,
                  price: p.price,
                  productUrl: p.productUrl,
                  availability: p.availability,
                  platform: p.platform,
                  description: p.description,
                  category: p.category,
                  accountType: p.accountType,
                }));
              },
              getByCategory: async (category: string) => {
                const results = await storage.getProductsByCategory(category);
                return results.map(p => ({
                  name: p.name,
                  price: p.price,
                  productUrl: p.productUrl,
                  availability: p.availability,
                  platform: p.platform,
                  description: p.description,
                  category: p.category,
                  accountType: p.accountType,
                }));
              },
              getTotalCount: async () => {
                return storage.getProductCount();
              },
            };

            const autoReplyInput = req.body.quickReplyValue || parsed.data.content;
            const replyContent = await getSmartAutoReply(
              autoReplyInput,
              conversationHistory,
              {
                problemType: req.body.problemType || currentSession?.problemType || null,
                gameName: req.body.gameName || currentSession?.gameName || null,
                pageTitle: pageTitle || null,
                pageUrl: pageUrl || null,
                userName: parsed.data.userName || null,
                wpProductName: req.body.productName || null,
                wpProductPrice: req.body.productPrice || null,
                wpProductUrl: req.body.productUrl || null,
              },
              catalogLookup,
              tenantId || null
            );

            const autoReply = await storage.createMessage({
              sessionId,
              userEmail: normalizedEmail,
              userName: "Soporte",
              sender: "support",
              content: replyContent,
              tenantId,
            });
            io.to(`session:${sessionId}`).emit("new_message", autoReply);
            io.to("admin_room").emit("admin_new_message", { sessionId, message: autoReply });
            if (tenantId) {
              io.to(`tenant:${tenantId}`).emit("tenant_new_message", { sessionId, message: autoReply });
            }

            if (!isSessionOnline(sessionId)) {
              sendOfflineNotification({
                userName: parsed.data.userName,
                userEmail: parsed.data.userEmail,
                messageContent: autoReply.content,
                sessionId,
              }).catch(() => {});
            }
          } catch (err: any) {
            log(`Error en auto-respuesta: ${err.message}`, "api");
          }
        }, 1500);
      }

      if (parsed.data.sender === "support" && !isSessionOnline(sessionId)) {
        const session = await storage.getSession(sessionId);
        if (session) {
          sendOfflineNotification({
            userName: session.userName,
            userEmail: session.userEmail,
            messageContent: parsed.data.content,
            sessionId,
          }).catch(() => {});
        }
      }

      res.json(message);
    } catch (error: any) {
      log(`Error al guardar mensaje: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar mensaje" });
    }
  });

  app.post("/api/contact-executive", async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos" });
      }

      const recentMessages = await storage.getMessagesBySessionId(parsed.data.sessionId);
      const lastMessages = recentMessages.slice(-10);
      const chatSummary = lastMessages
        .map((m) => `${m.sender === "user" ? parsed.data.userName : "Soporte"}: ${m.content}`)
        .join("\n");

      const normalizedEmail = parsed.data.userEmail.toLowerCase();

      const contactTenantId = req.body.tenantId ? parseInt(req.body.tenantId, 10) : null;
      const contactRequest = await storage.createContactRequest({
        userEmail: normalizedEmail,
        userName: parsed.data.userName,
        pageUrl: parsed.data.pageUrl || null,
        pageTitle: parsed.data.pageTitle || null,
        chatSummary: chatSummary || null,
        problemType: parsed.data.problemType || null,
        gameName: parsed.data.gameName || null,
        tenantId: contactTenantId,
      });

      const emailSent = await sendContactNotification({
        userName: parsed.data.userName,
        userEmail: parsed.data.userEmail,
        pageUrl: parsed.data.pageUrl,
        pageTitle: parsed.data.pageTitle,
        chatSummary,
        problemType: parsed.data.problemType,
        gameName: parsed.data.gameName,
      });

      const confirmMsg = await storage.createMessage({
        sessionId: parsed.data.sessionId,
        userEmail: normalizedEmail,
        userName: "Soporte",
        sender: "support",
        content: emailSent
          ? "Tu solicitud ha sido enviada. Un ejecutivo se pondrá en contacto contigo por correo electrónico lo antes posible."
          : "Hemos registrado tu solicitud. Un ejecutivo se comunicara contigo pronto.",
        tenantId: contactTenantId,
      });

      io.to(`session:${parsed.data.sessionId}`).emit("new_message", confirmMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: parsed.data.sessionId, message: confirmMsg });
      log(`Solicitud de contacto de ${parsed.data.userName} (${parsed.data.userEmail}) - Email: ${emailSent ? "enviado" : "no enviado"}`, "contact");
      res.json({ confirmed: true });
    } catch (error: any) {
      log(`Error en solicitud de contacto: ${error.message}`, "api");
      res.status(500).json({ message: "Error al procesar solicitud" });
    }
  });

  app.get("/api/canned-responses", async (_req, res) => {
    try {
      const responses = await storage.getCannedResponses();
      res.json(responses);
    } catch (error: any) {
      log(`Error al obtener respuestas rapidas: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener respuestas" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña requeridos" });
      }
      const user = await storage.getAdminUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      const token = generateToken({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName, color: user.color } });
    } catch (error: any) {
      log(`Error en login: ${error.message}`, "auth");
      res.status(500).json({ message: "Error en autenticacion" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const dbUser = await storage.getAdminUserById(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    res.json({ id: dbUser.id, email: dbUser.email, role: dbUser.role, displayName: dbUser.displayName, color: dbUser.color });
  });

  function generateTenantToken(tenant: { id: number; email: string; companyName: string }) {
    return jwt.sign({ id: tenant.id, email: tenant.email, companyName: tenant.companyName, isTenant: true, role: "owner" }, JWT_SECRET, { expiresIn: "7d" });
  }

  function generateAgentToken(agent: { id: number; tenantId: number; email: string; displayName: string; role: string; color: string }, companyName: string) {
    return jwt.sign({ id: agent.tenantId, agentId: agent.id, email: agent.email, companyName, displayName: agent.displayName, role: agent.role, color: agent.color, isTenant: true, isAgent: true }, JWT_SECRET, { expiresIn: "7d" });
  }

  interface TenantAuthResult {
    id: number;
    email: string;
    companyName: string;
    role: "owner" | "admin" | "ejecutivo";
    agentId?: number;
    displayName?: string;
    color?: string;
    isAgent?: boolean;
  }

  function verifyTenantToken(token: string): TenantAuthResult | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded.isTenant) return null;
      return {
        id: decoded.id,
        email: decoded.email,
        companyName: decoded.companyName,
        role: decoded.isAgent ? decoded.role : "owner",
        agentId: decoded.agentId,
        displayName: decoded.displayName,
        color: decoded.color,
        isAgent: decoded.isAgent || false,
      };
    } catch { return null; }
  }

  function requireTenantAuth(req: any, res: any): TenantAuthResult | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No autorizado" });
      return null;
    }
    const token = authHeader.substring(7);
    const tenant = verifyTenantToken(token);
    if (!tenant) {
      res.status(401).json({ message: "Token invalido o expirado" });
      return null;
    }
    return tenant;
  }

  function requireTenantOwnerOrAdmin(req: any, res: any): TenantAuthResult | null {
    const auth = requireTenantAuth(req, res);
    if (!auth) return null;
    if (auth.role === "ejecutivo") {
      res.status(403).json({ message: "No tienes permisos para esta accion" });
      return null;
    }
    return auth;
  }

  app.post("/api/tenants/register", async (req, res) => {
    try {
      const { name, email, password, companyName, referralCode } = req.body;
      if (!name || !email || !password || !companyName) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }
      const existing = await storage.getTenantByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "Ya existe una cuenta con este email" });
      }
      let referrerId: number | undefined;
      if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
        const referrer = await storage.getTenantByReferralCode(referralCode.trim().toUpperCase());
        if (referrer) {
          referrerId = referrer.id;
        }
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const tenant = await storage.createTenant({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        companyName,
        ...(referrerId ? { referredBy: referrerId } : {}),
      });
      if (referrerId) {
        try {
          await storage.createReferral({ referrerId, referredId: tenant.id });
          log(`Referral tracked: tenant ${tenant.id} referred by ${referrerId} (code: ${referralCode})`, "referral");
        } catch (e: any) {
          log(`Error creating referral record: ${e.message}`, "referral");
        }
      }
      const token = generateTenantToken({ id: tenant.id, email: tenant.email, companyName: tenant.companyName });
      res.status(201).json({
        token,
        tenant: { id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, welcomeMessage: tenant.welcomeMessage, logoUrl: tenant.logoUrl, domain: tenant.domain },
      });
    } catch (error: any) {
      log(`Error en registro de tenant: ${error.message}`, "auth");
      res.status(500).json({ message: "Error en registro" });
    }
  });

  app.post("/api/tenants/google-auth", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ message: "Token de Google requerido" });
      }
      const { OAuth2Client } = await import("google-auth-library");
      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ message: "Token de Google invalido" });
      }
      const email = payload.email.toLowerCase().trim();
      const name = payload.name || email.split("@")[0];
      const picture = payload.picture || null;
      let tenant = await storage.getTenantByEmail(email);
      if (!tenant) {
        const crypto = await import("crypto");
        const randomPass = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(randomPass, 10);
        tenant = await storage.createTenant({
          name,
          email,
          passwordHash,
          companyName: name,
          avatarUrl: picture,
        });
      } else if (picture && tenant.avatarUrl !== picture) {
        tenant = (await storage.updateTenant(tenant.id, { avatarUrl: picture } as any)) || tenant;
      }
      const token = generateTenantToken({ id: tenant.id, email: tenant.email, companyName: tenant.companyName });
      res.json({
        token,
        isNew: !!(tenant.companyName === name && tenant.plan === "free"),
        tenant: { id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, welcomeMessage: tenant.welcomeMessage, logoUrl: tenant.logoUrl, avatarUrl: tenant.avatarUrl, domain: tenant.domain },
      });
    } catch (error: any) {
      log(`Error en Google auth: ${error.message}`, "auth");
      res.status(401).json({ message: "Error de autenticacion con Google" });
    }
  });

  app.post("/api/tenants/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña requeridos" });
      }
      const tenant = await storage.getTenantByEmail(email.toLowerCase().trim());
      if (!tenant) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      const valid = await bcrypt.compare(password, tenant.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      const token = generateTenantToken({ id: tenant.id, email: tenant.email, companyName: tenant.companyName });
      res.json({
        token,
        tenant: { id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, welcomeMessage: tenant.welcomeMessage, logoUrl: tenant.logoUrl, domain: tenant.domain },
      });
    } catch (error: any) {
      log(`Error en login de tenant: ${error.message}`, "auth");
      res.status(500).json({ message: "Error en autenticacion" });
    }
  });

  app.get("/api/tenants/me", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const tenant = await storage.getTenantById(auth.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant no encontrado" });
    }
    res.json({ id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, headerTextColor: tenant.headerTextColor, botBubbleColor: tenant.botBubbleColor, botTextColor: tenant.botTextColor, userTextColor: tenant.userTextColor, welcomeMessage: tenant.welcomeMessage, welcomeSubtitle: tenant.welcomeSubtitle, logoUrl: tenant.logoUrl, logoScale: tenant.logoScale, avatarUrl: tenant.avatarUrl, launcherImageUrl: tenant.launcherImageUrl, launcherImageScale: tenant.launcherImageScale, botIconUrl: tenant.botIconUrl, botIconScale: tenant.botIconScale, widgetPosition: tenant.widgetPosition, labelContactButton: tenant.labelContactButton, labelTicketButton: tenant.labelTicketButton, labelFinalizeButton: tenant.labelFinalizeButton, domain: tenant.domain, formFields: tenant.formFields, consultationOptions: tenant.consultationOptions, showProductSearch: tenant.showProductSearch, productSearchLabel: tenant.productSearchLabel, productApiUrl: tenant.productApiUrl, botConfigured: tenant.botConfigured, onboardingStep: tenant.onboardingStep, welcomeBannerText: tenant.welcomeBannerText, launcherBubbleText: tenant.launcherBubbleText, launcherBubbleStyle: tenant.launcherBubbleStyle, createdAt: tenant.createdAt });
  });

  app.patch("/api/tenants/me", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { companyName, widgetColor, headerTextColor, botBubbleColor, botTextColor, userTextColor, welcomeMessage, welcomeSubtitle, logoUrl, logoScale, avatarUrl, launcherImageUrl, launcherImageScale, botIconUrl, botIconScale, widgetPosition, labelContactButton, labelTicketButton, labelFinalizeButton, domain, formFields, consultationOptions, showProductSearch, productSearchLabel, productApiUrl, botConfigured, onboardingStep, welcomeBannerText, launcherBubbleText, launcherBubbleStyle } = req.body;
      const updates: any = {};
      if (companyName !== undefined) updates.companyName = companyName;
      if (widgetColor !== undefined) updates.widgetColor = widgetColor;
      if (headerTextColor !== undefined) updates.headerTextColor = headerTextColor;
      if (botBubbleColor !== undefined) updates.botBubbleColor = botBubbleColor;
      if (botTextColor !== undefined) updates.botTextColor = botTextColor;
      if (userTextColor !== undefined) updates.userTextColor = userTextColor;
      if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
      if (welcomeSubtitle !== undefined) updates.welcomeSubtitle = welcomeSubtitle;
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (logoScale !== undefined) updates.logoScale = Math.min(200, Math.max(50, Number(logoScale) || 100));
      if (launcherImageScale !== undefined) updates.launcherImageScale = Math.min(200, Math.max(50, Number(launcherImageScale) || 100));
      if (botIconScale !== undefined) updates.botIconScale = Math.min(200, Math.max(50, Number(botIconScale) || 100));
      if (domain !== undefined) updates.domain = domain;
      if (formFields !== undefined) updates.formFields = formFields;
      if (consultationOptions !== undefined) updates.consultationOptions = consultationOptions;
      if (showProductSearch !== undefined) updates.showProductSearch = showProductSearch;
      if (productSearchLabel !== undefined) updates.productSearchLabel = productSearchLabel;
      if (productApiUrl !== undefined) updates.productApiUrl = productApiUrl;
      if (botConfigured !== undefined) updates.botConfigured = botConfigured;
      if (onboardingStep !== undefined) updates.onboardingStep = onboardingStep;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      if (launcherImageUrl !== undefined) updates.launcherImageUrl = launcherImageUrl;
      if (botIconUrl !== undefined) updates.botIconUrl = botIconUrl;
      if (widgetPosition !== undefined && (widgetPosition === "left" || widgetPosition === "right")) updates.widgetPosition = widgetPosition;
      if (labelContactButton !== undefined) updates.labelContactButton = labelContactButton || null;
      if (labelTicketButton !== undefined) updates.labelTicketButton = labelTicketButton || null;
      if (labelFinalizeButton !== undefined) updates.labelFinalizeButton = labelFinalizeButton || null;
      if (welcomeBannerText !== undefined) updates.welcomeBannerText = welcomeBannerText || null;
      if (launcherBubbleText !== undefined) updates.launcherBubbleText = launcherBubbleText || null;
      if (launcherBubbleStyle !== undefined) updates.launcherBubbleStyle = launcherBubbleStyle || "normal";
      const tenant = await storage.updateTenant(auth.id, updates);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant no encontrado" });
      }
      res.json({ id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, headerTextColor: tenant.headerTextColor, botBubbleColor: tenant.botBubbleColor, botTextColor: tenant.botTextColor, userTextColor: tenant.userTextColor, welcomeMessage: tenant.welcomeMessage, welcomeSubtitle: tenant.welcomeSubtitle, logoUrl: tenant.logoUrl, logoScale: tenant.logoScale, avatarUrl: tenant.avatarUrl, launcherImageUrl: tenant.launcherImageUrl, launcherImageScale: tenant.launcherImageScale, botIconUrl: tenant.botIconUrl, botIconScale: tenant.botIconScale, widgetPosition: tenant.widgetPosition, labelContactButton: tenant.labelContactButton, labelTicketButton: tenant.labelTicketButton, labelFinalizeButton: tenant.labelFinalizeButton, domain: tenant.domain, formFields: tenant.formFields, consultationOptions: tenant.consultationOptions, showProductSearch: tenant.showProductSearch, productSearchLabel: tenant.productSearchLabel, productApiUrl: tenant.productApiUrl, botConfigured: tenant.botConfigured, onboardingStep: tenant.onboardingStep, welcomeBannerText: tenant.welcomeBannerText, launcherBubbleText: tenant.launcherBubbleText, launcherBubbleStyle: tenant.launcherBubbleStyle });
    } catch (error: any) {
      log(`Error actualizando tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar" });
    }
  });

  // ========== WORDPRESS PLUGIN DOWNLOAD ==========
  app.get("/api/tenants/me/wordpress-plugin", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const tenant = await storage.getTenantById(auth.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const tenantId = tenant.id;
      const pluginSlug = "foxbot-chat";
      const companyName = tenant.companyName || "FoxBot";

      const pluginPhp = `<?php
/**
 * Plugin Name: FoxBot Chat - ${companyName}
 * Plugin URI: https://foxbot.cl
 * Description: Chatbot inteligente de FoxBot para ${companyName}. Se instala automaticamente en todas las paginas de tu sitio WordPress.
 * Version: 1.0.0
 * Author: Web Maker Chile
 * Author URI: https://foxbot.cl
 * License: GPL v2 or later
 * Text Domain: foxbot-chat
 */

if (!defined('ABSPATH')) exit;

define('FOXBOT_TENANT_ID', '${tenantId}');
define('FOXBOT_BASE_URL', '${baseUrl}');

function foxbot_enqueue_widget() {
    $tenant_id = FOXBOT_TENANT_ID;
    $base_url = FOXBOT_BASE_URL;

    $script = "
    (function() {
        if (document.getElementById('foxbot-widget')) return;
        var iframe = document.createElement('iframe');
        iframe.id = 'foxbot-widget';
        iframe.src = '" . esc_url($base_url) . "/widget?tenantId=" . intval($tenant_id) . "';
        iframe.allow = 'microphone';
        var pos = 'right';
        function setPos(p, state, w, h) {
            var s = p === 'left' ? 'left' : 'right';
            var o = p === 'left' ? 'right' : 'left';
            var mobile = window.innerWidth <= 480;
            if (state === 'open') {
                if (mobile) {
                    iframe.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:100%;border:none;z-index:9999;';
                } else {
                    iframe.style.cssText = 'position:fixed;bottom:16px;' + s + ':16px;' + o + ':auto;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
                }
            } else {
                var cw = (w || 70) + 'px';
                var ch = (h || 70) + 'px';
                iframe.style.cssText = 'position:fixed;bottom:12px;' + s + ':12px;' + o + ':auto;width:' + cw + ';height:' + ch + ';border:none;z-index:9999;';
            }
        }
        setPos(pos, 'closed');
        document.body.appendChild(iframe);
        window.addEventListener('message', function(e) {
            if (!e.data || !e.data.type) return;
            if (e.data.position) pos = e.data.position;
            if (e.data.type === 'foxbot_position') { pos = e.data.position; setPos(pos, 'closed'); }
            if (e.data.type === 'open_chat') setPos(pos, 'open');
            if (e.data.type === 'close_chat') setPos(pos, 'closed', e.data.width, e.data.height);
        });
    })();
    ";

    wp_register_script('foxbot-widget', '', array(), '1.0.0', true);
    wp_enqueue_script('foxbot-widget');
    wp_add_inline_script('foxbot-widget', $script);
}
add_action('wp_enqueue_scripts', 'foxbot_enqueue_widget');

function foxbot_settings_link($links) {
    $settings_link = '<a href="https://foxbot.cl/dashboard" target="_blank">Configurar en FoxBot</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'foxbot_settings_link');

function foxbot_admin_notice() {
    if (!current_user_can('manage_options')) return;
    echo '<div class="notice notice-success is-dismissible"><p><strong>FoxBot Chat activo</strong> - Tu chatbot inteligente esta funcionando en todas las paginas. <a href="https://foxbot.cl/dashboard" target="_blank">Ir al panel de FoxBot</a></p></div>';
}
register_activation_hook(__FILE__, function() {
    set_transient('foxbot_activation_notice', true, 5);
});
add_action('admin_notices', function() {
    if (get_transient('foxbot_activation_notice')) {
        foxbot_admin_notice();
        delete_transient('foxbot_activation_notice');
    }
});
?>`;

      const readmeTxt = `=== FoxBot Chat - ${companyName} ===
Contributors: webmakerchile
Tags: chatbot, ai, live chat, customer support, foxbot
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Chatbot inteligente de FoxBot para ${companyName}.

== Description ==

FoxBot es un chatbot impulsado por inteligencia artificial que se integra automaticamente en tu sitio WordPress. No requiere configuracion adicional - simplemente activa el plugin y tu chatbot estara funcionando.

Caracteristicas:
* Respuestas inteligentes con IA
* Soporte en tiempo real
* Totalmente personalizable desde foxbot.cl/dashboard
* Compatible con todos los temas de WordPress
* Responsive - funciona en escritorio y movil

== Installation ==

1. Sube el archivo ZIP desde Plugins > Añadir nuevo > Subir plugin
2. Activa el plugin
3. Listo! El chatbot aparecera automaticamente en tu sitio

Para personalizar tu chatbot, visita https://foxbot.cl/dashboard

== Changelog ==

= 1.0.0 =
* Version inicial
`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${pluginSlug}.zip"`);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);
      archive.append(pluginPhp, { name: `${pluginSlug}/${pluginSlug}.php` });
      archive.append(readmeTxt, { name: `${pluginSlug}/readme.txt` });
      await archive.finalize();

    } catch (error: any) {
      log(`Error generando plugin WordPress: ${error.message}`, "api");
      if (!res.headersSent) {
        res.status(500).json({ message: "Error al generar plugin" });
      }
    }
  });

  // ========== TENANT AGENT LOGIN ==========
  app.post("/api/tenant-agents/login", async (req, res) => {
    try {
      const { email, password, tenantId } = req.body;
      if (!email || !password || !tenantId) {
        return res.status(400).json({ message: "Email, contraseña y ID de empresa son requeridos" });
      }
      const tid = parseInt(tenantId);
      if (isNaN(tid)) return res.status(400).json({ message: "ID de empresa invalido" });
      const tenant = await storage.getTenantById(tid);
      if (!tenant) return res.status(404).json({ message: "Empresa no encontrada" });
      const agent = await storage.getTenantAgentByEmail(tid, email.toLowerCase().trim());
      if (!agent) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      if (agent.active !== 1) {
        return res.status(403).json({ message: "Tu cuenta esta desactivada. Contacta al administrador." });
      }
      const valid = await bcrypt.compare(password, agent.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      await storage.updateTenantAgentLastLogin(agent.id);
      const token = generateAgentToken(agent, tenant.companyName);
      res.json({ token, agent: { id: agent.id, displayName: agent.displayName, email: agent.email, role: agent.role, color: agent.color }, tenantId: tenant.id, companyName: tenant.companyName });
    } catch (error: any) {
      log(`Error agent login: ${error.message}`, "api");
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  // ========== TENANT AGENT MANAGEMENT (owner/admin only) ==========
  app.get("/api/tenant-panel/agents", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const agents = await storage.getTenantAgents(auth.id);
      res.json(agents.map(a => ({ id: a.id, tenantId: a.tenantId, email: a.email, displayName: a.displayName, role: a.role, color: a.color, active: a.active, lastLoginAt: a.lastLoginAt, createdAt: a.createdAt })));
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener agentes" });
    }
  });

  app.post("/api/tenant-panel/agents", async (req, res) => {
    const auth = requireTenantOwnerOrAdmin(req, res);
    if (!auth) return;
    try {
      const { email, password, displayName, role, color } = req.body;
      if (!email || !password || !displayName) {
        return res.status(400).json({ message: "Email, contraseña y nombre son requeridos" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }
      const agentRole = role || "ejecutivo";
      if (auth.role !== "owner" && agentRole === "admin") {
        return res.status(403).json({ message: "Solo el propietario puede crear administradores" });
      }
      if (agentRole === "owner") {
        return res.status(403).json({ message: "No se puede crear otro propietario" });
      }
      const tenant = await storage.getTenantById(auth.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS.free;
      const currentCount = await storage.countTenantAgents(auth.id);
      if (currentCount >= limits.maxAgents) {
        return res.status(403).json({ message: `Tu plan ${tenant.plan === "free" ? "Fox Free" : tenant.plan === "basic" ? "Fox Pro" : "Fox Enterprise"} permite maximo ${limits.maxAgents} ejecutivo(s). Actualiza tu plan para agregar mas.` });
      }
      const existing = await storage.getTenantAgentByEmail(auth.id, email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "Ya existe un ejecutivo con este email" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const agent = await storage.createTenantAgent({
        tenantId: auth.id,
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName,
        role: agentRole,
        color: color || "#10b981",
        active: 1,
      });
      res.json({ id: agent.id, tenantId: agent.tenantId, email: agent.email, displayName: agent.displayName, role: agent.role, color: agent.color, active: agent.active, createdAt: agent.createdAt });
    } catch (error: any) {
      log(`Error creating agent: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear ejecutivo" });
    }
  });

  app.patch("/api/tenant-panel/agents/:id", async (req, res) => {
    const auth = requireTenantOwnerOrAdmin(req, res);
    if (!auth) return;
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) return res.status(400).json({ message: "ID invalido" });
      const targetAgent = await storage.getTenantAgentById(agentId);
      if (!targetAgent || targetAgent.tenantId !== auth.id) {
        return res.status(404).json({ message: "Ejecutivo no encontrado" });
      }
      if (targetAgent.role === "owner" && auth.role !== "owner") {
        return res.status(403).json({ message: "No puedes modificar al propietario" });
      }
      const { displayName, color, role, active, password } = req.body;
      const updates: any = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (color !== undefined) updates.color = color;
      if (active !== undefined) updates.active = active;
      if (role !== undefined) {
        if (role === "owner") return res.status(403).json({ message: "No se puede asignar rol de propietario" });
        if (targetAgent.role === "owner") return res.status(403).json({ message: "No se puede cambiar el rol del propietario" });
        if (auth.role !== "owner" && role === "admin") return res.status(403).json({ message: "Solo el propietario puede asignar administradores" });
        updates.role = role;
      }
      if (password && password.length >= 6) {
        updates.passwordHash = await bcrypt.hash(password, 10);
      }
      const updated = await storage.updateTenantAgent(auth.id, agentId, updates);
      if (!updated) return res.status(404).json({ message: "No se pudo actualizar" });
      res.json({ id: updated.id, tenantId: updated.tenantId, email: updated.email, displayName: updated.displayName, role: updated.role, color: updated.color, active: updated.active, lastLoginAt: updated.lastLoginAt, createdAt: updated.createdAt });
    } catch (error: any) {
      log(`Error updating agent: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar ejecutivo" });
    }
  });

  app.delete("/api/tenant-panel/agents/:id", async (req, res) => {
    const auth = requireTenantOwnerOrAdmin(req, res);
    if (!auth) return;
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) return res.status(400).json({ message: "ID invalido" });
      const targetAgent = await storage.getTenantAgentById(agentId);
      if (!targetAgent || targetAgent.tenantId !== auth.id) {
        return res.status(404).json({ message: "Ejecutivo no encontrado" });
      }
      if (targetAgent.role === "owner") {
        return res.status(403).json({ message: "No se puede eliminar al propietario de la cuenta" });
      }
      if (auth.isAgent && auth.agentId === agentId) {
        return res.status(403).json({ message: "No puedes eliminarte a ti mismo" });
      }
      const deleted = await storage.deleteTenantAgent(auth.id, agentId);
      if (!deleted) return res.status(404).json({ message: "No se pudo eliminar" });
      res.json({ success: true });
    } catch (error: any) {
      log(`Error deleting agent: ${error.message}`, "api");
      res.status(500).json({ message: "Error al eliminar ejecutivo" });
    }
  });

  app.get("/api/tenant-panel/agents/me", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const tenant = await storage.getTenantById(auth.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      if (auth.isAgent && auth.agentId) {
        const agent = await storage.getTenantAgentById(auth.agentId);
        if (!agent || agent.tenantId !== auth.id) return res.status(404).json({ message: "Agente no encontrado" });
        res.json({ id: agent.id, tenantId: agent.tenantId, email: agent.email, displayName: agent.displayName, role: agent.role, color: agent.color, active: agent.active, companyName: tenant.companyName, plan: tenant.plan, isAgent: true });
      } else {
        res.json({ id: 0, tenantId: auth.id, email: auth.email, displayName: tenant.companyName, role: "owner", color: tenant.widgetColor, active: 1, companyName: tenant.companyName, plan: tenant.plan, isAgent: false });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.get("/api/tenants/:id/config", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });
      const tenant = await storage.getTenantById(id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      res.json({
        id: tenant.id,
        companyName: tenant.companyName,
        widgetColor: tenant.widgetColor,
        headerTextColor: tenant.headerTextColor,
        botBubbleColor: tenant.botBubbleColor,
        botTextColor: tenant.botTextColor,
        userTextColor: tenant.userTextColor,
        welcomeMessage: tenant.welcomeMessage,
        welcomeSubtitle: tenant.welcomeSubtitle,
        logoUrl: tenant.logoUrl,
        logoScale: tenant.logoScale,
        launcherImageUrl: tenant.launcherImageUrl,
        launcherImageScale: tenant.launcherImageScale,
        botIconUrl: tenant.botIconUrl,
        botIconScale: tenant.botIconScale,
        widgetPosition: tenant.widgetPosition,
        labelContactButton: tenant.labelContactButton,
        labelTicketButton: tenant.labelTicketButton,
        labelFinalizeButton: tenant.labelFinalizeButton,
        formFields: tenant.formFields,
        consultationOptions: tenant.consultationOptions,
        showProductSearch: tenant.showProductSearch,
        productSearchLabel: tenant.productSearchLabel,
        welcomeBannerText: tenant.welcomeBannerText,
        launcherBubbleText: tenant.launcherBubbleText,
        launcherBubbleStyle: tenant.launcherBubbleStyle,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.get("/api/tenants/me/stats", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const stats = await storage.getTenantStats(auth.id);
      res.json(stats);
    } catch (error: any) {
      log(`Error obteniendo stats tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener estadisticas" });
    }
  });

  app.post("/api/tenants/me/checkout", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { plan } = req.body;
      if (!plan || !PLAN_PRICES[plan]) {
        return res.status(400).json({ message: "Plan invalido" });
      }

      const tenant = await storage.getTenantById(auth.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });

      if (tenant.plan === plan) {
        return res.status(400).json({ message: "Ya tienes este plan activo" });
      }

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost:5000";
      const baseURL = `${protocol}://${host}`;

      const flowApi = getFlowApi(baseURL);
      const planInfo = PLAN_PRICES[plan];
      const commerceOrder = `foxbot_${auth.id}_${plan}_${Date.now()}`;

      const paymentOrder = await storage.createPaymentOrder({
        tenantId: auth.id,
        commerceOrder,
        targetPlan: plan,
        amount: planInfo.amount,
      });

      const params = {
        commerceOrder,
        subject: planInfo.subject,
        currency: "CLP",
        amount: planInfo.amount,
        email: tenant.email,
        paymentMethod: 9,
        urlConfirmation: `${baseURL}/api/flow/confirm`,
        urlReturn: `${baseURL}/api/flow/return`,
      };

      const response = await flowApi.send("payment/create", params, "POST");

      if (response.flowOrder) {
        await storage.updatePaymentOrderStatus(commerceOrder, "pending");
      }

      const paymentUrl = `${response.url}?token=${response.token}`;
      log(`Pago Flow creado: order=${commerceOrder} flowOrder=${response.flowOrder} tenant=${auth.id} plan=${plan}`, "api");
      res.json({ paymentUrl, flowOrder: response.flowOrder });
    } catch (error: any) {
      log(`Error al crear pago Flow: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear pago" });
    }
  });

  app.post("/api/flow/confirm", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        log("Flow confirm: token no recibido", "api");
        return res.status(400).json({ message: "Token requerido" });
      }

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost:5000";
      const baseURL = `${protocol}://${host}`;
      const flowApi = getFlowApi(baseURL);

      const flowStatus = await flowApi.send("payment/getStatus", { token }, "GET");
      log(`Flow confirm: commerceOrder=${flowStatus.commerceOrder} status=${flowStatus.status} amount=${flowStatus.amount}`, "api");

      if (!flowStatus.commerceOrder) {
        log("Flow confirm: commerceOrder no encontrada en respuesta", "api");
        return res.json({ status: "ok" });
      }

      const order = await storage.getPaymentOrderByCommerceOrder(flowStatus.commerceOrder);
      if (!order) {
        log(`Flow confirm: orden no encontrada en DB: ${flowStatus.commerceOrder}`, "api");
        return res.json({ status: "ok" });
      }

      if (order.status === "paid") {
        log(`Flow confirm: orden ${flowStatus.commerceOrder} ya fue procesada (idempotente)`, "api");
        return res.json({ status: "ok" });
      }

      if (flowStatus.status === 2) {
        if (flowStatus.amount !== order.amount) {
          log(`Flow confirm: monto no coincide. Esperado=${order.amount} Recibido=${flowStatus.amount} orden=${flowStatus.commerceOrder}`, "api");
          return res.json({ status: "ok" });
        }

        await storage.updatePaymentOrderStatus(flowStatus.commerceOrder, "paid", new Date());
        await storage.updateTenant(order.tenantId, { plan: order.targetPlan } as any);
        log(`Tenant ${order.tenantId} actualizado a plan ${order.targetPlan} - Pago Flow #${flowStatus.flowOrder} orden=${flowStatus.commerceOrder}`, "api");

        try {
          const referral = await storage.getReferralByReferredId(order.tenantId);
          const isPaidPlan = order.targetPlan === "basic" || order.targetPlan === "pro";
          if (referral && referral.confirmed === 0 && isPaidPlan) {
            await storage.confirmReferral(referral.referrerId, order.tenantId);
            const paidCount = await storage.getPaidReferralCount(referral.referrerId);
            const AMBASSADOR_THRESHOLD = 15;
            const isAmbassador = paidCount >= AMBASSADOR_THRESHOLD;
            const CASH_PER_REFERRAL = isAmbassador ? 5000 : 3000;
            await storage.addReferralCash(referral.referrerId, CASH_PER_REFERRAL);
            log(`Referral cash: referrer ${referral.referrerId} earned $${CASH_PER_REFERRAL} CLP ${isAmbassador ? "(EMBAJADOR)" : ""} (referido ${order.tenantId})`, "referral");
            const confirmedCount = await storage.getConfirmedReferralCount(referral.referrerId);
            const milestones: { count: number; plan: string; months: number }[] = [
              { count: 1, plan: "basic", months: 1 },
              { count: 3, plan: "basic", months: 2 },
              { count: 5, plan: "pro", months: 3 },
              { count: 10, plan: "pro", months: 6 },
              { count: 15, plan: "pro", months: 12 },
            ];
            const bestMilestone = milestones.filter(m => confirmedCount >= m.count).pop();
            if (bestMilestone) {
              await storage.applyReferralReward(referral.referrerId, bestMilestone.plan, bestMilestone.months);
              const planName = bestMilestone.plan === "pro" ? "Fox Enterprise" : "Fox Pro";
              log(`Referral milestone: referrer ${referral.referrerId} earned ${bestMilestone.months} months ${planName} (${confirmedCount} referidos, referido ${order.tenantId} compró ${order.targetPlan})`, "referral");
            } else {
              log(`Referral confirmed: referrer ${referral.referrerId} now has ${confirmedCount} confirmed + $${CASH_PER_REFERRAL} CLP (referido ${order.tenantId} compró ${order.targetPlan})`, "referral");
            }
            if (isAmbassador && paidCount === AMBASSADOR_THRESHOLD) {
              log(`EMBAJADOR NUEVO: tenant ${referral.referrerId} alcanzó ${AMBASSADOR_THRESHOLD} referidos pagados activos`, "referral");
            }
          }
        } catch (refErr: any) {
          log(`Error procesando referido en pago: ${refErr.message}`, "referral");
        }
      } else if (flowStatus.status === 3 || flowStatus.status === 4) {
        await storage.updatePaymentOrderStatus(flowStatus.commerceOrder, "rejected");
        log(`Pago rechazado/cancelado: orden=${flowStatus.commerceOrder} tenant=${order.tenantId}`, "api");
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      log(`Error en confirmación Flow: ${error.message}`, "api");
      res.status(500).json({ message: "Error procesando confirmacion" });
    }
  });

  app.get("/api/flow/return", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/dashboard?payment=error");
      }

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost:5000";
      const baseURL = `${protocol}://${host}`;
      const flowApi = getFlowApi(baseURL);

      const flowStatus = await flowApi.send("payment/getStatus", { token }, "GET");

      if (flowStatus.status === 2) {
        return res.redirect("/dashboard?payment=success");
      } else if (flowStatus.status === 3) {
        return res.redirect("/dashboard?payment=rejected");
      } else {
        return res.redirect("/dashboard?payment=pending");
      }
    } catch (error: any) {
      log(`Error en retorno Flow: ${error.message}`, "api");
      return res.redirect("/dashboard?payment=error");
    }
  });

  app.get("/api/tenants/me/sessions", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const tenantSessions = await storage.getSessionsByTenantId(auth.id);
      res.json(tenantSessions);
    } catch (error: any) {
      log(`Error obteniendo sesiones tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener sesiones" });
    }
  });

  app.get("/api/tenants/me/sessions/:sessionId/messages", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session || session.tenantId !== auth.id) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      const msgs = await storage.getMessagesBySessionId(sessionId);
      res.json(msgs);
    } catch (error: any) {
      log(`Error obteniendo mensajes sesión tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.post("/api/tenants/me/sessions/:sessionId/reply", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Contenido requerido" });
      }
      const session = await storage.getSession(sessionId);
      if (!session || session.tenantId !== auth.id) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      const msg = await storage.createMessage({
        sessionId,
        userEmail: session.userEmail,
        userName: auth.companyName || auth.email,
        sender: "support",
        content: content.trim(),
        imageUrl: null,
        tenantId: auth.id,
      });
      io.to(`session:${sessionId}`).emit("new_message", msg);
      res.json(msg);
    } catch (error: any) {
      log(`Error enviando respuesta tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar respuesta" });
    }
  });

  app.get("/api/tenants/me/plan-prices", async (_req, res) => {
    const prices = Object.entries(PLAN_PRICES).map(([key, val]) => ({
      plan: key,
      amount: val.amount,
      label: val.label,
      formattedPrice: `$${val.amount.toLocaleString("es-CL")} CLP/mes`,
    }));
    res.json(prices);
  });

  app.get("/api/tenants/me/referral", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const tenant = await storage.getTenantById(auth.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      let code = tenant.referralCode;
      if (!code) {
        code = await storage.generateReferralCode(auth.id);
      }
      const allReferrals = await storage.getReferralsByReferrerId(auth.id);
      const confirmedCount = allReferrals.filter(r => r.confirmed === 1).length;
      const pendingCount = allReferrals.filter(r => r.confirmed === 0).length;
      const paidReferralCount = await storage.getPaidReferralCount(auth.id);
      const AMBASSADOR_THRESHOLD = 15;
      const isAmbassador = paidReferralCount >= AMBASSADOR_THRESHOLD;
      const CASH_NORMAL = 3000;
      const CASH_AMBASSADOR = 5000;
      const referralsWithNames = await Promise.all(allReferrals.map(async (r) => {
        const referred = await storage.getTenantById(r.referredId);
        return {
          id: r.id,
          referredName: referred?.companyName || referred?.name || "Desconocido",
          referredEmail: referred?.email || "",
          referredPlan: referred?.plan || "free",
          confirmed: r.confirmed,
          createdAt: r.createdAt,
          confirmedAt: r.confirmedAt,
        };
      }));
      let currentReward = null;
      if (tenant.rewardPlan && tenant.rewardExpiresAt) {
        const planLabels: Record<string, string> = { free: "Fox Free", basic: "Fox Pro", pro: "Fox Enterprise" };
        currentReward = {
          plan: tenant.rewardPlan,
          planLabel: planLabels[tenant.rewardPlan] || tenant.rewardPlan,
          expiresAt: tenant.rewardExpiresAt,
          months: tenant.rewardMonths,
        };
      }
      const milestones = [
        { target: 1, plan: "Fox Pro", months: 1 },
        { target: 3, plan: "Fox Pro", months: 2 },
        { target: 5, plan: "Fox Enterprise", months: 3 },
        { target: 10, plan: "Fox Enterprise", months: 6 },
        { target: 15, plan: "Fox Enterprise", months: 12 },
      ];
      let nextReward = null;
      for (const m of milestones) {
        if (confirmedCount < m.target) {
          nextReward = { target: m.target, current: confirmedCount, plan: m.plan, months: m.months };
          break;
        }
      }
      const cashBalance = tenant.cashBalance || 0;
      const totalCashEarned = confirmedCount * CASH_NORMAL;
      res.json({
        code, confirmedCount, pendingCount, paidReferralCount,
        isAmbassador, ambassadorThreshold: AMBASSADOR_THRESHOLD,
        cashPerReferral: isAmbassador ? CASH_AMBASSADOR : CASH_NORMAL,
        referrals: referralsWithNames, currentReward, nextReward,
        cashBalance, totalCashEarned,
      });
    } catch (error: any) {
      log(`Error obteniendo referidos: ${error.message}`, "referral");
      res.status(500).json({ message: "Error al obtener datos de referidos" });
    }
  });

  app.post("/api/tenants/me/referral/confirm", async (_req, res) => {
    res.status(400).json({ message: "Los referidos se confirman automáticamente cuando compran un plan de pago" });
  });

  app.get("/api/admin/users", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    let users = await storage.getAllAdminUsers();
    if (user.role === "admin" || user.role === "ejecutivo") {
      users = users.filter(u => u.role !== "superadmin");
    }
    res.json(users.map(u => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role, color: u.color, createdAt: u.createdAt })));
  });

  app.post("/api/admin/users", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === "ejecutivo") {
      return res.status(403).json({ message: "Solo administradores pueden crear usuarios" });
    }
    try {
      const { email, password, displayName, color } = req.body;
      const role = req.body.role || "ejecutivo";
      if (!["admin", "ejecutivo"].includes(role)) {
        return res.status(403).json({ message: "Rol no permitido" });
      }
      if (user.role === "admin" && role === "superadmin") {
        return res.status(403).json({ message: "No se puede crear usuarios superadmin" });
      }
      if (!email || !password || !displayName) {
        return res.status(400).json({ message: "Email, contraseña y nombre requeridos" });
      }
      const existing = await storage.getAdminUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "Ya existe un usuario con ese email" });
      }
      const hash = await bcrypt.hash(password, 12);
      const created = await storage.createAdminUser({
        email: email.toLowerCase().trim(),
        passwordHash: hash,
        displayName: displayName.trim(),
        role,
        color: color || "#6200EA",
      });
      res.status(201).json({ id: created.id, email: created.email, displayName: created.displayName, role: created.role, color: created.color, createdAt: created.createdAt });
    } catch (error: any) {
      log(`Error al crear usuario: ${error.message}`, "auth");
      res.status(500).json({ message: "Error al crear usuario" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role === "ejecutivo") {
      return res.status(403).json({ message: "Solo administradores pueden eliminar usuarios" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });
    if (id === user.id) {
      return res.status(403).json({ message: "No puedes eliminarte a ti mismo" });
    }
    const target = await storage.getAdminUserById(id);
    if (!target) return res.status(404).json({ message: "Usuario no encontrado" });
    if (target.role === "superadmin") {
      return res.status(403).json({ message: "No se puede eliminar al superadmin" });
    }
    if (user.role !== "superadmin" && user.role !== "admin") {
      return res.status(403).json({ message: "No tienes permisos para eliminar usuarios" });
    }
    await storage.deleteAdminUser(id);
    res.json({ success: true });
  });

  app.post("/api/admin/change-password", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Contraseña actual y nueva requeridas" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
      }
      const dbUser = await storage.getAdminUserById(user.id);
      if (!dbUser) return res.status(404).json({ message: "Usuario no encontrado" });
      const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Contraseña actual incorrecta" });
      }
      const hash = await bcrypt.hash(newPassword, 12);
      await storage.updateAdminUserPassword(user.id, hash);
      const newToken = generateToken({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
      res.json({ success: true, token: newToken });
    } catch (error: any) {
      log(`Error al cambiar contraseña: ${error.message}`, "auth");
      res.status(500).json({ message: "Error al cambiar contraseña" });
    }
  });

  app.get("/api/business-hours-status", async (_req, res) => {
    try {
      const bhEnabled = await storage.getSetting("business_hours_enabled");
      if (bhEnabled === "false") {
        return res.json({ isOffline: false, ticketUrl: "", hoursStart: 0, hoursEnd: 0 });
      }
      const hoursStart = parseInt(await storage.getSetting("business_hours_start") || "12", 10);
      const hoursEnd = parseInt(await storage.getSetting("business_hours_end") || "21", 10);
      const ticketUrl = await storage.getSetting("business_hours_ticket_url") || "";
      const nowChile = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
      const currentHour = nowChile.getHours();
      const isOffline = currentHour < hoursStart || currentHour >= hoursEnd;
      res.json({ isOffline, ticketUrl, hoursStart, hoursEnd });
    } catch (e) {
      res.json({ isOffline: false, ticketUrl: "", hoursStart: 0, hoursEnd: 0 });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const value = await storage.getSetting(req.params.key);
      res.json({ value });
    } catch (error: any) {
      log(`Error al obtener setting: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { value } = req.body;
      if (typeof value !== "string") {
        return res.status(400).json({ message: "Valor requerido" });
      }
      await storage.setSetting(req.params.key, value);
      res.json({ success: true });
    } catch (error: any) {
      log(`Error al guardar setting: ${error.message}`, "api");
      res.status(500).json({ message: "Error al guardar configuración" });
    }
  });

  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ key: VAPID_PUBLIC_KEY });
  });

  app.post("/api/admin/push-subscribe", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Datos de suscripción inválidos" });
      }
      try {
        await storage.deletePushSubscription(endpoint);
      } catch {}
      await storage.createPushSubscription({
        adminUserId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      res.json({ success: true });
    } catch (error: any) {
      log(`Error al registrar push subscription: ${error.message}`, "push");
      res.status(500).json({ message: "Error al registrar notificaciones" });
    }
  });

  app.delete("/api/admin/push-subscribe", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ message: "Endpoint requerido" });
      await storage.deletePushSubscription(endpoint);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error al eliminar suscripción" });
    }
  });

  app.post("/api/tenants/me/push-subscribe", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Datos de suscripción inválidos" });
      }
      try {
        await storage.deleteTenantPushSubscription(endpoint);
      } catch {}
      await storage.createTenantPushSubscription({
        tenantId: auth.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      res.json({ success: true });
    } catch (error: any) {
      log(`Error al registrar push subscription tenant: ${error.message}`, "push");
      res.status(500).json({ message: "Error al registrar notificaciones" });
    }
  });

  app.delete("/api/tenants/me/push-subscribe", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ message: "Endpoint requerido" });
      await storage.deleteTenantPushSubscription(endpoint, auth.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error al eliminar suscripción" });
    }
  });

  // ========== TENANT PANEL ROUTES ==========

  app.get("/api/tenant-panel/sessions", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const statusFilter = (req.query.status as string) || "all";
      const sessions = await storage.getTenantSessionsFull(auth.id, statusFilter);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener sesiones" });
    }
  });

  app.get("/api/tenant-panel/sessions/:sessionId/messages", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session || session.tenantId !== auth.id) return res.status(404).json({ message: "Sesion no encontrada" });
      const msgs = await storage.getMessagesBySessionId(req.params.sessionId);
      res.json(msgs);
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.post("/api/tenant-panel/sessions/:sessionId/reply", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session || session.tenantId !== auth.id) return res.status(404).json({ message: "Sesion no encontrada" });
      const { content, imageUrl } = req.body;
      if (!content && !imageUrl) return res.status(400).json({ message: "Contenido requerido" });
      const tenant = await storage.getTenantById(auth.id);
      const agentName = auth.isAgent ? (auth.displayName || auth.email) : (tenant?.companyName || auth.email);
      const agentColor = auth.isAgent ? (auth.color || "#10b981") : (tenant?.widgetColor || "#10b981");
      const msg = await storage.createMessage({
        sessionId: req.params.sessionId,
        tenantId: auth.id,
        userEmail: session.userEmail,
        userName: session.userName,
        sender: "support",
        content: content || "",
        imageUrl: imageUrl || null,
        adminName: agentName,
        adminColor: agentColor,
      });
      await storage.touchSession(req.params.sessionId);
      io.to(`session:${req.params.sessionId}`).emit("new_message", msg);
      io.to("admin_room").emit("admin_new_message", {
        sessionId: req.params.sessionId,
        userName: session.userName,
        content: content || "[Imagen]",
        message: msg,
        assignedTo: session.assignedTo,
      });
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ message: "Error al enviar mensaje" });
    }
  });

  app.post("/api/tenant-panel/sessions/:sessionId/read", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session || session.tenantId !== auth.id) return res.status(404).json({ message: "Sesion no encontrada" });
      await storage.markSessionRead(req.params.sessionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.patch("/api/tenant-panel/sessions/:sessionId/status", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { status } = req.body;
      const updated = await storage.updateTenantSessionStatus(auth.id, req.params.sessionId, status);
      if (!updated) return res.status(404).json({ message: "Sesion no encontrada" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.post("/api/tenant-panel/sessions/:sessionId/claim", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const tenant = await storage.getTenantById(auth.id);
      const agentName = auth.isAgent ? (auth.displayName || auth.email) : (tenant?.companyName || auth.email);
      const agentColor = auth.isAgent ? (auth.color || "#10b981") : (tenant?.widgetColor || "#10b981");
      const updated = await storage.claimTenantSession(auth.id, req.params.sessionId, agentName, agentColor);
      if (!updated) return res.status(404).json({ message: "Sesion no encontrada" });

      await storage.updateSessionAdminActive(req.params.sessionId, true);

      const session = await storage.getSession(req.params.sessionId);
      const notifyMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session?.userEmail || "support@system",
        userName: "Soporte",
        sender: "support",
        content: "Un agente de soporte se ha unido a la conversación. A partir de ahora seras atendido personalmente.",
        tenantId: auth.id,
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", notifyMsg);
      io.to(`tenant:${auth.id}`).emit("tenant_new_message", { sessionId: req.params.sessionId, message: notifyMsg });
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: notifyMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "claim", session: updated });

      res.json(updated);
    } catch (error: any) {
      log(`Error tenant claim: ${error.message}`, "api");
      res.status(500).json({ message: "Error" });
    }
  });

  app.post("/api/tenant-panel/sessions/:sessionId/unclaim", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      await storage.updateSessionAdminActive(req.params.sessionId, false);
      const updated = await storage.unclaimTenantSession(auth.id, req.params.sessionId);
      if (!updated) return res.status(404).json({ message: "Sesion no encontrada" });

      const session = await storage.getSession(req.params.sessionId);
      const notifyMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session?.userEmail || "support@system",
        userName: "Soporte",
        sender: "support",
        content: "El agente de soporte ha salido de la conversación. El asistente automático seguirá ayudándote.",
        tenantId: auth.id,
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", notifyMsg);
      io.to(`tenant:${auth.id}`).emit("tenant_new_message", { sessionId: req.params.sessionId, message: notifyMsg });
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: notifyMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "unclaim", session: updated });

      res.json(updated);
    } catch (error: any) {
      log(`Error tenant unclaim: ${error.message}`, "api");
      res.status(500).json({ message: "Error" });
    }
  });

  app.delete("/api/tenant-panel/sessions/:sessionId", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const deleted = await storage.deleteTenantSession(auth.id, req.params.sessionId);
      if (!deleted) return res.status(404).json({ message: "Sesion no encontrada" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.patch("/api/tenant-panel/sessions/:sessionId/tags", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session || session.tenantId !== auth.id) return res.status(404).json({ message: "Sesion no encontrada" });
      const { tags } = req.body;
      const updated = await storage.updateSessionTags(req.params.sessionId, tags);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.get("/api/tenant-panel/canned-responses", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const responses = await storage.getTenantCannedResponses(auth.id);
    res.json(responses);
  });

  app.post("/api/tenant-panel/canned-responses", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { shortcut, content } = req.body;
      if (!shortcut || !content) return res.status(400).json({ message: "Shortcut y contenido requeridos" });
      const created = await storage.createTenantCannedResponse(auth.id, shortcut, content);
      res.json(created);
    } catch (error: any) {
      res.status(500).json({ message: "Error al crear atajo" });
    }
  });

  app.delete("/api/tenant-panel/canned-responses/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const deleted = await storage.deleteTenantCannedResponse(auth.id, parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ message: "No encontrado" });
    res.json({ success: true });
  });

  app.get("/api/tenant-panel/tags", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const tags = await storage.getTenantTags(auth.id);
    res.json(tags);
  });

  app.post("/api/tenant-panel/tags", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nombre requerido" });
    await storage.addTenantTag(auth.id, name);
    res.json({ success: true });
  });

  app.delete("/api/tenant-panel/tags/:name", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    await storage.deleteTenantTag(auth.id, req.params.name);
    res.json({ success: true });
  });

  app.get("/api/tenant-panel/knowledge", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const filter: { status?: string; category?: string; query?: string } = {};
      if (req.query.status) filter.status = req.query.status as string;
      if (req.query.category) filter.category = req.query.category as string;
      if (req.query.query) filter.query = req.query.query as string;
      const entries = await storage.getTenantKnowledgeEntries(auth.id, filter);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.post("/api/tenant-panel/knowledge", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const entry = await storage.createTenantKnowledgeEntry(auth.id, req.body);
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ message: "Error al crear entrada" });
    }
  });

  app.patch("/api/tenant-panel/knowledge/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const updated = await storage.updateTenantKnowledgeEntry(auth.id, parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "No encontrada" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.delete("/api/tenant-panel/knowledge/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const deleted = await storage.deleteTenantKnowledgeEntry(auth.id, parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ message: "No encontrada" });
    res.json({ success: true });
  });

  app.get("/api/tenant-panel/products", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const prods = await storage.getTenantProducts(auth.id);
    res.json(prods);
  });

  app.post("/api/tenant-panel/products", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const created = await storage.createTenantProduct(auth.id, req.body);
      res.json(created);
    } catch (error: any) {
      res.status(500).json({ message: "Error al crear producto" });
    }
  });

  app.patch("/api/tenant-panel/products/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const updated = await storage.updateTenantProduct(auth.id, parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "No encontrado" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error" });
    }
  });

  app.delete("/api/tenant-panel/products/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const deleted = await storage.deleteTenantProduct(auth.id, parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ message: "No encontrado" });
    res.json({ success: true });
  });

  app.get("/api/tenant-panel/files", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const files = await storage.getTenantFiles(auth.id);
    res.json(files);
  });

  app.post("/api/tenant-panel/files", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { fileName, originalName, fileUrl, fileType, fileSize, description, keywords, autoSend } = req.body;
      if (!fileName || !fileUrl || !fileType) {
        return res.status(400).json({ message: "Datos incompletos" });
      }
      const file = await storage.createTenantFile({
        tenantId: auth.id,
        fileName,
        originalName: originalName || fileName,
        fileUrl,
        fileType,
        fileSize: fileSize || 0,
        description: description || null,
        keywords: keywords || [],
        autoSend: autoSend !== undefined ? autoSend : 1,
      });
      res.json(file);
    } catch (error: any) {
      log(`Error creating tenant file: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear archivo" });
    }
  });

  app.patch("/api/tenant-panel/files/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { description, keywords, autoSend, fileName } = req.body;
    const data: any = {};
    if (description !== undefined) data.description = description;
    if (keywords !== undefined) data.keywords = keywords;
    if (autoSend !== undefined) data.autoSend = autoSend;
    if (fileName !== undefined) data.fileName = fileName;
    const updated = await storage.updateTenantFile(auth.id, parseInt(req.params.id), data);
    if (!updated) return res.status(404).json({ message: "No encontrado" });
    res.json(updated);
  });

  app.delete("/api/tenant-panel/files/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const deleted = await storage.deleteTenantFile(auth.id, parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ message: "No encontrado" });
    res.json({ success: true });
  });

  app.get("/api/tenant-panel/settings", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const tenant = await storage.getTenantById(auth.id);
    if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
    res.json({
      aiEnabled: tenant.aiEnabled,
      businessHoursConfig: tenant.businessHoursConfig ? JSON.parse(tenant.businessHoursConfig) : null,
      botContext: tenant.botContext || "",
    });
  });

  app.patch("/api/tenant-panel/settings", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const update: any = {};
      if (req.body.aiEnabled !== undefined) update.aiEnabled = req.body.aiEnabled;
      if (req.body.businessHoursConfig !== undefined) update.businessHoursConfig = JSON.stringify(req.body.businessHoursConfig);
      if (req.body.botContext !== undefined) update.botContext = req.body.botContext;
      const updated = await storage.updateTenant(auth.id, update);
      res.json({ success: true, tenant: updated });
    } catch (error: any) {
      res.status(500).json({ message: "Error al actualizar configuración" });
    }
  });

  app.get("/api/tenant-panel/knowledge-pages", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { db } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const pages = await db.select().from(knowledgePages).where(eq(knowledgePages.tenantId, auth.id)).orderBy(asc(knowledgePages.sortOrder), asc(knowledgePages.id));
      res.json(pages);
    } catch {
      res.status(500).json({ message: "Error al obtener páginas" });
    }
  });

  app.post("/api/tenant-panel/knowledge-pages", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { title, content } = req.body;
      if (!title || !content) return res.status(400).json({ message: "Título y contenido son requeridos" });
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const existing = await db.select().from(knowledgePages).where(eq(knowledgePages.tenantId, auth.id));
      const sortOrder = existing.length;
      const [page] = await db.insert(knowledgePages).values({ tenantId: auth.id, title, content, sortOrder }).returning();
      res.json(page);
    } catch {
      res.status(500).json({ message: "Error al crear página" });
    }
  });

  app.patch("/api/tenant-panel/knowledge-pages/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const pageId = parseInt(req.params.id);
      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const [existing] = await db.select().from(knowledgePages).where(and(eq(knowledgePages.id, pageId), eq(knowledgePages.tenantId, auth.id)));
      if (!existing) return res.status(404).json({ message: "Página no encontrada" });
      const update: any = { updatedAt: new Date() };
      if (req.body.title !== undefined) update.title = req.body.title;
      if (req.body.content !== undefined) update.content = req.body.content;
      if (req.body.sortOrder !== undefined) update.sortOrder = req.body.sortOrder;
      const [updated] = await db.update(knowledgePages).set(update).where(eq(knowledgePages.id, pageId)).returning();
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Error al actualizar página" });
    }
  });

  app.delete("/api/tenant-panel/knowledge-pages/:id", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const pageId = parseInt(req.params.id);
      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const [existing] = await db.select().from(knowledgePages).where(and(eq(knowledgePages.id, pageId), eq(knowledgePages.tenantId, auth.id)));
      if (!existing) return res.status(404).json({ message: "Página no encontrada" });
      await db.delete(knowledgePages).where(eq(knowledgePages.id, pageId));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Error al eliminar página" });
    }
  });

  app.post("/api/tenant-panel/analyze-text", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return res.status(400).json({ message: "Texto muy corto. Pega al menos un párrafo con información de tu negocio." });
    }
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un asistente experto en organizar informacion de negocios para entrenar chatbots de atencion al cliente.

Tu tarea: Recibir texto desordenado (copiado de paginas web, documentos, etc.) y organizarlo en un formato visual, estructurado y facil de leer/editar.

FORMATO DE SALIDA (usar exactamente estas secciones con emojis, omitir las que no apliquen):

🏪 NOMBRE DEL NEGOCIO: [nombre]

📝 DESCRIPCION:
[breve descripcion del negocio en 1-3 lineas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛍️ PRODUCTOS / SERVICIOS:
• [nombre] — [descripcion breve]
  💰 Precio: $[precio] | 🏷️ Oferta: $[precio oferta si aplica]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 CATEGORIAS:
📌 [categoria 1]:
  • [producto 1]
  • [producto 2]
📌 [categoria 2]:
  • [producto 1]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💳 METODOS DE PAGO:
• [metodo 1]
• [metodo 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚚 ENVIOS / DESPACHO:
• [politica de envio]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 POLITICAS:
• [politica 1]
• [politica 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 CONTACTO:
• 📱 WhatsApp: [numero]
• 📧 Email: [correo]
• 🌐 Web: [url]
• 📍 Direccion: [direccion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🕐 HORARIOS:
• [dia/rango]: [horario]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ PREGUNTAS FRECUENTES:
❔ [pregunta 1]
✅ [respuesta 1]

❔ [pregunta 2]
✅ [respuesta 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ INFORMACION ADICIONAL:
• [dato relevante]

Reglas CRITICAS:
- Mantener TODOS los precios exactos del texto original
- Mantener TODOS los nombres de productos/tonos/variantes exactos
- Si hay ofertas o descuentos, indicarlos claramente con el emoji 🏷️
- Si hay categorias, agrupar productos por categoria
- Escribir en español
- NUNCA inventar informacion que no este en el texto
- NUNCA usar placeholders como [precio], [numero], [correo], [direccion], [horario], [detalles si aplica], etc. Si no tienes un dato, OMITE esa linea por completo. No pongas corchetes ni texto generico.
- Si no hay informacion suficiente para una seccion completa, OMITE la seccion entera
- Ser conciso pero completo con la info REAL disponible
- Usar las lineas separadoras ━━━ entre cada seccion para facilitar la lectura
- Los emojis son obligatorios para cada seccion`
          },
          {
            role: "user",
            content: `Organiza la siguiente informacion de negocio. IMPORTANTE: Solo incluye datos reales que aparezcan en el texto, nunca pongas valores entre corchetes como placeholders:\n\n${text.substring(0, 50000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });
      const organized = completion.choices[0]?.message?.content || "";
      res.json({ organized });
    } catch (error: any) {
      console.error("[analyze-text] Error:", error.message);
      res.status(500).json({ message: "Error al analizar el texto. Intenta de nuevo." });
    }
  });

  app.post("/api/tenant-panel/beautify-text", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length < 30) {
      return res.status(400).json({ message: "El texto es muy corto para embellecer. Necesita al menos un párrafo de contenido." });
    }
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un experto en copywriting y comunicacion comercial para chatbots de atencion al cliente en Chile.

Tu tarea: Recibir el texto de entrenamiento de un chatbot y EMBELLECERLO para que el bot de respuestas mas profesionales, claras, persuasivas y humanas.

REGLAS CRITICAS:
- MANTENER EXACTAMENTE la misma estructura del texto original (secciones, emojis, separadores ━━━)
- MANTENER TODOS los datos reales: precios, nombres de productos, URLs, telefonos, emails, horarios, direcciones
- NUNCA cambiar, inventar o eliminar informacion factual
- NUNCA agregar placeholders como [dato], [info], etc.
- NUNCA agregar secciones nuevas que no existan en el original
- Si una seccion tiene informacion real, mantenerla intacta

LO QUE SI PUEDES MEJORAR:
- Mejorar las descripciones de productos/servicios haciendolas mas atractivas y persuasivas
- Mejorar la descripcion del negocio para que suene mas profesional y cercana
- Mejorar la redaccion de politicas para que sean mas claras
- Mejorar las respuestas de preguntas frecuentes para que sean mas completas y amables
- Agregar palabras que transmitan confianza y profesionalismo
- Usar un tono amable, cercano y profesional (estilo chileno pero no exageradamente informal)
- Mejorar la coherencia y fluidez del texto
- Corregir errores ortograficos o gramaticales

El resultado debe ser el MISMO texto pero con mejor redaccion, NO un texto completamente diferente.`
          },
          {
            role: "user",
            content: `Embellece el siguiente texto de entrenamiento de chatbot. Mejora la redaccion manteniendo toda la informacion real intacta:\n\n${text.substring(0, 50000)}`
          }
        ],
        temperature: 0.4,
        max_tokens: 8000,
      });
      const beautified = completion.choices[0]?.message?.content || "";
      res.json({ beautified });
    } catch (error: any) {
      console.error("[beautify-text] Error:", error.message);
      res.status(500).json({ message: "Error al embellecer el texto. Intenta de nuevo." });
    }
  });

  app.post("/api/tenant-panel/add-info", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { existingText, newText } = req.body;
    if (!newText || typeof newText !== "string" || newText.trim().length < 5) {
      return res.status(400).json({ message: "La información nueva es muy corta." });
    }
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const hasExisting = existingText && typeof existingText === "string" && existingText.trim().length > 0;
      const systemPrompt = hasExisting
        ? `Eres un experto en organizar informacion de negocios para chatbots de atencion al cliente en Chile.

Tu tarea: Recibir la INFORMACION EXISTENTE de un chatbot y NUEVA INFORMACION adicional, y fusionarlas en un solo texto coherente y bien organizado.

REGLAS CRITICAS:
- CONSERVAR TODA la informacion existente sin eliminar nada
- INTEGRAR la nueva informacion en las secciones correspondientes del texto existente
- Si la nueva informacion tiene datos que contradicen los existentes, USAR LOS NUEVOS (son mas actualizados)
- Si la nueva informacion agrega secciones o temas que no existen, CREAR nuevas secciones al final
- MANTENER la misma estructura, formato y estilo del texto existente (emojis, separadores ━━━, bullets, etc.)
- NUNCA inventar informacion ni agregar placeholders como [dato], [info], etc.
- El resultado debe ser UN SOLO texto unificado, no dos textos separados
- Mantener un tono profesional y amable, estilo chileno`
        : `Eres un experto en organizar informacion de negocios para chatbots de atencion al cliente en Chile.

Tu tarea: Recibir informacion de un negocio y organizarla de forma clara y estructurada para entrenar un chatbot.

REGLAS:
- Organizar la informacion en secciones claras con emojis y separadores
- Usar formato con bullets y estructura legible
- NUNCA inventar informacion ni agregar placeholders
- Mantener un tono profesional y amable, estilo chileno`;

      const userMessage = hasExisting
        ? `INFORMACION EXISTENTE del chatbot:\n\n${existingText.substring(0, 12000)}\n\n━━━━━━━━━━━━━━━━━━━━\n\nNUEVA INFORMACION para agregar:\n\n${newText.substring(0, 5000)}\n\nFusiona ambas en un solo texto unificado, conservando todo lo existente e integrando lo nuevo.`
        : `Organiza la siguiente informacion de negocio para un chatbot:\n\n${newText.substring(0, 8000)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 6000,
      });
      const merged = completion.choices[0]?.message?.content || "";
      res.json({ merged });
    } catch (error: any) {
      console.error("[add-info] Error:", error.message);
      res.status(500).json({ message: "Error al procesar la información. Intenta de nuevo." });
    }
  });

  app.post("/api/tenant-panel/analyze-url", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "URL invalida" });
    }
    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }
      const parsedUrl = new URL(cleanUrl);
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedPatterns = ["localhost", "127.0.0.1", "0.0.0.0", "169.254.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "[::1]", "metadata.google", "metadata.aws"];
      if (blockedPatterns.some(p => hostname.includes(p)) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
        return res.status(400).json({ message: "URL no permitida. Solo se permiten sitios web publicos." });
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: "Solo se permiten URLs con protocolo HTTP o HTTPS." });
      }

      const fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
      };

      async function fetchPage(pageUrl: string, timeoutMs: number = 15000): Promise<string | null> {
        try {
          const ctrl = new AbortController();
          const tm = setTimeout(() => ctrl.abort(), timeoutMs);
          const resp = await fetch(pageUrl, { signal: ctrl.signal, headers: fetchHeaders, redirect: "follow" });
          clearTimeout(tm);
          if (!resp.ok) return null;
          const ct = resp.headers.get("content-type") || "";
          if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return null;
          return await resp.text();
        } catch { return null; }
      }

      function cleanHtmlEntities(text: string): string {
        return text
          .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
          .replace(/\s+/g, " ").trim();
      }

      function extractSectionsByTag(html: string, tags: string[]): string[] {
        const results: string[] = [];
        for (const tag of tags) {
          const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
          const matches = html.matchAll(regex);
          for (const m of matches) {
            const text = m[1].replace(/<[^>]+>/g, " ");
            const clean = cleanHtmlEntities(text);
            if (clean.length > 15) results.push(clean);
          }
        }
        return results;
      }

      function extractPricingData(html: string): string[] {
        const pricing: string[] = [];
        const pricePatterns = [
          /\$[\d.,]+/g,
          /USD\s*[\d.,]+/g,
          /CLP\s*[\d.,]+/g,
          /€[\d.,]+/g,
          /[\d.,]+\s*(?:€|\$|USD|CLP|pesos|clp)/gi,
        ];
        const priceBlocks = html.match(/<(?:div|section|article|table|ul|ol|li|span|p|h[1-6]|td|th|dt|dd)[^>]*(?:pric|plan|cost|tarif|valor|monto|cuota|suscri|membresi|precio|oferta)[^>]*>[\s\S]*?<\/(?:div|section|article|table|ul|ol|li|span|p|h[1-6]|td|th|dt|dd)>/gi) || [];
        for (const block of priceBlocks) {
          const text = block.replace(/<[^>]+>/g, " ");
          const clean = cleanHtmlEntities(text);
          if (clean.length > 10) pricing.push(clean);
        }
        const ariaLabels = html.matchAll(/aria-label=["']([^"']*(?:pric|plan|precio|tarif|costo)[^"']*)["']/gi);
        for (const m of ariaLabels) pricing.push(m[1]);
        const dataAttrs = html.matchAll(/data-(?:price|plan|amount|cost|value)=["']([^"']+)["']/gi);
        for (const m of dataAttrs) pricing.push(`${m[0].split("=")[0].replace("data-","")}: ${m[1]}`);
        return pricing;
      }

      function extractTables(html: string): string[] {
        const tables: string[] = [];
        const tableMatches = html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);
        for (const tm of tableMatches) {
          const rows = tm[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
          const tableRows: string[] = [];
          for (const row of rows) {
            const cells = row[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi);
            const cellTexts: string[] = [];
            for (const cell of cells) {
              const t = cleanHtmlEntities(cell[1].replace(/<[^>]+>/g, " "));
              if (t) cellTexts.push(t);
            }
            if (cellTexts.length > 0) tableRows.push(cellTexts.join(" | "));
          }
          if (tableRows.length > 0) tables.push(tableRows.join("\n"));
        }
        return tables;
      }

      function extractLists(html: string): string[] {
        const lists: string[] = [];
        const listMatches = html.matchAll(/<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi);
        for (const lm of listMatches) {
          const items = lm[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          const itemTexts: string[] = [];
          for (const item of items) {
            const t = cleanHtmlEntities(item[1].replace(/<[^>]+>/g, " "));
            if (t.length > 5) itemTexts.push(`• ${t}`);
          }
          if (itemTexts.length >= 2) lists.push(itemTexts.join("\n"));
        }
        return lists;
      }

      function extractEmails(html: string): string[] {
        const emails = new Set<string>();
        const mailtoMatches = html.matchAll(/mailto:([^\s"'?]+)/gi);
        for (const m of mailtoMatches) emails.add(m[1]);
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const textContent = html.replace(/<[^>]+>/g, " ");
        const textEmails = textContent.matchAll(emailRegex);
        for (const m of textEmails) emails.add(m[0]);
        return [...emails];
      }

      function extractPhones(html: string): string[] {
        const phones = new Set<string>();
        const telMatches = html.matchAll(/tel:([^\s"']+)/gi);
        for (const m of telMatches) phones.add(m[1]);
        const waMatches = html.matchAll(/wa\.me\/(\d+)/gi);
        for (const m of waMatches) phones.add(`+${m[1]}`);
        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
        const textContent = html.replace(/<[^>]+>/g, " ");
        const textPhones = textContent.matchAll(phoneRegex);
        for (const m of textPhones) {
          const clean = m[0].replace(/\s+/g, "");
          if (clean.length >= 8 && clean.length <= 16) phones.add(m[0].trim());
        }
        return [...phones];
      }

      function extractSocialLinks(html: string): string[] {
        const socials = new Set<string>();
        const socialPatterns = [
          /https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?twitter\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?x\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?linkedin\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?youtube\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?wa\.me\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?api\.whatsapp\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?pinterest\.com\/[^\s"'<>]+/gi,
          /https?:\/\/(?:www\.)?threads\.net\/[^\s"'<>]+/gi,
        ];
        for (const pattern of socialPatterns) {
          const matches = html.matchAll(pattern);
          for (const m of matches) socials.add(m[0].replace(/["'<>]/g, ""));
        }
        return [...socials];
      }

      function extractPageData(html: string, pageUrl: string) {
        const metaParts: string[] = [];
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) metaParts.push(`Titulo: ${titleMatch[1].trim()}`);
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        if (metaDescMatch) metaParts.push(`Descripcion: ${metaDescMatch[1].trim()}`);
        const ogMatches = html.matchAll(/<meta[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']+)["']/gi);
        for (const m of ogMatches) metaParts.push(`${m[1]}: ${m[2].trim()}`);
        const ogMatches2 = html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](og:[^"']+)["']/gi);
        for (const m of ogMatches2) metaParts.push(`${m[2]}: ${m[1].trim()}`);
        const twitterMeta = html.matchAll(/<meta[^>]*name=["'](twitter:[^"']+)["'][^>]*content=["']([^"']+)["']/gi);
        for (const m of twitterMeta) metaParts.push(`${m[1]}: ${m[2].trim()}`);
        const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
        if (keywordsMatch) metaParts.push(`Keywords: ${keywordsMatch[1].trim()}`);

        const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        const jsonLdParts: string[] = [];
        for (const m of jsonLdMatches) { try { jsonLdParts.push(m[1].trim()); } catch {} }

        const navContent = (html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi) || [])
          .map(n => n.replace(/<[^>]+>/g, " ")).map(n => cleanHtmlEntities(n)).join(" | ");
        const footerContent = (html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/gi) || [])
          .map(f => f.replace(/<[^>]+>/g, " ")).map(f => cleanHtmlEntities(f)).join(" ");
        const headerContent = (html.match(/<header[^>]*>([\s\S]*?)<\/header>/gi) || [])
          .map(h => h.replace(/<[^>]+>/g, " ")).map(h => cleanHtmlEntities(h)).join(" ");

        const headings = extractSectionsByTag(html, ["h1", "h2", "h3", "h4", "h5", "h6"]);
        const paragraphs = extractSectionsByTag(html, ["p"]);
        const pricing = extractPricingData(html);
        const tables = extractTables(html);
        const lists = extractLists(html);
        const emails = extractEmails(html);
        const phones = extractPhones(html);
        const socials = extractSocialLinks(html);

        const mainContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
          .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
          .replace(/<[^>]+>/g, " ");
        const cleanMain = cleanHtmlEntities(mainContent);

        const links: string[] = [];
        const linkTexts: { href: string; text: string }[] = [];
        const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi);
        for (const lm of linkMatches) {
          try {
            const href = lm[1].trim();
            const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
            if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
            const resolved = new URL(href, pageUrl);
            if (resolved.hostname === new URL(pageUrl).hostname) {
              links.push(resolved.href);
              if (linkText.length > 2) linkTexts.push({ href: resolved.href, text: linkText });
            }
          } catch {}
        }

        return { metaParts, jsonLdParts, mainContent: cleanMain, navContent, footerContent, headerContent, headings, paragraphs, pricing, tables, lists, emails, phones, socials, links: [...new Set(links)], linkTexts };
      }

      const mainHtml = await fetchPage(cleanUrl, 30000);
      if (!mainHtml) {
        return res.status(400).json({ message: "No se pudo acceder a la pagina. Verifica que la URL sea correcta y accesible." });
      }

      const mainData = extractPageData(mainHtml, cleanUrl);

      const skipPatterns = [/login/i, /register/i, /signup/i, /admin/i, /dashboard/i, /cart/i, /checkout/i, /account/i, /wp-admin/i, /wp-login/i, /\.pdf$/i, /\.jpg$/i, /\.png$/i, /\.gif$/i, /\.zip$/i, /\.css$/i, /\.js$/i, /\?/];
      const priorityPatterns = [/about/i, /acerca/i, /nosotros/i, /servicios/i, /services/i, /productos/i, /products/i, /contacto/i, /contact/i, /horarios/i, /hours/i, /precios/i, /pricing/i, /planes/i, /faq/i, /preguntas/i, /ayuda/i, /help/i, /info/i, /quienes-somos/i, /equipo/i, /team/i, /galeria/i, /gallery/i, /ubicacion/i, /location/i, /donar/i, /eventos/i, /events/i, /blog/i, /noticias/i, /envios/i, /shipping/i, /politicas/i, /policies/i, /menu/i, /catalogo/i, /tienda/i, /shop/i, /participa/i, /soy-nuevo/i, /mensajes/i];
      const internalLinks = mainData.links
        .filter(l => !skipPatterns.some(p => p.test(l)))
        .filter(l => l !== cleanUrl && l !== cleanUrl + "/");

      const prioritized = internalLinks.sort((a, b) => {
        const aP = priorityPatterns.some(p => p.test(a)) ? 0 : 1;
        const bP = priorityPatterns.some(p => p.test(b)) ? 0 : 1;
        return aP - bP;
      });

      const maxSubpages = 10;
      const subpageUrls = prioritized.slice(0, maxSubpages);
      const subpageResults: { url: string; title: string; content: string }[] = [];

      const batchSize = 4;
      for (let i = 0; i < subpageUrls.length; i += batchSize) {
        const batch = subpageUrls.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (spUrl) => {
          const spHtml = await fetchPage(spUrl, 8000);
          if (!spHtml) return null;
          const spData = extractPageData(spHtml, spUrl);
          const title = spData.metaParts.find(p => p.startsWith("Titulo:"))?.replace("Titulo: ", "") || spUrl;
          const content = spData.mainContent.substring(0, 2500);
          if (content.length < 30) return null;
          return { url: spUrl, title, content };
        }));
        for (const r of batchResults) {
          if (r) subpageResults.push(r);
        }
      }

      let combinedText = "";
      combinedText += `URL PRINCIPAL: ${cleanUrl}\n\n`;
      if (mainData.metaParts.length > 0) combinedText += "METADATOS:\n" + mainData.metaParts.join("\n") + "\n\n";
      if (mainData.jsonLdParts.length > 0) combinedText += "DATOS ESTRUCTURADOS (JSON-LD):\n" + mainData.jsonLdParts.join("\n") + "\n\n";
      if (mainData.headerContent.length > 10) combinedText += "ENCABEZADO DEL SITIO:\n" + mainData.headerContent.substring(0, 500) + "\n\n";
      if (mainData.navContent.length > 10) combinedText += "NAVEGACION DEL SITIO:\n" + mainData.navContent.substring(0, 500) + "\n\n";
      if (mainData.mainContent.length > 10) combinedText += "CONTENIDO PRINCIPAL:\n" + mainData.mainContent.substring(0, 8000) + "\n\n";
      if (mainData.footerContent.length > 10) combinedText += "PIE DE PAGINA:\n" + mainData.footerContent.substring(0, 1000) + "\n\n";

      if (subpageResults.length > 0) {
        combinedText += "\n========== PAGINAS INTERNAS DEL SITIO ==========\n\n";
        for (const sp of subpageResults) {
          combinedText += `--- PAGINA: ${sp.title} (${sp.url}) ---\n${sp.content}\n\n`;
        }
      }

      const allInternalLinks = mainData.links.filter(l => !skipPatterns.some(p => p.test(l)));
      if (allInternalLinks.length > 0) {
        combinedText += "\nTODOS LOS LINKS INTERNOS ENCONTRADOS:\n";
        for (const link of allInternalLinks.slice(0, 30)) {
          combinedText += `• ${link}\n`;
        }
      }

      if (combinedText.trim().length < 10) {
        return res.status(400).json({ message: "La pagina no tiene contenido accesible. Prueba con otra URL o usa 'Pegar texto' para copiar la info manualmente." });
      }

      const truncatedText = combinedText.substring(0, 50000);

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un analista web EXPERTO. Tu trabajo es hacer un analisis ULTRA MINUCIOSO de un sitio web completo para generar la base de conocimiento mas completa posible para un chatbot de atencion al cliente.

Se te proporcionara el contenido de la pagina principal Y de todas las subpaginas internas del sitio. Debes analizar CADA pagina, CADA link, CADA seccion y extraer ABSOLUTAMENTE TODA la informacion.

FORMATO DE SALIDA (usa TODAS las secciones que apliquen, con emojis y separadores):

🏪 NOMBRE DEL NEGOCIO: [nombre exacto]
📝 TIPO DE NEGOCIO/SISTEMA: [tipo, ej: tienda online, restaurante, iglesia, clinica, etc.]

🌐 SITIO WEB: [url principal]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 DESCRIPCION COMPLETA
[Descripcion extensa y detallada del negocio/organizacion. 3-5 parrafos minimo. Incluye historia, proposito, mision, vision, valores si los hay. Hazlo como si fueras un empleado orgulloso presentando su empresa.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 CONTACTO E INFORMACION GENERAL
• 📍 Direccion: [si hay]
• 📱 WhatsApp: [si hay]
• 📧 Email: [si hay]
• 📞 Telefono: [si hay]
• 🌐 Sitio Web: [url]
• 📺 Redes Sociales: [todas las que encuentres: YouTube, Instagram, Facebook, TikTok, etc.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🕐 HORARIOS
• [dia/rango]: [horario] ([descripcion si aplica])
[Lista COMPLETA de todos los horarios encontrados]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛍️ SERVICIOS Y ACTIVIDADES / PRODUCTOS
[Lista EXHAUSTIVA de cada servicio, producto, actividad. Incluir descripcion, precio, horario, detalles]
• [nombre] — [descripcion detallada]
  💰 Precio: [si aplica] | 🕐 Horario: [si aplica]

📌 CATEGORIAS DE SERVICIOS/PRODUCTOS:
  • [categoria 1]: [items]
  • [categoria 2]: [items]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DATOS Y ESTADISTICAS
[Cualquier numero, estadistica, dato cuantitativo del negocio]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 PAGINAS DEL SITIO WEB
[Lista COMPLETA de todas las paginas/secciones del sitio con su URL y descripcion de que contiene cada una]

1. 🏠 [nombre pagina]: [url]
   → [descripcion de que contiene esa pagina]

2. [siguiente pagina...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 FUNCIONES/SECCIONES INTERNAS (si aplica)
[Documentar todas las funciones del sistema: panel de usuario, dashboard, formularios, etc.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💳 METODOS DE PAGO
• [metodo 1]
• [metodo 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚚 ENVIOS / DESPACHO / LOGISTICA
• [detalles]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 POLITICAS Y GARANTIAS
• [politica 1]
• [politica 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 EQUIPO / ROLES / PERSONAL
[Si hay info sobre el equipo, lideres, roles, jerarquia]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ PREGUNTAS FRECUENTES (generar al menos 10-15 basadas en la informacion)
❔ [pregunta que un cliente/visitante haria]
✅ [respuesta completa basada en los datos]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ INFORMACION ADICIONAL
• [cualquier dato que no encaje en las secciones anteriores]
• [proyectos, campanas, eventos especiales, etc.]

REGLAS CRITICAS:
- Se ULTRA MINUCIOSO. Extrae ABSOLUTAMENTE TODO lo que encuentres
- Analiza CADA subpagina proporcionada, no solo la principal
- Los links a paginas internas deben documentarse con su URL exacta y que contienen
- NUNCA inventar informacion. Si no hay un dato, OMITE esa linea
- NUNCA usar placeholders como [precio], [numero], etc. Solo datos reales
- Genera MUCHAS preguntas frecuentes (10-15 minimo) basadas en la informacion real
- La descripcion debe ser EXTENSA y profesional, como un pitch de ventas
- Escribir TODO en español
- Emojis obligatorios en cada seccion y subseccion
- Separadores ━━━ entre secciones
- Si una seccion no tiene datos, OMITELA completamente
- El resultado debe ser lo MAS COMPLETO y DETALLADO posible para que un chatbot pueda responder CUALQUIER pregunta sobre el negocio`
          },
          {
            role: "user",
            content: `Analiza EXHAUSTIVAMENTE este sitio web completo (${cleanUrl}). Se te proporciona el contenido de la pagina principal Y ${subpageResults.length} subpaginas internas que fueron escaneadas automaticamente. Analiza CADA pagina, extrae TODA la informacion: servicios, productos, horarios, contacto, links, preguntas frecuentes, y todo lo que pueda servir para que un chatbot responda cualquier pregunta. Solo incluye datos REALES, nunca placeholders:\n\n${truncatedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 16000,
      });
      const organized = completion.choices[0]?.message?.content || "";
      res.json({ organized, sourceUrl: cleanUrl });
    } catch (error: any) {
      if (error.name === "AbortError") {
        return res.status(408).json({ message: "La pagina tardo demasiado en responder (mas de 30 segundos)." });
      }
      console.error("[analyze-url] Error:", error.message);
      res.status(500).json({ message: "Error al analizar la URL. Verifica que sea accesible." });
    }
  });

  app.post("/api/tenant-panel/help-request", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    const { name, email, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Nombre y correo son requeridos" });
    }
    try {
      const tenant = await storage.getTenantById(auth.id);
      console.log(`[help-request] Tenant: ${tenant?.companyName} (${auth.id}), Name: ${name}, Email: ${email}, Message: ${message || "Sin mensaje"}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[help-request] Error:", error.message);
      res.status(500).json({ message: "Error al enviar solicitud" });
    }
  });

  app.get("/api/admin/tags", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    const tags = await storage.getCustomTags();
    res.json(tags);
  });

  app.post("/api/admin/tags", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Nombre de etiqueta requerido" });
    }
    await storage.addCustomTag(name.trim());
    res.json({ success: true });
  });

  app.delete("/api/admin/tags/:name", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    await storage.deleteCustomTag(req.params.name);
    res.json({ success: true });
  });

  // Knowledge Base routes
  app.get("/api/admin/knowledge", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const filter: { status?: string; category?: string; query?: string } = {};
      if (req.query.status) filter.status = req.query.status as string;
      if (req.query.category) filter.category = req.query.category as string;
      if (req.query.query) filter.query = req.query.query as string;
      const entries = await storage.getKnowledgeEntries(filter);
      res.json(entries);
    } catch (error: any) {
      log(`Error al obtener conocimiento: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener conocimiento" });
    }
  });

  app.patch("/api/admin/knowledge/:id", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const entry = await storage.updateKnowledgeEntry(id, updates);
      if (!entry) {
        res.status(404).json({ message: "Entrada no encontrada" });
        return;
      }
      res.json(entry);
    } catch (error: any) {
      log(`Error al actualizar conocimiento: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar" });
    }
  });

  app.delete("/api/admin/knowledge/:id", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteKnowledgeEntry(id);
      if (!deleted) {
        res.status(404).json({ message: "Entrada no encontrada" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      log(`Error al eliminar conocimiento: ${error.message}`, "api");
      res.status(500).json({ message: "Error al eliminar" });
    }
  });

  app.post("/api/admin/knowledge/extract", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const limit = req.body.limit || 10;
      const result = await extractKnowledgeFromSessions({ limit });
      res.json(result);
    } catch (error: any) {
      log(`Error al extraer conocimiento: ${error.message}`, "api");
      res.status(500).json({ message: "Error al extraer conocimiento" });
    }
  });

  app.post("/api/admin/knowledge", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const data = insertKnowledgeBaseSchema.parse(req.body);
      const entry = await storage.createKnowledgeEntry(data);
      res.json(entry);
    } catch (error: any) {
      log(`Error al crear conocimiento: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear entrada" });
    }
  });

  app.get("/api/admin/sessions", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const statusFilter = (req.query.status as string) || "all";
      const start = Date.now();
      const sessions = await storage.getAllSessions(statusFilter as "active" | "closed" | "all");
      log(`getAllSessions(${statusFilter}) took ${Date.now() - start}ms, returned ${sessions.length} sessions`, "perf");
      res.json(sessions);
    } catch (error: any) {
      log(`Error al obtener sesiones: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener sesiones" });
    }
  });

  app.get("/api/admin/sessions/:sessionId/messages", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const msgs = await storage.getMessagesBySessionId(req.params.sessionId);
      await storage.markSessionRead(req.params.sessionId);
      res.json(msgs);
    } catch (error: any) {
      log(`Error al obtener mensajes de sesión: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.delete("/api/admin/sessions/all", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    if (adminUser.role === "ejecutivo") {
      return res.status(403).json({ message: "Solo administradores pueden eliminar todos los chats" });
    }
    try {
      const count = await storage.deleteAllSessions();
      io.to("admin_room").emit("sessions_cleared");
      res.json({ message: "Todos los chats eliminados", count });
    } catch (error: any) {
      log(`Error al eliminar todos los chats: ${error.message}`, "api");
      res.status(500).json({ message: "Error al eliminar chats" });
    }
  });

  app.delete("/api/admin/sessions/:sessionId", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    if (adminUser.role === "ejecutivo") {
      return res.status(403).json({ message: "Solo administradores pueden eliminar chats" });
    }
    try {
      const deleted = await storage.deleteSession(req.params.sessionId);
      if (!deleted) {
        return res.status(404).json({ message: "Chat no encontrado" });
      }
      io.to("admin_room").emit("session_deleted", { sessionId: req.params.sessionId });
      res.json({ message: "Chat eliminado" });
    } catch (error: any) {
      log(`Error al eliminar chat: ${error.message}`, "api");
      res.status(500).json({ message: "Error al eliminar chat" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/status", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const { status } = req.body;
      if (status !== "active" && status !== "closed") {
        return res.status(400).json({ message: "Estado invalido" });
      }
      const sessionCheck = await storage.getSession(req.params.sessionId);
      if (sessionCheck && isLockedToOtherAgent(sessionCheck, adminUser)) {
        return res.status(403).json(lockedResponse(sessionCheck));
      }
      const updated = await storage.updateSessionStatus(req.params.sessionId, status);
      if (!updated) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "status", session: updated });
      res.json(updated);
    } catch (error: any) {
      log(`Error al actualizar estado: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar estado" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/tags", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const { tags } = req.body;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags debe ser un array" });
      }
      const sessionCheck = await storage.getSession(req.params.sessionId);
      if (sessionCheck && isLockedToOtherAgent(sessionCheck, adminUser)) {
        return res.status(403).json(lockedResponse(sessionCheck));
      }
      const updated = await storage.updateSessionTags(req.params.sessionId, tags);
      if (!updated) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "tags", session: updated });
      res.json(updated);
    } catch (error: any) {
      log(`Error al actualizar tags: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar tags" });
    }
  });

  app.get("/api/admin/search", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const results = await storage.searchMessages(query);
      const grouped: Record<string, { sessionId: string; userName: string; userEmail: string; messages: typeof results }> = {};
      for (const msg of results) {
        if (!grouped[msg.sessionId]) {
          grouped[msg.sessionId] = {
            sessionId: msg.sessionId,
            userName: msg.sender === "user" ? msg.userName : "",
            userEmail: msg.sender === "user" ? msg.userEmail : "",
            messages: [],
          };
        }
        grouped[msg.sessionId].messages.push(msg);
        if (msg.sender === "user") {
          grouped[msg.sessionId].userName = msg.userName;
          grouped[msg.sessionId].userEmail = msg.userEmail;
        }
      }
      res.json(Object.values(grouped));
    } catch (error: any) {
      log(`Error en busqueda: ${error.message}`, "api");
      res.status(500).json({ message: "Error en busqueda" });
    }
  });

  app.get("/api/admin/contact-requests", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const requests = await storage.getContactRequests();
      res.json(requests);
    } catch (error: any) {
      log(`Error al obtener solicitudes: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener solicitudes" });
    }
  });

  app.get("/api/admin/canned-responses", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const responses = await storage.getCannedResponses();
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener respuestas" });
    }
  });

  app.post("/api/admin/canned-responses", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const parsed = insertCannedResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos" });
      }
      const created = await storage.createCannedResponse(parsed.data);
      res.json(created);
    } catch (error: any) {
      log(`Error al crear respuesta rapida: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear respuesta" });
    }
  });

  app.patch("/api/admin/canned-responses/:id", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });
      const updated = await storage.updateCannedResponse(id, req.body);
      if (!updated) return res.status(404).json({ message: "No encontrada" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error al actualizar" });
    }
  });

  app.delete("/api/admin/canned-responses/:id", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });
      const deleted = await storage.deleteCannedResponse(id);
      if (!deleted) return res.status(404).json({ message: "No encontrada" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error al eliminar" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 1) {
        return res.json([]);
      }
      const results = await storage.searchProductsByName(query);
      res.json(results);
    } catch (error: any) {
      log(`Error en busqueda de productos: ${error.message}`, "api");
      res.status(500).json({ message: "Error en busqueda de productos" });
    }
  });

  app.get("/api/products/browse", async (req, res) => {
    try {
      const search = (req.query.q as string || "").trim().toLowerCase();
      const category = req.query.category as string || "";
      const platform = req.query.platform as string || "";
      const tenantIdParam = req.query.tenantId as string || "";
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      let allProducts = await storage.getProducts();
      if (tenantIdParam) {
        const tid = parseInt(tenantIdParam, 10);
        if (!isNaN(tid)) {
          allProducts = allProducts.filter(p => p.tenantId === tid);
        }
      }

      if (category) {
        allProducts = allProducts.filter(p => p.category === category);
      }
      if (platform) {
        allProducts = allProducts.filter(p => p.platform === platform || p.platform === "all");
      }
      if (search && search.length >= 2) {
        allProducts = allProducts.filter(p =>
          p.name.toLowerCase().includes(search) ||
          (p.searchAliases || []).some(a => a.toLowerCase().includes(search))
        );
      }

      allProducts.sort((a, b) => a.name.localeCompare(b.name, "es"));

      const total = allProducts.length;
      const paginated = allProducts.slice(offset, offset + limit);

      res.json({
        products: paginated.map(p => ({ id: p.id, name: p.name, price: p.price, platform: p.platform, category: p.category, availability: p.availability, productUrl: p.productUrl, imageUrl: p.imageUrl, description: p.description })),
        total,
        offset,
        limit,
      });
    } catch (error: any) {
      log(`Error en browse de productos: ${error.message}`, "api");
      res.status(500).json({ message: "Error en browse de productos" });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const allProducts = await storage.getProducts();
      res.json(allProducts);
    } catch (error: any) {
      log(`Error al obtener productos: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten() });
      }
      const created = await storage.createProduct(parsed.data);
      res.json(created);
    } catch (error: any) {
      log(`Error al crear producto: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear producto" });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });
      const updated = await storage.updateProduct(id, req.body);
      if (!updated) return res.status(404).json({ message: "Producto no encontrado" });
      res.json(updated);
    } catch (error: any) {
      log(`Error al actualizar producto: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar producto" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });
      const deleted = await storage.deleteProduct(id);
      if (!deleted) return res.status(404).json({ message: "Producto no encontrado" });
      res.json({ success: true });
    } catch (error: any) {
      log(`Error al eliminar producto: ${error.message}`, "api");
      res.status(500).json({ message: "Error al eliminar producto" });
    }
  });


  app.post("/api/ratings", async (req, res) => {
    try {
      const parsed = insertRatingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.errors });
      }
      const { rating } = parsed.data;
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "La calificacion debe ser entre 1 y 5" });
      }
      const existing = await storage.getRatingBySessionId(parsed.data.sessionId);
      if (existing) {
        return res.status(409).json({ message: "Ya existe una calificación para esta sesión", rating: existing });
      }
      const ratingSession = await storage.getSession(parsed.data.sessionId);
      const ratingData = { ...parsed.data, tenantId: ratingSession?.tenantId ?? null };
      const created = await storage.createRating(ratingData);
      await storage.updateSessionStatus(parsed.data.sessionId, "closed");
      io.to("admin_room").emit("session_updated", { sessionId: parsed.data.sessionId, type: "status", session: { status: "closed" } });
      res.status(201).json(created);
    } catch (error: any) {
      log(`Error al crear calificacion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear calificacion" });
    }
  });

  app.get("/api/admin/dashboard-metrics", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== "superadmin") {
      return res.status(403).json({ message: "Solo superadmin" });
    }
    try {
      const { pool } = await import("./db");

      const tenantsResult = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_count,
               COUNT(CASE WHEN plan = 'basic' THEN 1 END) as basic_count,
               COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_count
        FROM tenants
      `);
      const tenantStats = tenantsResult.rows[0];

      const activeTenantsResult = await pool.query(`
        SELECT COUNT(DISTINCT tenant_id) as active
        FROM sessions
        WHERE tenant_id IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
      `);

      const revenueResult = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM payment_orders
        WHERE status = 'paid'
      `);

      const monthlyRevenueResult = await pool.query(`
        SELECT TO_CHAR(paid_at, 'YYYY-MM') as month,
               COALESCE(SUM(amount), 0) as revenue
        FROM payment_orders
        WHERE status = 'paid' AND paid_at IS NOT NULL
          AND paid_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
        ORDER BY month ASC
      `);

      const sessionsResult = await pool.query(`SELECT COUNT(*) as total FROM sessions`);
      const messagesResult = await pool.query(`SELECT COUNT(*) as total FROM messages`);

      const newTenantsResult = await pool.query(`
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
               COUNT(*) as count
        FROM tenants
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `);

      const mrrResult = await pool.query(`
        SELECT COALESCE(SUM(CASE WHEN plan = 'basic' THEN 19990 WHEN plan = 'pro' THEN 49990 ELSE 0 END), 0) as mrr
        FROM tenants
      `);

      res.json({
        totalTenants: parseInt(tenantStats.total),
        activeTenants: parseInt(activeTenantsResult.rows[0]?.active || "0"),
        totalRevenue: parseInt(revenueResult.rows[0]?.total_revenue || "0"),
        mrr: parseInt(mrrResult.rows[0]?.mrr || "0"),
        totalSessions: parseInt(sessionsResult.rows[0]?.total || "0"),
        totalMessages: parseInt(messagesResult.rows[0]?.total || "0"),
        planDistribution: {
          free: parseInt(tenantStats.free_count),
          basic: parseInt(tenantStats.basic_count),
          pro: parseInt(tenantStats.pro_count),
        },
        monthlyRevenue: monthlyRevenueResult.rows.map((r: any) => ({
          month: r.month,
          revenue: parseInt(r.revenue),
        })),
        newTenantsPerMonth: newTenantsResult.rows.map((r: any) => ({
          month: r.month,
          count: parseInt(r.count),
        })),
      });
    } catch (error: any) {
      log(`Error al obtener métricas: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener métricas" });
    }
  });

  app.get("/api/admin/tenants", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== "superadmin") {
      return res.status(403).json({ message: "Solo superadmin puede ver tenants" });
    }
    try {
      const tenantsWithStats = await storage.getAllTenantsWithStats();
      res.json(tenantsWithStats);
    } catch (error: any) {
      log(`Error al obtener tenants: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener tenants" });
    }
  });

  app.patch("/api/admin/tenants/:id", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== "superadmin") {
      return res.status(403).json({ message: "Solo superadmin puede modificar tenants" });
    }
    try {
      const tenantId = parseInt(req.params.id, 10);
      const { plan } = req.body;
      if (!plan || !["free", "basic", "pro"].includes(plan)) {
        return res.status(400).json({ message: "Plan invalido" });
      }
      const updated = await storage.updateTenant(tenantId, { plan } as any);
      if (!updated) {
        return res.status(404).json({ message: "Tenant no encontrado" });
      }
      log(`Superadmin ${user.email} cambió plan de tenant ${tenantId} a ${plan}`, "api");
      res.json({ id: updated.id, plan: updated.plan });
    } catch (error: any) {
      log(`Error al actualizar tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar tenant" });
    }
  });

  app.get("/api/admin/payments", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    if (user.role !== "superadmin") {
      return res.status(403).json({ message: "Solo superadmin puede ver pagos" });
    }
    try {
      const orders = await storage.getRecentPaymentOrders(100);
      res.json(orders);
    } catch (error: any) {
      log(`Error al obtener pagos: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener pagos" });
    }
  });

  app.get("/api/admin/ratings", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const allRatings = await storage.getAllRatings();
      res.json(allRatings);
    } catch (error: any) {
      log(`Error al obtener calificaciones: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener calificaciones" });
    }
  });

  app.get("/api/admin/sessions/:sessionId/rating", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const rating = await storage.getRatingBySessionId(req.params.sessionId);
      if (!rating) return res.status(404).json({ message: "No hay calificación para esta sesión" });
      res.json(rating);
    } catch (error: any) {
      log(`Error al obtener calificacion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener calificacion" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/admin-active", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const { adminActive } = req.body;
      if (typeof adminActive !== "boolean") {
        return res.status(400).json({ message: "adminActive debe ser boolean" });
      }
      const sessionCheck = await storage.getSession(req.params.sessionId);
      if (sessionCheck && isLockedToOtherAgent(sessionCheck, adminUser)) {
        return res.status(403).json(lockedResponse(sessionCheck));
      }
      let updated = await storage.updateSessionAdminActive(req.params.sessionId, adminActive);
      if (!updated) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }

      if (adminActive && !sessionCheck?.assignedTo) {
        const dbAdmin = await storage.getAdminUserById(adminUser.id);
        const claimed = await storage.claimSession(
          req.params.sessionId,
          adminUser.id,
          adminUser.displayName,
          dbAdmin?.color || "#6200EA"
        );
        if (claimed) {
          updated = claimed;
          const currentTags: string[] = updated.tags || [];
          const hadBot = currentTags.includes("Bot");
          const hadEjecutivo = currentTags.includes("Ejecutivo");
          if (hadBot || !hadEjecutivo) {
            const newTags = currentTags.filter((t: string) => t !== "Bot");
            if (!hadEjecutivo) newTags.push("Ejecutivo");
            updated = await storage.updateSessionTags(req.params.sessionId, newTags) || updated;
          }
          io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "claimed", session: updated });
        }
      }

      if (!adminActive && sessionCheck?.assignedTo === adminUser.id) {
        const unclaimed = await storage.unclaimSession(req.params.sessionId);
        if (unclaimed) {
          updated = unclaimed;
          const currentTags: string[] = unclaimed.tags || [];
          const newTags = currentTags.filter((t: string) => t !== "Ejecutivo");
          if (!newTags.includes("Bot")) newTags.push("Bot");
          updated = await storage.updateSessionTags(req.params.sessionId, newTags) || updated;
          io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "unclaimed", session: updated });
        }
      }

      const session = await storage.getSession(req.params.sessionId);
      const notifyContent = adminActive
        ? "Un agente de soporte se ha unido a la conversación. A partir de ahora seras atendido personalmente."
        : "El agente de soporte ha salido de la conversación. El asistente automático seguirá ayudándote.";

      const notifyMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session?.userEmail || "support@system",
        userName: "Soporte",
        sender: "support",
        content: notifyContent,
        tenantId: session?.tenantId ?? null,
      });

      io.to(`session:${req.params.sessionId}`).emit("new_message", notifyMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: notifyMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "admin_active", session: updated });

      res.json(updated);
    } catch (error: any) {
      log(`Error al cambiar admin activo: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/claim", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      if (session.assignedTo && session.assignedTo !== adminUser.id) {
        return res.status(409).json({
          message: `Este chat ya esta asignado a ${session.assignedToName || "otro agente"}`,
          assignedToName: session.assignedToName,
        });
      }
      const dbAdmin = await storage.getAdminUserById(adminUser.id);
      const claimed = await storage.claimSession(
        req.params.sessionId,
        adminUser.id,
        adminUser.displayName,
        dbAdmin?.color || "#6200EA"
      );
      let updated = claimed;
      if (updated && updated.tags) {
        const newTags = updated.tags.filter((t: string) => t !== "Bot");
        if (!newTags.includes("Ejecutivo")) newTags.push("Ejecutivo");
        if (newTags.length !== updated.tags.length || newTags.includes("Ejecutivo")) {
          updated = await storage.updateSessionTags(req.params.sessionId, newTags) || updated;
        }
      } else if (updated) {
        updated = await storage.updateSessionTags(req.params.sessionId, ["Ejecutivo"]) || updated;
      }
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "claim", session: updated });
      res.json(updated);
    } catch (error: any) {
      log(`Error al tomar chat: ${error.message}`, "api");
      res.status(500).json({ message: "Error al tomar chat" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/unclaim", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const sessionCheck = await storage.getSession(req.params.sessionId);
      if (sessionCheck && sessionCheck.assignedTo && sessionCheck.assignedTo !== adminUser.id && adminUser.role !== "superadmin") {
        return res.status(403).json(lockedResponse(sessionCheck));
      }
      await storage.updateSessionAdminActive(req.params.sessionId, false);
      const unclaimed = await storage.unclaimSession(req.params.sessionId);
      let updated = unclaimed;
      if (updated && updated.tags) {
        const newTags = updated.tags.filter((t: string) => t !== "Ejecutivo" && t !== "Solicita Ejecutivo");
        if (!newTags.includes("Bot")) newTags.push("Bot");
        updated = await storage.updateSessionTags(req.params.sessionId, newTags) || updated;
      } else if (updated) {
        updated = await storage.updateSessionTags(req.params.sessionId, ["Bot"]) || updated;
      }

      const notifyMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: sessionCheck?.userEmail || "support@system",
        userName: "Soporte",
        sender: "support",
        content: "El agente de soporte ha salido de la conversación. El asistente automático seguirá ayudándote.",
        tenantId: sessionCheck?.tenantId ?? null,
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", notifyMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: notifyMsg });

      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "unclaim", session: updated });
      res.json(updated);
    } catch (error: any) {
      log(`Error al liberar chat: ${error.message}`, "api");
      res.status(500).json({ message: "Error al liberar chat" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/transfer", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const { targetAgentId } = req.body;
      if (!targetAgentId || typeof targetAgentId !== "number") {
        return res.status(400).json({ message: "ID del agente destino requerido" });
      }
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      if (adminUser.role === "ejecutivo") {
        if (!session.assignedTo || session.assignedTo !== adminUser.id) {
          return res.status(403).json({ message: "Solo puedes transferir chats que te estan asignados" });
        }
      } else if (session.assignedTo && session.assignedTo !== adminUser.id && adminUser.role !== "superadmin") {
        return res.status(403).json(lockedResponse(session));
      }
      const targetAgent = await storage.getAdminUserById(targetAgentId);
      if (!targetAgent) {
        return res.status(404).json({ message: "Agente destino no encontrado" });
      }
      const transferred = await storage.claimSession(
        req.params.sessionId,
        targetAgent.id,
        targetAgent.displayName,
        targetAgent.color || "#6200EA"
      );
      let updated = transferred;
      if (updated && updated.tags) {
        const newTags = updated.tags.filter((t) => t !== "Bot");
        if (!newTags.includes("Ejecutivo")) newTags.push("Ejecutivo");
        updated = await storage.updateSessionTags(req.params.sessionId, newTags) || updated;
      }
      await storage.createMessage({
        sessionId: req.params.sessionId,
        content: `Chat transferido de ${adminUser.displayName} a ${targetAgent.displayName}`,
        sender: "support" as const,
        userEmail: session.userEmail || "",
        userName: session.userName || "",
        tenantId: session.tenantId ?? null,
      });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "transfer", session: updated });
      sendPushToAdmins(
        `Chat transferido`,
        `${adminUser.displayName} te ha transferido el chat de ${session.userName || "un usuario"}`,
        req.params.sessionId,
        targetAgent.id
      );
      res.json(updated);
    } catch (error) {
      log(`Error al transferir chat: ${(error as Error).message}`, "api");
      res.status(500).json({ message: "Error al transferir chat" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/block", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      await storage.blockSession(req.params.sessionId);

      const session = await storage.getSession(req.params.sessionId);
      const warningMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session?.userEmail || "",
        userName: "Soporte",
        sender: "support",
        content: "Tu chat ha sido bloqueado por un administrador debido a comportamiento inapropiado.",
        tenantId: session?.tenantId ?? null,
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", warningMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: warningMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al bloquear sesión" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/unblock", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      await storage.unblockSession(req.params.sessionId);

      const session = await storage.getSession(req.params.sessionId);
      const unblockMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session?.userEmail || "",
        userName: "Soporte",
        sender: "support",
        content: "Tu chat ha sido desbloqueado. Puedes continuar la conversación.",
        tenantId: session?.tenantId ?? null,
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", unblockMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: unblockMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al desbloquear sesión" });
    }
  });

  app.post("/api/admin/sessions/:sessionId/reply", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const { content, imageUrl } = req.body;
      if ((!content || typeof content !== "string" || content.trim().length === 0) && !imageUrl) {
        return res.status(400).json({ message: "Contenido requerido" });
      }

      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }

      if (isLockedToOtherAgent(session, adminUser)) {
        return res.status(403).json(lockedResponse(session));
      }

      const dbAdmin = await storage.getAdminUserById(adminUser.id);

      if (!session.assignedTo) {
        const claimed = await storage.claimSession(
          req.params.sessionId,
          adminUser.id,
          adminUser.displayName,
          dbAdmin?.color || "#6200EA"
        );
        if (claimed) {
          const currentTags: string[] = claimed.tags || [];
          const hadBot = currentTags.includes("Bot");
          const hadEjecutivo = currentTags.includes("Ejecutivo");
          if (hadBot || !hadEjecutivo) {
            const newTags = currentTags.filter((t: string) => t !== "Bot");
            if (!hadEjecutivo) newTags.push("Ejecutivo");
            await storage.updateSessionTags(req.params.sessionId, newTags);
          }
          io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId, type: "claimed", session: claimed });
        }
        if (!session.adminActive) {
          await storage.updateSessionAdminActive(req.params.sessionId, true);
        }
      }

      const message = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session.userEmail,
        userName: "Soporte",
        sender: "support",
        content: (content || "").trim() || (imageUrl ? (/\.(mp4|webm|mov|avi|mkv)$/i.test(imageUrl) ? "Video enviado" : "Imagen enviada") : ""),
        imageUrl: imageUrl || null,
        adminName: adminUser.displayName,
        adminColor: dbAdmin?.color || "#6200EA",
        tenantId: session.tenantId ?? null,
      });

      await storage.touchSession(req.params.sessionId);
      await storage.markSessionRead(req.params.sessionId);

      io.to(`session:${req.params.sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message });
      emitToTenantRoom(req.params.sessionId, { message });

      if (!isSessionOnline(req.params.sessionId)) {
        const lastNotificationTime = offlineNotificationTimestamps.get(req.params.sessionId);
        const now = Date.now();
        
        if (!lastNotificationTime || now - lastNotificationTime >= OFFLINE_NOTIFICATION_COOLDOWN) {
          sendOfflineNotification({
            userName: session.userName,
            userEmail: session.userEmail,
            messageContent: content.trim(),
            sessionId: req.params.sessionId,
          }).catch(() => {});
          
          offlineNotificationTimestamps.set(req.params.sessionId, now);
        }
      }

      res.json(message);
    } catch (error: any) {
      log(`Error al enviar respuesta admin: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar respuesta" });
    }
  });

  app.post("/api/admin/sessions/:sessionId/send-rating", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }

      if (isLockedToOtherAgent(session, adminUser)) {
        return res.status(403).json(lockedResponse(session));
      }

      const existingRating = await storage.getRatingBySessionId(req.params.sessionId);
      if (existingRating) {
        return res.status(409).json({ message: "Ya existe una calificación para esta sesión" });
      }

      const message = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session.userEmail,
        userName: "Soporte",
        sender: "support",
        content: "{{SHOW_RATING}}",
        imageUrl: null,
        tenantId: session.tenantId ?? null,
      });

      await storage.touchSession(req.params.sessionId);
      io.to(`session:${req.params.sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message });
      emitToTenantRoom(req.params.sessionId, { message });

      res.json(message);
    } catch (error: any) {
      log(`Error al enviar encuesta: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar encuesta" });
    }
  });

  app.post("/api/admin/sessions/:id/send-email", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }

      const userEmail = session.userEmail;
      const userName = session.userName;

      if (!userEmail) {
        return res.status(400).json({ message: "No se encontro email del usuario" });
      }

      const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
      const host = req.get("host") || "";
      const baseUrl = `${protocol}://${host}`;
      const chatUrl = `${baseUrl}/chat?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName || "")}`;

      const result = await sendChatInviteEmail({
        userName: userName || "Usuario",
        userEmail,
        sessionId: req.params.id,
        agentName: user.displayName,
        chatUrl,
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Error al enviar el correo" });
      }

      await storage.updateSessionManualEmailAt(req.params.id);

      const emailSession = await storage.getSession(req.params.id);
      const systemMsg = await storage.createMessage({
        sessionId: req.params.id,
        userEmail: userEmail,
        userName: user.displayName,
        sender: "support",
        content: `${user.displayName} envio un correo de invitacion al usuario`,
        imageUrl: null,
        tenantId: emailSession?.tenantId ?? null,
      });

      io.to(`session:${req.params.id}`).emit("new_message", systemMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.id, message: systemMsg });
      emitToTenantRoom(req.params.id, { message: systemMsg });
      io.to("admin_room").emit("manual_email_sent", { sessionId: req.params.id, agentName: user.displayName, timestamp: new Date().toISOString() });

      res.json({ success: true });
    } catch (error: any) {
      log(`Error al enviar correo de invitacion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar correo" });
    }
  });

  app.post("/api/sessions/:sessionId/request-rating", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }

      const message = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session.userEmail,
        userName: "Soporte",
        sender: "support",
        content: "{{SHOW_RATING}}",
        imageUrl: null,
        tenantId: session.tenantId,
      });

      await storage.touchSession(req.params.sessionId);
      io.to(`session:${req.params.sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message });
      emitToTenantRoom(req.params.sessionId, { message });

      res.json(message);
    } catch (error: any) {
      log(`Error al solicitar calificacion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al solicitar calificacion" });
    }
  });

  io.on("connection", (socket) => {
    const { email, name, sessionId, role, tenantId: socketTenantId } = socket.handshake.auth as { email: string; name: string; sessionId: string; role?: string; tenantId?: number };

    if (role === "admin") {
      log(`Admin socket conectado: ${socket.id}`, "socket.io");
      socket.on("join_admin_room", (data: { token: string }) => {
        const adminUser = verifyToken(data.token);
        if (adminUser) {
          socket.join("admin_room");
          log(`Admin ${adminUser.displayName} unido a admin_room`, "socket.io");
        }
      });
      socket.on("disconnect", () => {
        log(`Admin socket desconectado: ${socket.id}`, "socket.io");
      });
      return;
    }

    if (role === "tenant") {
      log(`Tenant socket conectado: ${socket.id}`, "socket.io");
      socket.on("join_tenant_room", (data: { token: string }) => {
        try {
          const decoded = jwt.verify(data.token, JWT_SECRET) as any;
          if (decoded && decoded.isTenant && decoded.id) {
            socket.join(`tenant:${decoded.id}`);
            log(`Tenant ${decoded.id} unido a tenant:${decoded.id}`, "socket.io");
          }
        } catch (e) {
          log(`Error al verificar token de tenant: ${e}`, "socket.io");
        }
      });
      socket.on("disconnect", () => {
        log(`Tenant socket desconectado: ${socket.id}`, "socket.io");
      });
      return;
    }

    if (!email || !name || !sessionId) {
      socket.disconnect(true);
      return;
    }

    log(`Usuario conectado: ${name} (${email}) session:${sessionId}`, "socket.io");
    socket.join(`session:${sessionId}`);
    addSessionConnection(sessionId, socket.id);

    userSessions.set(socket.id, { email, name, sessionId });

    storage.upsertSession({ sessionId, userEmail: email, userName: name, tenantId: socketTenantId || null }).catch(() => {});

    storage.getMessagesBySessionId(sessionId).then((history) => {
      socket.emit("chat_history", history);
    }).catch((err) => {
      log(`Error al cargar historial: ${err.message}`, "socket.io");
      socket.emit("chat_history", []);
    });

    socket.on("page_info", (data: { url?: string; title?: string }) => {
      const session = userSessions.get(socket.id);
      if (session) {
        session.pageUrl = data.url || "";
        session.pageTitle = data.title || "";
        userSessions.set(socket.id, session);
      }
    });

    socket.on("send_message", async (data: unknown) => {
      const parsed = socketMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("error", { message: "Datos de mensaje invalidos" });
        return;
      }

      const session = userSessions.get(socket.id);
      const sid = (data as any)?.sessionId || session?.sessionId;
      if (!sid) {
        socket.emit("error", { message: "Session ID requerido" });
        return;
      }

      try {
        const normalizedEmail = parsed.data.userEmail.toLowerCase();

        await storage.upsertSession({
          sessionId: sid,
          userEmail: normalizedEmail,
          userName: parsed.data.userName,
          tenantId: socketTenantId || null,
        });

        if (parsed.data.sender === "user") {
          const blocked = await storage.isSessionBlocked(sid);
          if (blocked) {
            socket.emit("error", { message: "Tu chat ha sido bloqueado por uso reiterado de lenguaje inapropiado." });
            return;
          }

          const profanityCheck = containsProfanity(parsed.data.content);
          if (profanityCheck.hasProfanity) {
            const newCount = await storage.incrementWarningCount(sid);
            if (newCount >= BLOCK_THRESHOLD) {
              await storage.blockSession(sid);
            }
            const warningText = getProfanityWarningMessage(newCount);

            const blockedMsg = await storage.createMessage({
              sessionId: sid,
              userEmail: normalizedEmail,
              userName: parsed.data.userName,
              sender: "user",
              content: "[Mensaje con contenido inapropiado]",
              tenantId: socketTenantId || null,
            });
            io.to(`session:${sid}`).emit("new_message", blockedMsg);
            io.to("admin_room").emit("admin_new_message", { sessionId: sid, message: blockedMsg });

            const warningMsg = await storage.createMessage({
              sessionId: sid,
              userEmail: normalizedEmail,
              userName: "Soporte",
              sender: "support",
              content: warningText,
              tenantId: socketTenantId || null,
            });
            io.to(`session:${sid}`).emit("new_message", warningMsg);
            io.to("admin_room").emit("admin_new_message", { sessionId: sid, message: warningMsg });
            await storage.touchSession(sid);
            return;
          }
        }

        const message = await storage.createMessage({
          sessionId: sid,
          userEmail: normalizedEmail,
          userName: parsed.data.userName,
          sender: parsed.data.sender,
          content: parsed.data.content,
          tenantId: socketTenantId || null,
        });

        await storage.touchSession(sid);

        io.to(`session:${sid}`).emit("new_message", message);

        if (parsed.data.sender === "user") {
          const sessForPush = await storage.getSession(sid);
          sendPushToAdmins(
            `Nuevo mensaje de ${parsed.data.userName}`,
            parsed.data.content.substring(0, 100),
            sid,
            sessForPush?.assignedTo
          );
          io.to("admin_room").emit("admin_new_message", { sessionId: sid, userName: parsed.data.userName, content: parsed.data.content, message, assignedTo: sessForPush?.assignedTo || null });
          emitToTenantRoom(sid, { userName: parsed.data.userName, content: parsed.data.content, message });
          setTimeout(async () => {
            try {
              const currentSession = await storage.getSession(sid);
              if (currentSession?.adminActive) return;

              const historyMessages = await storage.getMessagesBySessionId(sid);
              const conversationHistory = historyMessages.map(m => ({
                sender: m.sender,
                content: m.content,
              }));

              const socketCatalogLookup = {
                searchByName: async (query: string) => {
                  const results = await storage.searchProductsByName(query);
                  return results.map(p => ({
                    name: p.name,
                    price: p.price,
                    productUrl: p.productUrl,
                    availability: p.availability,
                    platform: p.platform,
                    description: p.description,
                    category: p.category,
                    accountType: p.accountType,
                  }));
                },
                getByPlatform: async (platform: string) => {
                  const results = await storage.getProductsByPlatform(platform);
                  return results.map(p => ({
                    name: p.name,
                    price: p.price,
                    productUrl: p.productUrl,
                    availability: p.availability,
                    platform: p.platform,
                    description: p.description,
                    category: p.category,
                    accountType: p.accountType,
                  }));
                },
                getByCategory: async (category: string) => {
                  const results = await storage.getProductsByCategory(category);
                  return results.map(p => ({
                    name: p.name,
                    price: p.price,
                    productUrl: p.productUrl,
                    availability: p.availability,
                    platform: p.platform,
                    description: p.description,
                    category: p.category,
                    accountType: p.accountType,
                  }));
                },
                getTotalCount: async () => {
                  return storage.getProductCount();
                },
              };

              const socketAutoReplyInput = (data as any)?.quickReplyValue || parsed.data.content;
              const replyContent = await getSmartAutoReply(
                socketAutoReplyInput,
                conversationHistory,
                {
                  problemType: currentSession?.problemType || null,
                  gameName: currentSession?.gameName || null,
                  pageTitle: session?.pageTitle || null,
                  pageUrl: session?.pageUrl || null,
                  userName: parsed.data.userName || null,
                },
                socketCatalogLookup,
                socketTenantId || null
              );

              const autoReply = await storage.createMessage({
                sessionId: sid,
                userEmail: normalizedEmail,
                userName: "Soporte",
                sender: "support",
                content: replyContent,
                tenantId: socketTenantId || null,
              });
              io.to(`session:${sid}`).emit("new_message", autoReply);
              io.to("admin_room").emit("admin_new_message", { sessionId: sid, message: autoReply });
              emitToTenantRoom(sid, { message: autoReply });
            } catch (err: any) {
              log(`Error en auto-respuesta: ${err.message}`, "socket.io");
            }
          }, 1500);
        }
      } catch (error: any) {
        log(`Error al guardar mensaje: ${error.message}`, "socket.io");
        socket.emit("error", { message: "Error al enviar mensaje" });
      }
    });

    socket.on("contact_executive", async (data: unknown) => {
      const parsed = contactSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("error", { message: "Datos invalidos" });
        return;
      }

      try {
        const recentMessages = await storage.getMessagesBySessionId(parsed.data.sessionId);
        const lastMessages = recentMessages.slice(-10);
        const chatSummary = lastMessages
          .map((m) => `${m.sender === "user" ? parsed.data.userName : "Soporte"}: ${m.content}`)
          .join("\n");

        const normalizedEmail = parsed.data.userEmail.toLowerCase();

        const contactRequest = await storage.createContactRequest({
          userEmail: normalizedEmail,
          userName: parsed.data.userName,
          pageUrl: parsed.data.pageUrl || null,
          pageTitle: parsed.data.pageTitle || null,
          chatSummary: chatSummary || null,
          problemType: parsed.data.problemType || null,
          gameName: parsed.data.gameName || null,
          tenantId: socketTenantId || null,
        });

        const emailSent = await sendContactNotification({
          userName: parsed.data.userName,
          userEmail: parsed.data.userEmail,
          pageUrl: parsed.data.pageUrl,
          pageTitle: parsed.data.pageTitle,
          chatSummary,
          problemType: parsed.data.problemType,
          gameName: parsed.data.gameName,
        });

        const sessForContact = await storage.getSession(parsed.data.sessionId);
        sendPushToAdmins(
          `Solicitud de ejecutivo`,
          `${parsed.data.userName} solicita contacto`,
          parsed.data.sessionId,
          sessForContact?.assignedTo
        );

        socket.emit("contact_confirmed");

        const confirmMsg = await storage.createMessage({
          sessionId: parsed.data.sessionId,
          userEmail: normalizedEmail,
          userName: "Soporte",
          sender: "support",
          content: emailSent
            ? "Tu solicitud ha sido enviada. Un ejecutivo se pondrá en contacto contigo por correo electrónico lo antes posible."
            : "Hemos registrado tu solicitud. Un ejecutivo se comunicara contigo pronto.",
          tenantId: socketTenantId || null,
        });

        io.to(`session:${parsed.data.sessionId}`).emit("new_message", confirmMsg);
        io.to("admin_room").emit("admin_new_message", { sessionId: parsed.data.sessionId, message: confirmMsg });
        emitToTenantRoom(parsed.data.sessionId, { message: confirmMsg });
        log(`Solicitud de contacto de ${parsed.data.userName} (${parsed.data.userEmail}) - Email: ${emailSent ? "enviado" : "no enviado"}`, "contact");
      } catch (error: any) {
        log(`Error en solicitud de contacto: ${error.message}`, "socket.io");
        socket.emit("error", { message: "Error al procesar solicitud" });
      }
    });

    socket.on("disconnect", () => {
      const session = userSessions.get(socket.id);
      if (session) {
        removeSessionConnection(session.sessionId, socket.id);
      }
      userSessions.delete(socket.id);
      log(`Usuario desconectado: ${name} (${email})`, "socket.io");

      const disconnectedSessionId = sessionId;
      const disconnectedEmail = email;
      const disconnectedName = name;
      const host = process.env.REPLIT_DEV_DOMAIN || socket.handshake.headers.host || "localhost:5000";

      setTimeout(async () => {
        try {
          const activeConns = sessionConnections.get(disconnectedSessionId);
          if (activeConns && activeConns.size > 0) {
            log(`Usuario reconectado a session ${disconnectedSessionId}, no se envia correo automático`, "auto-email");
            return;
          }

          const sessionData = await storage.getSession(disconnectedSessionId);
          if (!sessionData || !sessionData.userEmail) return;

          if (sessionData.status === "closed") return;
          if (!sessionData.adminActive) return;

          const msgs = await storage.getMessagesBySessionId(disconnectedSessionId);
          if (msgs.length === 0) return;

          const lastUserMsg = [...msgs].reverse().find(m => m.sender === "user");
          const lastUserTime = lastUserMsg ? new Date(lastUserMsg.timestamp).getTime() : 0;

          const recentAdminMsgs = msgs.filter(m =>
            m.sender === "support" &&
            m.adminName &&
            m.content !== "{{SHOW_RATING}}" &&
            !m.content.startsWith("Correo automatico enviado") &&
            !m.content.includes("envio un correo de invitacion") &&
            new Date(m.timestamp).getTime() > lastUserTime
          );

          if (recentAdminMsgs.length === 0) {
            log(`No hay mensajes de admin sin leer en session ${disconnectedSessionId}, no se envia correo`, "auto-email");
            return;
          }

          const latestAdminMsgTime = Math.max(...recentAdminMsgs.map(m => new Date(m.timestamp).getTime()));
          const lastAutoEmail = sessionData.lastAutoEmailAt;
          if (lastAutoEmail) {
            const lastAutoEmailTime = new Date(lastAutoEmail).getTime();
            if (lastAutoEmailTime > latestAdminMsgTime) {
              log(`Ya se envio correo automático para estos mensajes en session ${disconnectedSessionId}`, "auto-email");
              return;
            }
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            if (new Date(lastAutoEmail) > twoHoursAgo) {
              log(`Cooldown activo para session ${disconnectedSessionId}, ultimo correo automático: ${lastAutoEmail}`, "auto-email");
              return;
            }
          }

          const chatUrl = `https://${host}/chat?email=${encodeURIComponent(disconnectedEmail)}&name=${encodeURIComponent(disconnectedName)}`;

          const result = await sendChatInviteEmail({
            userName: disconnectedName || "Usuario",
            userEmail: disconnectedEmail,
            sessionId: disconnectedSessionId,
            agentName: "Sistema automático",
            chatUrl,
          });

          if (result.success) {
            await storage.updateSessionAutoEmailAt(disconnectedSessionId);

            const emailSess = await storage.getSession(disconnectedSessionId);
            const systemMsg = await storage.createMessage({
              sessionId: disconnectedSessionId,
              userEmail: disconnectedEmail,
              userName: "Soporte",
              sender: "support",
              content: "Correo automatico enviado al usuario",
              imageUrl: null,
              tenantId: emailSess?.tenantId ?? null,
            });

            io.to(`session:${disconnectedSessionId}`).emit("new_message", systemMsg);
            io.to("admin_room").emit("admin_new_message", { sessionId: disconnectedSessionId, message: systemMsg });
            emitToTenantRoom(disconnectedSessionId, { message: systemMsg });
            io.to("admin_room").emit("auto_email_sent", { sessionId: disconnectedSessionId, timestamp: new Date().toISOString() });

            log(`Correo automatico enviado a ${disconnectedEmail} para session ${disconnectedSessionId}`, "auto-email");
          } else {
            log(`Error al enviar correo automático a ${disconnectedEmail}: ${result.error}`, "auto-email");
          }
        } catch (error: any) {
          log(`Error en auto-email para session ${disconnectedSessionId}: ${error.message}`, "auto-email");
        }
      }, 2 * 60 * 1000);
    });
  });

  return httpServer;
}

