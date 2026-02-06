# Chat Widget Application

## Overview
A stand-alone chat widget built with React + Vite (Frontend) and Express + Socket.io (Backend). Designed to be embedded in an iframe on a WordPress site. Communicates with the parent window via `postMessage` for dynamic resizing.

## Architecture
- **Frontend**: React, Tailwind CSS, Lucide React icons, Socket.io-client
- **Backend**: Express, Socket.io, Drizzle ORM
- **Database**: PostgreSQL for message persistence
- **Theme**: Dark gaming aesthetic with neon purple (#6200EA) accents

## Key Features
1. **Widget States**: Launcher button (closed) + Chat window (open), with postMessage events (`open_chat`/`close_chat`) for iframe resizing
2. **Auto-Authentication**: Reads `?email=` and `?name=` URL params for WordPress logged-in users
3. **Guest Form**: Welcome form for visitors without URL params, saves to localStorage
4. **Real-time Chat**: Socket.io for bidirectional messaging
5. **Message Persistence**: All messages stored in PostgreSQL, history loaded on reconnect
6. **Auto-replies**: Basic keyword-based auto-reply system for demo purposes

## Project Structure
- `shared/schema.ts` - Database schema (messages table) and TypeScript types
- `server/routes.ts` - Socket.io setup, message handling, auto-reply logic
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection pool
- `server/seed.ts` - Demo data seeding
- `client/src/App.tsx` - Main widget container, iframe postMessage logic
- `client/src/components/Launcher.tsx` - Floating chat button
- `client/src/components/ChatWindow.tsx` - Chat messages area + input
- `client/src/components/WelcomeForm.tsx` - Guest login form
- `client/src/hooks/use-chat.ts` - Chat state management hook
- `client/src/lib/socket.ts` - Socket.io client configuration

## Running
- `npm run dev` starts Express + Vite dev server on port 5000
- Socket.io runs on the same HTTP server
- CORS configured for `*` (any origin) for iframe compatibility
