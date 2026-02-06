# Chat Widget Application

## Overview
A stand-alone chat widget built with React + Vite (Frontend) and Express + Socket.io (Backend). Designed to be embedded in an iframe on a WordPress site. Communicates with the parent window via `postMessage` for dynamic resizing. All UI is in Spanish.

## Architecture
- **Frontend**: React, Tailwind CSS, Lucide React icons, Socket.io-client
- **Backend**: Express, Socket.io, Drizzle ORM, Resend (email)
- **Database**: PostgreSQL for message and contact request persistence
- **Theme**: Dark gaming aesthetic with neon purple (#6200EA) accents

## Key Features
1. **Widget States**: Launcher button (closed) + Chat window (open), with postMessage events (`open_chat`/`close_chat`) with dimensions for iframe resizing
2. **Auto-Authentication**: Reads `?email=` and `?name=` URL params for WordPress logged-in users
3. **Page Context Detection**: Reads `?page_url=` and `?page_title=` params, or receives page info via postMessage from parent, to provide contextual auto-replies
4. **Guest Form**: Welcome form (in Spanish) for visitors without URL params, saves to localStorage
5. **Hybrid Messaging**: HTTP POST for sending messages (iframe-compatible), Socket.io for real-time receiving, with 4s polling fallback
6. **Message Persistence**: All messages stored in PostgreSQL, history loaded on reconnect
7. **Contact Executive**: Button to request human contact, sends email notification via Resend to cjmdigitales@gmail.com with chat summary and page context
8. **Auto-replies**: Keyword-based auto-reply system in Spanish with page context awareness

## Project Structure
- `shared/schema.ts` - Database schema (messages + contact_requests tables) and TypeScript types
- `server/routes.ts` - Socket.io setup, message handling, contact executive, auto-reply logic
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection pool
- `server/email.ts` - Resend email notification service
- `server/seed.ts` - Demo data seeding (Spanish)
- `client/src/App.tsx` - Main widget container, iframe postMessage logic, QueryClient provider
- `client/src/components/Launcher.tsx` - Floating chat button
- `client/src/components/ChatWindow.tsx` - Chat messages area + input + contact executive button
- `client/src/components/WelcomeForm.tsx` - Guest login form (Spanish)
- `client/src/hooks/use-chat.ts` - Chat state management hook with TanStack Query integration
- `client/src/lib/socket.ts` - Socket.io client configuration

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key for email notifications
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
