// ============================================
// SecureChat - Global State Store (Zustand)
// ============================================

import { create } from 'zustand';
import { User, Conversation, Message, Call, AppView, AdminStats } from './types';

interface AppState {
  // View management
  currentView: AppView;
  setView: (view: AppView) => void;

  // Auth state
  currentUser: User | null;
  isAdmin: boolean;
  authToken: string | null;
  login: (user: User, isAdmin: boolean, token?: string) => void;
  logout: () => void;
  getToken: () => string | null;

  // Chat state
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  typingUsers: Map<string, Set<string>>;
  setTyping: (userId: string, conversationId: string) => void;
  clearTyping: (userId: string, conversationId: string) => void;

  // Call state
  activeCall: Call | null;
  incomingCall: Call | null;
  setActiveCall: (call: Call | null) => void;
  setIncomingCall: (call: Call | null) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  contactInfoOpen: boolean;
  setContactInfoOpen: (open: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;

  // Admin state
  adminStats: AdminStats | null;
  setAdminStats: (stats: AdminStats) => void;

  // Online users tracking
  onlineUsers: Set<string>;
  setOnlineUsers: (users: Set<string>) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;

  // Socket connection
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // View
  currentView: 'landing',
  setView: (view) => set({ currentView: view }),

  // Auth
  currentUser: null,
  isAdmin: false,
  authToken: null,
  login: (user, isAdmin, token) => {
    // Store session in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'securechat_session',
        JSON.stringify({ user, isAdmin, token: token || null, expiresAt: Date.now() + 86400000 })
      );
    }
    set({ currentUser: user, isAdmin, authToken: token || null });
  },
  getToken: () => {
    const state = get();
    if (state.authToken) return state.authToken;
    if (typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem('securechat_session');
        if (session) {
          const parsed = JSON.parse(session);
          return parsed.token || null;
        }
      } catch { /* ignore */ }
    }
    return null;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('securechat_session');
    }
    set({
      currentUser: null,
      isAdmin: false,
      authToken: null,
      activeConversation: null,
      messages: [],
      activeCall: null,
      incomingCall: null,
      conversations: [],
      currentView: 'landing',
    });
  },

  // Chat
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  activeConversation: null,
  setActiveConversation: (conversation) => {
    set({
      activeConversation: conversation,
      messages: [],
      contactInfoOpen: false,
    });
  },
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    const { messages, activeConversation } = get();
    if (activeConversation && message.conversationId === activeConversation.id) {
      set({ messages: [...messages, message] });
    }
    // Update conversation list
    const { conversations } = get();
    const updatedConversations = conversations.map(c => {
      if (c.id === message.conversationId) {
        return { ...c, lastMessage: message, updatedAt: message.createdAt, unreadCount: c.id === activeConversation?.id ? 0 : c.unreadCount + 1 };
      }
      return c;
    });
    set({ conversations: updatedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) });
  },
  typingUsers: new Map(),
  setTyping: (userId, conversationId) => {
    const { typingUsers } = get();
    const newMap = new Map(typingUsers);
    const convSet = new Set(newMap.get(conversationId) || []);
    convSet.add(userId);
    newMap.set(conversationId, convSet);
    set({ typingUsers: newMap });
  },
  clearTyping: (userId, conversationId) => {
    const { typingUsers } = get();
    const newMap = new Map(typingUsers);
    const convSet = new Set(newMap.get(conversationId) || []);
    convSet.delete(userId);
    if (convSet.size === 0) {
      newMap.delete(conversationId);
    } else {
      newMap.set(conversationId, convSet);
    }
    set({ typingUsers: newMap });
  },

  // Calls
  activeCall: null,
  incomingCall: null,
  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  contactInfoOpen: false,
  setContactInfoOpen: (open) => set({ contactInfoOpen: open }),
  showEmojiPicker: false,
  setShowEmojiPicker: (show) => set({ showEmojiPicker: show }),

  // Admin
  adminStats: null,
  setAdminStats: (stats) => set({ adminStats: stats }),

  // Online users
  onlineUsers: new Set(),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId) => {
    const { onlineUsers } = get();
    const newSet = new Set(onlineUsers);
    newSet.add(userId);
    set({ onlineUsers: newSet });
  },
  removeOnlineUser: (userId) => {
    const { onlineUsers } = get();
    const newSet = new Set(onlineUsers);
    newSet.delete(userId);
    set({ onlineUsers: newSet });
  },

  // Socket
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// ============================================
// Session Restoration
// ============================================
export function restoreSession(): { user: User; isAdmin: boolean; token: string | null } | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('securechat_session');
    if (!session) return null;
    const parsed = JSON.parse(session);
    if (parsed.expiresAt > Date.now()) {
      return { user: parsed.user, isAdmin: parsed.isAdmin, token: parsed.token || null };
    }
    localStorage.removeItem('securechat_session');
    return null;
  } catch {
    return null;
  }
}

// Helper to create auth headers for API calls
export function getAuthHeaders(): Record<string, string> {
  const token = useAppStore.getState().getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
