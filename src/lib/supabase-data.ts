// ============================================
// SecureChat - Supabase Data Access Layer
// ============================================
// This module provides a unified data access interface.
// When Supabase is configured, it uses the real database.
// Otherwise, it falls back to the in-memory mock store.

import { isSupabaseConfigured, getSupabaseAdmin } from './supabase';
import { getDemoStore } from './mock-data';
import type {
  User,
  Conversation,
  Message,
  Call,
  AdminStats,
  CreateUserPayload,
} from './types';
import { createToken } from './auth-utils';

// ============================================
// Row-to-Type Mappers
// ============================================

interface DbRow {
  [key: string]: unknown;
}

function rowToUser(row: DbRow): User {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) || null,
    role: (row.role as User['role']) || 'user',
    status: (row.status as User['status']) || 'offline',
    bio: (row.bio as string) || '',
    lastSeen: row.last_seen ? new Date(row.last_seen as string).toISOString() : new Date().toISOString(),
    createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : new Date().toISOString(),
    isDeleted: (row.is_deleted as boolean) || false,
  };
}

function rowToMessage(row: DbRow, sender?: User): Message {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    content: row.content as string,
    type: (row.type as Message['type']) || 'text',
    status: (row.status as Message['status']) || 'sent',
    replyToId: (row.reply_to_id as string) || undefined,
    isDeleted: (row.is_deleted as boolean) || false,
    createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : new Date().toISOString(),
    sender: sender || undefined,
  };
}

function rowToCall(row: DbRow, caller?: User, receiver?: User): Call {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    callerId: row.caller_id as string,
    receiverId: row.receiver_id as string,
    type: (row.type as Call['type']) || 'audio',
    status: (row.status as Call['status']) || 'ringing',
    duration: (row.duration as number) || 0,
    startedAt: row.started_at ? new Date(row.started_at as string).toISOString() : new Date().toISOString(),
    endedAt: row.ended_at ? new Date(row.ended_at as string).toISOString() : null,
    caller: caller || undefined,
    receiver: receiver || undefined,
  };
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// ============================================
// AUTH
// ============================================

interface LoginResult {
  user: User;
  token: string;
}

async function loginUser(
  username: string,
  password: string,
  role: 'admin' | 'user'
): Promise<LoginResult | null> {
  if (role === 'admin') {
    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
      // Try to find the admin user in the database first
      if (isSupabaseConfigured()) {
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data } = await admin
            .from('profiles')
            .select('*')
            .eq('username', adminUsername)
            .eq('role', 'admin')
            .single();

          if (data) {
            const user = rowToUser(data);
            const token = createToken(user.id, 'admin');
            return { user, token };
          }
        }
      }

      // Fallback: create a local admin user object
      const adminUser: User = {
        id: 'admin-1',
        username: adminUsername,
        displayName: 'Administrator',
        avatarUrl: null,
        role: 'admin',
        status: 'online',
        bio: 'System Administrator',
        lastSeen: new Date().toISOString(),
        createdAt: '2025-01-01T00:00:00Z',
        isDeleted: false,
      };
      const token = createToken(adminUser.id, 'admin');
      return { user: adminUser, token };
    }
    return null;
  }

  // User login
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_deleted', false)
        .single();

      if (error || !data) return null;

      // Plain text comparison
      if (data.password_hash !== password) return null;

      // Update status to online
      await supabase
        .from('profiles')
        .update({
          status: 'online',
          last_seen: new Date().toISOString(),
        })
        .eq('id', data.id);

      const user = rowToUser({ ...data, status: 'online', last_seen: new Date().toISOString() });
      const token = createToken(user.id, 'user');
      return { user, token };
    }
  }

  // Fallback to mock store
  const store = getDemoStore();
  const user = store.verifyUser(username, password);
  if (user) {
    store.updateUser(user.id, { status: 'online', lastSeen: new Date().toISOString() });
    const updatedUser = store.getUserById(user.id);
    const token = createToken(user.id, 'user');
    return { user: updatedUser!, token };
  }
  return null;
}

// ============================================
// USERS
// ============================================

async function getAllUsers(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[supabase-data] getAllUsers error:', error);
        return [];
      }
      return (data || []).map(rowToUser);
    }
  }

  return getDemoStore().getAllUsers();
}

async function getUserById(id: string): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return rowToUser(data);
    }
  }

  return getDemoStore().getUserById(id) || null;
}

async function getUserByUsername(username: string): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_deleted', false)
        .single();

      if (error || !data) return null;
      return rowToUser(data);
    }
  }

  return getDemoStore().getUserByUsername(username) || null;
}

async function createUser(data: CreateUserPayload): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const row = {
        username: data.username,
        display_name: data.displayName,
        password_hash: data.password,
        avatar_url: data.avatarUrl || null,
        role: 'user',
        status: 'offline',
        bio: data.bio || '',
      };

      const { data: inserted, error } = await supabase
        .from('profiles')
        .insert(row)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return rowToUser(inserted);
    }
  }

  return getDemoStore().createUser(data);
}

