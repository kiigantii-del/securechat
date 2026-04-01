// ============================================
// SecureChat - Real-time Chat Service (Socket.io)
// ============================================
// Handles real-time messaging, typing indicators, 
// presence, and WebRTC signaling for voice/video calls.

import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================
// State Management
// ============================================
interface ConnectedUser {
  id: string;
  username: string;
  socketId: string;
  status: 'online' | 'away' | 'busy';
}

const connectedUsers = new Map<string, ConnectedUser>(); // userId -> ConnectedUser
const socketToUser = new Map<string, string>(); // socketId -> userId
const activeRooms = new Map<string, Set<string>>(); // conversationId -> Set of userIds
const typingUsers = new Map<string, Map<string, NodeJS.Timeout>>(); // conversationId -> Map<userId, timeout>

// ============================================
// Helper Functions
// ============================================
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getUserSocket(userId: string): string | undefined {
  const user = connectedUsers.get(userId);
  return user?.socketId;
}

function broadcastToRoom(conversationId: string, event: string, data: any, excludeSocket?: string): void {
  const room = activeRooms.get(conversationId);
  if (!room) return;

  room.forEach((userId) => {
    const user = connectedUsers.get(userId);
    if (user && user.socketId !== excludeSocket) {
      io.to(user.socketId).emit(event, data);
    }
  });
}

function notifyPresence(userId: string): void {
  const user = connectedUsers.get(userId);
  if (!user) return;

  // Notify all conversations this user is part of
  activeRooms.forEach((members, conversationId) => {
    if (members.has(userId)) {
      broadcastToRoom(conversationId, 'user-online', userId, user.socketId);
    }
  });
}

