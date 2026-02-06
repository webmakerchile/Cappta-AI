import { messages, contactRequests, type Message, type InsertMessage, type ContactRequest, type InsertContactRequest } from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getMessagesBySessionId(sessionId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  createContactRequest(req: InsertContactRequest): Promise<ContactRequest>;
}

export class DatabaseStorage implements IStorage {
  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.timestamp));
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async createContactRequest(req: InsertContactRequest): Promise<ContactRequest> {
    const [created] = await db.insert(contactRequests).values(req).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
