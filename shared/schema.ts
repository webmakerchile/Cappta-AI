import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, index, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().default("legacy"),
  tenantId: integer("tenant_id"),
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
  index("idx_messages_tenant_id").on(table.tenantId),
]);

export const sessions = pgTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  tenantId: integer("tenant_id"),
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
  lastAutoEmailAt: timestamp("last_auto_email_at"),
  lastManualEmailAt: timestamp("last_manual_email_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sessions_tenant_id").on(table.tenantId),
]);

export const cannedResponses = pgTable("canned_responses", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  shortcut: text("shortcut").notNull(),
  content: text("content").notNull(),
});

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
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
  tenantId: integer("tenant_id"),
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
  accountType: text("account_type", { enum: ["primaria", "secundaria", "no_aplica"] }).notNull().default("no_aplica"),
  badgeLabel: text("badge_label"),
  wcLastSync: timestamp("wc_last_sync"),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
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
  color: text("color").notNull().default("#10b981"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customTags = pgTable("custom_tags", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  name: text("name").notNull(),
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

export const tenantPushSubscriptions = pgTable("tenant_push_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  companyName: text("company_name").notNull(),
  domain: text("domain"),
  widgetColor: text("widget_color").notNull().default("#10b981"),
  headerTextColor: text("header_text_color").notNull().default("#ffffff"),
  botBubbleColor: text("bot_bubble_color").notNull().default("#2a2a2a"),
  botTextColor: text("bot_text_color").notNull().default("#e0e0e0"),
  userTextColor: text("user_text_color").notNull().default("#ffffff"),
  welcomeMessage: text("welcome_message").notNull().default("Hola, ¿en qué podemos ayudarte?"),
  welcomeSubtitle: text("welcome_subtitle").notNull().default("Completa tus datos para iniciar la conversacion"),
  logoUrl: text("logo_url"),
  avatarUrl: text("avatar_url"),
  launcherImageUrl: text("launcher_image_url"),
  botIconUrl: text("bot_icon_url"),
  widgetPosition: text("widget_position").notNull().default("right"),
  labelContactButton: text("label_contact_button"),
  labelTicketButton: text("label_ticket_button"),
  labelFinalizeButton: text("label_finalize_button"),
  formFields: text("form_fields"),
  consultationOptions: text("consultation_options"),
  showProductSearch: integer("show_product_search").notNull().default(0),
  productSearchLabel: text("product_search_label").notNull().default("Buscar producto"),
  productApiUrl: text("product_api_url"),
  botConfigured: integer("bot_configured").notNull().default(0),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  aiEnabled: integer("ai_enabled").notNull().default(1),
  botContext: text("bot_context"),
  businessHoursConfig: text("business_hours_config"),
  plan: text("plan", { enum: ["free", "basic", "pro"] }).notNull().default("free"),
  flowCustomerId: text("flow_customer_id"),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  rewardMonths: integer("reward_months").notNull().default(0),
  rewardPlan: text("reward_plan"),
  rewardExpiresAt: timestamp("reward_expires_at"),
  cashBalance: integer("cash_balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredId: integer("referred_id").notNull(),
  confirmed: integer("confirmed").notNull().default(0),
  rewardApplied: integer("reward_applied").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const paymentOrders = pgTable("payment_orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  commerceOrder: text("commerce_order").notNull().unique(),
  flowOrder: integer("flow_order"),
  targetPlan: text("target_plan").notNull(),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "paid", "rejected", "cancelled"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
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

export const tenantFiles = pgTable("tenant_files", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  description: text("description"),
  keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
  autoSend: integer("auto_send").notNull().default(1),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tenant_files_tenant_id").on(table.tenantId),
]);

export const tenantAgents = pgTable("tenant_agents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["owner", "admin", "ejecutivo"] }).notNull().default("ejecutivo"),
  color: text("color").notNull().default("#10b981"),
  active: integer("active").notNull().default(1),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tenant_agents_tenant_id").on(table.tenantId),
]);

export const insertTenantAgentSchema = createInsertSchema(tenantAgents).omit({ id: true, createdAt: true, lastLoginAt: true });
export type InsertTenantAgent = z.infer<typeof insertTenantAgentSchema>;
export type TenantAgent = typeof tenantAgents.$inferSelect;

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
export const insertTenantPushSubscriptionSchema = createInsertSchema(tenantPushSubscriptions).omit({ id: true, createdAt: true });
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, lastUsedAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertTenantFileSchema = createInsertSchema(tenantFiles).omit({ id: true, createdAt: true, downloadCount: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true, confirmedAt: true });

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
export type InsertTenantPushSubscription = z.infer<typeof insertTenantPushSubscriptionSchema>;
export type TenantPushSubscription = typeof tenantPushSubscriptions.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenantFile = z.infer<typeof insertTenantFileSchema>;
export type TenantFile = typeof tenantFiles.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export const knowledgePages = pgTable("knowledge_pages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_knowledge_pages_tenant_id").on(table.tenantId),
]);

export const insertKnowledgePageSchema = createInsertSchema(knowledgePages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKnowledgePage = z.infer<typeof insertKnowledgePageSchema>;
export type KnowledgePage = typeof knowledgePages.$inferSelect;

export const guestFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  email: z.string().email("Ingresa un correo valido").max(200),
  problemType: z.string().optional().default(""),
  gameName: z.string().optional().default(""),
});

export type GuestForm = z.infer<typeof guestFormSchema>;
