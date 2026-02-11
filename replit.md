# Chat Widget Application

## Overview
This project is a standalone chat widget, integrating a React + Vite frontend with an Express + Socket.io backend. It's designed for seamless embedding within an iframe on WordPress sites, communicating with the parent window for dynamic resizing. The primary goal is to provide real-time customer support, automate responses, and facilitate agent interaction, enhancing user experience and streamlining support operations. The widget aims to improve customer engagement and operational efficiency for businesses.

## User Preferences
I want iterative development.
I prefer detailed explanations.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The application features a React frontend with Tailwind CSS for styling and Lucide React for icons, communicating with an Express backend utilizing Socket.io for real-time messaging. PostgreSQL is used for data persistence via Drizzle ORM, and Resend handles email notifications. The UI adopts a dark gaming aesthetic with neon purple accents.

Key architectural decisions and features include:
- **Dynamic Iframe Resizing**: The widget communicates with the parent WordPress site using `postMessage` for responsive iframe adjustments based on its open/closed state.
- **Contextual User Experience**: It supports auto-authentication via URL parameters (`email`, `name`) for logged-in users and detects page context (`page_url`, `page_title`) to provide relevant auto-replies.
- **Persistent Conversation History**: Messages and sessions are stored in PostgreSQL, allowing users to view their entire conversation history across multiple consultations.
- **Hybrid Messaging**: Combines HTTP POST for sending messages (iframe compatibility) with Socket.io for real-time message reception, including a 4-second polling fallback. Admin panel uses a separate socket connection with `role: "admin"` auth that bypasses user session requirements, enabling real-time message reception in the admin dashboard.
- **Intelligent Auto-reply Engine**: A sophisticated `autoReply.ts` engine in the backend provides context-aware responses, detects user intent, recognizes product/game names, avoids repetition, and escalates to human agents when necessary. When AI is enabled, ALL intents (except the first greeting) are routed through OpenAI gpt-4o-mini for fully personalized, contextual responses. The AI system prompt includes anti-generic-response rules, dialogue flow guidance, and strict formatting rules (no markdown, plain URLs only). Product search results are passed to AI as context so it can mention real prices and availability. AI responses are post-processed to strip any markdown formatting. The `extractProductKeywords()` function strips conversational prefixes/suffixes from user messages to extract product names for better catalog matching. AI can be toggled on/off globally via the admin panel Settings tab (stored in `app_settings` table, defaults to enabled).
- **Business Hours System**: Configurable business hours (default 12:00-21:00 Chile time) stored in `app_settings`. During offline hours, the chat continues to work normally (AI responds, catalog searches work) but "Contactar ejecutivo" buttons are automatically replaced with "Crear ticket de soporte" links to Zoho Desk. The AI system prompt is dynamically updated during offline hours to avoid suggesting agent contact and instead direct users to the ticket system. Hours, toggle, and ticket URL are all configurable via the admin Settings tab.
- **Integrated Product Catalog**: The bot can query a PostgreSQL-backed product catalog to include real-time prices, availability, and purchase URLs in its responses. Product search uses fuzzy matching via PostgreSQL pg_trgm trigram similarity to handle typos and misspellings (e.g., "mainkraft" → Minecraft, "espaiderman" → Spider-Man). Extensions pg_trgm and fuzzystrmatch are auto-enabled at startup. An admin panel manages this catalog.
- **Comprehensive Admin Panel**: Located at `/admin`, this panel offers session management, a chat viewer, global search, status filters, tags, canned responses, product catalog management, session agent badges, and agent type filters.
- **Admin-User Collaboration Tools**: Features include live chat takeover by admins, agent assignment/claiming, unique agent color differentiation in chat, and image uploads for both users and admins.
- **PWA for Admin Panel**: The admin interface is installable as a Progressive Web App, supporting offline access and push notifications.
- **Authentication and User Management**: Admin panel access is secured with JWT-based authentication. A superadmin role manages admin users, and agents can change their passwords.
- **Notification Systems**: Includes audio notifications for new sessions and browser push notifications for admins via VAPID/web-push when the app is backgrounded.
- **Conversation Learning System**: An AI-powered learning pipeline that extracts knowledge from closed customer conversations. When triggered from the admin panel, it analyzes completed chats using OpenAI to extract FAQ patterns, troubleshooting solutions, product info, and business policies. Extracted entries are stored in a `knowledge_base` table with pending/approved/rejected status. Admins can review, edit, approve, or reject entries from the "Conocimiento" tab. Approved entries are automatically searched (using pg_trgm similarity) when generating AI responses and injected into the system prompt as learned context, making the chatbot progressively smarter with each interaction.
- **Satisfaction Survey**: The bot prompts users for a 1-5 star rating and optional comments upon conversation resolution, with results visible in the admin panel.
- **Replit Object Storage**: Used for image uploads, leveraging presigned URLs for secure and efficient file handling.

## External Dependencies
- **PostgreSQL**: Primary database for storing messages, sessions, canned responses, contact requests, products, ratings, admin users, and push subscriptions.
- **Resend**: Email API for sending notifications, including executive contact requests and offline user replies.
- **Socket.io**: Real-time bidirectional event-based communication.
- **Drizzle ORM**: TypeScript ORM for interacting with PostgreSQL.
- **WooCommerce REST API**: Used for syncing product catalog data (consumer key/secret required).
- **Replit Object Storage**: For storing image uploads, accessed via presigned URLs.
- **VAPID/Web-Push**: For sending browser push notifications to admin users.
- **OpenAI**: Powers intelligent AI responses for complex/unknown queries using gpt-4o-mini. Uses `OPENAI_API_KEY` environment variable (user-provided).