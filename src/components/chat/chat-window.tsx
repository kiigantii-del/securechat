'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Phone,
  Video,
  Info,
  Smile,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, getAuthHeaders } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { Conversation, Message, User, CallType, UserStatus } from '@/lib/types';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { format, isSameDay, parseISO } from 'date-fns';

interface ChatWindowProps {
  conversation: Conversation;
  getConversationName: (conversation: Conversation) => string;
  getOtherUser: (conversation: Conversation) => User | null;
  isUserOnline: (userId: string) => boolean;
}

const avatarColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-cyan-500',
  'bg-amber-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-3">
      <div className="px-3 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm">
        <span className="text-xs text-muted-foreground font-medium">
          {format(parseISO(date), 'MMMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator({ names }: { names: string[] }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-muted-foreground">
          {names.length === 1 ? `${names[0]} is typing` : `${names.join(', ')} are typing`}
        </span>
      </div>
    </div>
  );
}

export function ChatWindow({
  conversation,
  getConversationName,
  getOtherUser,
  isUserOnline,
}: ChatWindowProps) {
  const {
    currentUser,
    messages,
    setMessages,
    addMessage,
    typingUsers,
    setContactInfoOpen,
    contactInfoOpen,
    setActiveCall,
    activeConversation,
  } = useAppStore();

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const prevConversationIdRef = useRef<string | null>(null);

  const name = getConversationName(conversation);
  const otherUser = getOtherUser(conversation);
  const online = otherUser ? isUserOnline(otherUser.id) : false;
  const colorClass = getAvatarColor(name);
  const isGroup = conversation.type === 'group';

  // Get typing user names for current conversation
  const typingUserIds = typingUsers.get(conversation.id);
  const typingNames: string[] = [];
  if (typingUserIds && currentUser) {
    typingUserIds.forEach((uid) => {
      if (uid !== currentUser.id) {
        const participant = conversation.participants.find((p) => p.id === uid);
        if (participant) {
          typingNames.push(participant.displayName || participant.username);
        }
      }
    });
  }

  // Load messages on conversation change
  useEffect(() => {
    if (!conversation || conversation.id === prevConversationIdRef.current) return;
    prevConversationIdRef.current = conversation.id;

    loadMessages(conversation.id);

    // Join socket room
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join-room', conversation.id);

    return () => {
      socket.emit('leave-room', conversation.id);
    };
  }, [conversation.id]);

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const headers = getAuthHeaders();
      const userId = useAppStore.getState().currentUser?.id;
      const res = await fetch(`/api/messages?conversationId=${conversationId}&userId=${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typingNames.length]);

  const handleSendMessage = useCallback(
    (content: string, type: 'text' | 'image' = 'text', replyToId?: string) => {
      if (!currentUser || !activeConversation) return;

      const socket = getSocket();
      const message: Message = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        sender: currentUser,
        content,
        type,
        status: 'sending',
        replyToId,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      // Emit via socket
      socket.emit('send-message', message);
      // Optimistically add
      addMessage(message);
    },
    [currentUser, activeConversation, addMessage]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const res = await fetch(`/api/messages`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId }),
        });
        if (res.ok) {
          // Remove from local state
          const { messages: currentMessages, setMessages: updateMessages } = useAppStore.getState();
          updateMessages(currentMessages.filter((m) => m.id !== messageId));
        }
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    },
    []
  );

  const handleReply = useCallback((message: Message) => {
    // Store the reply target in a simple state mechanism
    useAppStore.getState().setShowEmojiPicker(false);
    // Dispatch custom event for reply
    window.dispatchEvent(new CustomEvent('reply-to-message', { detail: message }));
  }, []);

  const initiateCall = useCallback(
    (callType: CallType) => {
      if (!otherUser || !currentUser) return;

      const socket = getSocket();
      socket.emit('call-user', {
        receiverId: otherUser.id,
        type: callType,
      });
    },
    [otherUser, currentUser]
  );

  // Group messages by date for separators
  const renderMessages = () => {
    let lastDate = '';

    return messages.map((message) => {
      const msgDate = format(parseISO(message.createdAt), 'yyyy-MM-dd');
      const showDateSeparator = msgDate !== lastDate;
      lastDate = msgDate;

      return (
        <div key={message.id}>
          {showDateSeparator && <DateSeparator date={message.createdAt} />}
          <MessageBubble
            message={message}
            isOwn={message.senderId === currentUser?.id}
            isGroup={isGroup}
            onReply={handleReply}
            onDelete={handleDeleteMessage}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-emerald-600 dark:bg-emerald-700 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarFallback className={`${colorClass} text-white font-semibold text-sm`}>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isGroup && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-600 ${
                  online ? 'bg-emerald-300' : 'bg-gray-400'
                }`}
              />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{name}</h2>
            <p className="text-emerald-100 text-xs truncate">
              {isGroup
                ? `${conversation.participants.length} participants`
                : online
                ? 'Online'
                : 'Click here for contact info'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => initiateCall('audio')}
            title="Voice Call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => initiateCall('video')}
            title="Video Call"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setContactInfoOpen(!contactInfoOpen)}
            title="Contact Info"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Encryption notice */}
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Messages are end-to-end encrypted</span>
            </div>
            <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {isLoadingMessages && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-14 w-48 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!isLoadingMessages && renderMessages()}

        {/* Typing Indicator */}
        {typingNames.length > 0 && <TypingIndicator names={typingNames} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        conversationId={conversation.id}
      />
    </div>
  );
}
