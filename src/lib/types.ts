// ============================================
// SecureChat - TypeScript Type Definitions
// ============================================

export type UserRole = 'admin' | 'user';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system' | 'call';
export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';
export type ConversationType = 'direct' | 'group';
export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  bio: string;
  lastSeen: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface CreateUserPayload {
  username: string;
  displayName: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyToId?: string;
  replyTo?: Message;
  isDeleted: boolean;
  createdAt: string;
}

export interface Call {
  id: string;
  conversationId: string;
  callerId: string;
  receiverId: string;
  caller?: User;
  receiver?: User;
  type: CallType;
  status: CallStatus;
  duration: number;
  startedAt: string;
  endedAt: string | null;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface UserLoginCredentials {
  username: string;
  password: string;
}

// Socket.io event types
export interface SocketEvents {
  // Client -> Server
  'join-room': (conversationId: string) => void;
  'leave-room': (conversationId: string) => void;
  'send-message': (message: Message) => void;
  'typing': (conversationId: string) => void;
  'stop-typing': (conversationId: string) => void;
  'call-user': (data: { receiverId: string; type: CallType }) => void;
  'answer-call': (data: { callId: string }) => void;
  'reject-call': (data: { callId: string }) => void;
  'end-call': (data: { callId: string }) => void;
  'offer-signal': (data: { callId: string; signal: RTCSessionDescriptionInit }) => void;
  'answer-signal': (data: { callId: string; signal: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { callId: string; candidate: RTCIceCandidateInit }) => void;

  // Server -> Client
  'new-message': (message: Message) => void;
  'message-status': (data: { messageId: string; status: MessageStatus }) => void;
  'user-typing': (data: { userId: string; conversationId: string }) => void;
  'user-stop-typing': (data: { userId: string; conversationId: string }) => void;
  'incoming-call': (call: Call) => void;
  'call-answered': (data: { callId: string }) => void;
  'call-rejected': (data: { callId: string }) => void;
  'call-ended': (data: { callId: string; duration: number }) => void;
  'offer-signal': (data: { callId: string; signal: RTCSessionDescriptionInit }) => void;
  'answer-signal': (data: { callId: string; signal: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { callId: string; candidate: RTCIceCandidateInit }) => void;
  'user-online': (userId: string) => void;
  'user-offline': (userId: string) => void;
}

// App view types
export type AppView = 'landing' | 'admin-login' | 'admin' | 'user-login' | 'chat';

// Admin stats
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  totalCalls: number;
  totalConversations: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'user_created' | 'message_sent' | 'call_made' | 'user_login';
  description: string;
  timestamp: string;
  userId?: string;
}
