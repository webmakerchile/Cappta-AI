import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema, insertCannedResponseSchema } from "@shared/schema";
import { sendContactNotification, sendOfflineNotification } from "./email";
import { log } from "./index";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

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

  registerObjectStorageRoutes(app);

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

  app.post("/api/messages", async (req, res) => {
    try {
      const hasImage = !!req.body.imageUrl;
      const bodyForValidation = { ...req.body };
      if (hasImage && (!bodyForValidation.content || bodyForValidation.content.trim() === "")) {
        bodyForValidation.content = "Imagen enviada";
      }
      const parsed = socketMessageSchema.safeParse(bodyForValidation);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos de mensaje invalidos" });
      }

      const sessionId = req.body.sessionId;
      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ message: "Session ID requerido" });
      }

      await storage.upsertSession({
        sessionId,
        userEmail: parsed.data.userEmail,
        userName: parsed.data.userName,
        problemType: req.body.problemType || null,
        gameName: req.body.gameName || null,
      });

      const message = await storage.createMessage({
        sessionId,
        userEmail: parsed.data.userEmail,
        userName: parsed.data.userName,
        sender: parsed.data.sender,
        content: parsed.data.content,
        imageUrl: req.body.imageUrl || null,
      });

      await storage.touchSession(sessionId);

      io.to(`session:${sessionId}`).emit("new_message", message);

      if (parsed.data.sender === "user" && !req.body.imageUrl) {
        const pageUrl = req.body.pageUrl || "";
        const pageTitle = req.body.pageTitle || "";
        setTimeout(async () => {
          try {
            const currentSession = await storage.getSession(sessionId);
            if (currentSession?.adminActive) return;

            const autoReply = await storage.createMessage({
              sessionId,
              userEmail: parsed.data.userEmail,
              userName: "Soporte",
              sender: "support",
              content: getAutoReply(parsed.data.content, pageTitle, pageUrl),
            });
            io.to(`session:${sessionId}`).emit("new_message", autoReply);

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

      const contactRequest = await storage.createContactRequest({
        userEmail: parsed.data.userEmail,
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
        userEmail: parsed.data.userEmail,
        userName: "Soporte",
        sender: "support",
        content: emailSent
          ? "Tu solicitud ha sido enviada. Un ejecutivo se pondra en contacto contigo por correo electronico lo antes posible."
          : "Hemos registrado tu solicitud. Un ejecutivo se comunicara contigo pronto.",
      });

      io.to(`session:${parsed.data.sessionId}`).emit("new_message", confirmMsg);
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

  const ADMIN_KEY = process.env.SESSION_SECRET;

  function requireAdmin(req: any, res: any): boolean {
    if (!ADMIN_KEY) {
      res.status(503).json({ message: "Admin no configurado" });
      return false;
    }
    const authHeader = req.headers["x-admin-key"] || req.query.key;
    if (authHeader !== ADMIN_KEY) {
      res.status(401).json({ message: "No autorizado" });
      return false;
    }
    return true;
  }

  app.get("/api/admin/sessions", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const statusFilter = (req.query.status as string) || "all";
      const sessions = await storage.getAllSessions(statusFilter as "active" | "closed" | "all");
      res.json(sessions);
    } catch (error: any) {
      log(`Error al obtener sesiones: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener sesiones" });
    }
  });

  app.get("/api/admin/sessions/:sessionId/messages", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const msgs = await storage.getMessagesBySessionId(req.params.sessionId);
      res.json(msgs);
    } catch (error: any) {
      log(`Error al obtener mensajes de sesion: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/status", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { status } = req.body;
      if (status !== "active" && status !== "closed") {
        return res.status(400).json({ message: "Estado invalido" });
      }
      const updated = await storage.updateSessionStatus(req.params.sessionId, status);
      if (!updated) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      res.json(updated);
    } catch (error: any) {
      log(`Error al actualizar estado: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar estado" });
    }
  });

  app.patch("/api/admin/sessions/:sessionId/tags", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { tags } = req.body;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags debe ser un array" });
      }
      const updated = await storage.updateSessionTags(req.params.sessionId, tags);
      if (!updated) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }
      res.json(updated);
    } catch (error: any) {
      log(`Error al actualizar tags: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar tags" });
    }
  });

  app.get("/api/admin/search", async (req, res) => {
    if (!requireAdmin(req, res)) return;
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
    if (!requireAdmin(req, res)) return;
    try {
      const requests = await storage.getContactRequests();
      res.json(requests);
    } catch (error: any) {
      log(`Error al obtener solicitudes: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener solicitudes" });
    }
  });

  app.get("/api/admin/canned-responses", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const responses = await storage.getCannedResponses();
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener respuestas" });
    }
  });

  app.post("/api/admin/canned-responses", async (req, res) => {
    if (!requireAdmin(req, res)) return;
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
    if (!requireAdmin(req, res)) return;
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
    if (!requireAdmin(req, res)) return;
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

  app.patch("/api/admin/sessions/:sessionId/admin-active", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { adminActive } = req.body;
      if (typeof adminActive !== "boolean") {
        return res.status(400).json({ message: "adminActive debe ser boolean" });
      }
      const updated = await storage.updateSessionAdminActive(req.params.sessionId, adminActive);
      if (!updated) {
        return res.status(404).json({ message: "Sesion no encontrada" });
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

      res.json(updated);
    } catch (error: any) {
      log(`Error al cambiar admin activo: ${error.message}`, "api");
      res.status(500).json({ message: "Error al actualizar" });
    }
  });

  app.post("/api/admin/sessions/:sessionId/reply", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { content, imageUrl } = req.body;
      if ((!content || typeof content !== "string" || content.trim().length === 0) && !imageUrl) {
        return res.status(400).json({ message: "Contenido requerido" });
      }

      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Sesion no encontrada" });
      }

      const message = await storage.createMessage({
        sessionId: req.params.sessionId,
        userEmail: session.userEmail,
        userName: "Soporte",
        sender: "support",
        content: (content || "").trim() || (imageUrl ? "Imagen enviada" : ""),
        imageUrl: imageUrl || null,
      });

      await storage.touchSession(req.params.sessionId);

      io.to(`session:${req.params.sessionId}`).emit("new_message", message);

      if (!isSessionOnline(req.params.sessionId)) {
        sendOfflineNotification({
          userName: session.userName,
          userEmail: session.userEmail,
          messageContent: content.trim(),
          sessionId: req.params.sessionId,
        }).catch(() => {});
      }

      res.json(message);
    } catch (error: any) {
      log(`Error al enviar respuesta admin: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar respuesta" });
    }
  });

  io.on("connection", (socket) => {
    const { email, name, sessionId } = socket.handshake.auth as { email: string; name: string; sessionId: string };

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
        await storage.upsertSession({
          sessionId: sid,
          userEmail: parsed.data.userEmail,
          userName: parsed.data.userName,
        });

        const message = await storage.createMessage({
          sessionId: sid,
          userEmail: parsed.data.userEmail,
          userName: parsed.data.userName,
          sender: parsed.data.sender,
          content: parsed.data.content,
        });

        await storage.touchSession(sid);

        io.to(`session:${sid}`).emit("new_message", message);

        if (parsed.data.sender === "user") {
          setTimeout(async () => {
            try {
              const currentSession = await storage.getSession(sid);
              if (currentSession?.adminActive) return;

              const autoReply = await storage.createMessage({
                sessionId: sid,
                userEmail: parsed.data.userEmail,
                userName: "Soporte",
                sender: "support",
                content: getAutoReply(parsed.data.content, session?.pageTitle, session?.pageUrl),
              });
              io.to(`session:${sid}`).emit("new_message", autoReply);
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

        const contactRequest = await storage.createContactRequest({
          userEmail: parsed.data.userEmail,
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

        socket.emit("contact_confirmed");

        const confirmMsg = await storage.createMessage({
          sessionId: parsed.data.sessionId,
          userEmail: parsed.data.userEmail,
          userName: "Soporte",
          sender: "support",
          content: emailSent
            ? "Tu solicitud ha sido enviada. Un ejecutivo se pondra en contacto contigo por correo electronico lo antes posible."
            : "Hemos registrado tu solicitud. Un ejecutivo se comunicara contigo pronto.",
        });

        io.to(`session:${parsed.data.sessionId}`).emit("new_message", confirmMsg);
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
    });
  });

  return httpServer;
}

function getAutoReply(userMessage: string, pageTitle?: string, pageUrl?: string): string {
  const msg = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const url = (pageUrl || "").toLowerCase();
  const title = (pageTitle || "").toLowerCase();

  const pageContext = pageTitle ? ` Veo que estas navegando en "${pageTitle}".` : "";

  const isPlayStation = msg.includes("ps4") || msg.includes("ps5") || msg.includes("playstation") || msg.includes("play station") || msg.includes("sony") || url.includes("ps4") || url.includes("ps5") || url.includes("playstation") || title.includes("ps4") || title.includes("ps5");
  const isXbox = msg.includes("xbox") || msg.includes("microsoft") || msg.includes("game pass") || msg.includes("gamepass") || url.includes("xbox") || title.includes("xbox");

  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("hey") || msg.includes("hello") || msg.includes("hi") || msg.includes("buen dia") || msg.includes("buenos dias")) {
    if (isPlayStation) {
      return `¡Hola! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Tenemos un amplio catalogo de juegos y suscripciones para PS4 y PS5. ¿Que estas buscando? Puedo ayudarte con juegos, tarjetas PlayStation, o suscripciones PS Plus.`;
    }
    if (isXbox) {
      return `¡Hola! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Contamos con juegos y suscripciones para Xbox One y Xbox Series S|X. ¿Te interesa algun juego, tarjeta Xbox, o suscripcion Game Pass?`;
    }
    return `¡Hola! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Tenemos juegos y suscripciones para PS4, PS5, Xbox One y Xbox Series. ¿En que puedo ayudarte hoy?`;
  }

  if (msg.includes("plus essential") || msg.includes("ps plus essential") || msg.includes("psplus essential") || (msg.includes("essential") && (msg.includes("plus") || isPlayStation))) {
    const duration = extractDuration(msg);
    if (duration) {
      return `¡Excelente eleccion! La suscripcion PS Plus Essential de ${duration} te da acceso a juego online multijugador, 2-3 juegos gratis cada mes, descuentos exclusivos en PlayStation Store y almacenamiento en la nube. ¿Quieres que te ayude con el proceso de compra o necesitas mas informacion sobre la entrega?`;
    }
    return `PS Plus Essential es el plan base de PlayStation. Incluye juego online multijugador, juegos mensuales gratis, y descuentos en PS Store. Tenemos disponible en planes de 1 mes, 3 meses y 12 meses. ¿Cual te interesa?`;
  }

  if (msg.includes("plus extra") || msg.includes("ps plus extra") || msg.includes("psplus extra") || (msg.includes("extra") && (msg.includes("plus") || isPlayStation))) {
    const duration = extractDuration(msg);
    if (duration) {
      return `¡Buena eleccion! PS Plus Extra de ${duration} incluye todo lo de Essential MAS un catalogo de hasta 400 juegos de PS4 y PS5 para descargar y jugar. Es como tener Netflix de juegos. ¿Te gustaria proceder con la compra?`;
    }
    return `PS Plus Extra incluye todo lo de Essential mas acceso a un catalogo de ~400 juegos descargables de PS4 y PS5. Disponible en 1, 3 y 12 meses. ¿De cual duracion te gustaria saber el precio?`;
  }

  if (msg.includes("plus premium") || msg.includes("ps plus premium") || msg.includes("psplus premium") || msg.includes("plus deluxe") || (msg.includes("premium") && (msg.includes("plus") || isPlayStation))) {
    const duration = extractDuration(msg);
    if (duration) {
      return `PS Plus Premium de ${duration} es el plan mas completo. Incluye todo lo de Extra mas streaming de juegos en la nube, juegos clasicos de PS1/PS2/PS3/PSP, y pruebas de juegos por tiempo limitado. ¿Quieres mas detalles sobre la compra?`;
    }
    return `PS Plus Premium es el plan mas completo de PlayStation. Incluye todo de Extra mas juegos clasicos, streaming en la nube y pruebas de juegos. Disponible en 1, 3 y 12 meses. ¿Cual duracion te interesa?`;
  }

  if (msg.includes("ps plus") || msg.includes("psplus") || msg.includes("playstation plus") || (msg.includes("plus") && isPlayStation)) {
    return `Tenemos los 3 niveles de PS Plus disponibles:\n\n• Essential - Juego online + juegos mensuales gratis\n• Extra - Todo de Essential + catalogo de ~400 juegos\n• Premium - Todo de Extra + clasicos + streaming\n\nCada uno disponible en 1, 3 y 12 meses. ¿Cual nivel te interesa?`;
  }

  if (msg.includes("game pass") || msg.includes("gamepass") || msg.includes("xbox pass")) {
    if (msg.includes("ultimate")) {
      const duration = extractDuration(msg);
      if (duration) {
        return `¡Game Pass Ultimate de ${duration} es la mejor opcion! Incluye acceso a cientos de juegos en consola, PC y nube, juego online (Xbox Live Gold), EA Play, y juegos de Xbox Studios desde el dia de lanzamiento. ¿Te ayudo con la compra?`;
      }
      return `Xbox Game Pass Ultimate incluye juegos en consola + PC + nube, Xbox Live Gold, EA Play y juegos day-one de Microsoft. Tenemos planes de 1, 3 y 12 meses. ¿Cual te interesa?`;
    }
    if (msg.includes("core")) {
      return `Xbox Game Pass Core reemplaza a Xbox Live Gold. Incluye juego online multijugador y acceso a un catalogo selecto de juegos. Es el plan base para jugar online en Xbox. ¿Quieres saber los precios disponibles?`;
    }
    return `Tenemos suscripciones Xbox Game Pass disponibles:\n\n• Game Pass Core - Juego online + catalogo selecto\n• Game Pass Standard - Catalogo de cientos de juegos\n• Game Pass Ultimate - Todo incluido + PC + nube + EA Play\n\n¿Cual plan te interesa?`;
  }

  if (msg.includes("xbox live") || msg.includes("live gold") || (msg.includes("gold") && isXbox)) {
    return `Xbox Live Gold fue reemplazado por Xbox Game Pass Core, que incluye juego online multijugador y un catalogo de juegos seleccionados. ¿Te gustaria saber mas sobre Game Pass Core u otro plan de Game Pass?`;
  }

  if (msg.includes("tarjeta") || msg.includes("gift card") || msg.includes("giftcard") || msg.includes("codigo") || msg.includes("saldo") || msg.includes("recarga") || msg.includes("wallet")) {
    const duration = extractDuration(msg);
    if (duration) {
      if (isPlayStation || msg.includes("psn") || msg.includes("playstation") || msg.includes("ps store")) {
        return `¡Tenemos tarjetas de suscripcion PlayStation de ${duration}! Disponible en PS Plus Essential, Extra y Premium. ¿Cual nivel te interesa? Te puedo dar mas detalles de lo que incluye cada uno.`;
      }
      if (isXbox || msg.includes("xbox")) {
        return `¡Tenemos tarjetas de suscripcion Xbox de ${duration}! Disponible en Game Pass Core, Standard y Ultimate. ¿Cual plan te interesa?`;
      }
      return `¡Tenemos tarjetas de suscripcion de ${duration}! ¿Para cual plataforma la necesitas?\n\n• PlayStation: PS Plus Essential, Extra o Premium\n• Xbox: Game Pass Core, Standard o Ultimate\n\nTambien contamos con tarjetas de saldo.`;
    }
    if (msg.includes("psn") || msg.includes("playstation") || msg.includes("ps store") || isPlayStation) {
      const amount = extractMoneyAmount(msg);
      if (amount) {
        return `¡Tenemos tarjetas PSN de $${amount}! Las tarjetas de PlayStation Store te permiten agregar saldo a tu cuenta para comprar juegos, DLCs, y contenido digital. La entrega es digital e inmediata por correo. ¿Quieres proceder con la compra?`;
      }
      return `Contamos con tarjetas de saldo para PlayStation Store (PSN) en varias denominaciones. Puedes usarlas para comprar juegos, DLCs, y contenido en PS Store. ¿De cuanto saldo necesitas?`;
    }
    if (msg.includes("xbox") || isXbox) {
      const amount = extractMoneyAmount(msg);
      if (amount) {
        return `¡Tenemos tarjetas Xbox de $${amount}! Te permite agregar saldo a tu cuenta Microsoft para comprar juegos y contenido en la tienda Xbox. Entrega digital inmediata. ¿Quieres que te ayude con la compra?`;
      }
      return `Tenemos tarjetas de saldo Xbox en varias denominaciones. Sirven para comprar juegos, DLCs y contenido en la Microsoft Store. ¿Que monto necesitas?`;
    }
    return `Tenemos tarjetas digitales para PlayStation y Xbox:\n\n• Tarjetas de saldo PSN (PlayStation Store)\n• Tarjetas de saldo Xbox (Microsoft Store)\n• Suscripciones PS Plus (Essential/Extra/Premium)\n• Suscripciones Xbox Game Pass\n\n¿Cual te interesa?`;
  }

  if (msg.includes("1 mes") || msg.includes("un mes") || msg.includes("mensual")) {
    if (isPlayStation) {
      return `Tenemos suscripciones de 1 mes para PS Plus en los 3 niveles: Essential, Extra y Premium. ¿Cual nivel te interesa? Te puedo dar mas detalles de lo que incluye cada uno.`;
    }
    if (isXbox) {
      return `Tenemos suscripciones de 1 mes para Xbox Game Pass: Core, Standard y Ultimate. ¿Cual plan te interesa? Puedo explicarte las diferencias.`;
    }
    return `Tenemos suscripciones de 1 mes tanto para PlayStation (PS Plus) como para Xbox (Game Pass). ¿Para cual plataforma necesitas?`;
  }

  if (msg.includes("3 mes") || msg.includes("tres mes") || msg.includes("trimestral")) {
    if (isPlayStation) {
      return `¡La suscripcion de 3 meses de PS Plus es muy popular! Disponible en Essential, Extra y Premium. Es mejor relacion precio/mes que la mensual. ¿Cual nivel te interesa?`;
    }
    if (isXbox) {
      return `Tenemos Game Pass de 3 meses disponible. Ofrece mejor valor que el plan mensual. ¿Te interesa Core, Standard o Ultimate?`;
    }
    return `Las suscripciones de 3 meses estan disponibles para PlayStation y Xbox. Ofrecen mejor precio por mes que la opcion mensual. ¿Para que plataforma la necesitas?`;
  }

  if (msg.includes("12 mes") || msg.includes("doce mes") || msg.includes("un ano") || msg.includes("1 ano") || msg.includes("anual")) {
    if (isPlayStation) {
      return `El plan anual de PS Plus es el que ofrece el mejor ahorro. Disponible en Essential, Extra y Premium con 12 meses de acceso. ¿Cual nivel te gustaria?`;
    }
    if (isXbox) {
      return `El plan anual de Game Pass te da el mejor precio por mes. ¿Te interesa la version Core, Standard o Ultimate?`;
    }
    return `Los planes anuales (12 meses) son los que ofrecen el mejor ahorro. Disponibles para PS Plus y Xbox Game Pass. ¿Para cual plataforma?`;
  }

  if (msg.includes("juego") || msg.includes("game") || msg.includes("titulo")) {
    if (isPlayStation) {
      return `Tenemos un amplio catalogo de juegos digitales para PS4 y PS5.${pageContext} ¿Buscas algun titulo en particular? Tambien tenemos ofertas y lanzamientos recientes.`;
    }
    if (isXbox) {
      return `Contamos con juegos digitales para Xbox One y Xbox Series.${pageContext} ¿Que titulo buscas? Tenemos novedades y ofertas especiales.`;
    }
    return `Tenemos juegos digitales para todas las plataformas: PS4, PS5, Xbox One y Xbox Series.${pageContext} ¿Que titulo o plataforma te interesa?`;
  }

  if (msg.includes("precio") || msg.includes("costo") || msg.includes("cuanto") || msg.includes("cuánto") || msg.includes("vale") || msg.includes("cobran")) {
    if (isPlayStation) {
      return `Los precios de PS Plus varian segun el nivel y duracion. ¿Te gustaria saber el precio de Essential, Extra o Premium? Y por cuanto tiempo: 1, 3 o 12 meses?`;
    }
    if (isXbox) {
      return `Los precios de Game Pass dependen del plan. ¿Quieres saber el precio de Core, Standard o Ultimate? Disponible en 1, 3 y 12 meses.`;
    }
    return `Los precios dependen del producto y plataforma. ¿Me puedes indicar que producto te interesa? Asi te doy la informacion exacta.`;
  }

  if (msg.includes("pago") || msg.includes("pagar") || msg.includes("metodo") || msg.includes("transferencia") || msg.includes("paypal") || msg.includes("cripto") || msg.includes("bitcoin") || msg.includes("efectivo")) {
    return `Aceptamos varios metodos de pago. Para darte la informacion exacta sobre formas de pago y proceso de compra, ¿me puedes indicar que producto te interesa? Asi te guio paso a paso.`;
  }

  if (msg.includes("entrega") || msg.includes("envio") || msg.includes("recibir") || msg.includes("como llega") || msg.includes("demora") || msg.includes("tarda")) {
    return `La entrega de todos nuestros productos es digital e inmediata. Recibiras tu codigo o producto por correo electronico al completar la compra. El proceso suele tomar unos pocos minutos. ¿Necesitas ayuda con algo mas?`;
  }

  if (msg.includes("garantia") || msg.includes("devolucion") || msg.includes("reembolso") || msg.includes("cambio") || msg.includes("problema") || msg.includes("funciona") || msg.includes("error")) {
    return `Lamentamos si tienes algun inconveniente. Todos nuestros productos tienen garantia de funcionamiento. Si necesitas ayuda con un producto que compraste, te recomiendo contactar a un ejecutivo para asistencia personalizada usando el boton "Contactar un Ejecutivo" abajo.`;
  }

  if (msg.includes("gracias") || msg.includes("muchas gracias") || msg.includes("genial") || msg.includes("perfecto") || msg.includes("excelente") || msg.includes("buenisimo")) {
    return `¡Con gusto! Estamos aqui para ayudarte. Si tienes mas preguntas sobre nuestros productos, no dudes en escribir. ¡Buen dia!`;
  }

  if (msg.includes("adios") || msg.includes("bye") || msg.includes("chao") || msg.includes("hasta luego") || msg.includes("nos vemos")) {
    return `¡Hasta pronto! Fue un placer ayudarte. Si necesitas algo mas, no dudes en volver a escribirnos. ¡Que tengas un excelente dia!`;
  }

  if (msg.includes("promocion") || msg.includes("oferta") || msg.includes("descuento") || msg.includes("rebaja") || msg.includes("sale")) {
    return `¡Siempre tenemos ofertas disponibles! Las promociones cambian frecuentemente. ¿Te interesa alguna plataforma en particular (PlayStation o Xbox)? Puedo ver que ofertas tenemos activas.`;
  }

  if (msg.includes("seguro") || msg.includes("confiable") || msg.includes("estafa") || msg.includes("real") || msg.includes("legitimo")) {
    return `¡Somos una tienda 100% confiable y segura! Todos nuestros productos son codigos digitales oficiales. Tenemos una larga trayectoria y miles de clientes satisfechos. Si quieres, puedes contactar a un ejecutivo para resolver cualquier duda de confianza.`;
  }

  return `Gracias por tu mensaje.${pageContext} Estoy aqui para ayudarte con nuestros productos digitales: juegos, suscripciones PS Plus, Xbox Game Pass, tarjetas de saldo y mas. ¿En que puedo ayudarte?`;
}

function extractDuration(msg: string): string | null {
  if (msg.includes("1 mes") || msg.includes("un mes") || msg.includes("mensual")) return "1 mes";
  if (msg.includes("3 mes") || msg.includes("tres mes") || msg.includes("trimestral")) return "3 meses";
  if (msg.includes("12 mes") || msg.includes("doce mes") || msg.includes("un ano") || msg.includes("1 ano") || msg.includes("anual")) return "12 meses";
  return null;
}

function extractMoneyAmount(msg: string): string | null {
  const match = msg.match(/\$?(\d+)/);
  return match ? match[1] : null;
}
