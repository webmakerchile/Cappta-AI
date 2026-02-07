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
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
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

export const guestFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  email: z.string().email("Ingresa un correo valido").max(200),
  problemType: z.string().min(1, "Selecciona un tipo de consulta"),
  gameName: z.string().min(1, "Ingresa el nombre del juego o producto").max(200),
});

export type GuestForm = z.infer<typeof guestFormSchema>;
