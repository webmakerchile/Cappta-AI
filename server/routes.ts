import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { log } from "./index";
import { z } from "zod";

const socketMessageSchema = insertMessageSchema.extend({
  content: z.string().min(1).max(2000),
  userEmail: z.string().email().max(200),
  userName: z.string().min(1).max(100),
  sender: z.enum(["user", "support"]),
});

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

  app.get("/api/messages/:email", async (req, res) => {
    try {
      const emailSchema = z.string().email();
      const parsed = emailSchema.safeParse(req.params.email);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email" });
      }
      const messages = await storage.getMessagesByEmail(parsed.data);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  io.on("connection", (socket) => {
    const { email, name } = socket.handshake.auth as { email: string; name: string };

    if (!email || !name) {
      socket.disconnect(true);
      return;
    }

    log(`User connected: ${name} (${email})`, "socket.io");
    socket.join(`user:${email}`);

    storage.getMessagesByEmail(email).then((history) => {
      socket.emit("chat_history", history);
    }).catch((err) => {
      log(`Error fetching history: ${err.message}`, "socket.io");
      socket.emit("chat_history", []);
    });

    socket.on("send_message", async (data: unknown) => {
      const parsed = socketMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("error", { message: "Invalid message data" });
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
          setTimeout(async () => {
            try {
              const autoReply = await storage.createMessage({
                userEmail: parsed.data.userEmail,
                userName: "Support",
                sender: "support",
                content: getAutoReply(parsed.data.content),
              });
              io.to(`user:${parsed.data.userEmail}`).emit("new_message", autoReply);
            } catch (err: any) {
              log(`Error sending auto-reply: ${err.message}`, "socket.io");
            }
          }, 1500);
        }
      } catch (error: any) {
        log(`Error saving message: ${error.message}`, "socket.io");
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      log(`User disconnected: ${name} (${email})`, "socket.io");
    });
  });

  return httpServer;
}

function getAutoReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hola")) {
    return "Hey there! How can I help you today?";
  }
  if (msg.includes("price") || msg.includes("cost") || msg.includes("pricing")) {
    return "Our pricing starts at $9.99/month. Would you like to know more about our plans?";
  }
  if (msg.includes("help")) {
    return "I'm here to help! Could you describe your issue in more detail?";
  }
  if (msg.includes("thank")) {
    return "You're welcome! Is there anything else I can help with?";
  }
  if (msg.includes("bug") || msg.includes("error") || msg.includes("issue")) {
    return "I'm sorry to hear about that issue. Let me look into it. Can you provide more details about what happened?";
  }
  return "Thanks for your message! A team member will follow up shortly. Is there anything specific I can help with in the meantime?";
}
