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
        userName: "Demo User",
        sender: "user" as const,
        content: "Hi! I need help with my account settings.",
        timestamp: new Date(now.getTime() - 300000),
      },
      {
        userEmail: demoEmail,
        userName: "Support",
        sender: "support" as const,
        content: "Hey there! I'd be happy to help with your account settings. What specific changes are you looking to make?",
        timestamp: new Date(now.getTime() - 240000),
      },
      {
        userEmail: demoEmail,
        userName: "Demo User",
        sender: "user" as const,
        content: "I want to change my notification preferences",
        timestamp: new Date(now.getTime() - 180000),
      },
      {
        userEmail: demoEmail,
        userName: "Support",
        sender: "support" as const,
        content: "Sure! You can find notification settings under Profile > Preferences > Notifications. You can toggle email, push, and SMS notifications individually.",
        timestamp: new Date(now.getTime() - 120000),
      },
    ];

    await db.insert(messages).values(seedMessages);
    log("Database seeded with demo messages", "seed");
  } catch (error: any) {
    log(`Seed error: ${error.message}`, "seed");
  }
}
