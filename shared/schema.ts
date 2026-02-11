import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, index, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().default("legacy"),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  sender: text("sender", { enum: ["user", "support"] }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  adminName: text("admin_name"),
  adminColor: text("admin_color"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_session_id").on(table.sessionId),
  index("idx_messages_user_email").on(table.userEmail),
]);

export const sessions = pgTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  problemType: text("problem_type"),
  gameName: text("game_name"),
  adminActive: boolean("admin_active").notNull().default(false),
  assignedTo: integer("assigned_to"),
  assignedToName: text("assigned_to_name"),
  assignedToColor: text("assigned_to_color"),
  warningCount: integer("warning_count").notNull().default(0),
  blockedAt: timestamp("blocked_at"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cannedResponses = pgTable("canned_responses", {
  id: serial("id").primaryKey(),
  shortcut: text("shortcut").notNull().unique(),
  content: text("content").notNull(),
});

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  pageUrl: text("page_url"),
  pageTitle: text("page_title"),
  chatSummary: text("chat_summary"),
  problemType: text("problem_type"),
  gameName: text("game_name"),
  notified: boolean("notified").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  wcProductId: integer("wc_product_id"),
  name: text("name").notNull(),
  searchAliases: text("search_aliases").array().notNull().default(sql`'{}'::text[]`),
  platform: text("platform", { enum: ["ps4", "ps5", "xbox_one", "xbox_series", "pc", "nintendo", "all"] }).notNull().default("all"),
  price: text("price"),
  productUrl: text("product_url"),
  imageUrl: text("image_url"),
  availability: text("availability", { enum: ["available", "out_of_stock", "preorder"] }).notNull().default("available"),
  description: text("description"),
  category: text("category", { enum: ["game", "subscription", "card", "bundle", "console", "accessory", "other"] }).notNull().default("game"),
  wcLastSync: timestamp("wc_last_sync"),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["superadmin", "admin", "ejecutivo"] }).notNull().default("ejecutivo"),
  color: text("color").notNull().default("#6200EA"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customTags = pgTable("custom_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  category: text("category", { enum: ["faq", "troubleshooting", "product_info", "policy", "general"] }).notNull().default("general"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
  confidence: integer("confidence").notNull().default(80),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  sourceSessionId: text("source_session_id"),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_knowledge_status").on(table.status),
  index("idx_knowledge_category").on(table.category),
]);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  timestamp: true,
  notified: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  lastMessageAt: true,
  createdAt: true,
});

export const insertCannedResponseSchema = createInsertSchema(cannedResponses).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, timestamp: true });

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, lastUsedAt: true });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = z.infer<typeof insertCannedResponseSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;

export const guestFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  email: z.string().email("Ingresa un correo valido").max(200),
  problemType: z.string().min(1, "Selecciona un tipo de consulta"),
  gameName: z.string().min(1, "Ingresa el nombre del juego o producto").max(200),
});

export type GuestForm = z.infer<typeof guestFormSchema>;
