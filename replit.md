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
4. **Guest Form**: Welcome form (in Spanish) asking for email, problem type (dropdown), game/product name, and user name. Saves to localStorage with unique session ID
5. **Session-Based Privacy**: Each chat gets a unique session ID (generated client-side). Messages are stored/fetched by sessionId, not email. Email is only used for executive contact. This prevents users from seeing each other's chat history even if they enter the same email
6. **Hybrid Messaging**: HTTP POST for sending messages (iframe-compatible), Socket.io for real-time receiving, with 4s polling fallback
7. **Message Persistence**: All messages stored in PostgreSQL with session isolation, history loaded on reconnect within same session
8. **Contact Executive**: Button to request human contact, sends email notification via Resend to cjmdigitales@gmail.com with chat summary, page context, and pre-chat form data (problem type, game/product name)
9. **Auto-replies**: Intelligent keyword-based auto-reply system in Spanish with product knowledge (PS Plus, Game Pass, gift cards, specific games) and page context awareness
10. **Admin Panel** (`/admin`): Private admin page with session list, chat viewer, global search, status filters, tags, and canned responses management
11. **In-Chat Search**: Search bar within the chat window to filter messages within the current conversation, with text highlighting
12. **Conversation Status Management**: Sessions can be marked as 'active' or 'closed' (soft delete). Closed chats are hidden from inbox but accessible via filter. Auto-reopens when user sends new message.
13. **Slash Commands / Canned Responses**: Typing "/" in the message input shows a dropdown of predefined quick responses. Managed via admin panel CRUD.
14. **Session Tags**: Conversations can be tagged (Venta, Soporte, Urgente, etc.) for categorization in the admin panel.
15. **Offline Email Notifications**: When a support reply is sent and the user is disconnected (no active Socket.io connection), an email notification is sent to the user via Resend.

## Database Tables
- `messages` - Chat messages with sessionId, sender, content, timestamp
- `sessions` - Session metadata: status (active/closed), tags, problemType, gameName, lastMessageAt
- `canned_responses` - Quick reply shortcuts (shortcut + content) for slash commands
- `contact_requests` - Executive contact requests with chat summary

## Project Structure
- `shared/schema.ts` - Database schema (messages, sessions, canned_responses, contact_requests) and TypeScript types
- `server/routes.ts` - Socket.io setup, message handling, contact executive, auto-reply logic, admin API endpoints, offline detection
- `server/storage.ts` - Database CRUD operations (session queries, search, admin queries, canned responses)
- `server/db.ts` - Database connection pool
- `server/email.ts` - Resend email notification service (contact notification + offline notification)
- `server/seed.ts` - Demo data seeding (Spanish)
- `client/src/App.tsx` - Main app container with routing (/ = widget, /admin = admin panel)
- `client/src/pages/Admin.tsx` - Admin panel with session list, chat viewer, global search, status filters, tags, canned responses CRUD
- `client/src/components/Launcher.tsx` - Floating chat button
- `client/src/components/ChatWindow.tsx` - Chat messages area + input + in-chat search + slash commands + contact executive button
- `client/src/components/WelcomeForm.tsx` - Guest login form (Spanish)
- `client/src/hooks/use-chat.ts` - Chat state management hook with TanStack Query integration
- `client/src/lib/socket.ts` - Socket.io client configuration

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

## Public API Endpoints
- `GET /api/messages/session/:sessionId` - Get messages for a session
- `POST /api/messages` - Send a message (auto-creates/reopens session)
- `POST /api/contact-executive` - Request executive contact
- `GET /api/canned-responses` - Get canned responses (for slash commands)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key for email notifications
- `SESSION_SECRET` - Admin panel authentication key
- Notification email: cjmdigitales@gmail.com (configured in server/email.ts)

## Running
- `npm run dev` starts Express + Vite dev server on port 5000
- Socket.io runs on the same HTTP server
- CORS configured for `*` (any origin) for iframe compatibility

## WordPress Iframe Integration
Embed the widget with URL params:
```html
<iframe src="https://your-app.replit.app/?email=user@email.com&name=UserName&page_url=https://yoursite.com/page&page_title=Page Title" />
```
The widget sends postMessage events to the parent for resize:
```js
{ type: "open_chat", width: 390, height: 600 }
{ type: "close_chat", width: 70, height: 70 }
```

## Resend Setup Note
For production email delivery, you need to verify a domain in Resend. The free tier onboarding@resend.dev sender only delivers to the Resend account owner's email. To send to any email, add and verify your domain in Resend dashboard.
