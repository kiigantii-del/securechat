// ============================================
// SecureChat - Mock Data for Sandbox Demo
// ============================================
// This provides in-memory mock data when Supabase is not configured.
// When Supabase is configured, this module is bypassed.

import { User, Conversation, Message, Call, AdminStats } from './types';

// ============================================
// Admin credentials (for demo)
// ============================================
export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'admin123';

// ============================================
// Demo Users
// ============================================
export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice Johnson',
    avatarUrl: null,
    role: 'user',
    status: 'online',
    bio: 'Hey there! I am using SecureChat.',
    lastSeen: new Date().toISOString(),
    createdAt: '2025-01-15T10:00:00Z',
    isDeleted: false,
  },
  {
    id: 'user-2',
    username: 'bob',
    displayName: 'Bob Smith',
    avatarUrl: null,
    role: 'user',
    status: 'online',
    bio: 'Available',
    lastSeen: new Date().toISOString(),
    createdAt: '2025-01-20T14:00:00Z',
    isDeleted: false,
  },
  {
    id: 'user-3',
    username: 'charlie',
    displayName: 'Charlie Davis',
    avatarUrl: null,
    role: 'user',
    status: 'away',
    bio: 'Working from home',
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2025-02-01T09:00:00Z',
    isDeleted: false,
  },
  {
    id: 'user-4',
    username: 'diana',
    displayName: 'Diana Wilson',
    avatarUrl: null,
    role: 'user',
    status: 'offline',
    bio: 'On vacation',
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2025-02-10T16:00:00Z',
    isDeleted: false,
  },
  {
    id: 'user-5',
    username: 'emma',
    displayName: 'Emma Thompson',
    avatarUrl: null,
    role: 'user',
    status: 'busy',
    bio: 'In a meeting',
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    createdAt: '2025-03-01T11:00:00Z',
    isDeleted: false,
  },
];

// Demo user passwords
export const MOCK_PASSWORDS: Record<string, string> = {
  alice: 'alice123',
  bob: 'bob123',
  charlie: 'charlie123',
  diana: 'diana123',
  emma: 'emma123',
};

