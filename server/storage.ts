import { messages, sessions, cannedResponses, contactRequests, products, ratings, adminUsers, pushSubscriptions, customTags, appSettings, knowledgeBase, type Message, type InsertMessage, type ContactRequest, type InsertContactRequest, type Session, type InsertSession, type CannedResponse, type InsertCannedResponse, type Product, type InsertProduct, type Rating, type InsertRating, type AdminUser, type InsertAdminUser, type PushSubscription, type InsertPushSubscription, type KnowledgeBase, type InsertKnowledgeBase } from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, sql, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  getMessagesBySessionId(sessionId: string): Promise<Message[]>;
  getMessagesByEmail(email: string): Promise<Message[]>;
  getSessionsByEmail(email: string): Promise<Session[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  createContactRequest(req: InsertContactRequest): Promise<ContactRequest>;
  getAllSessions(statusFilter?: "active" | "closed" | "all"): Promise<{ sessionId: string; userName: string; userEmail: string; messageCount: number; unreadCount: number; lastMessage: Date | null; firstMessage: Date | null; status: string; tags: string[]; problemType: string | null; gameName: string | null; adminActive: boolean; contactRequested: boolean; assignedTo: number | null; assignedToName: string | null; assignedToColor: string | null; lastMessageContent: string | null; lastMessageSender: string | null; blockedAt: Date | null }[]>;
  markSessionRead(sessionId: string): Promise<void>;
  searchMessages(query: string): Promise<Message[]>;
  getContactRequests(): Promise<ContactRequest[]>;
  upsertSession(data: { sessionId: string; userEmail: string; userName: string; problemType?: string | null; gameName?: string | null }): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSessionStatus(sessionId: string, status: "active" | "closed"): Promise<Session | null>;
  updateSessionTags(sessionId: string, tags: string[]): Promise<Session | null>;
  updateSessionAdminActive(sessionId: string, adminActive: boolean): Promise<Session | null>;
  claimSession(sessionId: string, adminId: number, adminName: string, adminColor: string): Promise<Session | null>;
  unclaimSession(sessionId: string): Promise<Session | null>;
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
  getProductCount(): Promise<number>;
  createRating(data: InsertRating): Promise<Rating>;
  getRatingBySessionId(sessionId: string): Promise<Rating | null>;
  getAllRatings(): Promise<Rating[]>;
  // Admin users
  getAdminUserByEmail(email: string): Promise<AdminUser | null>;
  getAdminUserById(id: number): Promise<AdminUser | null>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(data: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserPassword(id: number, passwordHash: string): Promise<AdminUser | null>;
  deleteAdminUser(id: number): Promise<boolean>;
  // Push subscriptions
  getPushSubscriptionsByUserId(adminUserId: number): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  createPushSubscription(data: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string): Promise<boolean>;
  getCustomTags(): Promise<string[]>;
  addCustomTag(name: string): Promise<void>;
  deleteCustomTag(name: string): Promise<void>;
  findActiveSessionByEmail(email: string): Promise<Session | null>;
  deleteAllSessions(): Promise<number>;
  incrementWarningCount(sessionId: string): Promise<number>;
  blockSession(sessionId: string): Promise<void>;
  unblockSession(sessionId: string): Promise<void>;
  isSessionBlocked(sessionId: string): Promise<boolean>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  // Knowledge Base
  createKnowledgeEntry(data: InsertKnowledgeBase): Promise<KnowledgeBase>;
  getKnowledgeEntries(filter?: { status?: string; category?: string; query?: string }): Promise<KnowledgeBase[]>;
  getKnowledgeEntryById(id: number): Promise<KnowledgeBase | null>;
  updateKnowledgeEntry(id: number, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | null>;
  deleteKnowledgeEntry(id: number): Promise<boolean>;
  searchKnowledgeEntries(query: string, limit?: number): Promise<KnowledgeBase[]>;
  incrementKnowledgeUsage(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.timestamp));
  }

  async findActiveSessionByEmail(email: string): Promise<Session | null> {
    const results = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userEmail, email))
      .orderBy(desc(sessions.lastMessageAt))
      .limit(5);
    const active = results.find(s => s.status === "active");
    return active || results[0] || null;
  }

  async getMessagesByEmail(email: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userEmail, email))
      .orderBy(asc(messages.timestamp));
  }

  async getSessionsByEmail(email: string): Promise<Session[]> {
    return await db
      .select()
      .from(sessions)
      .where(eq(sessions.userEmail, email))
      .orderBy(asc(sessions.createdAt));
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

  async claimSession(sessionId: string, adminId: number, adminName: string, adminColor: string): Promise<Session | null> {
    const [updated] = await db
      .update(sessions)
      .set({ assignedTo: adminId, assignedToName: adminName, assignedToColor: adminColor })
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return updated || null;
  }

  async unclaimSession(sessionId: string): Promise<Session | null> {
    const [updated] = await db
      .update(sessions)
      .set({ assignedTo: null, assignedToName: null, assignedToColor: null })
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

  async markSessionRead(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ lastReadAt: new Date() })
      .where(eq(sessions.sessionId, sessionId));
  }

  async getAllSessions(statusFilter?: "active" | "closed" | "all"): Promise<{ sessionId: string; userName: string; userEmail: string; messageCount: number; unreadCount: number; lastMessage: Date | null; firstMessage: Date | null; status: string; tags: string[]; problemType: string | null; gameName: string | null; adminActive: boolean; contactRequested: boolean; assignedTo: number | null; assignedToName: string | null; assignedToColor: string | null; lastMessageContent: string | null; lastMessageSender: string | null; blockedAt: Date | null }[]> {
    const statusCondition = statusFilter && statusFilter !== "all"
      ? sql`WHERE s.status = ${statusFilter}`
      : sql``;

    const sessionsWithStats = await db.execute(sql`
      SELECT
        s.session_id AS "sessionId",
        s.user_name AS "userName",
        s.user_email AS "userEmail",
        s.status,
        s.tags,
        s.problem_type AS "problemType",
        s.game_name AS "gameName",
        s.admin_active AS "adminActive",
        s.assigned_to AS "assignedTo",
        s.assigned_to_name AS "assignedToName",
        s.assigned_to_color AS "assignedToColor",
        s.blocked_at AS "blockedAt",
        s.last_read_at AS "lastReadAt",
        COALESCE(ms.msg_count, 0)::int AS "messageCount",
        COALESCE(ms.unread_user, 0)::int AS "totalUserMessages",
        ms.last_msg AS "lastMessage",
        ms.first_msg AS "firstMessage",
        COALESCE(ms.unread_after, 0)::int AS "unreadAfterRead",
        CASE WHEN cr.user_email IS NOT NULL THEN true ELSE false END AS "contactRequested",
        (SELECT m2.content FROM messages m2 WHERE m2.session_id = s.session_id ORDER BY m2.timestamp DESC LIMIT 1) AS "lastMessageContent",
        (SELECT m2.sender FROM messages m2 WHERE m2.session_id = s.session_id ORDER BY m2.timestamp DESC LIMIT 1) AS "lastMessageSender"
      FROM sessions s
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS msg_count,
          MAX(m.timestamp) AS last_msg,
          MIN(m.timestamp) AS first_msg,
          COUNT(*) FILTER (WHERE m.sender = 'user')::int AS unread_user,
          COUNT(*) FILTER (WHERE m.sender = 'user' AND m.timestamp > COALESCE(s.last_read_at, '1970-01-01'))::int AS unread_after
        FROM messages m
        WHERE m.session_id = s.session_id
      ) ms ON true
      LEFT JOIN (
        SELECT DISTINCT LOWER(user_email) AS user_email FROM contact_requests
      ) cr ON LOWER(s.user_email) = cr.user_email
      ${statusCondition}
      ORDER BY COALESCE(ms.last_msg, s.last_message_at) DESC
    `);

    const result: any[] = [];
    for (const row of sessionsWithStats.rows) {
      const r = row as any;
      const unreadCount = r.lastReadAt ? r.unreadAfterRead : r.totalUserMessages;
      result.push({
        sessionId: r.sessionId,
        userName: r.userName,
        userEmail: r.userEmail,
        messageCount: r.messageCount,
        unreadCount,
        lastMessage: r.lastMessage || null,
        firstMessage: r.firstMessage || null,
        status: r.status,
        tags: r.tags || [],
        problemType: r.problemType,
        gameName: r.gameName,
        adminActive: r.adminActive ?? false,
        contactRequested: r.contactRequested ?? false,
        assignedTo: r.assignedTo ?? null,
        assignedToName: r.assignedToName ?? null,
        assignedToColor: r.assignedToColor ?? null,
        blockedAt: r.blockedAt || null,
        lastMessageContent: r.lastMessageContent || null,
        lastMessageSender: r.lastMessageSender || null,
      });
    }

    const sessionIds = new Set(result.map((s: any) => s.sessionId));
    if (statusFilter !== "closed") {
      const legacyResult = await db.execute(sql`
        SELECT
          m.session_id AS "sessionId",
          MAX(CASE WHEN m.sender = 'user' THEN m.user_name END) AS "userName",
          MAX(CASE WHEN m.sender = 'user' THEN m.user_email END) AS "userEmail",
          COUNT(*)::int AS "messageCount",
          MAX(m.timestamp) AS "lastMessage",
          MIN(m.timestamp) AS "firstMessage"
        FROM messages m
        LEFT JOIN sessions s ON m.session_id = s.session_id
        WHERE s.session_id IS NULL AND m.session_id != 'legacy'
        GROUP BY m.session_id
        ORDER BY MAX(m.timestamp) DESC
      `);

      const contactEmails = new Set(
        (await db.select({ email: sql<string>`LOWER(user_email)` }).from(contactRequests)).map(c => c.email)
      );

      for (const lr of legacyResult.rows) {
        const r = lr as any;
        if (!sessionIds.has(r.sessionId)) {
          result.push({
            sessionId: r.sessionId,
            userName: r.userName,
            userEmail: r.userEmail,
            messageCount: r.messageCount,
            unreadCount: r.messageCount,
            lastMessage: r.lastMessage || null,
            firstMessage: r.firstMessage || null,
            status: "active",
            tags: [],
            problemType: null,
            gameName: null,
            adminActive: false,
            contactRequested: contactEmails.has((r.userEmail || "").toLowerCase()),
            assignedTo: null,
            assignedToName: null,
            assignedToColor: null,
            blockedAt: null,
            lastMessageContent: null,
            lastMessageSender: null,
          });
        }
      }

      result.sort((a: any, b: any) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage).getTime() : 0;
        return bTime - aTime;
      });
    }

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

    const categoryKeywords: Record<string, string[]> = {
      subscription: ["suscripcion", "suscripciones", "subscripcion", "subscription", "subscriptions", "membresia", "membresias", "membership"],
      card: ["tarjeta", "tarjetas", "gift card", "gift cards", "saldo", "recarga", "recargas", "codigo", "codigos"],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (normalizedQuery.includes(keyword)) {
          const categoryResults = await this.getProductsByCategory(category);
          if (categoryResults.length > 0) return categoryResults;
        }
      }
    }

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

    if (directResults.length > 0) {
      if (detectedPlatform) {
        const platformFiltered = directResults.filter(p => p.platform === detectedPlatform || p.platform === "all");
        if (platformFiltered.length > 0) return platformFiltered;
      }
      return directResults;
    }

    const stopWords = new Set(["de", "del", "la", "las", "los", "el", "en", "un", "una", "para", "con", "por", "que", "y", "o"]);
    const words = normalizedQuery.split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));

    if (words.length > 1) {
      const productScores = new Map<number, { product: Product; score: number }>();

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

        for (const product of wordResults) {
          const existing = productScores.get(product.id);
          if (existing) {
            existing.score += 1;
          } else {
            productScores.set(product.id, { product, score: 1 });
          }
        }
      }

      if (productScores.size > 0) {
        const scored = Array.from(productScores.values());
        scored.sort((a, b) => b.score - a.score);

        const maxScore = scored[0].score;
        if (maxScore > 1) {
          const multiMatch = scored.filter(s => s.score > 1).map(s => s.product);
          if (multiMatch.length > 0) {
            if (detectedPlatform) {
              const platformFiltered = multiMatch.filter(p => p.platform === detectedPlatform || p.platform === "all");
              if (platformFiltered.length > 0) return platformFiltered;
            }
            return multiMatch;
          }
        }

        const allResults = scored.map(s => s.product);
        if (detectedPlatform) {
          const platformFiltered = allResults.filter(p => p.platform === detectedPlatform || p.platform === "all");
          if (platformFiltered.length > 0) return platformFiltered;
        }
        return allResults;
      }
    }

    for (const word of words) {
      if (word.length < 3) continue;
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
      if (wordResults.length > 0) {
        if (detectedPlatform) {
          const platformFiltered = wordResults.filter(p => p.platform === detectedPlatform || p.platform === "all");
          if (platformFiltered.length > 0) return platformFiltered;
        }
        return wordResults;
      }
    }

    if (detectedPlatform) {
      return await this.getProductsByPlatform(detectedPlatform);
    }

    const fuzzyMappings: Record<string, string> = {
      "suscripcion": "subscription",
      "suscripciones": "subscription",
      "subscripcion": "subscription",
      "membresia": "subscription",
      "tarjetas": "card",
      "tarjeta": "card",
    };

    for (const [fuzzyKey, category] of Object.entries(fuzzyMappings)) {
      if (normalizedQuery.includes(fuzzyKey)) {
        return await this.getProductsByCategory(category);
      }
    }

    // Fuzzy search using pg_trgm trigram similarity
    const normalizedForFuzzy = normalizedQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const fuzzyWords = normalizedForFuzzy.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));
    
    if (fuzzyWords.length > 0) {
      const fuzzyQuery = fuzzyWords.join(" ");
      const trigramResults = await db
        .select()
        .from(products)
        .where(
          sql`(
            similarity(lower(${products.name}), ${fuzzyQuery}) > 0.15
            OR EXISTS (
              SELECT 1 FROM unnest(${products.searchAliases}) AS alias 
              WHERE similarity(lower(alias), ${fuzzyQuery}) > 0.2
            )
          )`
        )
        .orderBy(sql`similarity(lower(${products.name}), ${fuzzyQuery}) DESC`)
        .limit(10);
      
      if (trigramResults.length > 0) {
        if (detectedPlatform) {
          const platformFiltered = trigramResults.filter(p => p.platform === detectedPlatform || p.platform === "all");
          if (platformFiltered.length > 0) return platformFiltered;
        }
        return trigramResults;
      }

      // Individual word fuzzy matching
      for (const word of fuzzyWords) {
        if (word.length < 4) continue;
        const wordTrigramResults = await db
          .select()
          .from(products)
          .where(
            sql`(
              similarity(lower(${products.name}), ${word}) > 0.2
              OR EXISTS (
                SELECT 1 FROM unnest(${products.searchAliases}) AS alias 
                WHERE similarity(lower(alias), ${word}) > 0.3
              )
            )`
          )
          .orderBy(sql`similarity(lower(${products.name}), ${word}) DESC`)
          .limit(10);
        
        if (wordTrigramResults.length > 0) {
          if (detectedPlatform) {
            const platformFiltered = wordTrigramResults.filter(p => p.platform === detectedPlatform || p.platform === "all");
            if (platformFiltered.length > 0) return platformFiltered;
          }
          return wordTrigramResults;
        }
      }
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

  async getProductCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(products);
    return result[0]?.count || 0;
  }

  async createRating(data: InsertRating): Promise<Rating> {
    const [created] = await db.insert(ratings).values(data).returning();
    return created;
  }

  async getRatingBySessionId(sessionId: string): Promise<Rating | null> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.sessionId, sessionId));
    return rating || null;
  }

  async getAllRatings(): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .orderBy(desc(ratings.timestamp));
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | null> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    return user || null;
  }

  async getAdminUserById(id: number): Promise<AdminUser | null> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id));
    return user || null;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db
      .select()
      .from(adminUsers)
      .orderBy(asc(adminUsers.email));
  }

  async createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values(data).returning();
    return created;
  }

  async updateAdminUserPassword(id: number, passwordHash: string): Promise<AdminUser | null> {
    const [updated] = await db
      .update(adminUsers)
      .set({ passwordHash })
      .where(eq(adminUsers.id, id))
      .returning();
    return updated || null;
  }

  async deleteAdminUser(id: number): Promise<boolean> {
    const result = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id))
      .returning();
    return result.length > 0;
  }

  async getPushSubscriptionsByUserId(adminUserId: number): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.adminUserId, adminUserId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions);
  }

  async createPushSubscription(data: InsertPushSubscription): Promise<PushSubscription> {
    const [created] = await db.insert(pushSubscriptions).values(data).returning();
    return created;
  }

  async deletePushSubscription(endpoint: string): Promise<boolean> {
    const result = await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .returning();
    return result.length > 0;
  }
  async getCustomTags(): Promise<string[]> {
    const result = await db.select({ name: customTags.name }).from(customTags).orderBy(customTags.name);
    return result.map(r => r.name);
  }

  async addCustomTag(name: string): Promise<void> {
    await db.insert(customTags).values({ name }).onConflictDoNothing();
  }

  async deleteCustomTag(name: string): Promise<void> {
    await db.delete(customTags).where(eq(customTags.name, name));
  }

  async deleteAllSessions(): Promise<number> {
    return await db.transaction(async (tx) => {
      await tx.delete(messages);
      await tx.delete(contactRequests);
      await tx.delete(ratings);
      const deleted = await tx.delete(sessions).returning();
      return deleted.length;
    });
  }

  async incrementWarningCount(sessionId: string): Promise<number> {
    const result = await db
      .update(sessions)
      .set({ warningCount: sql`${sessions.warningCount} + 1` })
      .where(eq(sessions.sessionId, sessionId))
      .returning({ warningCount: sessions.warningCount });
    return result[0]?.warningCount ?? 0;
  }

  async blockSession(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ blockedAt: new Date() })
      .where(eq(sessions.sessionId, sessionId));
  }

  async unblockSession(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ blockedAt: null, warningCount: 0 })
      .where(eq(sessions.sessionId, sessionId));
  }

  async isSessionBlocked(sessionId: string): Promise<boolean> {
    const session = await db
      .select({ blockedAt: sessions.blockedAt })
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId))
      .limit(1);
    return !!session[0]?.blockedAt;
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key));
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value },
      });
  }

  async createKnowledgeEntry(data: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [entry] = await db.insert(knowledgeBase).values(data).returning();
    return entry;
  }

  async getKnowledgeEntries(filter?: { status?: string; category?: string; query?: string }): Promise<KnowledgeBase[]> {
    let query = db.select().from(knowledgeBase);
    const conditions = [];
    if (filter?.status) {
      conditions.push(eq(knowledgeBase.status, filter.status as any));
    }
    if (filter?.category) {
      conditions.push(eq(knowledgeBase.category, filter.category as any));
    }
    if (filter?.query) {
      conditions.push(
        or(
          ilike(knowledgeBase.question, `%${filter.query}%`),
          ilike(knowledgeBase.answer, `%${filter.query}%`)
        )!
      );
    }
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(knowledgeBase.createdAt));
    }
    return await query.orderBy(desc(knowledgeBase.createdAt));
  }

  async getKnowledgeEntryById(id: number): Promise<KnowledgeBase | null> {
    const results = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id));
    return results[0] || null;
  }

  async updateKnowledgeEntry(id: number, data: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase | null> {
    const results = await db.update(knowledgeBase).set({ ...data, updatedAt: new Date() }).where(eq(knowledgeBase.id, id)).returning();
    return results[0] || null;
  }

  async deleteKnowledgeEntry(id: number): Promise<boolean> {
    const results = await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id)).returning();
    return results.length > 0;
  }

  async searchKnowledgeEntries(query: string, limit: number = 5): Promise<KnowledgeBase[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const results = await db.execute(sql`
      SELECT *, 
        GREATEST(
          similarity(LOWER(question), ${normalizedQuery}),
          similarity(LOWER(answer), ${normalizedQuery})
        ) as sim_score
      FROM knowledge_base 
      WHERE status = 'approved'
        AND (
          LOWER(question) LIKE ${'%' + normalizedQuery + '%'}
          OR LOWER(answer) LIKE ${'%' + normalizedQuery + '%'}
          OR similarity(LOWER(question), ${normalizedQuery}) > 0.15
          OR EXISTS (
            SELECT 1 FROM unnest(keywords) AS kw 
            WHERE LOWER(kw) LIKE ${'%' + normalizedQuery + '%'}
            OR similarity(LOWER(kw), ${normalizedQuery}) > 0.2
          )
        )
      ORDER BY sim_score DESC
      LIMIT ${limit}
    `);
    return (results.rows || results) as KnowledgeBase[];
  }

  async incrementKnowledgeUsage(id: number): Promise<void> {
    await db.update(knowledgeBase).set({
      usageCount: sql`${knowledgeBase.usageCount} + 1`,
      lastUsedAt: new Date(),
    }).where(eq(knowledgeBase.id, id));
  }
}

export const storage = new DatabaseStorage();
