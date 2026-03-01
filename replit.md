# FoxBot SaaS Platform by Web Maker Chile

## Overview
This project is a SaaS platform for AI-powered customer support chat widgets. Originally built as a standalone chat widget for CJM Digitales, it has been expanded into a multi-tenant SaaS application under the Web Maker Chile brand ("FoxBot"). The platform integrates a React + Vite frontend with an Express + Socket.io backend. Businesses can register, configure their own chat widget, and embed it in their websites via iframe. The core features include AI-powered responses, product catalog integration, real-time agent collaboration, and a knowledge base that learns from conversations.

## Brand Identity
- **Product Name**: FoxBot (by Web Maker Chile)
- **Primary Color**: Green (HSL 142 72% 32%) - matches the Web Maker Chile fox logo
- **Accent Color**: Orange (HSL 30 90% 52%) - matches the fox mascot
- **Logo Assets**: `attached_assets/Logo_sin_fondo_1772247619250.png` (transparent), `attached_assets/Logo_1772247624057.png` (with background)
- **Default Widget Color**: Green (#10b981) used as fallback when no tenant brandColor is set
- **Note**: Purple (#6200EA) is used ONLY as CJM admin color fallback and in the admin panel UI, NOT in multi-tenant widgets
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
- **Multi-Tenant Architecture**: All core tables (sessions, messages, products, knowledgeBase, ratings, contactRequests) have a nullable `tenantId` column. Legacy data (CJM Digitales) has tenantId=null. New tenants get their own isolated data. TenantId flows end-to-end: widget URL `?tenantId=X` → useChat hook → all POST requests and socket.io auth → server routes → upsertSession/createMessage storage calls. Widget components (Launcher, ChatWindow, WelcomeForm) accept dynamic branding from tenant config fetched via `/api/tenants/:id/config`. **Full color customization**: widgetColor (main/header bg + user bubble bg), headerTextColor, botBubbleColor, botTextColor, userTextColor — all configurable per tenant in Dashboard "Apariencia del Widget" section with live preview. **Custom launcher button & bot icon**: `launcherImageUrl` (custom image for the floating chat button, replaces default MessageCircle icon) and `botIconUrl` (custom image for the small icon next to bot messages, replaces default Headphones icon). Both configurable via Dashboard with upload + preview in "Botón" tab.
- **Two Auth Systems**: Admin JWT (for admin panel agents) and Tenant JWT (for SaaS dashboard, with `isTenant: true` claim). Both use the same JWT_SECRET but different token structures.
- **Dynamic Iframe Resizing**: The widget communicates with the parent WordPress site using `postMessage` for responsive iframe adjustments based on its open/closed state.
- **Contextual User Experience**: It supports auto-authentication via URL parameters (`email`, `name`) for logged-in users and detects page context (`page_url`, `page_title`) to provide relevant auto-replies.
- **Persistent Conversation History**: Messages and sessions are stored in PostgreSQL, allowing users to view their entire conversation history across multiple consultations.
- **Hybrid Messaging**: Combines HTTP POST for sending messages (iframe compatibility) with Socket.io for real-time message reception, including a 4-second polling fallback. Admin panel uses a separate socket connection with `role: "admin"` auth that bypasses user session requirements, enabling real-time message reception in the admin dashboard.
- **Intelligent Auto-reply Engine**: A sophisticated `autoReply.ts` engine in the backend provides context-aware responses. For CJM Digitales (tenantId=null), it uses a hardcoded intent-based response tree with product catalog lookup. For all other tenants, `_processTenantAutoReply()` routes directly to OpenAI gpt-4o-mini with tenant-specific context (companyName, botContext from tenants table), tenant-scoped knowledge base entries, and tenant product catalog. The `buildTenantSystemPrompt()` in `aiReply.ts` generates a dynamic system prompt per tenant with ultra-intelligent behavior: expert-level knowledge, emoji-rich responses, adaptive length, proactive information sharing, and deep context understanding. Knowledge base searches are tenant-scoped via the `tenantId` parameter. Max completion tokens: 1000. Knowledge text limit: 50,000 chars. Temperature: 0.75.
- **Deep Web Scraping**: The `analyze-url` endpoint crawls the main page + up to 10 internal subpages (batched 4 at a time), extracting metadata, JSON-LD, nav, header, footer, main content, and all internal links. The AI analysis prompt generates ultra-detailed knowledge base output with FAQs, page listings, and comprehensive business profiles. Max tokens for analysis: 16,000.
- **Business Hours System**: Configurable business hours stored in `app_settings`. During offline hours, the chat continues to work normally but contact executive buttons are replaced with ticket system links.
- **Integrated Product Catalog**: Each tenant manages their own product catalog via the tenant panel. The bot queries the tenant-scoped PostgreSQL-backed catalog with fuzzy matching via pg_trgm trigram similarity. WooCommerce direct integration has been removed — products are managed per-tenant through the panel UI.
- **Comprehensive Admin Panel**: Located at `/admin`, this panel offers session management, a chat viewer, global search, status filters, tags, canned responses, product catalog management, session agent badges, and agent type filters.
- **Conversation Learning System**: An AI-powered learning pipeline that extracts knowledge from closed customer conversations.
- **Ambassador Referral System**: Referral program with dynamic "Embajador" (Ambassador) tier. Normal referrals earn $3,000 CLP per confirmed paid referral. At 15+ active paid referrals (plan != 'free'), the referrer becomes an Ambassador and earns $5,000 CLP per referral + free Fox Enterprise plan. Ambassador status is **dynamic** — if paid referrals drop below 15 (e.g., referral downgrades to free plan), they lose Ambassador benefits. `getPaidReferralCount()` counts only referrals whose tenant currently has a paid plan ('basic' or 'pro'). Frontend shows Ambassador banner, progress toward ambassador threshold, and distinguishes "Activo" vs "Plan cancelado" referral statuses.
- **Replit Object Storage**: Used for image uploads, leveraging presigned URLs for secure and efficient file handling.

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
  - **Referral rewards**: $3.000 CLP per confirmed referral (accumulated in cashBalance) + milestone subscription bonuses: 1→1mo Fox Pro, 3→2mo Fox Pro, 5→3mo Enterprise, 10→6mo Enterprise, 15→12mo Enterprise
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

## Payment Integration (Flow.cl)
- **Provider**: Flow.cl (Chilean payment gateway, used instead of Stripe)
- **Package**: `flowcl-node-api-client` (CommonJS, imported via createRequire)
- **Service File**: `server/flow.ts` - Flow API client configuration and plan pricing
- **Environment Variables**: `FLOW_API_KEY`, `FLOW_SECRET_KEY`
- **Plans & Pricing**:
  - `free` (Gratis): $0 — 50 sessions/month, 500 messages/month
  - `basic` (Pro): $19,990 CLP/month — 500 sessions, 5,000 messages, AI + catalog + KB
  - `pro` (Enterprise): $49,990 CLP/month — unlimited, priority support, API, multi-agent
- **Payment Flow**:
  1. Tenant clicks "Contratar" → `POST /api/tenants/me/checkout` → creates Flow payment order
  2. Redirect to Flow.cl hosted checkout page
  3. Flow.cl calls `POST /api/flow/confirm` webhook on payment completion → updates tenant plan in DB
  4. User redirected to `GET /api/flow/return` → redirects to `/dashboard?payment=success|rejected|pending|error`
  5. Dashboard shows toast notification based on payment result and refreshes tenant data
- **DB Field**: `tenants.flowCustomerId` — reserved for future recurring billing via Flow customer/charge API

## Payment API Routes
- `POST /api/tenants/me/checkout` - Create Flow.cl payment (auth required, body: { plan })
- `POST /api/flow/confirm` - Flow.cl webhook (receives token, verifies payment status)
- `GET /api/flow/return` - Post-payment redirect (redirects to dashboard with status)
- `GET /api/tenants/me/plan-prices` - Public plan pricing info

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
- **Replit Object Storage**: For storing image uploads via presigned URLs.
- **VAPID/Web-Push**: For sending browser push notifications to admin users.
- **OpenAI**: Powers intelligent AI responses using gpt-4o-mini.
- **Flow.cl**: Chilean payment gateway for plan billing (via flowcl-node-api-client).
- **Helmet**: Express security headers middleware.
