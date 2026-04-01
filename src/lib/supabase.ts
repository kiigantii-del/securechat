// ============================================
// SecureChat - Supabase Client Configuration
// ============================================
// This module provides a Supabase client for production use.
// Set environment variables to use Supabase:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[SecureChat] Supabase not configured. Using local fallback.');
    return null;
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabase;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[SecureChat] Supabase admin not configured.');
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdmin;
}

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

export default getSupabaseClient;

/*
  ============================================
  SUPABASE DATABASE SCHEMA (SQL)
  ============================================
  
  Run this SQL in your Supabase SQL Editor to set up the database:

  -- Enable Row Level Security
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

  -- Users table
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
    bio TEXT DEFAULT '',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Conversations table
  CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Conversation participants
  CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
  );

  -- Messages table
  CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'video', 'system', 'call')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Calls table
  CREATE TABLE IF NOT EXISTS calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('audio', 'video')),
    status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended', 'missed', 'rejected')),
    duration INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
  );

  -- Admin config
  CREATE TABLE IF NOT EXISTS admin_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
  CREATE INDEX IF NOT EXISTS idx_calls_conversation ON calls(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

  -- RLS Policies
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

  -- Profiles policies
  CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
  CREATE POLICY "Admin can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id::text OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

  -- Messages policies  
  CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );
  CREATE POLICY "Participants can insert messages" ON messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

  -- Default admin user (change password after first login!)
  INSERT INTO profiles (username, display_name, password_hash, role)
  VALUES ('admin', 'Administrator', '$2b$10$placeholder_hash_change_me', 'admin')
  ON CONFLICT (username) DO NOTHING;

  ============================================
*/
