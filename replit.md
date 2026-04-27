# Cappta AI SaaS Platform

## Overview
Cappta AI is a SaaS platform providing AI-powered customer support chat widgets for businesses. It enables businesses to integrate customizable, AI-driven chat widgets into their websites, offering features like AI-powered responses, product catalog integration, real-time agent collaboration, and a knowledge base that learns from conversations. The platform aims to provide a premium customer support solution, inspired by leading AI services, and supports a multi-tenant architecture where each business operates with isolated data and configurations.

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application uses a React frontend with Tailwind CSS and Lucide React for UI, communicating with an Express backend. Real-time messaging is handled by Socket.io, and data persistence is managed with PostgreSQL via Drizzle ORM. Resend is used for email notifications.

**Key Architectural Decisions and Features:**

*   **Multi-Tenant Architecture**: Core tables include a `tenantId` for data isolation. Tenant configurations, including branding, widget appearance, and content (knowledge base, products), are dynamically loaded. Cache keys also incorporate `tenantId` to prevent data leaks.
*   **Authentication Systems**: Two distinct JWT-based authentication systems are implemented: one for admin panel agents and another for SaaS dashboard tenants, sharing the same `JWT_SECRET`.
*   **Dynamic Iframe Resizing**: The chat widget uses `postMessage` to communicate with parent sites (e.g., WordPress) for responsive iframe adjustments.
*   **Contextual User Experience**: Supports auto-authentication via URL parameters and detects page context for relevant auto-replies.
*   **Persistent Conversation History**: All messages and sessions are stored in PostgreSQL, allowing users to access their full conversation history.
*   **Hybrid Messaging**: Combines HTTP POST for sending messages (iframe compatibility) with Socket.io for real-time reception, including a polling fallback.
*   **Intelligent Auto-reply Engine**: A backend engine provides context-aware responses. For new tenants, it uses OpenAI's gpt-4o-mini with tenant-specific context, knowledge base, and product catalog. System prompts are dynamically generated for intelligent, adaptive responses.
*   **Deep Web Scraping**: An `analyze-url` endpoint crawls websites to extract detailed information (metadata, content, links) for populating knowledge bases.
*   **Price Extraction**: Logic extracts pricing data from web pages, distinguishing demo prices from actual product catalog prices.
*   **Business Hours System**: Configurable business hours that modify chat behavior during offline periods (e.g., replacing contact executive buttons with ticket links).
*   **Integrated Product Catalog**: Each tenant manages their own PostgreSQL-backed product catalog, queryable by the bot with fuzzy matching.
*   **Comprehensive Admin Panel**: A `/admin` panel for superadmins and a `/panel` tenant-specific panel for session management, chat viewing, knowledge base management, product management, and AI settings.
*   **Conversation Learning System**: An AI pipeline extracts knowledge from closed customer conversations to improve responses.
*   **Ambassador Referral System**: A dynamic referral program with tiered rewards, including monetary incentives and plan upgrades, based on active paid referrals.
*   **Image Uploads**: Images (logos, avatars, bot icons) are converted to base64 data URIs and stored directly in PostgreSQL text columns, avoiding external storage dependencies.
*   **SaaS Pages & Routing**: A structured routing system manages various pages including a marketing landing page, comparison pages, vertical-specific pages, interactive demo, registration/login, tenant dashboard, support panel, and guides.
*   **Plan Limit Enforcement**: Limits on sessions and messages are enforced per tenant plan, with appropriate feedback provided in the chat interface.
*   **WhatsApp Integration**: Integrates with Twilio WhatsApp Business API for multi-channel support, configurable per tenant with an optional add-on.
*   **Payment Integration**: Uses Mercado Pago Checkout Pro for payment processing, supporting various plans and add-ons. Webhooks handle plan upgrades upon successful payments.
*   **Cappta Connect**: A unified business hub for paid-plan tenants combining (a) Catálogo (existing product catalog), (b) Pagos en chat (chat_payment_links + Mercado Pago preference flow with cappta_chatlink_<tid>_<lid> external_reference webhook handling), (c) Citas (appointment_slots/appointments with public booking page at `/agenda/:slotId` supporting requiresPayment + auto payment-link creation), and (d) Reportes (consolidated stats: paid links amount, pending appointments, conversion). Public payment-link lookup is protected by a per-link random publicToken to prevent enumeration. Plan-gated: solo/basic/scale/pro/enterprise.

## External Dependencies
*   **PostgreSQL**: Primary database.
*   **Resend**: Email API.
*   **Socket.io**: Real-time communication.
*   **Drizzle ORM**: TypeScript ORM for PostgreSQL.
*   **OpenAI**: AI-powered responses (gpt-4o-mini).
*   **Mercado Pago**: Payment gateway (Checkout Pro).
*   **Twilio**: WhatsApp Business API.
*   **TikTok Pixel + Events API**: Tracking and server-side events.
*   **Helmet**: Express security middleware.
*   **VAPID/Web-Push**: For browser push notifications.