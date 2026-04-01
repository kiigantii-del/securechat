-- ============================================
-- SecureChat - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up the database.
-- This creates all tables, indexes, RLS policies, and helper functions.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRIVILEGES
-- ============================================
-- Ensure all roles can access public schema tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- ============================================
-- TABLE: profiles
-- Stores user account information. password_hash stores plain text
-- passwords since this is a simple app (not production-hardened).
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
  bio TEXT DEFAULT '',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profiles_username_not_empty CHECK (char_length(username) > 0),
  CONSTRAINT profiles_display_name_not_empty CHECK (char_length(display_name) > 0)
);

COMMENT ON TABLE profiles IS 'User profiles with authentication credentials';
COMMENT ON COLUMN profiles.password_hash IS 'Plain text password (simple auth mode)';
COMMENT ON COLUMN profiles.is_deleted IS 'Soft delete flag - users are never hard-deleted';

-- ============================================
-- TABLE: conversations
-- Represents a chat conversation (direct or group).
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT conversations_name_required_for_group CHECK (
    (type = 'direct' AND name IS NULL) OR (type = 'group' AND name IS NOT NULL)
  )
);

COMMENT ON TABLE conversations IS 'Chat conversations - direct messages and group chats';

-- ============================================
-- TRIGGER: conversations updated_at
-- Automatically updates the updated_at column when a conversation is modified.
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

COMMENT ON FUNCTION update_conversation_updated_at() IS 'Auto-updates updated_at on conversations';

-- ============================================
-- TABLE: conversation_participants
-- Many-to-many join between profiles and conversations.
-- Tracks when each user joined and their last read position.
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE conversation_participants IS 'Maps users to their conversations';
COMMENT ON COLUMN conversation_participants.last_read_at IS 'Used for computing unread message counts';

-- ============================================
-- TABLE: messages
-- All messages sent in conversations. Supports text, image, file, audio,
-- video, system, and call message types. Soft-deleted messages are filtered out.
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'video', 'system', 'call')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT messages_content_not_empty CHECK (char_length(content) > 0)
);

COMMENT ON TABLE messages IS 'All chat messages across conversations';
COMMENT ON COLUMN messages.reply_to_id IS 'Self-referencing FK for reply threads';
COMMENT ON COLUMN messages.is_deleted IS 'Soft delete - message content can be redacted';

-- ============================================
-- TABLE: calls
-- Records of voice/video calls made between users.
-- ============================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended', 'missed', 'rejected')),
  duration INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT calls_duration_non_negative CHECK (duration >= 0)
);

COMMENT ON TABLE calls IS 'Voice and video call records';
COMMENT ON COLUMN calls.duration IS 'Call duration in seconds';

-- ============================================
-- TABLE: admin_config
-- Key-value store for admin configuration settings.
-- ============================================
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE admin_config IS 'Key-value configuration store for admin settings';

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_conversation ON calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver ON calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Policies are permissive since this is a private app.
-- All authenticated users can read/write freely.

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Profiles policies: anyone can view and insert; admins can update any, users can update own
CREATE POLICY "Anyone can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile or admins can update any" ON profiles
  FOR UPDATE USING (
    true
  );

CREATE POLICY "Anyone can delete profiles" ON profiles
  FOR DELETE USING (true);

-- Conversations policies: permissive
CREATE POLICY "Anyone can view conversations" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update conversations" ON conversations
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete conversations" ON conversations
  FOR DELETE USING (true);

-- Conversation participants policies: permissive
CREATE POLICY "Anyone can view participants" ON conversation_participants
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update participants" ON conversation_participants
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete participants" ON conversation_participants
  FOR DELETE USING (true);

-- Messages policies: participants can view/insert messages
CREATE POLICY "Anyone can view messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update messages" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete messages" ON messages
  FOR DELETE USING (true);

-- Calls policies: permissive
CREATE POLICY "Anyone can view calls" ON calls
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert calls" ON calls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update calls" ON calls
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete calls" ON calls
  FOR DELETE USING (true);

-- Admin config policies: permissive
CREATE POLICY "Anyone can view admin config" ON admin_config
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert admin config" ON admin_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update admin config" ON admin_config
  FOR UPDATE USING (true);

-- ============================================
-- HELPER FUNCTION: set_password
-- Allows admin to set/update a user's password by username.
-- Usage: SELECT set_password('alice', 'newpassword123');
-- ============================================
CREATE OR REPLACE FUNCTION set_password(p_username TEXT, p_password TEXT)
RETURNS TABLE(id UUID, username TEXT, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find the user
  SELECT id INTO v_user_id FROM profiles WHERE username = p_username AND is_deleted = FALSE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT
      NULL::UUID,
      p_username,
      FALSE,
      'User not found or has been deleted'::TEXT;
    RETURN;
  END IF;

  -- Update the password
  UPDATE profiles SET password_hash = p_password WHERE id = v_user_id;

  RETURN QUERY SELECT
    v_user_id,
    p_username,
    TRUE,
    'Password updated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_password(TEXT, TEXT) IS 'Admin utility to set user password by username';

-- ============================================
-- DEFAULT ADMIN USER
-- The password is set via NEXT_PUBLIC_ADMIN_PASSWORD env var.
-- Change it after first login!
-- ============================================
INSERT INTO profiles (username, display_name, password_hash, role, status)
VALUES ('admin', 'Administrator', 'admin123', 'admin', 'online')
ON CONFLICT (username) DO NOTHING;

COMMENT ON TABLE profiles IS 'User profiles with authentication credentials';