async function updateUser(
  id: string,
  data: Partial<User>
): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // Map camelCase to snake_case for Supabase
      const updateRow: DbRow = {};
      for (const [key, value] of Object.entries(data)) {
        if (
          key !== 'id' &&
          key !== 'role' &&
          key !== 'isDeleted' &&
          key !== 'createdAt'
        ) {
          updateRow[camelToSnake(key)] = value;
        }
      }

      if (Object.keys(updateRow).length === 0) {
        return getUserById(id);
      }

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(updateRow)
        .eq('id', id)
        .select()
        .single();

      if (error || !updated) return null;
      return rowToUser(updated);
    }
  }

  return getDemoStore().updateUser(id, data) || null;
}

async function deleteUser(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_deleted: true, status: 'offline' })
        .eq('id', id);

      if (error) {
        console.error('[supabase-data] deleteUser error:', error);
        return false;
      }
      return true;
    }
  }

  return getDemoStore().deleteUser(id);
}

async function getUserConversations(userId: string): Promise<Conversation[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // Step 1: Get conversation IDs for this user
      const { data: participants, error: pError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId);

      if (pError || !participants || participants.length === 0) return [];

      const conversationIds = participants.map(p => p.conversation_id);

      // Step 2: Get conversation details
      const { data: conversations, error: cError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (cError || !conversations) return [];

      // Step 3: For each conversation, get participants, last message, unread count
      const result: Conversation[] = [];

      for (const conv of conversations) {
        // Get participants
        const { data: convParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id, last_read_at')
          .eq('conversation_id', conv.id);

        const participantIds = convParticipants
          ? convParticipants.map(p => p.user_id)
          : [];

        // Get participant user profiles
        let participantsUsers: User[] = [];
        if (participantIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', participantIds);

          if (profiles) {
            participantsUsers = profiles.map(rowToUser);
          }
        }

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1);

        let lastMessage: Message | null = null;
        if (lastMessages && lastMessages.length > 0) {
          // Get sender for the last message
          const senderRow = lastMessages[0];
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', senderRow.sender_id)
            .single();
          const sender = senderProfile ? rowToUser(senderProfile) : undefined;
          lastMessage = rowToMessage(senderRow, sender);
        }

        // Count unread messages (messages created after user's last_read_at)
        const userParticipant = convParticipants?.find(p => p.user_id === userId);
        const lastReadAt = userParticipant?.last_read_at || null;

        let unreadCount = 0;
        if (lastReadAt) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .neq('sender_id', userId)
            .gt('created_at', lastReadAt);

          unreadCount = count || 0;
        } else {
          // If never read, count all non-self messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .neq('sender_id', userId);

          unreadCount = count || 0;
        }

        result.push({
          id: conv.id,
          type: (conv.type as Conversation['type']) || 'direct',
          name: (conv.name as string) || null,
          avatarUrl: (conv.avatar_url as string) || null,
          participants: participantsUsers,
          lastMessage,
          unreadCount,
          createdAt: conv.created_at
            ? new Date(conv.created_at as string).toISOString()
            : new Date().toISOString(),
          updatedAt: conv.updated_at
            ? new Date(conv.updated_at as string).toISOString()
            : new Date().toISOString(),
        });
      }

      return result;
    }
  }

  return getDemoStore().getConversationsForUser(userId);
}

// ============================================
// CONVERSATIONS
// ============================================

async function createDirectConversation(
  user1Id: string,
  user2Id: string
): Promise<Conversation | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // Check if a direct conversation already exists between these two users
      const { data: user1Convs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user1Id);

      if (user1Convs && user1Convs.length > 0) {
        const convIds = user1Convs.map(c => c.conversation_id);

        const { data: user2Convs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user2Id)
          .in('conversation_id', convIds);

        if (user2Convs && user2Convs.length > 0) {
          // Check if any of these are direct conversations
          const { data: directConvs } = await supabase
            .from('conversations')
            .select('id, type')
            .in('id', user2Convs.map(c => c.conversation_id))
            .eq('type', 'direct');

          if (directConvs && directConvs.length > 0) {
            // Existing direct conversation found - return it
            return getUserConversations(user1Id).then(convs =>
              convs.find(c => c.id === directConvs[0].id) || null
            );
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (convError || !newConv) {
        console.error('[supabase-data] createConversation error:', convError);
        return null;
      }

      // Add both participants
      const { error: pError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user1Id },
          { conversation_id: newConv.id, user_id: user2Id },
        ]);

      if (pError) {
        console.error('[supabase-data] addParticipants error:', pError);
        return null;
      }

      // Return the full conversation with participants
      const conversations = await getUserConversations(user1Id);
      return conversations.find(c => c.id === newConv.id) || null;
    }
  }

  return getDemoStore().createDirectConversation(user1Id, user2Id);
}

