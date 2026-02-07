# Chat Widget Application

## Overview
A stand-alone chat widget built with React + Vite (Frontend) and Express + Socket.io (Backend). Designed to be embedded in an iframe on a WordPress site. Communicates with the parent window via `postMessage` for dynamic resizing. All UI is in Spanish.

## Architecture
- **Frontend**: React, Tailwind CSS, Lucide React icons, Socket.io-client
- **Backend**: Express, Socket.io, Drizzle ORM, Resend (email)
- **Database**: PostgreSQL for message, session, canned response, and contact request persistence
- **Theme**: Dark gaming aesthetic with neon purple (#6200EA) accents

## Key Features
1. **Widget States**: Launcher button (closed) + Chat window (open), with postMessage events (`open_chat`/`close_chat`) with dimensions for iframe resizing
2. **Auto-Authentication**: Reads `?email=` and `?name=` URL params for WordPress logged-in users
3. **Page Context Detection**: Reads `?page_url=` and `?page_title=` params, or receives page info via postMessage from parent, to provide contextual auto-replies
4. **Guest Form**: Welcome form (in Spanish) asking for email, problem type (dropdown), game/product name (searchable dropdown with live product search from catalog), and user name. Saves to localStorage with unique session ID
5. **Session-Based Privacy**: Each chat gets a unique session ID (generated client-side). Messages are stored/fetched by sessionId, not email. Email is only used for executive contact. This prevents users from seeing each other's chat history even if they enter the same email
6. **Hybrid Messaging**: HTTP POST for sending messages (iframe-compatible), Socket.io for real-time receiving, with 4s polling fallback
7. **Message Persistence**: All messages stored in PostgreSQL with session isolation, history loaded on reconnect within same session
8. **Contact Executive**: Button to request human contact, sends email notification via Resend to cjmdigitales@gmail.com with chat summary, page context, and pre-chat form data (problem type, game/product name)
9. **Smart Auto-replies**: Intelligent context-aware auto-reply engine (`server/autoReply.ts`) with conversation memory, intent detection (12 intent types), game/product name recognition (20+ titles including EA FC, GTA, COD, Spider-Man, etc.), no-repetition system, smart escalation to human agents after unresolved exchanges, and **consultation-type-adaptive greetings** (compra→shopping focus, entrega→delivery empathy, devolucion→executive redirect, problema_cuenta→support focus, info_producto→product info, precio→price display)
10. **Product Catalog**: Database-backed product catalog that the bot queries to include real prices, availability, and purchase URLs in responses. Managed via admin panel "Productos" tab. Purchase flow tracks stages (inquiry→confirmed→link) to avoid looping.
11. **Admin Panel** (`/admin`): Private admin page with session list, chat viewer, global search, status filters, tags, canned responses management, and product catalog management
12. **In-Chat Search**: Search bar within the chat window to filter messages within the current conversation, with text highlighting
13. **Conversation Status Management**: Sessions can be marked as 'active' or 'closed' (soft delete). Closed chats are hidden from inbox but accessible via filter. Auto-reopens when user sends new message.
14. **Slash Commands / Canned Responses**: Typing "/" in the message input shows a dropdown of predefined quick responses. Managed via admin panel CRUD.
15. **Session Tags**: Conversations can be tagged (Venta, Soporte, Urgente, etc.) for categorization in the admin panel.
16. **Offline Email Notifications**: When a support reply is sent and the user is disconnected (no active Socket.io connection), an email notification is sent to the user via Resend.
17. **Admin Live Chat Takeover**: Admin can click "Entrar al Chat" to take over a conversation. Bot auto-replies are paused, admin gets a reply input to respond directly. User receives a notification message. Admin can click "Salir del Chat" to return control to the bot. Messages auto-refresh every 3s when admin is active.
18. **Image Uploads**: Both users and admins can send images in chat. Images are uploaded to Replit Object Storage via presigned URL flow. Messages with images display inline with clickable previews. Image-only messages skip auto-reply. Max file size: 5MB.
19. **In-Chat Product Browser**: ShoppingBag button in chat input opens a floating product catalog overlay with search. Users can browse/search products and click to send a product inquiry directly in the conversation.

## Database Tables
- `messages` - Chat messages with sessionId, sender, content, imageUrl (optional), timestamp
- `sessions` - Session metadata: status (active/closed), tags, problemType, gameName, adminActive, lastMessageAt
- `canned_responses` - Quick reply shortcuts (shortcut + content) for slash commands
- `contact_requests` - Executive contact requests with chat summary
- `products` - Product catalog: name, searchAliases, platform, price, productUrl, imageUrl, availability, description, category, wcProductId (WooCommerce ID), wcLastSync (last sync timestamp)

## Project Structure
- `shared/schema.ts` - Database schema (messages, sessions, canned_responses, contact_requests) and TypeScript types
- `server/autoReply.ts` - Smart auto-reply engine with conversation memory, intent detection, product/game recognition, no-repetition, and escalation
- `server/routes.ts` - Socket.io setup, message handling, contact executive, admin API endpoints, offline detection
- `server/storage.ts` - Database CRUD operations (session queries, search, admin queries, canned responses)
- `server/db.ts` - Database connection pool
- `server/email.ts` - Resend email notification service (contact notification + offline notification)
- `server/woocommerce.ts` - WooCommerce REST API sync service (auto-sync on startup, manual sync via admin)
- `server/seed.ts` - Demo data seeding (Spanish)
- `client/src/App.tsx` - Main app container with routing (/ = widget, /admin = admin panel)
- `client/src/pages/Admin.tsx` - Admin panel with session list, chat viewer, global search, status filters, tags, canned responses CRUD
- `client/src/components/Launcher.tsx` - Floating chat button
- `client/src/components/ChatWindow.tsx` - Chat messages area + input + in-chat search + slash commands + contact executive button + image upload
- `client/src/components/WelcomeForm.tsx` - Guest login form (Spanish)
- `client/src/hooks/use-chat.ts` - Chat state management hook with TanStack Query integration
- `client/src/hooks/use-upload.ts` - Presigned URL upload hook for object storage
- `client/src/lib/socket.ts` - Socket.io client configuration
- `server/replit_integrations/object_storage/` - Object storage service, routes (presigned URLs), ACL

## Admin API Endpoints (all require x-admin-key header = SESSION_SECRET)
- `GET /api/admin/sessions?status=active|closed|all` - List sessions with filters
- `GET /api/admin/sessions/:sessionId/messages` - Get full message history
- `PATCH /api/admin/sessions/:sessionId/status` - Update session status (active/closed)
- `PATCH /api/admin/sessions/:sessionId/tags` - Update session tags
- `GET /api/admin/search?q=query` - Search across all messages
- `GET /api/admin/contact-requests` - List executive contact requests
- `GET /api/admin/canned-responses` - List all canned responses
- `POST /api/admin/canned-responses` - Create canned response
- `PATCH /api/admin/canned-responses/:id` - Update canned response
- `DELETE /api/admin/canned-responses/:id` - Delete canned response
- `PATCH /api/admin/sessions/:sessionId/admin-active` - Toggle admin takeover (sends notification to user)
- `POST /api/admin/sessions/:sessionId/reply` - Send admin reply message to user
- `GET /api/admin/products` - List all products in catalog
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/wc/status` - WooCommerce sync status (configured, counts, last sync)
- `POST /api/admin/wc/sync` - Trigger manual WooCommerce product sync

## Public API Endpoints
- `GET /api/messages/session/:sessionId` - Get messages for a session
- `POST /api/messages` - Send a message (auto-creates/reopens session)
- `POST /api/contact-executive` - Request executive contact
- `GET /api/canned-responses` - Get canned responses (for slash commands)
- `GET /api/products/search?q=query` - Search products by name/aliases (used by auto-reply)
- `GET /api/products/browse?q=search&category=game&platform=ps5&limit=50&offset=0` - Browse all products with optional filters (used by product selector)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key for email notifications
- `SESSION_SECRET` - Admin panel authentication key
- `WC_CONSUMER_KEY` - WooCommerce REST API consumer key
- `WC_CONSUMER_SECRET` - WooCommerce REST API consumer secret
- `WC_STORE_URL` - WordPress/WooCommerce store URL (env var, default: https://cjmdigitales.com)
- Notification email: cjmdigitales@gmail.com (configured in server/email.ts)

## Running
- `npm run dev` starts Express + Vite dev server on port 5000
- Socket.io runs on the same HTTP server
- CORS configured for `*` (any origin) for iframe compatibility

## WordPress Iframe Integration
Embed the widget with URL params:
```html
<iframe src="https://your-app.replit.app/?email=user@email.com&name=UserName&page_url=https://yoursite.com/page&page_title=Page Title&product_name=EA Sports FC 26&product_price=$29.99 USD&product_url=https://yoursite.com/product/fc-26&product_image=https://yoursite.com/img/fc26.jpg" />
```
Product-specific params (optional, for product pages):
- `product_name` - Name of the product on the current page
- `product_price` - Price of the product
- `product_url` - Direct link to buy the product
- `product_image` - Product image URL
The widget sends postMessage events to the parent for resize:
```js
{ type: "open_chat", width: 390, height: 600 }
{ type: "close_chat", width: 70, height: 70 }
```

## Resend Setup Note
For production email delivery, you need to verify a domain in Resend. The free tier onboarding@resend.dev sender only delivers to the Resend account owner's email. To send to any email, add and verify your domain in Resend dashboard.
