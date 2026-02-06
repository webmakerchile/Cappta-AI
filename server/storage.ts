import { messages, contactRequests, type Message, type InsertMessage, type ContactRequest, type InsertContactRequest } from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  getMessagesBySessionId(sessionId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  createContactRequest(req: InsertContactRequest): Promise<ContactRequest>;
  getAllSessions(): Promise<{ sessionId: string; userName: string; userEmail: string; messageCount: number; lastMessage: Date | null; firstMessage: Date | null }[]>;
  searchMessages(query: string): Promise<Message[]>;
  getContactRequests(): Promise<ContactRequest[]>;
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

  async getAllSessions(): Promise<{ sessionId: string; userName: string; userEmail: string; messageCount: number; lastMessage: Date | null; firstMessage: Date | null }[]> {
    const result = await db
      .select({
        sessionId: messages.sessionId,
        userName: sql<string>`MAX(CASE WHEN ${messages.sender} = 'user' THEN ${messages.userName} END)`,
        userEmail: sql<string>`MAX(CASE WHEN ${messages.sender} = 'user' THEN ${messages.userEmail} END)`,
        messageCount: sql<number>`COUNT(*)::int`,
        lastMessage: sql<Date>`MAX(${messages.timestamp})`,
        firstMessage: sql<Date>`MIN(${messages.timestamp})`,
      })
      .from(messages)
      .where(sql`${messages.sessionId} != 'legacy'`)
      .groupBy(messages.sessionId)
      .orderBy(sql`MAX(${messages.timestamp}) DESC`);

    return result;
  }

  async searchMessages(query: string): Promise<Message[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(messages)
      .where(
        or(
          ilike(messages.content, searchPattern),
          ilike(messages.userName, searchPattern),
          ilike(messages.userEmail, searchPattern)
        )
      )
      .orderBy(desc(messages.timestamp))
      .limit(200);
  }

  async getContactRequests(): Promise<ContactRequest[]> {
    return await db
      .select()
      .from(contactRequests)
      .orderBy(desc(contactRequests.timestamp));
  }
}

export const storage = new DatabaseStorage();
