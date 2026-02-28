import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema, insertCannedResponseSchema, insertProductSchema, insertRatingSchema, insertAdminUserSchema, insertKnowledgeBaseSchema } from "@shared/schema";
import { sendContactNotification, sendOfflineNotification, sendChatInviteEmail } from "./email";
import { log } from "./index";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getSmartAutoReply } from "./autoReply";
import { containsProfanity, getProfanityWarningMessage, BLOCK_THRESHOLD, getBuiltinWords, getCustomWords, setCustomWords } from "./profanityFilter";
import { syncWooCommerceProducts, getWCSyncStatus } from "./woocommerce";
import { extractKnowledgeFromSessions } from "./knowledgeBase";
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
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    cookie: false,
  });

  const userSessions = new Map<string, UserSession>();
  const offlineNotificationTimestamps = new Map<string, number>();
  const OFFLINE_NOTIFICATION_COOLDOWN = 30 * 60 * 1000;

  const JWT_SECRET = process.env.SESSION_SECRET || "default-secret";

  function generateToken(user: { id: number; email: string; role: string; displayName: string }) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role, displayName: user.displayName }, JWT_SECRET, { expiresIn: "30d" });
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
    webpush.setVapidDetails("mailto:cjmdigitales@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
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
        const hash = await bcrypt.hash("peseta832", 12);
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

  const savedCustomWords = await storage.getSetting("custom_profanity_words");
  if (savedCustomWords) {
    try { setCustomWords(JSON.parse(savedCustomWords)); } catch {}
  }

  registerObjectStorageRoutes(app);

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
      const msgs = await storage.getMessagesByEmail(email.toLowerCase());
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
      const userSessions = await storage.getSessionsByEmail(email.toLowerCase());
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
      const session = await storage.findActiveSessionByEmail(email.toLowerCase());
      if (session) {
        res.json({ sessionId: session.sessionId });
      } else {
        res.json({ sessionId: null });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al resolver sesion" });
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

      const upsertData: { sessionId: string; userEmail: string; userName: string; problemType?: string; gameName?: string } = {
        sessionId,
        userEmail: normalizedEmail,
        userName: parsed.data.userName,
      };
      if (req.body.problemType) upsertData.problemType = req.body.problemType;
      if (req.body.gameName) upsertData.gameName = req.body.gameName;
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
          });
          io.to(`session:${sessionId}`).emit("new_message", blockedMsg);
          io.to("admin_room").emit("admin_new_message", { sessionId, message: blockedMsg });

          const warningMsg = await storage.createMessage({
            sessionId,
            userEmail: normalizedEmail,
            userName: "Soporte",
            sender: "support",
            content: warningText,
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
      });

      await storage.touchSession(sessionId);

      const sess = await storage.getSession(sessionId);
      io.to(`session:${sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId, message, assignedTo: sess?.assignedTo || null });

      if (parsed.data.sender === "user") {
        sendPushToAdmins(
          `Nuevo mensaje de ${parsed.data.userName}`,
          parsed.data.content.substring(0, 100),
          sessionId,
          sess?.assignedTo
        );
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
              catalogLookup
            );

            const autoReply = await storage.createMessage({
              sessionId,
              userEmail: normalizedEmail,
              userName: "Soporte",
              sender: "support",
              content: replyContent,
            });
            io.to(`session:${sessionId}`).emit("new_message", autoReply);
            io.to("admin_room").emit("admin_new_message", { sessionId, message: autoReply });

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

      const contactRequest = await storage.createContactRequest({
        userEmail: normalizedEmail,
        userName: parsed.data.userName,
        pageUrl: parsed.data.pageUrl || null,
        pageTitle: parsed.data.pageTitle || null,
        chatSummary: chatSummary || null,
        problemType: parsed.data.problemType || null,
        gameName: parsed.data.gameName || null,
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
          ? "Tu solicitud ha sido enviada. Un ejecutivo se pondra en contacto contigo por correo electronico lo antes posible."
          : "Hemos registrado tu solicitud. Un ejecutivo se comunicara contigo pronto.",
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
    return jwt.sign({ id: tenant.id, email: tenant.email, companyName: tenant.companyName, isTenant: true }, JWT_SECRET, { expiresIn: "30d" });
  }

  function verifyTenantToken(token: string): { id: number; email: string; companyName: string; isTenant: true } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded.isTenant) return null;
      return decoded;
    } catch { return null; }
  }

  function requireTenantAuth(req: any, res: any): { id: number; email: string; companyName: string } | null {
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

  app.post("/api/tenants/register", async (req, res) => {
    try {
      const { name, email, password, companyName } = req.body;
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
      const passwordHash = await bcrypt.hash(password, 10);
      const tenant = await storage.createTenant({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        companyName,
      });
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
    res.json({ id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, welcomeMessage: tenant.welcomeMessage, logoUrl: tenant.logoUrl, domain: tenant.domain, createdAt: tenant.createdAt });
  });

  app.patch("/api/tenants/me", async (req, res) => {
    const auth = requireTenantAuth(req, res);
    if (!auth) return;
    try {
      const { companyName, widgetColor, welcomeMessage, logoUrl, domain } = req.body;
      const updates: any = {};
      if (companyName !== undefined) updates.companyName = companyName;
      if (widgetColor !== undefined) updates.widgetColor = widgetColor;
      if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (domain !== undefined) updates.domain = domain;
      const tenant = await storage.updateTenant(auth.id, updates);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant no encontrado" });
      }
      res.json({ id: tenant.id, name: tenant.name, email: tenant.email, companyName: tenant.companyName, plan: tenant.plan, widgetColor: tenant.widgetColor, welcomeMessage: tenant.welcomeMessage, logoUrl: tenant.logoUrl, domain: tenant.domain });
    } catch (error: any) {
      log(`Error actualizando tenant: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar" });
    }
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
      const ticketUrl = await storage.getSetting("business_hours_ticket_url") || "https://cjmdigitales.zohodesk.com/portal/es/newticket";
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
      res.status(500).json({ message: "Error al obtener configuracion" });
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
      res.status(500).json({ message: "Error al guardar configuracion" });
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
        return res.status(400).json({ message: "Datos de suscripcion invalidos" });
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
      res.status(500).json({ message: "Error al eliminar suscripcion" });
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
      log(`Error al obtener mensajes de sesion: ${error.message}`, "api");
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
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      let allProducts = await storage.getProducts();

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

  app.get("/api/admin/wc/status", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      const status = await getWCSyncStatus();
      res.json(status);
    } catch (error: any) {
      log(`Error al obtener estado WC: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener estado" });
    }
  });

  app.post("/api/admin/wc/sync", async (req, res) => {
    const adminUser = requireAuth(req, res);
    if (!adminUser) return;
    try {
      log("Iniciando sincronizacion WooCommerce manual", "woocommerce");
      const result = await syncWooCommerceProducts();
      res.json(result);
    } catch (error: any) {
      log(`Error en sincronizacion WC: ${error.message}`, "api");
      res.status(500).json({ message: "Error en sincronizacion", error: error.message });
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
        return res.status(409).json({ message: "Ya existe una calificacion para esta sesion", rating: existing });
      }
      const created = await storage.createRating(parsed.data);
      await storage.updateSessionStatus(parsed.data.sessionId, "closed");
      io.to("admin_room").emit("session_updated", { sessionId: parsed.data.sessionId, type: "status", session: { status: "closed" } });
      res.status(201).json(created);
    } catch (error: any) {
      log(`Error al crear calificacion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al crear calificacion" });
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
      if (!rating) return res.status(404).json({ message: "No hay calificacion para esta sesion" });
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
        ? "Un agente de soporte se ha unido a la conversacion. A partir de ahora seras atendido personalmente."
        : "El agente de soporte ha salido de la conversacion. El asistente automatico seguira ayudandote.";

      const notifyMsg = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session?.userEmail || "support@system",
        userName: "Soporte",
        sender: "support",
        content: notifyContent,
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
        content: "El agente de soporte ha salido de la conversacion. El asistente automatico seguira ayudandote.",
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
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", warningMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: warningMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al bloquear sesion" });
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
        content: "Tu chat ha sido desbloqueado. Puedes continuar la conversacion.",
      });
      io.to(`session:${req.params.sessionId}`).emit("new_message", unblockMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message: unblockMsg });
      io.to("admin_room").emit("session_updated", { sessionId: req.params.sessionId });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error al desbloquear sesion" });
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
      });

      await storage.touchSession(req.params.sessionId);
      await storage.markSessionRead(req.params.sessionId);

      io.to(`session:${req.params.sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message });

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
        return res.status(409).json({ message: "Ya existe una calificacion para esta sesion" });
      }

      const message = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session.userEmail,
        userName: "Soporte",
        sender: "support",
        content: "{{SHOW_RATING}}",
        imageUrl: null,
      });

      await storage.touchSession(req.params.sessionId);
      io.to(`session:${req.params.sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message });

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

      const systemMsg = await storage.createMessage({
        sessionId: req.params.id,
        userEmail: userEmail,
        userName: user.displayName,
        sender: "support",
        content: `${user.displayName} envio un correo de invitacion al usuario`,
        imageUrl: null,
      });

      io.to(`session:${req.params.id}`).emit("new_message", systemMsg);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.id, message: systemMsg });
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
      });

      await storage.touchSession(req.params.sessionId);
      io.to(`session:${req.params.sessionId}`).emit("new_message", message);
      io.to("admin_room").emit("admin_new_message", { sessionId: req.params.sessionId, message });

      res.json(message);
    } catch (error: any) {
      log(`Error al solicitar calificacion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al solicitar calificacion" });
    }
  });

  io.on("connection", (socket) => {
    const { email, name, sessionId, role } = socket.handshake.auth as { email: string; name: string; sessionId: string; role?: string };

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

    if (!email || !name || !sessionId) {
      socket.disconnect(true);
      return;
    }

    log(`Usuario conectado: ${name} (${email}) session:${sessionId}`, "socket.io");
    socket.join(`session:${sessionId}`);
    addSessionConnection(sessionId, socket.id);

    userSessions.set(socket.id, { email, name, sessionId });

    storage.upsertSession({ sessionId, userEmail: email, userName: name }).catch(() => {});

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
            });
            io.to(`session:${sid}`).emit("new_message", blockedMsg);
            io.to("admin_room").emit("admin_new_message", { sessionId: sid, message: blockedMsg });

            const warningMsg = await storage.createMessage({
              sessionId: sid,
              userEmail: normalizedEmail,
              userName: "Soporte",
              sender: "support",
              content: warningText,
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
                socketCatalogLookup
              );

              const autoReply = await storage.createMessage({
                sessionId: sid,
                userEmail: normalizedEmail,
                userName: "Soporte",
                sender: "support",
                content: replyContent,
              });
              io.to(`session:${sid}`).emit("new_message", autoReply);
              io.to("admin_room").emit("admin_new_message", { sessionId: sid, message: autoReply });
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
            ? "Tu solicitud ha sido enviada. Un ejecutivo se pondra en contacto contigo por correo electronico lo antes posible."
            : "Hemos registrado tu solicitud. Un ejecutivo se comunicara contigo pronto.",
        });

        io.to(`session:${parsed.data.sessionId}`).emit("new_message", confirmMsg);
        io.to("admin_room").emit("admin_new_message", { sessionId: parsed.data.sessionId, message: confirmMsg });
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
            log(`Usuario reconectado a session ${disconnectedSessionId}, no se envia correo automatico`, "auto-email");
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
              log(`Ya se envio correo automatico para estos mensajes en session ${disconnectedSessionId}`, "auto-email");
              return;
            }
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            if (new Date(lastAutoEmail) > twoHoursAgo) {
              log(`Cooldown activo para session ${disconnectedSessionId}, ultimo correo automatico: ${lastAutoEmail}`, "auto-email");
              return;
            }
          }

          const chatUrl = `https://${host}/chat?email=${encodeURIComponent(disconnectedEmail)}&name=${encodeURIComponent(disconnectedName)}`;

          const result = await sendChatInviteEmail({
            userName: disconnectedName || "Usuario",
            userEmail: disconnectedEmail,
            sessionId: disconnectedSessionId,
            agentName: "Sistema automatico",
            chatUrl,
          });

          if (result.success) {
            await storage.updateSessionAutoEmailAt(disconnectedSessionId);

            const systemMsg = await storage.createMessage({
              sessionId: disconnectedSessionId,
              userEmail: disconnectedEmail,
              userName: "Soporte",
              sender: "support",
              content: "Correo automatico enviado al usuario",
              imageUrl: null,
            });

            io.to(`session:${disconnectedSessionId}`).emit("new_message", systemMsg);
            io.to("admin_room").emit("admin_new_message", { sessionId: disconnectedSessionId, message: systemMsg });
            io.to("admin_room").emit("auto_email_sent", { sessionId: disconnectedSessionId, timestamp: new Date().toISOString() });

            log(`Correo automatico enviado a ${disconnectedEmail} para session ${disconnectedSessionId}`, "auto-email");
          } else {
            log(`Error al enviar correo automatico a ${disconnectedEmail}: ${result.error}`, "auto-email");
          }
        } catch (error: any) {
          log(`Error en auto-email para session ${disconnectedSessionId}: ${error.message}`, "auto-email");
        }
      }, 2 * 60 * 1000);
    });
  });

  return httpServer;
}

