import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema, insertCannedResponseSchema, insertProductSchema } from "@shared/schema";
import { sendContactNotification, sendOfflineNotification } from "./email";
import { log } from "./index";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getSmartAutoReply } from "./autoReply";

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
                }));
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
              userEmail: parsed.data.userEmail,
              userName: "Soporte",
              sender: "support",
              content: replyContent,
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

  app.get("/api/admin/products", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const allProducts = await storage.getProducts();
      res.json(allProducts);
    } catch (error: any) {
      log(`Error al obtener productos: ${error.message}`, "api");
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    if (!requireAdmin(req, res)) return;
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
    if (!requireAdmin(req, res)) return;
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
    if (!requireAdmin(req, res)) return;
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
                  }));
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
                userEmail: parsed.data.userEmail,
                userName: "Soporte",
                sender: "support",
                content: replyContent,
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

