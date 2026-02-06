import { db } from "./db";
import { messages } from "@shared/schema";
import { sql } from "drizzle-orm";
import { log } from "./index";

export async function seedDatabase() {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(messages);
    if (Number(existing[0].count) > 0) {
      return;
    }

    const demoEmail = "demo@example.com";
    const now = new Date();

    const seedMessages = [
      {
        userEmail: demoEmail,
        userName: "Usuario Demo",
        sender: "user" as const,
        content: "Hola, necesito ayuda con la configuraci\u00f3n de mi cuenta.",
        timestamp: new Date(now.getTime() - 300000),
      },
      {
        userEmail: demoEmail,
        userName: "Soporte",
        sender: "support" as const,
        content: "\u00a1Hola! Con gusto te ayudo con tu cuenta. \u00bfQu\u00e9 cambios necesitas realizar?",
        timestamp: new Date(now.getTime() - 240000),
      },
      {
        userEmail: demoEmail,
        userName: "Usuario Demo",
        sender: "user" as const,
        content: "Quiero cambiar mis preferencias de notificaciones",
        timestamp: new Date(now.getTime() - 180000),
      },
      {
        userEmail: demoEmail,
        userName: "Soporte",
        sender: "support" as const,
        content: "\u00a1Claro! Puedes encontrar las preferencias de notificaci\u00f3n en Perfil > Preferencias > Notificaciones. Ah\u00ed puedes activar o desactivar correos, push y SMS individualmente.",
        timestamp: new Date(now.getTime() - 120000),
      },
    ];

    await db.insert(messages).values(seedMessages);
    log("Base de datos sembrada con mensajes demo", "seed");
  } catch (error: any) {
    log(`Error en seed: ${error.message}`, "seed");
  }
}
