import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { sendContactNotification } from "./email";
import { log } from "./index";
import { z } from "zod";

const socketMessageSchema = insertMessageSchema.extend({
  content: z.string().min(1).max(2000),
  userEmail: z.string().email().max(200),
  userName: z.string().min(1).max(100),
  sender: z.enum(["user", "support"]),
});

const contactSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().min(1),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
});

interface UserSession {
  email: string;
  name: string;
  pageUrl?: string;
  pageTitle?: string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  const userSessions = new Map<string, UserSession>();

  app.get("/api/messages/:email", async (req, res) => {
    try {
      const emailSchema = z.string().email();
      const parsed = emailSchema.safeParse(req.params.email);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email inv\u00e1lido" });
      }
      const messages = await storage.getMessagesByEmail(parsed.data);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  io.on("connection", (socket) => {
    const { email, name } = socket.handshake.auth as { email: string; name: string };

    if (!email || !name) {
      socket.disconnect(true);
      return;
    }

    log(`Usuario conectado: ${name} (${email})`, "socket.io");
    socket.join(`user:${email}`);

    userSessions.set(socket.id, { email, name });

    storage.getMessagesByEmail(email).then((history) => {
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
        socket.emit("error", { message: "Datos de mensaje inv\u00e1lidos" });
        return;
      }

      try {
        const message = await storage.createMessage({
          userEmail: parsed.data.userEmail,
          userName: parsed.data.userName,
          sender: parsed.data.sender,
          content: parsed.data.content,
        });

        io.to(`user:${parsed.data.userEmail}`).emit("new_message", message);

        if (parsed.data.sender === "user") {
          const session = userSessions.get(socket.id);
          setTimeout(async () => {
            try {
              const autoReply = await storage.createMessage({
                userEmail: parsed.data.userEmail,
                userName: "Soporte",
                sender: "support",
                content: getAutoReply(parsed.data.content, session?.pageTitle, session?.pageUrl),
              });
              io.to(`user:${parsed.data.userEmail}`).emit("new_message", autoReply);
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
        socket.emit("error", { message: "Datos inv\u00e1lidos" });
        return;
      }

      try {
        const recentMessages = await storage.getMessagesByEmail(parsed.data.userEmail);
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
        });

        const emailSent = await sendContactNotification({
          userName: parsed.data.userName,
          userEmail: parsed.data.userEmail,
          pageUrl: parsed.data.pageUrl,
          pageTitle: parsed.data.pageTitle,
          chatSummary,
        });

        socket.emit("contact_confirmed");

        const confirmMsg = await storage.createMessage({
          userEmail: parsed.data.userEmail,
          userName: "Soporte",
          sender: "support",
          content: emailSent
            ? "Tu solicitud ha sido enviada. Un ejecutivo se pondr\u00e1 en contacto contigo por correo electr\u00f3nico lo antes posible."
            : "Hemos registrado tu solicitud. Un ejecutivo se comunicar\u00e1 contigo pronto.",
        });

        io.to(`user:${parsed.data.userEmail}`).emit("new_message", confirmMsg);
        log(`Solicitud de contacto de ${parsed.data.userName} (${parsed.data.userEmail}) - Email: ${emailSent ? "enviado" : "no enviado"}`, "contact");
      } catch (error: any) {
        log(`Error en solicitud de contacto: ${error.message}`, "socket.io");
        socket.emit("error", { message: "Error al procesar solicitud" });
      }
    });

    socket.on("disconnect", () => {
      userSessions.delete(socket.id);
      log(`Usuario desconectado: ${name} (${email})`, "socket.io");
    });
  });

  return httpServer;
}

function getAutoReply(userMessage: string, pageTitle?: string, pageUrl?: string): string {
  const msg = userMessage.toLowerCase();

  const pageContext = pageTitle
    ? ` Veo que est\u00e1s navegando en "${pageTitle}".`
    : "";

  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("hey") || msg.includes("hello") || msg.includes("hi")) {
    return `\u00a1Hola! Bienvenido.${pageContext} \u00bfEn qu\u00e9 puedo ayudarte hoy?`;
  }
  if (msg.includes("precio") || msg.includes("costo") || msg.includes("cuanto") || msg.includes("cu\u00e1nto") || msg.includes("tarifa")) {
    return `Nuestros planes comienzan desde $9.99/mes.${pageContext} \u00bfTe gustar\u00eda conocer m\u00e1s detalles sobre nuestros paquetes?`;
  }
  if (msg.includes("ayuda") || msg.includes("help")) {
    return `\u00a1Estoy aqu\u00ed para ayudarte!${pageContext} \u00bfPodr\u00edas describir tu consulta con m\u00e1s detalle?`;
  }
  if (msg.includes("gracias") || msg.includes("thank")) {
    return "\u00a1De nada! \u00bfHay algo m\u00e1s en lo que pueda asistirte?";
  }
  if (msg.includes("problema") || msg.includes("error") || msg.includes("falla") || msg.includes("bug") || msg.includes("no funciona")) {
    return `Lamento escuchar eso.${pageContext} \u00bfPodr\u00edas darme m\u00e1s detalles sobre el problema que est\u00e1s experimentando?`;
  }
  if (msg.includes("contacto") || msg.includes("ejecutivo") || msg.includes("persona") || msg.includes("humano") || msg.includes("agente")) {
    return `Si necesitas hablar directamente con un ejecutivo, puedes usar el bot\u00f3n "Contactar un Ejecutivo" que aparece arriba del campo de mensaje.`;
  }
  if (msg.includes("horario") || msg.includes("hora") || msg.includes("cuando") || msg.includes("cu\u00e1ndo")) {
    return `Nuestro equipo de soporte est\u00e1 disponible de lunes a viernes, de 9:00 AM a 6:00 PM.${pageContext} Si necesitas atenci\u00f3n inmediata, puedes solicitar contactar un ejecutivo.`;
  }

  return `Gracias por tu mensaje.${pageContext} Un miembro de nuestro equipo dar\u00e1 seguimiento pronto. \u00bfHay algo espec\u00edfico en lo que pueda ayudarte mientras tanto?`;
}
