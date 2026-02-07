import { messages, sessions, cannedResponses, contactRequests, products, type Message, type InsertMessage, type ContactRequest, type InsertContactRequest, type Session, type InsertSession, type CannedResponse, type InsertCannedResponse, type Product, type InsertProduct } from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  getMessagesBySessionId(sessionId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  createContactRequest(req: InsertContactRequest): Promise<ContactRequest>;
  getAllSessions(statusFilter?: "active" | "closed" | "all"): Promise<{ sessionId: string; userName: string; userEmail: string; messageCount: number; lastMessage: Date | null; firstMessage: Date | null; status: string; tags: string[]; problemType: string | null; gameName: string | null; adminActive: boolean }[]>;
  searchMessages(query: string): Promise<Message[]>;
  getContactRequests(): Promise<ContactRequest[]>;
  upsertSession(data: { sessionId: string; userEmail: string; userName: string; problemType?: string | null; gameName?: string | null }): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSessionStatus(sessionId: string, status: "active" | "closed"): Promise<Session | null>;
  updateSessionTags(sessionId: string, tags: string[]): Promise<Session | null>;
  updateSessionAdminActive(sessionId: string, adminActive: boolean): Promise<Session | null>;
  touchSession(sessionId: string): Promise<void>;
  getCannedResponses(): Promise<CannedResponse[]>;
  createCannedResponse(data: InsertCannedResponse): Promise<CannedResponse>;
  updateCannedResponse(id: number, data: Partial<InsertCannedResponse>): Promise<CannedResponse | null>;
  deleteCannedResponse(id: number): Promise<boolean>;
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | null>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | null>;
  deleteProduct(id: number): Promise<boolean>;
  searchProductsByName(query: string): Promise<Product[]>;
  getProductsByPlatform(platform: string): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
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

  async upsertSession(data: { sessionId: string; userEmail: string; userName: string; problemType?: string | null; gameName?: string | null }): Promise<Session> {
    const existing = await this.getSession(data.sessionId);
    if (existing) {
      const updateData: Record<string, any> = {
        lastMessageAt: new Date(),
        status: "active",
      };
      if (data.userEmail) updateData.userEmail = data.userEmail;
      if (data.userName) updateData.userName = data.userName;
      if (data.problemType !== undefined) updateData.problemType = data.problemType;
      if (data.gameName !== undefined) updateData.gameName = data.gameName;
      const [updated] = await db
        .update(sessions)
        .set(updateData)
        .where(eq(sessions.sessionId, data.sessionId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(sessions)
      .values({
        sessionId: data.sessionId,
        userEmail: data.userEmail,
        userName: data.userName,
        status: "active",
        tags: [],
        problemType: data.problemType || null,
        gameName: data.gameName || null,
      })
      .returning();
    return created;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId));
    return session || null;
  }

  async updateSessionStatus(sessionId: string, status: "active" | "closed"): Promise<Session | null> {
    const [updated] = await db
      .update(sessions)
      .set({ status })
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return updated || null;
  }

  async updateSessionTags(sessionId: string, tags: string[]): Promise<Session | null> {
    const [updated] = await db
      .update(sessions)
      .set({ tags })
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return updated || null;
  }

  async updateSessionAdminActive(sessionId: string, adminActive: boolean): Promise<Session | null> {
    const [updated] = await db
      .update(sessions)
      .set({ adminActive })
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return updated || null;
  }

  async touchSession(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(sessions.sessionId, sessionId));
  }

  async getAllSessions(statusFilter?: "active" | "closed" | "all"): Promise<{ sessionId: string; userName: string; userEmail: string; messageCount: number; lastMessage: Date | null; firstMessage: Date | null; status: string; tags: string[]; problemType: string | null; gameName: string | null; adminActive: boolean }[]> {
    const allSessions = await db.select().from(sessions).orderBy(desc(sessions.lastMessageAt));

    const result = [];
    for (const s of allSessions) {
      if (statusFilter && statusFilter !== "all" && s.status !== statusFilter) continue;

      const msgCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(messages)
        .where(eq(messages.sessionId, s.sessionId));

      const msgTimes = await db
        .select({
          lastMessage: sql<Date>`MAX(${messages.timestamp})`,
          firstMessage: sql<Date>`MIN(${messages.timestamp})`,
        })
        .from(messages)
        .where(eq(messages.sessionId, s.sessionId));

      result.push({
        sessionId: s.sessionId,
        userName: s.userName,
        userEmail: s.userEmail,
        messageCount: msgCount[0]?.count || 0,
        lastMessage: msgTimes[0]?.lastMessage || null,
        firstMessage: msgTimes[0]?.firstMessage || null,
        status: s.status,
        tags: s.tags || [],
        problemType: s.problemType,
        gameName: s.gameName,
        adminActive: s.adminActive ?? false,
      });
    }

    const sessionIds = new Set(allSessions.map(s => s.sessionId));
    const legacyResult = await db
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

    for (const lr of legacyResult) {
      if (!sessionIds.has(lr.sessionId)) {
        if (statusFilter === "closed") continue;
        result.push({
          ...lr,
          status: "active",
          tags: [],
          problemType: null,
          gameName: null,
          adminActive: false,
        });
      }
    }

    result.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage).getTime() : 0;
      return bTime - aTime;
    });

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

  async getCannedResponses(): Promise<CannedResponse[]> {
    return await db
      .select()
      .from(cannedResponses)
      .orderBy(asc(cannedResponses.shortcut));
  }

  async createCannedResponse(data: InsertCannedResponse): Promise<CannedResponse> {
    const [created] = await db.insert(cannedResponses).values(data).returning();
    return created;
  }

  async updateCannedResponse(id: number, data: Partial<InsertCannedResponse>): Promise<CannedResponse | null> {
    const [updated] = await db
      .update(cannedResponses)
      .set(data)
      .where(eq(cannedResponses.id, id))
      .returning();
    return updated || null;
  }

  async deleteCannedResponse(id: number): Promise<boolean> {
    const result = await db
      .delete(cannedResponses)
      .where(eq(cannedResponses.id, id))
      .returning();
    return result.length > 0;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async getProductById(id: number): Promise<Product | null> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || null;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(data).returning();
    return created;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | null> {
    const [updated] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return updated || null;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return result.length > 0;
  }

  async searchProductsByName(query: string): Promise<Product[]> {
    const normalizedQuery = query.toLowerCase().trim();

    const platformAliases: Record<string, string[]> = {
      ps5: ["play 5", "play5", "playstation 5", "ps 5", "ps5"],
      ps4: ["play 4", "play4", "playstation 4", "ps 4", "ps4"],
      xbox_series: ["xbox series", "xbox series x", "xbox series s", "xbox sx", "xbox ss"],
      xbox_one: ["xbox one", "xbox 1", "xone"],
    };

    let detectedPlatform: string | null = null;
    for (const [platform, aliases] of Object.entries(platformAliases)) {
      for (const alias of aliases) {
        if (normalizedQuery.includes(alias)) {
          detectedPlatform = platform;
          break;
        }
      }
      if (detectedPlatform) break;
    }

    const searchPattern = `%${normalizedQuery}%`;
    const directResults = await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, searchPattern),
          sql`EXISTS (SELECT 1 FROM unnest(${products.searchAliases}) AS alias WHERE lower(alias) LIKE ${searchPattern})`
        )
      );

    if (directResults.length > 0) return directResults;

    if (detectedPlatform) {
      return await this.getProductsByPlatform(detectedPlatform);
    }

    const words = normalizedQuery.split(/\s+/).filter(w => w.length >= 3);
    for (const word of words) {
      const wordPattern = `%${word}%`;
      const wordResults = await db
        .select()
        .from(products)
        .where(
          or(
            ilike(products.name, wordPattern),
            sql`EXISTS (SELECT 1 FROM unnest(${products.searchAliases}) AS alias WHERE lower(alias) LIKE ${wordPattern})`
          )
        );
      if (wordResults.length > 0) return wordResults;
    }

    return [];
  }

  async getProductsByPlatform(platform: string): Promise<Product[]> {
    const platformMap: Record<string, string[]> = {
      ps5: ["ps5"],
      ps4: ["ps4"],
      ps: ["ps5", "ps4"],
      xbox_series: ["xbox_series"],
      xbox_one: ["xbox_one"],
      xbox: ["xbox_series", "xbox_one"],
      nintendo: ["nintendo"],
      pc: ["pc"],
    };

    const platformVariants = platformMap[platform] || [platform];
    const allVariants = [...platformVariants, "all"];

    return await db
      .select()
      .from(products)
      .where(
        sql`${products.platform} IN (${sql.join(allVariants.map(v => sql`${v}`), sql`, `)})`
      )
      .orderBy(asc(products.name));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.category} = ${category}`)
      .orderBy(asc(products.name));
  }
}

export const storage = new DatabaseStorage();
