import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, index, boolean, integer, doublePrecision } from "drizzle-orm/pg-core";
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
  channel: text("channel", { enum: ["web", "whatsapp", "whatsapp_cloud", "instagram", "messenger", "telegram", "email"] }).notNull().default("web"),
  externalMessageId: text("external_message_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_session_id").on(table.sessionId),
  index("idx_messages_user_email").on(table.userEmail),
  index("idx_messages_tenant_id").on(table.tenantId),
  index("idx_messages_channel").on(table.channel),
]);

export const sessions = pgTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  tenantId: integer("tenant_id"),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  channel: text("channel", { enum: ["web", "whatsapp", "whatsapp_cloud", "instagram", "messenger", "telegram", "email"] }).notNull().default("web"),
  externalThreadId: text("external_thread_id"),
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
  logoScale: integer("logo_scale").notNull().default(100),
  avatarUrl: text("avatar_url"),
  launcherImageUrl: text("launcher_image_url"),
  launcherImageScale: integer("launcher_image_scale").notNull().default(100),
  botIconUrl: text("bot_icon_url"),
  botIconScale: integer("bot_icon_scale").notNull().default(100),
  widgetPosition: text("widget_position").notNull().default("right"),
  labelContactButton: text("label_contact_button"),
  labelTicketButton: text("label_ticket_button"),
  labelFinalizeButton: text("label_finalize_button"),
  formFields: text("form_fields"),
  consultationOptions: text("consultation_options"),
  showProductSearch: integer("show_product_search").notNull().default(0),
  productSearchLabel: text("product_search_label").notNull().default("Buscar producto"),
  productApiUrl: text("product_api_url"),
  welcomeBannerText: text("welcome_banner_text"),
  launcherBubbleText: text("launcher_bubble_text"),
  launcherBubbleStyle: text("launcher_bubble_style").notNull().default("normal"),
  whatsappEnabled: integer("whatsapp_enabled").notNull().default(0),
  whatsappNumber: text("whatsapp_number"),
  whatsappGreeting: text("whatsapp_greeting"),
  botConfigured: integer("bot_configured").notNull().default(0),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  aiEnabled: integer("ai_enabled").notNull().default(1),
  botContext: text("bot_context"),
  businessHoursConfig: text("business_hours_config"),
  plan: text("plan", { enum: ["free", "solo", "basic", "scale", "pro", "enterprise"] }).notNull().default("free"),
  industry: text("industry"),
  appliedTemplateSlug: text("applied_template_slug"),
  isTrial: integer("is_trial").notNull().default(0),
  flowCustomerId: text("flow_customer_id"),
  mpSubscriptionId: text("mp_subscription_id"),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  rewardMonths: integer("reward_months").notNull().default(0),
  rewardPlan: text("reward_plan"),
  rewardExpiresAt: timestamp("reward_expires_at"),
  cashBalance: integer("cash_balance").notNull().default(0),
  currency: text("currency").notNull().default("CLP"),
  aiModel: text("ai_model").notNull().default("gpt-4o-mini"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const llmUsage = pgTable("llm_usage", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  provider: text("provider", { enum: ["openai", "anthropic"] }).notNull().default("openai"),
  model: text("model").notNull(),
  kind: text("kind").notNull().default("chat"),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  costUsdMicros: integer("cost_usd_micros").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  status: text("status", { enum: ["ok", "fallback", "error"] }).notNull().default("ok"),
  errorMessage: text("error_message"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => [
  index("idx_llm_usage_tenant_id").on(table.tenantId),
  index("idx_llm_usage_occurred_at").on(table.occurredAt),
]);

export const insertLlmUsageSchema = createInsertSchema(llmUsage).omit({ id: true, occurredAt: true });
export type InsertLlmUsage = z.infer<typeof insertLlmUsageSchema>;
export type LlmUsage = typeof llmUsage.$inferSelect;

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

export const addons = pgTable("addons", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  icon: text("icon").notNull().default("Package"),
  category: text("category", { enum: ["marketing", "comunicacion", "analytics", "productividad"] }).notNull().default("productividad"),
  active: integer("active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tenantAddons = pgTable("tenant_addons", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  addonSlug: text("addon_slug").notNull(),
  status: text("status", { enum: ["active", "cancelled", "pending"] }).notNull().default("pending"),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  cancelledAt: timestamp("cancelled_at"),
  mpPaymentId: text("mp_payment_id"),
}, (table) => [
  index("idx_tenant_addons_tenant_id").on(table.tenantId),
  index("idx_tenant_addons_slug").on(table.addonSlug),
]);

export const insertAddonSchema = createInsertSchema(addons).omit({ id: true });
export type InsertAddon = z.infer<typeof insertAddonSchema>;
export type Addon = typeof addons.$inferSelect;

export const insertTenantAddonSchema = createInsertSchema(tenantAddons).omit({ id: true, activatedAt: true, cancelledAt: true });
export type InsertTenantAddon = z.infer<typeof insertTenantAddonSchema>;
export type TenantAddon = typeof tenantAddons.$inferSelect;

export const enterpriseLeads = pgTable("enterprise_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company").notNull(),
  companySize: text("company_size"),
  industry: text("industry"),
  monthlyConversations: text("monthly_conversations"),
  channels: text("channels"),
  message: text("message"),
  source: text("source").notNull().default("enterprise_form"),
  status: text("status", { enum: ["new", "contacted", "qualified", "won", "lost"] }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEnterpriseLeadSchema = createInsertSchema(enterpriseLeads).omit({
  id: true,
  createdAt: true,
  status: true,
});
export type InsertEnterpriseLead = z.infer<typeof insertEnterpriseLeadSchema>;
export type EnterpriseLead = typeof enterpriseLeads.$inferSelect;

export const appointmentSlots = pgTable("appointment_slots", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  price: doublePrecision("price"),
  requiresPayment: integer("requires_payment").notNull().default(0),
  availability: text("availability").notNull().default("{}"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_appointment_slots_tenant").on(table.tenantId),
]);

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  slotId: integer("slot_id"),
  sessionId: text("session_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  notes: text("notes"),
  status: text("status", { enum: ["scheduled", "confirmed", "cancelled", "completed", "no_show"] }).notNull().default("scheduled"),
  paymentLinkId: integer("payment_link_id"),
  source: text("source", { enum: ["chat", "public_page", "manual"] }).notNull().default("public_page"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_appointments_tenant").on(table.tenantId),
  index("idx_appointments_scheduled").on(table.scheduledAt),
]);

export const chatPaymentLinks = pgTable("chat_payment_links", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  sessionId: text("session_id"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  productId: integer("product_id"),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("CLP"),
  provider: text("provider", { enum: ["mercadopago", "manual"] }).notNull().default("mercadopago"),
  externalId: text("external_id"),
  paymentUrl: text("payment_url"),
  publicToken: text("public_token"),
  status: text("status", { enum: ["pending", "paid", "expired", "cancelled"] }).notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  source: text("source", { enum: ["chat", "manual", "appointment"] }).notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_payment_links_tenant").on(table.tenantId),
  index("idx_chat_payment_links_status").on(table.status),
]);

export const insertAppointmentSlotSchema = createInsertSchema(appointmentSlots).omit({ id: true, createdAt: true });
export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;
export type AppointmentSlot = typeof appointmentSlots.$inferSelect;

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export const insertChatPaymentLinkSchema = createInsertSchema(chatPaymentLinks).omit({ id: true, createdAt: true, paidAt: true });
export type InsertChatPaymentLink = z.infer<typeof insertChatPaymentLinkSchema>;
export type ChatPaymentLink = typeof chatPaymentLinks.$inferSelect;

export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
export type ChatPaymentLinkStatus = "pending" | "paid" | "expired" | "cancelled";

export const industryTemplates = pgTable("industry_templates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("Briefcase"),
  emoji: text("emoji").notNull().default("🏢"),
  color: text("color").notNull().default("#7669E9"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active").notNull().default(1),
  welcomeMessage: text("welcome_message").notNull(),
  welcomeSubtitle: text("welcome_subtitle").notNull().default(""),
  botContext: text("bot_context").notNull(),
  cannedResponses: text("canned_responses").notNull().default("[]"),
  knowledgeEntries: text("knowledge_entries").notNull().default("[]"),
  suggestedTags: text("suggested_tags").notNull().default("[]"),
  consultationOptions: text("consultation_options").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIndustryTemplateSchema = createInsertSchema(industryTemplates).omit({ id: true, createdAt: true });
export type InsertIndustryTemplate = z.infer<typeof insertIndustryTemplateSchema>;
export type IndustryTemplate = typeof industryTemplates.$inferSelect;

export const tenantChannels = pgTable("tenant_channels", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  channel: text("channel", { enum: ["whatsapp", "whatsapp_cloud", "instagram", "messenger", "telegram", "email"] }).notNull(),
  enabled: integer("enabled").notNull().default(0),
  displayName: text("display_name"),
  externalId: text("external_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  webhookSecret: text("webhook_secret"),
  phoneNumberId: text("phone_number_id"),
  pageId: text("page_id"),
  igUserId: text("ig_user_id"),
  botToken: text("bot_token"),
  inboundAddress: text("inbound_address"),
  config: text("config").notNull().default("{}"),
  status: text("status", { enum: ["pending", "connected", "error", "disabled"] }).notNull().default("pending"),
  statusMessage: text("status_message"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tenant_channels_tenant").on(table.tenantId),
  index("idx_tenant_channels_channel").on(table.channel),
  index("idx_tenant_channels_external").on(table.externalId),
]);

export const insertTenantChannelSchema = createInsertSchema(tenantChannels).omit({ id: true, createdAt: true, updatedAt: true, lastSyncedAt: true });
export type InsertTenantChannel = z.infer<typeof insertTenantChannelSchema>;
export type TenantChannel = typeof tenantChannels.$inferSelect;

export const guestFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  email: z.string().email("Ingresa un correo valido").max(200),
  problemType: z.string().optional().default(""),
  gameName: z.string().optional().default(""),
});

export type GuestForm = z.infer<typeof guestFormSchema>;

// ============================================================================
// MOTOR DE VENTAS IA - Lead Scoring, Sequences, Flows, Integrations, API
// ============================================================================

export const leadScores = pgTable("lead_scores", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  sessionId: text("session_id").notNull(),
  userEmail: text("user_email").notNull(),
  score: integer("score").notNull().default(0),
  temperature: text("temperature", { enum: ["cold", "warm", "hot"] }).notNull().default("cold"),
  intent: text("intent"),
  factors: text("factors").notNull().default("[]"),
  reasoning: text("reasoning"),
  nextAction: text("next_action"),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_scores_tenant").on(table.tenantId),
  index("idx_lead_scores_session").on(table.sessionId),
  index("idx_lead_scores_email").on(table.userEmail),
]);

export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger", { enum: ["lead_hot", "lead_warm", "no_reply_24h", "abandoned_cart", "new_session", "appointment_booked", "tag_added", "manual"] }).notNull().default("manual"),
  steps: text("steps").notNull().default("[]"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sequences_tenant").on(table.tenantId),
]);

export const sequenceRuns = pgTable("sequence_runs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  sequenceId: integer("sequence_id").notNull(),
  sessionId: text("session_id"),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  currentStep: integer("current_step").notNull().default(0),
  status: text("status", { enum: ["pending", "running", "completed", "stopped", "error"] }).notNull().default("pending"),
  nextRunAt: timestamp("next_run_at"),
  lastError: text("last_error"),
  context: text("context").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_sequence_runs_tenant").on(table.tenantId),
  index("idx_sequence_runs_status").on(table.status),
  index("idx_sequence_runs_next").on(table.nextRunAt),
]);

export const flows = pgTable("flows", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type", { enum: ["new_session", "new_message", "tag_added", "lead_hot", "lead_warm", "appointment_booked", "manual", "webhook"] }).notNull().default("manual"),
  triggerConfig: text("trigger_config").notNull().default("{}"),
  nodes: text("nodes").notNull().default("[]"),
  edges: text("edges").notNull().default("[]"),
  active: integer("active").notNull().default(1),
  runCount: integer("run_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_flows_tenant").on(table.tenantId),
]);

