'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle,
  Search,
  Plus,
  MoreVertical,
  ArrowLeft,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, getAuthHeaders } from '@/lib/store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Conversation, Message, Call, UserStatus } from '@/lib/types';
import { ConversationList } from './conversation-list';
import { ChatWindow } from './chat-window';
import { CallInterface } from './call-interface';
import { useTheme } from 'next-themes';

export function ChatLayout() {
  const {
    currentUser,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    addMessage,
    setTyping,
    clearTyping,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    activeCall,
    incomingCall,
    setActiveCall,
    setIncomingCall,
    logout,
    setConnected,
    onlineUsers,
    addOnlineUser,
    removeOnlineUser,
  } = useAppStore();

  const { theme, setTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Auth the socket
    socket.emit('auth', { userId: currentUser.id, username: currentUser.username });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('auth', { userId: currentUser.id, username: currentUser.username });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for new messages
    socket.on('new-message', (message: Message) => {
      addMessage(message);
    });

    // Typing indicators
    socket.on('user-typing', (data: { userId: string; conversationId: string }) => {
      setTyping(data.userId, data.conversationId);
    });

    socket.on('user-stop-typing', (data: { userId: string; conversationId: string }) => {
      clearTyping(data.userId, data.conversationId);
    });

    // Online status
    socket.on('user-online', (userId: string) => {
      addOnlineUser(userId);
    });

    socket.on('user-offline', (userId: string) => {
      removeOnlineUser(userId);
    });

    // Call events
    socket.on('incoming-call', (call: Call) => {
      setIncomingCall(call);
    });

    socket.on('call-ended', () => {
      setActiveCall(null);
    });

    // Load conversations
    const doLoad = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`/api/conversations?userId=${currentUser.id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };
    doLoad();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('incoming-call');
      socket.off('call-ended');
    };
  }, [currentUser?.id, addMessage, clearTyping, setConversations, setConnected, setIncomingCall, setActiveCall, setTyping, addOnlineUser, removeOnlineUser]);

  const handleLogout = useCallback(() => {
    disconnectSocket();
    logout();
  }, [logout]);

  // Get other participant for a direct conversation
  const getOtherUser = (conversation: Conversation) => {
    if (!currentUser) return null;
    return conversation.participants.find((p) => p.id !== currentUser.id) || null;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    const other = getOtherUser(conversation);
    return other?.displayName || other?.username || 'Unknown';
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  const statusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Call Interface Overlay */}
      {(activeCall || incomingCall) && <CallInterface />}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            fixed md:relative z-20 md:z-auto
            w-full md:w-80 h-full
            flex flex-col
            bg-white dark:bg-gray-900
            border-r border-gray-200 dark:border-gray-800
            transition-transform duration-300 ease-in-out
          `}
        >
          {/* Sidebar Header */}
          <div className="bg-emerald-600 dark:bg-emerald-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarFallback className="bg-emerald-500 text-white font-semibold text-sm">
                    {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-600 ${statusColor(currentUser?.status || 'offline')}`} />
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {currentUser?.displayName || currentUser?.username || 'User'}
                </p>
                <p className="text-emerald-100 text-xs truncate">
                  {currentUser?.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversation?.id}
              onSelect={(conv) => {
                setActiveConversation(conv);
                // On mobile, close sidebar
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              getConversationName={getConversationName}
              getOtherUser={getOtherUser}
              isUserOnline={isUserOnline}
              isLoading={false}
            />
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#e5ddd5] dark:bg-[#0b141a] relative">
          {/* Mobile back button */}
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3 z-10 h-9 w-9 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              getConversationName={getConversationName}
              getOtherUser={getOtherUser}
              isUserOnline={isUserOnline}
            />
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="max-w-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <MessageCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                  SecureChat Web
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Send and receive messages with end-to-end encryption.
                  Select a conversation from the sidebar to start chatting.
                </p>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  End-to-end encrypted
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