// ============================================
// MESSAGES
// ============================================

async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // Get messages with sender info via a join-like approach
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[supabase-data] getConversationMessages error:', error);
        return [];
      }

      if (!messages || messages.length === 0) return [];

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(m => m.sender_id))];

      // Fetch all sender profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);

      const profileMap = new Map<string, User>();
      if (profiles) {
        profiles.forEach(p => profileMap.set(p.id, rowToUser(p)));
      }

      return messages.map(m => {
        const sender = profileMap.get(m.sender_id);
        return rowToMessage(m, sender);
      });
    }
  }

  const store = getDemoStore();
  const msgs = store.getMessages(conversationId);
  return msgs
    .filter(m => !m.isDeleted)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(m => ({
      ...m,
      sender: store.getUserById(m.senderId) || undefined,
    }));
}

async function createMessage(data: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  replyToId?: string;
}): Promise<Message | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const row: DbRow = {
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        content: data.content,
        type: data.type || 'text',
        status: 'sent',
        reply_to_id: data.replyToId || null,
      };

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('[supabase-data] createMessage error:', error);
        return null;
      }

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.conversationId);

      // Get sender info
      const { data: sender } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.senderId)
        .single();

      return rowToMessage(inserted, sender ? rowToUser(sender) : undefined);
    }
  }

  // Fallback to mock store
  const store = getDemoStore();
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  let replyTo: Message | undefined;
  if (data.replyToId) {
    const allMessages = store.getMessages(data.conversationId);
    const repliedMessage = allMessages.find(m => m.id === data.replyToId);
    if (repliedMessage) replyTo = repliedMessage;
  }

  const message: Message = {
    id: messageId,
    conversationId: data.conversationId,
    senderId: data.senderId,
    content: data.content,
    type: (data.type as Message['type']) || 'text',
    status: 'sent',
    replyToId: data.replyToId || undefined,
    replyTo,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  };

  const storedMessage = store.addMessage(message);
  const sender = store.getUserById(data.senderId);
  return { ...storedMessage, sender: sender || undefined };
}

// ============================================
// STATS
// ============================================

async function getAdminStats(): Promise<AdminStats> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // Run count queries in parallel
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalMessages },
        { count: totalCalls },
        { count: totalConversations },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)
          .eq('status', 'online'),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false),
        supabase
          .from('calls')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true }),
      ]);

      // Get recent activity (last 20 messages ordered by created_at desc)
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivity = (recentMessages || []).map(m => ({
        id: m.id,
        type: 'message_sent' as const,
        description: `Message sent: ${(m.content as string).substring(0, 50)}${(m.content as string).length > 50 ? '...' : ''}`,
        timestamp: m.created_at ? new Date(m.created_at as string).toISOString() : new Date().toISOString(),
        userId: m.sender_id as string,
      }));

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalMessages: totalMessages || 0,
        totalCalls: totalCalls || 0,
        totalConversations: totalConversations || 0,
        recentActivity,
      };
    }
  }

  return getDemoStore().getStats();
}

// ============================================
// CALLS
// ============================================

async function createCall(data: {
  conversationId: string;
  callerId: string;
  receiverId: string;
  type: 'audio' | 'video';
}): Promise<Call | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const row = {
        conversation_id: data.conversationId,
        caller_id: data.callerId,
        receiver_id: data.receiverId,
        type: data.type,
        status: 'ringing',
      };

      const { data: inserted, error } = await supabase
        .from('calls')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('[supabase-data] createCall error:', error);
        return null;
      }

      // Fetch caller and receiver profiles
      const [callerResult, receiverResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.callerId).single(),
        supabase.from('profiles').select('*').eq('id', data.receiverId).single(),
      ]);

      const caller = callerResult.data ? rowToUser(callerResult.data) : undefined;
      const receiver = receiverResult.data ? rowToUser(receiverResult.data) : undefined;

      return rowToCall(inserted, caller, receiver);
    }
  }

  // Fallback to mock store
  const store = getDemoStore();
  const caller = store.getUserById(data.callerId);
  const receiver = store.getUserById(data.receiverId);

  const call: Call = {
    id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId: data.conversationId,
    callerId: data.callerId,
    receiverId: data.receiverId,
    caller: caller || undefined,
    receiver: receiver || undefined,
    type: data.type,
    status: 'ringing',
    duration: 0,
    startedAt: new Date().toISOString(),
    endedAt: null,
  };

  return store.addCall(call);
}

// ============================================
// Exports
// ============================================

export {
  loginUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  getUserConversations,
  createDirectConversation,
  getConversationMessages,
  createMessage,
  getAdminStats,
  createCall,
};