export const flowRuns = pgTable("flow_runs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  flowId: integer("flow_id").notNull(),
  sessionId: text("session_id"),
  status: text("status", { enum: ["running", "completed", "failed", "stopped"] }).notNull().default("running"),
  currentNodeId: text("current_node_id"),
  context: text("context").notNull().default("{}"),
  log: text("log").notNull().default("[]"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
}, (table) => [
  index("idx_flow_runs_tenant").on(table.tenantId),
  index("idx_flow_runs_flow").on(table.flowId),
]);

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  provider: text("provider", { enum: ["webhook", "http", "slack", "discord", "google_sheets", "google_calendar", "outlook_calendar", "hubspot", "pipedrive", "salesforce", "airtable", "notion", "teams", "stripe", "mercadopago", "mailchimp", "activecampaign"] }).notNull(),
  name: text("name").notNull(),
  config: text("config").notNull().default("{}"),
  credentials: text("credentials"),
  active: integer("active").notNull().default(1),
  lastUsedAt: timestamp("last_used_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_integrations_tenant").on(table.tenantId),
  index("idx_integrations_provider").on(table.provider),
]);

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  prefix: text("prefix").notNull(),
  hashedKey: text("hashed_key").notNull(),
  scopes: text("scopes").notNull().default("[]"),
  lastUsedAt: timestamp("last_used_at"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_api_keys_tenant").on(table.tenantId),
  index("idx_api_keys_prefix").on(table.prefix),
]);

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").array().notNull().default(sql`'{}'::text[]`),
  active: integer("active").notNull().default(1),
  lastDeliveryAt: timestamp("last_delivery_at"),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhook_endpoints_tenant").on(table.tenantId),
]);

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  endpointId: integer("endpoint_id").notNull(),
  event: text("event").notNull(),
  payload: text("payload").notNull(),
  statusCode: integer("status_code"),
  response: text("response"),
  attempts: integer("attempts").notNull().default(0),
  success: integer("success").notNull().default(0),
  deliveredAt: timestamp("delivered_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhook_deliveries_endpoint").on(table.endpointId),
]);

