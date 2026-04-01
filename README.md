# SecureChat

A secure, private WhatsApp-like communication web app with real-time messaging, voice/video calls, and admin portal. No phone number or registration required - admin-managed user accounts.

## Features

- **End-to-End Encrypted Messaging** - Real-time text, image, and file sharing
- **Voice & Video Calls** - WebRTC-powered with mute, speaker, and video toggles
- **Admin Portal** - User management, dashboard analytics, and settings
- **PWA Support** - Install as a native app on any device
- **Supabase Backend** - Scalable cloud database with Row Level Security
- **Dark/Light Theme** - Automatic theme switching
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Socket.io (real-time), WebRTC (calls)
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand (client), TanStack Query (server)
- **Deployment**: Vercel

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Go to Project Settings > API to get your keys

### 2. Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_ADMIN_USERNAME` (your admin username)
   - `NEXT_PUBLIC_ADMIN_PASSWORD` (your admin password)
4. Deploy

### 3. First Login

1. Go to your Vercel URL
2. Click "Admin Portal"
3. Sign in with the admin credentials you set
4. Add users from the admin panel
5. Users can sign in at the main URL

## Project Structure

```
src/
  app/
    page.tsx                    # Main view router
    layout.tsx                  # PWA + theme provider
    api/auth/route.ts           # Login API
    api/users/route.ts          # User CRUD API
    api/conversations/route.ts  # Conversations API
    api/messages/route.ts       # Messages API
    api/stats/route.ts          # Dashboard stats API
  components/
    landing-page.tsx            # Hero page
    auth/user-login.tsx         # User login
    admin/                      # Admin portal components
    chat/                       # Chat interface components
    common/                     # Shared components (PWA)
  lib/
    types.ts                    # TypeScript types
    store.ts                    # Zustand state management
    supabase.ts                 # Supabase client config
    supabase-data.ts            # Supabase data access layer
    socket.ts                   # Socket.io client
    auth-utils.ts               # Token utilities
mini-services/chat-service/     # Socket.io real-time service
supabase/migrations/            # Database migration files
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_ADMIN_USERNAME` | Yes | Admin username |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Yes | Admin password |

## Security Notes

- All API routes require authentication tokens
- Admin routes require admin role verification
- Users can only access their own conversations and messages
- Supabase Row Level Security (RLS) enabled on all tables
- Passwords should be changed from defaults immediately

## License

MIT
