import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  sender: text("sender", { enum: ["user", "support"] }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_user_email").on(table.userEmail),
]);

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  pageUrl: text("page_url"),
  pageTitle: text("page_title"),
  chatSummary: text("chat_summary"),
  notified: boolean("notified").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
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

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;

export const guestFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  email: z.string().email("Ingresa un correo v\u00e1lido").max(200),
});

export type GuestForm = z.infer<typeof guestFormSchema>;
