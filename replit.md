# Cappta AI SaaS Platform by Web Maker Chile

## Overview
This project is a SaaS platform for AI-powered customer support chat widgets. Originally built as "FoxBot", rebranded through "Nexia AI", now **Cappta AI** (cappta.ai) with premium/luxury positioning inspired by Vambe.ai. The platform integrates a React + Vite frontend with an Express + Socket.io backend. Businesses can register, configure their own chat widget, and embed it in their websites via iframe. The core features include AI-powered responses, product catalog integration, real-time agent collaboration, and a knowledge base that learns from conversations.

## Brand Identity
- **Product Name**: Cappta AI (by Web Maker Chile)
- **Domain**: cappta.ai (brand domain), foxbot.cl (operational domain — CORS, @foxbot.cl emails, payment callbacks, widget detection stay foxbot.cl)
- **Primary Color**: Deep violet/indigo #7669E9 = hsl(250, 65%, 60%)
- **Logo Component**: `client/src/components/CapptaLogo.tsx` (SVG arc "C" logo with CapptaLogo and CapptaIcon exports)
- **Typography**: Sora (headings via `font-heading` class) + Inter (body text) + DM Sans (dashboard/admin)
- **Default Widget Color**: Green (#10b981) used as fallback when no tenant brandColor is set (tenant-configurable)
- **Plan Names**: Cappta Starter (Free), Cappta Pro ($19.990), Cappta Enterprise ($49.990) CLP/mes
- **Widget IDs**: `nexia-widget` (iframe ID — kept for backward compatibility with existing customer sites), `nexia_position` (postMessage event)
- **WordPress Plugin**: `nexia-chat` slug (kept for backward compatibility)
- **CTA model**: All CTAs → "Agendar Reunión" linking to #demo section (DemoScheduleForm)
- **Legacy brands**: "FoxBot" → "Nexia AI" → "Cappta AI". All user-visible text now says Cappta AI. Operational domain/URLs stay foxbot.cl. NexiaLogo.tsx kept as orphan file (unused).
- **Product Isolation**: `/api/products/browse?tenantId=X` filters products by tenant. Each tenant only sees their own products in the widget.
- **Beautify Text**: `/api/tenant-panel/beautify-text` endpoint uses GPT-4o-mini to improve bot training text (copywriting, grammar, tone) while preserving structure and factual data.

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application features a React frontend with Tailwind CSS for styling and Lucide React for icons, communicating with an Express backend utilizing Socket.io for real-time messaging. PostgreSQL is used for data persistence via Drizzle ORM, and Resend handles email notifications.

Key architectural decisions and features include:
- **Multi-Tenant Architecture**: All core tables (sessions, messages, products, knowledgeBase, ratings, contactRequests) have a nullable `tenantId` column. Legacy data (CJM Digitales) has tenantId=null. New tenants get their own isolated data. TenantId flows end-to-end: widget URL `?tenantId=X` → useChat hook → all POST requests and socket.io auth → server routes → upsertSession/createMessage storage calls. **Cache isolation**: All TanStack Query cache keys include tenantId as the third element (`["/api/messages/thread", email, tenantId]`) to prevent cross-tenant data leaks when the same email exists across multiple tenants. Client-side filtering additionally enforces strict tenantId matching on fetched sessions and messages. Widget components (Launcher, ChatWindow, WelcomeForm) accept dynamic branding from tenant config fetched via `/api/tenants/:id/config`. **Full color customization**: widgetColor (main/header bg + user bubble bg), headerTextColor, botBubbleColor, botTextColor, userTextColor — all configurable per tenant in Dashboard "Apariencia del Widget" section with live preview. **Custom launcher button & bot icon**: `launcherImageUrl` (custom image for the floating chat button, replaces default MessageCircle icon) and `botIconUrl` (custom image for the small icon next to bot messages, replaces default Headphones icon). Both configurable via Dashboard with upload + preview in "Botón" tab. **Image scaling**: `logoScale`, `launcherImageScale`, and `botIconScale` (integer, default 100, range 50-200) allow resizing each image independently via sliders in Dashboard. Scale is applied with dynamic pixel sizing and max bounds to prevent overflow. **Welcome banner & launcher bubble**: `welcomeBannerText` (announcement banner shown between subtitle and form fields in WelcomeForm, styled with brand color) and `launcherBubbleText` (speech bubble next to launcher button, auto-hides after 5s). Both configurable in Dashboard and OnboardingWizard step 1.
- **Two Auth Systems**: Admin JWT (for admin panel agents) and Tenant JWT (for SaaS dashboard, with `isTenant: true` claim). Both use the same JWT_SECRET but different token structures.
- **Dynamic Iframe Resizing**: The widget communicates with the parent WordPress site using `postMessage` for responsive iframe adjustments based on its open/closed state.
- **Contextual User Experience**: It supports auto-authentication via URL parameters (`email`, `name`) for logged-in users and detects page context (`page_url`, `page_title`) to provide relevant auto-replies.
- **Persistent Conversation History**: Messages and sessions are stored in PostgreSQL, allowing users to view their entire conversation history across multiple consultations.
- **Hybrid Messaging**: Combines HTTP POST for sending messages (iframe compatibility) with Socket.io for real-time message reception, including a 4-second polling fallback. Admin panel uses a separate socket connection with `role: "admin"` auth that bypasses user session requirements, enabling real-time message reception in the admin dashboard.
- **Intelligent Auto-reply Engine**: A sophisticated `autoReply.ts` engine in the backend provides context-aware responses. For CJM Digitales (tenantId=null), it uses a hardcoded intent-based response tree with product catalog lookup. For all other tenants, `_processTenantAutoReply()` routes directly to OpenAI gpt-4o-mini with tenant-specific context (companyName, botContext from tenants table), tenant-scoped knowledge base entries, and tenant product catalog. The `buildTenantSystemPrompt()` in `aiReply.ts` generates a dynamic system prompt per tenant with ultra-intelligent behavior: expert-level knowledge, emoji-rich responses, adaptive length, proactive information sharing, and deep context understanding. Knowledge base searches are tenant-scoped via the `tenantId` parameter. Max completion tokens: 1000. Knowledge text limit: 50,000 chars. Temperature: 0.75.
- **Deep Web Scraping**: The `analyze-url` endpoint crawls the main page + up to 10 internal subpages (batched 4 at a time), extracting metadata, JSON-LD, nav, header, footer, main content, and all internal links. The AI analysis prompt generates ultra-detailed knowledge base output with FAQs, page listings, and comprehensive business profiles. Max tokens for analysis: 16,000.
- **Price Extraction**: `extractPricingData()` uses two passes: (1) HTML blocks with pricing-related class names, (2) full stripped-text scan for `$X.XXX` patterns with ±2 lines of surrounding context. This ensures e-commerce product prices are captured even without pricing CSS classes. AI prompts distinguish demo chat prices from real catalog/product prices.
- **Business Hours System**: Configurable business hours stored in `app_settings`. During offline hours, the chat continues to work normally but contact executive buttons are replaced with ticket system links.
- **Integrated Product Catalog**: Each tenant manages their own product catalog via the tenant panel. The bot queries the tenant-scoped PostgreSQL-backed catalog with fuzzy matching via pg_trgm trigram similarity. WooCommerce direct integration has been removed — products are managed per-tenant through the panel UI.
- **Comprehensive Admin Panel**: Located at `/admin`, this panel offers session management, a chat viewer, global search, status filters, tags, canned responses, product catalog management, session agent badges, and agent type filters.
- **Conversation Learning System**: An AI-powered learning pipeline that extracts knowledge from closed customer conversations.
- **Ambassador Referral System**: Referral program with dynamic "Embajador" (Ambassador) tier. Normal referrals earn $3,000 CLP per confirmed paid referral. At 15+ active paid referrals (plan != 'free'), the referrer becomes an Ambassador and earns $5,000 CLP per referral + free Cappta Enterprise plan. Ambassador status is **dynamic** — if paid referrals drop below 15 (e.g., referral downgrades to free plan), they lose Ambassador benefits. `getPaidReferralCount()` counts only referrals whose tenant currently has a paid plan ('basic' or 'pro'). Frontend shows Ambassador banner, progress toward ambassador threshold, and distinguishes "Activo" vs "Plan cancelado" referral statuses.
- **Image Uploads**: Upload route `POST /api/uploads/direct` (multipart) converts images to base64 data URIs and returns them directly. Data URIs are stored in PostgreSQL text columns (logoUrl, avatarUrl, launcherImageUrl, botIconUrl) and used directly as image `src` attributes. This approach avoids external storage dependencies (Replit Object Storage sidecar returns 401 in both dev and deployment). Upload limit: 5MB. Typical icons/logos are under 200KB.

## SaaS Pages & Routing
- `/` - Landing page (marketing, features, pricing) - FoxBot branding, color-cycling animated chat demo (4 brand themes: green/TechStore, orange/Sabor Criollo, blue/VidaSana, purple/Moda Urbana with clickable dots + auto-advance), platform logos (WooCommerce/Shopify/WordPress/Magento/API), stats section, CLP pricing
- `/demo` - Interactive demo chat with 27 categories across 11 groups, text search + category filter pills, no registration required, rate-limited 30 msg/hr, dynamic theming per context, uses OpenAI gpt-4o-mini via Replit AI integration
- `/register` - Tenant registration (company signup)
- `/login` - Tenant login
- `/dashboard` - Tenant dashboard (widget config, embed code, real stats, plan, link to Panel de Soporte). **Onboarding**: New tenants (onboardingStep < 3) see a 3-step wizard (OnboardingWizard.tsx): Step 1 = business info + URL analyze, Step 2 = colors/logo/welcome msg with live preview, Step 3 = embed code + next steps. After wizard, optional DashboardTour (DashboardTour.tsx) highlights each sidebar item with spotlight tooltip.
- `/panel` - Tenant admin panel (PWA installable from mobile). Full support management: real-time chats via socket.io with sub-filters Bot/Ejecutivo/Pendientes/Mis Chats, star ratings display, pre-chat form card, tag management dropdown, product search in chat toolbar, chat message search, SHOW_RATING rendering, image upload, notification sounds, canned responses, tags, products, knowledge base, guides, AI/business hours settings, **Entrenar Bot** tab with **multi-page knowledge system** (knowledge_pages table): "Página Principal" + unlimited additional pages (ej: Horarios, Precios, Políticas). Each page is independent — adding/editing one doesn't affect others. AI analysis (paste text or URL) can be applied to any page via "Reemplazar" or "Agregar sin borrar". All pages are injected into the AI prompt as separate sections. Also supports **Corregir** button on bot messages to save corrections to knowledge base.
- `/widget` - Chat widget (for iframe embedding, accepts `?tenantId=X`)
- `/chat` - Full-screen chat (for logged-in users via email params)
- `/chat/contacto` - Contact chat (with welcome form)
- `/guias` - Installation guides for 15+ platforms (WordPress, Shopify, WooCommerce, Magento, Squarespace, Wix, Webflow, React, Next.js, Vue, Angular, GTM, PrestaShop, HTML, iFrame) with copy-paste code blocks
- `/admin` - Admin panel (superadmin agent dashboard)

## Database Tables
- `tenants` - SaaS tenant/company accounts (id, name, email, passwordHash, companyName, domain, widgetColor, welcomeMessage, welcomeSubtitle, logoUrl, avatarUrl, formFields, consultationOptions, showProductSearch, productSearchLabel, productApiUrl, botConfigured, onboardingStep, aiEnabled, businessHoursConfig, plan, flowCustomerId, referralCode, referredBy, rewardMonths, rewardPlan, rewardExpiresAt, cashBalance, createdAt)
- `referrals` - Referral tracking (id, referrerId, referredId, confirmed, rewardApplied, createdAt, confirmedAt)
  - **Referral rewards**: $3.000 CLP per confirmed referral (accumulated in cashBalance) + milestone subscription bonuses: 1→1mo Cappta Pro, 3→2mo Cappta Pro, 5→3mo Enterprise, 10→6mo Enterprise, 15→12mo Enterprise
- `sessions` - Chat sessions (has tenantId for multi-tenant isolation)
- `messages` - Chat messages (has tenantId)
- `products` - Product catalog (has tenantId)
- `knowledge_base` - AI learning entries (has tenantId)
- `ratings` - Customer satisfaction ratings (has tenantId)
- `contact_requests` - Contact form submissions (has tenantId)
- `admin_users` - Admin/agent accounts
- `canned_responses` - Quick reply shortcuts (has nullable tenantId for tenant-scoped shortcuts)
- `custom_tags` - Session tags (has nullable tenantId for tenant-scoped tags)
- `push_subscriptions` - Web push notification subscriptions (admin)
- `tenant_push_subscriptions` - Tenant push notification subscriptions
- `app_settings` - Key-value app configuration
- `addons` - Addon/extension catalog (slug, name, description, price CLP, icon, category, active, sortOrder)
- `tenant_addons` - Tenant addon subscriptions (tenantId, addonSlug, status, activatedAt, cancelledAt, mpPaymentId)

## Tenant API Routes
- `POST /api/tenants/register` - Register new tenant (accepts optional `referralCode`)
- `POST /api/tenants/login` - Tenant login (returns JWT)
- `GET /api/tenants/me` - Get tenant profile (auth required)
- `PATCH /api/tenants/me` - Update tenant settings (auth required)
- `GET /api/tenants/me/stats` - Get tenant dashboard stats (auth required)
- `GET /api/tenants/me/sessions` - List tenant's customer sessions (auth required)
- `GET /api/tenants/me/sessions/:id/messages` - Get messages for a tenant session (auth required)
- `POST /api/tenants/me/sessions/:id/reply` - Reply to a customer session (auth required)
- `GET /api/tenants/:id/config` - Public endpoint for widget to load tenant config
- `GET /api/tenants/me/referral` - Get referral code, stats, and referral list (auth required)
- `POST /api/tenants/me/referral/confirm` - DISABLED: referrals now auto-confirm when referral buys a paid plan via Flow.cl

## Tenant Panel API Routes (Support Panel at /panel)
- `GET /api/tenant-panel/sessions?status=` - List tenant sessions with full stats
- `GET /api/tenant-panel/sessions/:id/messages` - Get messages for a tenant session
- `POST /api/tenant-panel/sessions/:id/reply` - Reply to customer (creates message, emits to socket)
- `POST /api/tenant-panel/sessions/:id/read` - Mark session as read
- `PATCH /api/tenant-panel/sessions/:id/status` - Change session status
- `POST /api/tenant-panel/sessions/:id/claim` - Claim session (disable bot)
- `POST /api/tenant-panel/sessions/:id/unclaim` - Unclaim session (enable bot)
- `DELETE /api/tenant-panel/sessions/:id` - Delete session
- `PATCH /api/tenant-panel/sessions/:id/tags` - Update session tags
- `GET/POST/DELETE /api/tenant-panel/canned-responses` - Manage shortcuts
- `GET/POST/DELETE /api/tenant-panel/tags` - Manage custom tags
- `GET/POST/PATCH/DELETE /api/tenant-panel/knowledge` - Manage knowledge base
- `GET/POST/PATCH/DELETE /api/tenant-panel/products` - Manage products
- `GET/PATCH /api/tenant-panel/settings` - AI toggle + business hours

## Socket.io Tenant Room
- Tenants connect with `auth: { role: "tenant" }` and emit `join_tenant_room` with JWT token
- Server creates room `tenant:${tenantId}` for each tenant
- `tenant_new_message` events are emitted when customers send messages, auto-replies fire, or contact requests come in
- TenantPanel.tsx listens for these events to update the chat in real-time

## Plan Limit Enforcement
- Limits defined in `server/flow.ts` as `PLAN_LIMITS`: free (50 sessions, 500 messages/month), basic (500/5000), pro (unlimited)
- Checked in `POST /api/messages` before session upsert — only for tenant users (tenantId present)
- Sessions limit: blocks new session creation but allows messaging in existing sessions
- Messages limit: blocks all new user messages when exceeded
- 429 response handled in `use-chat.ts` — shows limit message in chat as a system message
- Monthly usage tracked via `getTenantMonthlyUsage()` storage method (counts from 1st of current month)

## Admin Tenant Management
- `GET /api/admin/dashboard-metrics` - SaaS dashboard KPIs: total/active tenants, revenue, MRR, sessions, messages, plan distribution, monthly revenue chart, new tenants per month (superadmin only)
- `GET /api/admin/tenants` - List all tenants with session/message counts and domain (superadmin only)
- `PATCH /api/admin/tenants/:id` - Change tenant plan manually (superadmin only)
- `GET /api/admin/payments` - List recent payment orders (superadmin only)
- Admin.tsx: "Dashboard" tab (superadmin only) shows KPI cards + revenue/plan/tenant growth charts using recharts
- Admin.tsx: "Tenants" tab (superadmin only) shows searchable tenant table with plan badges, domain column, and payments history with status badges

## WhatsApp Integration (Twilio)
- **Provider**: Twilio WhatsApp Business API
- **Package**: `twilio` npm package
- **Service File**: `server/whatsapp.ts` - Twilio client, message sending, incoming message handler with AI
- **Environment Variables**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- **Webhook**: `POST /api/whatsapp/webhook` - Receives messages from Twilio, routes to tenant by WhatsApp number, responds with AI
- **Status**: `GET /api/whatsapp/status` - Returns whether Twilio is configured
- **Tenant Fields**: `whatsappEnabled` (int, default 0), `whatsappNumber` (text), `whatsappGreeting` (text)
- **Admin Management**: Superadmin can toggle WhatsApp and assign numbers per tenant from Admin panel
- **Dashboard**: Tenants see WhatsApp tab — free plans see upgrade prompt, paid plans see activation request or config (if enabled by admin)
- **Pricing**: Optional add-on at $14.990 CLP/month for paid plans (Cappta Pro or Cappta Enterprise)
- **Conversation History**: In-memory per phone number with 30-minute TTL, max 20 messages

## Payment Integration (Mercado Pago Checkout Pro)
- **Provider**: Mercado Pago Checkout Pro (Chilean payment gateway, accepts ALL payment methods)
- **Service File**: `server/flow.ts` - Mercado Pago API client (Checkout Pro preferences), plan pricing
- **Environment Variables**: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` (optional, signature logged but not blocking)
- **Plans & Pricing**:
  - `free` (Gratis): $0 — 10 sessions/month, 100 messages/month
  - `basic` (Pro): $19,990 CLP/month — 500 sessions, 5,000 messages, AI + catalog + KB
  - `pro` (Enterprise): $49,990 CLP/month — unlimited, priority support, API, multi-agent
  - `basic_whatsapp` (Pro + WhatsApp): $34,990 CLP/month
  - `pro_whatsapp` (Enterprise + WhatsApp): $64,990 CLP/month
- **WhatsApp Add-on**: $14,990 CLP/month (WHATSAPP_ADDON_PRICE constant in flow.ts)
- **Payment Flow** (Checkout Pro — single payment, not subscription):
  1. Tenant clicks plan button → `POST /api/tenants/me/checkout` → creates MP preference via `/checkout/preferences`
  2. Redirect to Mercado Pago checkout page (accepts credit/debit cards, bank transfer, cash, etc.)
  3. On approved payment, MP sends webhook `POST /api/mercadopago/webhook` with type=payment
  4. Webhook fetches payment via `/v1/payments/:id`, verifies status=approved, upgrades tenant plan
  5. Return URL `GET /api/mercadopago/return` also upgrades tenant as backup
  6. TikTok Purchase event fired server-side on approved payment
- **Webhook Signature**: HMAC SHA-256 validation logged as warning on mismatch (not blocking), payment verified via API call
- **DB Fields**: `tenants.mpSubscriptionId` — stores MP payment ID for reference

## Payment API Routes
- `POST /api/tenants/me/checkout` - Create Mercado Pago Checkout Pro preference (auth required, body: { plan })
- `POST /api/mercadopago/webhook` - Mercado Pago webhook (payment notifications + legacy subscription events)
- `GET /api/mercadopago/return` - Post-payment redirect with plan upgrade (redirects to dashboard with status)
- `POST /api/tenants/me/cancel-subscription` - Cancel/downgrade to free (auth required)
- `GET /api/tenants/me/subscription-status` - Get payment/plan status (auth required)
- `GET /api/tenants/me/plan-prices` - Public plan pricing info
- `GET /api/addons` - List all available addons (public)
- `GET /api/tenants/me/addons` - List tenant's active addons (auth required)
- `POST /api/tenants/me/addons` - Activate addon (body: { addonSlug }; returns payment link if price > 0, else activates directly)
- `POST /api/tenants/me/addons/:slug/cancel` - Cancel addon subscription (auth required)
- `GET /api/mercadopago/addon-return` - Post-addon-payment redirect (activates addon on success)

## Demo/Test Accounts (Development Only)
Created automatically on server startup (skipped in production):
- **Admin**: admin@foxbot.cl / admin123 (superadmin, full access to /admin panel)
- **Free Plan Tenant**: demo-free@foxbot.cl / demo123 (Tienda Gratis Ltda.)
- **Pro Plan Tenant**: demo-pro@foxbot.cl / demo123 (Negocio Pro SpA)
- **Enterprise Plan Tenant**: demo-enterprise@foxbot.cl / demo123 (Empresa Premium S.A.)
- **Original Superadmin**: webmakerchile@gmail.com / peseta832 (always created)

## Error Handling
- **React Error Boundary**: Global `ErrorBoundary` component in `App.tsx` catches all render crashes. Shows Spanish-language error screen with "Recargar página" and "Volver al inicio" buttons instead of white screen.
- **i18n**: All user-facing strings are in Spanish. No English strings visible to end users.

## Security Hardening
- **Helmet**: Enabled in `server/index.ts` with CSP disabled (for iframe embeds), cross-origin resource policy set to "cross-origin"
- **JWT Secret**: Auto-generates cryptographically secure ephemeral secret if `SESSION_SECRET` env var is not set. Never falls back to a hardcoded default.
- **JWT Expiry**: All tokens (admin, tenant, agent) expire in 7 days (previously 30 days)
- **Socket.IO CORS**: Restricted to foxbot.cl, replit.dev, and repl.co domains (previously `origin: "*"`)
- **Seed Passwords**: Superadmin seed uses `SUPERADMIN_SEED_PASSWORD` env var with fallback. Demo accounts only created in development.
- **SEO**: robots.txt, sitemap.xml, canonical URL, OG tags, meta keywords all pointing to foxbot.cl
- **Performance**: Google Fonts trimmed from ~25 families to just DM Sans (the only font used)

## External Dependencies
- **PostgreSQL**: Primary database for all data persistence.
- **Resend**: Email API for sending notifications.
- **Socket.io**: Real-time bidirectional event-based communication.
- **Drizzle ORM**: TypeScript ORM for interacting with PostgreSQL.
- **WooCommerce REST API**: Used for syncing product catalog data.
- **Image Storage**: Base64 data URIs stored directly in PostgreSQL (no external file storage).
- **VAPID/Web-Push**: For sending browser push notifications to admin users.
- **OpenAI**: Powers intelligent AI responses using gpt-4o-mini.
- **Mercado Pago**: Chilean payment gateway via Checkout Pro (accepts all payment methods, not just MP wallet).
- **Twilio**: WhatsApp Business API integration for multi-channel chat support.
- **TikTok Pixel + Events API**: Dual tracking (browser pixel + server-side Events API). Pixel ID: D6K986RC77U8SKV71PDG. Server module: `server/tiktok.ts`. Events: CompleteRegistration (on register, both form and Google auth), Purchase (on approved MP payment via webhook). Server events use `event_source: "web"` + `event_source_id` at root level.
- **Helmet**: Express security headers middleware.