// ============================================
// Demo Conversations
// ============================================
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: 'direct',
    name: null,
    avatarUrl: null,
    participants: [MOCK_USERS[0], MOCK_USERS[1]],
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: MOCK_USERS[1],
      content: 'Sure, let me check that out! 👍',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    unreadCount: 2,
    createdAt: '2025-01-20T15:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv-2',
    type: 'direct',
    name: null,
    avatarUrl: null,
    participants: [MOCK_USERS[0], MOCK_USERS[2]],
    lastMessage: {
      id: 'msg-5',
      conversationId: 'conv-2',
      senderId: 'user-3',
      sender: MOCK_USERS[2],
      content: 'Can we schedule a meeting for tomorrow?',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    unreadCount: 1,
    createdAt: '2025-02-05T10:00:00Z',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'conv-3',
    type: 'direct',
    name: null,
    avatarUrl: null,
    participants: [MOCK_USERS[0], MOCK_USERS[3]],
    lastMessage: {
      id: 'msg-8',
      conversationId: 'conv-3',
      senderId: 'user-1',
      sender: MOCK_USERS[0],
      content: 'Have a great vacation! 🏖️',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    unreadCount: 0,
    createdAt: '2025-02-15T12:00:00Z',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'conv-4',
    type: 'group',
    name: 'Project Team 🚀',
    avatarUrl: null,
    participants: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[4]],
    lastMessage: {
      id: 'msg-12',
      conversationId: 'conv-4',
      senderId: 'user-5',
      sender: MOCK_USERS[4],
      content: 'The deployment is complete! 🎉',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    unreadCount: 5,
    createdAt: '2025-03-01T09:00:00Z',
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// ============================================
// Demo Messages
// ============================================
export const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: MOCK_USERS[1],
      content: 'Hey Alice! How are you doing?',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'user-1',
      sender: MOCK_USERS[0],
      content: 'Hi Bob! I am great, thanks for asking! 😊',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 540000).toISOString(),
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: MOCK_USERS[1],
      content: 'Did you see the new project requirements?',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      senderId: 'user-1',
      sender: MOCK_USERS[0],
      content: 'Yes! They look really interesting. I especially like the real-time chat feature.',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    },
    {
      id: 'msg-1b',
      conversationId: 'conv-1',
      senderId: 'user-2',
      sender: MOCK_USERS[1],
      content: 'Sure, let me check that out! 👍',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
  ],
  'conv-2': [
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      senderId: 'user-3',
      sender: MOCK_USERS[2],
      content: 'Hi Alice, I have a question about the design specs.',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: 'user-1',
      sender: MOCK_USERS[0],
      content: 'Sure, what do you need to know?',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      senderId: 'user-3',
      sender: MOCK_USERS[2],
      content: 'Can we schedule a meeting for tomorrow?',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  'conv-3': [
    {
      id: 'msg-8',
      conversationId: 'conv-3',
      senderId: 'user-1',
      sender: MOCK_USERS[0],
      content: 'Have a great vacation! 🏖️',
      type: 'text',
      status: 'read',
      isDeleted: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  'conv-4': [
    {
      id: 'msg-9',
      conversationId: 'conv-4',
      senderId: 'user-1',
      sender: MOCK_USERS[0],
      content: 'Team, the sprint planning is tomorrow at 10 AM.',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'msg-10',
      conversationId: 'conv-4',
      senderId: 'user-2',
      sender: MOCK_USERS[1],
      content: 'I will prepare the sprint backlog.',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 'msg-11',
      conversationId: 'conv-4',
      senderId: 'user-3',
      sender: MOCK_USERS[2],
      content: 'I have some design updates to share too.',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 9000000).toISOString(),
    },
    {
      id: 'msg-12',
      conversationId: 'conv-4',
      senderId: 'user-5',
      sender: MOCK_USERS[4],
      content: 'The deployment is complete! 🎉',
      type: 'text',
      status: 'delivered',
      isDeleted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

// ============================================
// Demo Calls
// ============================================
export const MOCK_CALLS: Call[] = [
  {
    id: 'call-1',
    conversationId: 'conv-1',
    callerId: 'user-1',
    receiverId: 'user-2',
    caller: MOCK_USERS[0],
    receiver: MOCK_USERS[1],
    type: 'audio',
    status: 'ended',
    duration: 245,
    startedAt: new Date(Date.now() - 172800000).toISOString(),
    endedAt: new Date(Date.now() - 172795500).toISOString(),
  },
  {
    id: 'call-2',
    conversationId: 'conv-2',
    callerId: 'user-3',
    receiverId: 'user-1',
    caller: MOCK_USERS[2],
    receiver: MOCK_USERS[0],
    type: 'video',
    status: 'ended',
    duration: 1230,
    startedAt: new Date(Date.now() - 259200000).toISOString(),
    endedAt: new Date(Date.now() - 257970000).toISOString(),
  },
];

// ============================================
// Demo Stats
// ============================================
export const MOCK_STATS: AdminStats = {
  totalUsers: MOCK_USERS.length,
  activeUsers: MOCK_USERS.filter(u => u.status === 'online').length,
  totalMessages: Object.values(MOCK_MESSAGES).flat().length,
  totalCalls: MOCK_CALLS.length,
  totalConversations: MOCK_CONVERSATIONS.length,
  recentActivity: [
    {
      id: 'act-1',
      type: 'message_sent',
      description: 'Emma sent a message in Project Team',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userId: 'user-5',
    },
    {
      id: 'act-2',
      type: 'user_login',
      description: 'Alice logged in',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: 'user-1',
    },
    {
      id: 'act-3',
      type: 'call_made',
      description: 'Alice and Bob had an audio call (4m 5s)',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      userId: 'user-1',
    },
  ],
};

// ============================================
// In-memory store for demo (mutable)
// ============================================
class DemoStore {
  private users: Map<string, User>;
  private passwords: Map<string, string>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message[]>;
  private calls: Call[];

  constructor() {
    this.users = new Map(MOCK_USERS.map(u => [u.id, { ...u }]));
    this.passwords = new Map(Object.entries(MOCK_PASSWORDS));
    this.conversations = new Map(MOCK_CONVERSATIONS.map(c => [c.id, { ...c }]));
    this.messages = new Map(
      Object.entries(MOCK_MESSAGES).map(([k, v]) => [k, [...v]])
    );
    this.calls = [...MOCK_CALLS];
  }

  // Users
  getAllUsers(): User[] {
    return Array.from(this.users.values()).filter(u => !u.isDeleted);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(
      u => u.username === username && !u.isDeleted
    );
  }

  createUser(data: { username: string; displayName: string; password: string; bio?: string; avatarUrl?: string }): User {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl || null,
      role: 'user',
      status: 'offline',
      bio: data.bio || '',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    this.users.set(id, user);
    this.passwords.set(data.username, data.password);
    return user;
  }

  updateUser(id: string, data: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;
    user.isDeleted = true;
    user.status = 'offline';
    this.users.set(id, user);
    return true;
  }

  verifyUser(username: string, password: string): User | null {
    if (this.passwords.get(username) === password) {
      return this.getUserByUsername(username) || null;
    }
    return null;
  }

  // Conversations
  getConversationsForUser(userId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.participants.some(p => p.id === userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  createDirectConversation(user1Id: string, user2Id: string): Conversation {
    // Check if conversation already exists
    const existing = Array.from(this.conversations.values()).find(c => {
      if (c.type !== 'direct') return false;
      const ids = c.participants.map(p => p.id).sort();
      const newIds = [user1Id, user2Id].sort();
      return ids[0] === newIds[0] && ids[1] === newIds[1];
    });
    if (existing) return existing;

    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user1 = this.users.get(user1Id);
    const user2 = this.users.get(user2Id);
    const conv: Conversation = {
      id,
      type: 'direct',
      name: null,
      avatarUrl: null,
      participants: [user1!, user2!].filter(Boolean),
      lastMessage: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.conversations.set(id, conv);
    return conv;
  }

  // Messages
  getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  addMessage(message: Message): Message {
    const msgs = this.messages.get(message.conversationId) || [];
    msgs.push(message);
    this.messages.set(message.conversationId, msgs);

    // Update conversation
    const conv = this.conversations.get(message.conversationId);
    if (conv) {
      conv.lastMessage = message;
      conv.updatedAt = message.createdAt;
      this.conversations.set(message.conversationId, conv);
    }

    return message;
  }

  // Calls
  getCalls(): Call[] {
    return this.calls;
  }

  addCall(call: Call): Call {
    this.calls.push(call);
    return call;
  }

  // Stats
  getStats(): AdminStats {
    const users = this.getAllUsers();
    const allMessages = Array.from(this.messages.values()).flat();
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'online').length,
      totalMessages: allMessages.length,
      totalCalls: this.calls.length,
      totalConversations: this.conversations.size,
      recentActivity: MOCK_STATS.recentActivity,
    };
  }
}

// Singleton instance
let storeInstance: DemoStore | null = null;

export function getDemoStore(): DemoStore {
  if (!storeInstance) {
    storeInstance = new DemoStore();
  }
  return storeInstance;
}
