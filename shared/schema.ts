import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, index } from "drizzle-orm/pg-core";
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

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const guestFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required").max(200),
});

export type GuestForm = z.infer<typeof guestFormSchema>;