export const insertLeadScoreSchema = createInsertSchema(leadScores).omit({ id: true, calculatedAt: true });
export type InsertLeadScore = z.infer<typeof insertLeadScoreSchema>;
export type LeadScore = typeof leadScores.$inferSelect;

export const insertSequenceSchema = createInsertSchema(sequences).omit({ id: true, createdAt: true });
export type InsertSequence = z.infer<typeof insertSequenceSchema>;
export type Sequence = typeof sequences.$inferSelect;

export const insertSequenceRunSchema = createInsertSchema(sequenceRuns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSequenceRun = z.infer<typeof insertSequenceRunSchema>;
export type SequenceRun = typeof sequenceRuns.$inferSelect;

export const insertFlowSchema = createInsertSchema(flows).omit({ id: true, createdAt: true, updatedAt: true, runCount: true });
export type InsertFlow = z.infer<typeof insertFlowSchema>;
export type Flow = typeof flows.$inferSelect;

export const insertFlowRunSchema = createInsertSchema(flowRuns).omit({ id: true, startedAt: true, endedAt: true });
export type InsertFlowRun = z.infer<typeof insertFlowRunSchema>;
export type FlowRun = typeof flowRuns.$inferSelect;

export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, lastUsedAt: true, lastError: true });
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpoints).omit({ id: true, createdAt: true, lastDeliveryAt: true, failureCount: true });
export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({ id: true, deliveredAt: true });
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;

export type LeadTemperature = "cold" | "warm" | "hot";
export type SequenceStatus = "pending" | "running" | "completed" | "stopped" | "error";
export type FlowRunStatus = "running" | "completed" | "failed" | "stopped";

export interface LeadScoreFactor {
  factor: string;
  weight: number;
  positive: boolean;
}

export interface SequenceStep {
  type: "wait" | "send_message" | "send_email" | "create_task" | "webhook" | "tag";
  delayMinutes?: number;
  message?: string;
  subject?: string;
  url?: string;
  tag?: string;
}

export interface FlowNode {
  id: string;
  type: "trigger" | "send_message" | "wait" | "condition" | "ai_response" | "integration" | "tag" | "lead_score" | "end";
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export const ALL_WEBHOOK_EVENTS = [
  "session.closed",
  "message.user",
  "message.support",
  "lead.scored",
  "lead.hot",
  "lead.qualified",
] as const;

export type WebhookEvent = typeof ALL_WEBHOOK_EVENTS[number];
