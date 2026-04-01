// ============================================
// SecureChat - Socket.io Client Helper
// ============================================

import { io, Socket } from 'socket.io-client';

const SOCKET_PORT = 3003;

let socketInstance: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io('/?XTransformPort=' + SOCKET_PORT, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[SecureChat] Socket connected:', socketInstance?.id);
      reconnectAttempts = 0;
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[SecureChat] Socket disconnected:', reason);
      reconnectAttempts++;
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[SecureChat] Socket connection error:', error.message);
      reconnectAttempts++;
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function isConnected(): boolean {
  return socketInstance?.connected || false;
}
