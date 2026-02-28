# FoxBot SaaS Platform by Web Maker Chile

## Overview
This project is a SaaS platform for AI-powered customer support chat widgets. Originally built as a standalone chat widget for CJM Digitales, it has been expanded into a multi-tenant SaaS application under the Web Maker Chile brand ("FoxBot"). The platform integrates a React + Vite frontend with an Express + Socket.io backend. Businesses can register, configure their own chat widget, and embed it in their websites via iframe. The core features include AI-powered responses, product catalog integration, real-time agent collaboration, and a knowledge base that learns from conversations.

## Brand Identity
- **Product Name**: FoxBot (by Web Maker Chile)
- **Primary Color**: Green (HSL 142 72% 32%) - matches the Web Maker Chile fox logo
- **Accent Color**: Orange (HSL 30 90% 52%) - matches the fox mascot
- **Logo Assets**: `attached_assets/Logo_sin_fondo_1772247619250.png` (transparent), `attached_assets/Logo_1772247624057.png` (with background)
- **Note**: Purple (#6200EA) is used ONLY in the CJM Digitales chat widget components (hardcoded inline styles), NOT in the SaaS platform UI

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application features a React frontend with Tailwind CSS for styling and Lucide React for icons, communicating with an Express backend utilizing Socket.io for real-time messaging. PostgreSQL is used for data persistence via Drizzle ORM, and Resend handles email notifications.

Key architectural decisions and features include:
- **Multi-Tenant Architecture**: All core tables (sessions, messages, products, knowledgeBase, ratings, contactRequests) have a nullable `tenantId` column. Legacy data (CJM Digitales) has tenantId=null. New tenants get their own isolated data. TenantId flows end-to-end: widget URL `?tenantId=X` → useChat hook → all POST requests and socket.io auth → server routes → upsertSession/createMessage storage calls. Widget components (Launcher, ChatWindow, WelcomeForm) accept dynamic branding (color, name, welcome message) from tenant config fetched via `/api/tenants/:id/config`.
- **Two Auth Systems**: Admin JWT (for admin panel agents) and Tenant JWT (for SaaS dashboard, with `isTenant: true` claim). Both use the same JWT_SECRET but different token structures.
- **Dynamic Iframe Resizing**: The widget communicates with the parent WordPress site using `postMessage` for responsive iframe adjustments based on its open/closed state.
- **Contextual User Experience**: It supports auto-authentication via URL parameters (`email`, `name`) for logged-in users and detects page context (`page_url`, `page_title`) to provide relevant auto-replies.
- **Persistent Conversation History**: Messages and sessions are stored in PostgreSQL, allowing users to view their entire conversation history across multiple consultations.
- **Hybrid Messaging**: Combines HTTP POST for sending messages (iframe compatibility) with Socket.io for real-time message reception, including a 4-second polling fallback. Admin panel uses a separate socket connection with `role: "admin"` auth that bypasses user session requirements, enabling real-time message reception in the admin dashboard.
- **Intelligent Auto-reply Engine**: A sophisticated `autoReply.ts` engine in the backend provides context-aware responses, detects user intent, recognizes product/game names, avoids repetition, and escalates to human agents when necessary. When AI is enabled, ALL intents (except the first greeting) are routed through OpenAI gpt-4o-mini for fully personalized, contextual responses.
- **Business Hours System**: Configurable business hours stored in `app_settings`. During offline hours, the chat continues to work normally but contact executive buttons are replaced with ticket system links.
- **Integrated Product Catalog**: The bot can query a PostgreSQL-backed product catalog to include real-time prices, availability, and purchase URLs in its responses. Product search uses fuzzy matching via PostgreSQL pg_trgm trigram similarity.
- **Comprehensive Admin Panel**: Located at `/admin`, this panel offers session management, a chat viewer, global search, status filters, tags, canned responses, product catalog management, session agent badges, and agent type filters.
- **Conversation Learning System**: An AI-powered learning pipeline that extracts knowledge from closed customer conversations.
- **Replit Object Storage**: Used for image uploads, leveraging presigned URLs for secure and efficient file handling.

## SaaS Pages & Routing
- `/` - Landing page (marketing, features, pricing) - FoxBot branding
- `/register` - Tenant registration (company signup)
- `/login` - Tenant login
- `/dashboard` - Tenant dashboard (widget config, embed code, real stats, plan)
- `/widget` - Chat widget (for iframe embedding, accepts `?tenantId=X`)
- `/chat` - Full-screen chat (for logged-in users via email params)
- `/chat/contacto` - Contact chat (with welcome form)
- `/admin` - Admin panel (agent dashboard)

## Database Tables
- `tenants` - SaaS tenant/company accounts (id, name, email, passwordHash, companyName, domain, widgetColor, welcomeMessage, logoUrl, plan, createdAt)
- `sessions` - Chat sessions (has tenantId for multi-tenant isolation)
- `messages` - Chat messages (has tenantId)
- `products` - Product catalog (has tenantId)
- `knowledge_base` - AI learning entries (has tenantId)
- `ratings` - Customer satisfaction ratings (has tenantId)
- `contact_requests` - Contact form submissions (has tenantId)
- `admin_users` - Admin/agent accounts
- `canned_responses` - Quick reply shortcuts
- `push_subscriptions` - Web push notification subscriptions
- `app_settings` - Key-value app configuration
- `custom_tags` - Session tags

## Tenant API Routes
- `POST /api/tenants/register` - Register new tenant
- `POST /api/tenants/login` - Tenant login (returns JWT)
- `GET /api/tenants/me` - Get tenant profile (auth required)
- `PATCH /api/tenants/me` - Update tenant settings (auth required)
- `GET /api/tenants/me/stats` - Get tenant dashboard stats (auth required)
- `GET /api/tenants/:id/config` - Public endpoint for widget to load tenant config

## External Dependencies
- **PostgreSQL**: Primary database for all data persistence.
- **Resend**: Email API for sending notifications.
- **Socket.io**: Real-time bidirectional event-based communication.
- **Drizzle ORM**: TypeScript ORM for interacting with PostgreSQL.
- **WooCommerce REST API**: Used for syncing product catalog data.
- **Replit Object Storage**: For storing image uploads via presigned URLs.
- **VAPID/Web-Push**: For sending browser push notifications to admin users.
- **OpenAI**: Powers intelligent AI responses using gpt-4o-mini.