// ============================================
// Connection Handling
// ============================================
io.on('connection', (socket) => {
  console.log(`[SecureChat] Client connected: ${socket.id}`);

  // ==========================================
  // Authentication & Registration
  // ==========================================
  socket.on('auth', (data: { userId: string; username: string }) => {
    const { userId, username } = data;

    // Store user mapping
    socketToUser.set(socket.id, userId);
    connectedUsers.set(userId, {
      id: userId,
      username,
      socketId: socket.id,
      status: 'online',
    });

    console.log(`[SecureChat] User authenticated: ${username} (${userId})`);
    socket.emit('auth-success', { userId, status: 'online' });
  });

  // ==========================================
  // Conversation Rooms
  // ==========================================
  socket.on('join-room', (conversationId: string) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    if (!activeRooms.has(conversationId)) {
      activeRooms.set(conversationId, new Set());
    }
    activeRooms.get(conversationId)!.add(userId);
    console.log(`[SecureChat] ${userId} joined room: ${conversationId}`);
  });

  socket.on('leave-room', (conversationId: string) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    const room = activeRooms.get(conversationId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        activeRooms.delete(conversationId);
      }
    }
    console.log(`[SecureChat] ${userId} left room: ${conversationId}`);
  });

  // ==========================================
  // Messaging
  // ==========================================
  socket.on('send-message', (message: any) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    // Add server-side metadata
    const enrichedMessage = {
      ...message,
      id: message.id || generateId(),
      status: 'sent',
      createdAt: message.createdAt || new Date().toISOString(),
    };

    // Broadcast to all users in the conversation
    broadcastToRoom(message.conversationId, 'new-message', enrichedMessage);

    // Send delivery confirmation to sender
    socket.emit('message-status', {
      messageId: enrichedMessage.id,
      status: 'sent',
    });
  });

  socket.on('message-read', (data: { messageId: string; conversationId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    broadcastToRoom(data.conversationId, 'message-status', {
      messageId: data.messageId,
      status: 'read',
    }, socket.id);
  });

  // ==========================================
  // Typing Indicators
  // ==========================================
  socket.on('typing', (conversationId: string) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    broadcastToRoom(conversationId, 'user-typing', {
      userId,
      conversationId,
    }, socket.id);
  });

  socket.on('stop-typing', (conversationId: string) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    broadcastToRoom(conversationId, 'user-stop-typing', {
      userId,
      conversationId,
    }, socket.id);
  });

  // ==========================================
  // Voice/Video Calls (WebRTC Signaling)
  // ==========================================
  socket.on('call-user', (data: { receiverId: string; type: 'audio' | 'video'; conversationId: string }) => {
    const callerId = socketToUser.get(socket.id);
    if (!callerId) return;

    const receiverSocket = getUserSocket(data.receiverId);
    if (!receiverSocket) {
      socket.emit('call-error', { error: 'User is offline' });
      return;
    }

    const callData = {
      id: generateId(),
      conversationId: data.conversationId,
      callerId,
      receiverId: data.receiverId,
      type: data.type,
      status: 'ringing',
      startedAt: new Date().toISOString(),
    };

    io.to(receiverSocket).emit('incoming-call', callData);
    socket.emit('call-initiated', callData);
    console.log(`[SecureChat] Call: ${callerId} -> ${data.receiverId} (${data.type})`);
  });

  socket.on('answer-call', (data: { callId: string; receiverId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    const callerId = data.receiverId; // The callerId is passed as receiverId here
    const callerSocket = getUserSocket(callerId);
    if (callerSocket) {
      io.to(callerSocket).emit('call-answered', { callId: data.callId });
    }
    console.log(`[SecureChat] Call answered: ${data.callId}`);
  });

  socket.on('reject-call', (data: { callId: string; callerId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    const callerSocket = getUserSocket(data.callerId);
    if (callerSocket) {
      io.to(callerSocket).emit('call-rejected', { callId: data.callId });
    }
    console.log(`[SecureChat] Call rejected: ${data.callId}`);
  });

  socket.on('end-call', (data: { callId: string; receiverId: string }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    const receiverSocket = getUserSocket(data.receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('call-ended', {
        callId: data.callId,
        endedBy: userId,
      });
    }
    console.log(`[SecureChat] Call ended: ${data.callId}`);
  });

  // WebRTC Signaling
  socket.on('offer-signal', (data: { callId: string; receiverId: string; signal: RTCSessionDescriptionInit }) => {
    const receiverSocket = getUserSocket(data.receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('offer-signal', {
        callId: data.callId,
        signal: data.signal,
      });
    }
  });

  socket.on('answer-signal', (data: { callId: string; callerId: string; signal: RTCSessionDescriptionInit }) => {
    const callerSocket = getUserSocket(data.callerId);
    if (callerSocket) {
      io.to(callerSocket).emit('answer-signal', {
        callId: data.callId,
        signal: data.signal,
      });
    }
  });

  socket.on('ice-candidate', (data: { callId: string; targetId: string; candidate: RTCIceCandidateInit }) => {
    const targetSocket = getUserSocket(data.targetId);
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', {
        callId: data.callId,
        candidate: data.candidate,
      });
    }
  });

  // ==========================================
  // Disconnect
  // ==========================================
  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      connectedUsers.delete(userId);
      socketToUser.delete(socket.id);

      // Leave all rooms
      activeRooms.forEach((members, conversationId) => {
        if (members.has(userId)) {
          members.delete(userId);
          // Notify others
          broadcastToRoom(conversationId, 'user-offline', userId);
          if (members.size === 0) {
            activeRooms.delete(conversationId);
          }
        }
      });

      console.log(`[SecureChat] User disconnected: ${userId}`);
    } else {
      console.log(`[SecureChat] Unknown client disconnected: ${socket.id}`);
    }
  });

  socket.on('error', (error) => {
    console.error(`[SecureChat] Socket error (${socket.id}):`, error);
  });
});

// ============================================
// Start Server
// ============================================
const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[SecureChat] Real-time chat service running on port ${PORT}`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`[SecureChat] Received ${signal}, shutting down...`);
  io.close();
  httpServer.close(() => {
    console.log('[SecureChat] Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
