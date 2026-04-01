'use client';

import { Conversation, User } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  getConversationName: (conversation: Conversation) => string;
  getOtherUser: (conversation: Conversation) => User | null;
  isUserOnline: (userId: string) => boolean;
  isLoading: boolean;
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

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return formatDistanceToNow(date, { addSuffix: false });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: false });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  getConversationName,
  getOtherUser,
  isUserOnline,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {conversations.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              No conversations yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a new chat to begin messaging
            </p>
          </div>
        )}

        {conversations.map((conversation) => {
          const name = getConversationName(conversation);
          const otherUser = getOtherUser(conversation);
          const isActive = conversation.id === activeConversationId;
          const online = otherUser ? isUserOnline(otherUser.id) : false;
          const colorClass = getAvatarColor(name);
          const isGroup = conversation.type === 'group';

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150
                ${isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
              `}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`${colorClass} text-white font-semibold text-sm`}>
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online status dot */}
                {!isGroup && otherUser && (
                  <span
                    className={`
                      absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2
                      ${online
                        ? 'border-white dark:border-gray-900 bg-emerald-500'
                        : 'border-white dark:border-gray-900 bg-gray-400 dark:bg-gray-600'
                      }
                    `}
                  />
                )}
                {isGroup && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <Users className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-semibold text-sm truncate ${
                      isActive
                        ? 'text-emerald-900 dark:text-emerald-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {name}
                  </span>
                  <span
                    className={`text-xs shrink-0 ${
                      conversation.unreadCount > 0
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {conversation.lastMessage
                      ? formatTime(conversation.lastMessage.createdAt)
                      : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={`text-sm truncate ${
                      conversation.unreadCount > 0
                        ? 'text-gray-700 dark:text-gray-300 font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {conversation.lastMessage
                      ? (() => {
                          const prefix = conversation.lastMessage.senderId !== (typeof window !== 'undefined' ? localStorage.getItem('securechat_session') : null)
                            ? ''
                            : '';
                          const text = conversation.lastMessage.type === 'image'
                            ? '📷 Photo'
                            : conversation.lastMessage.content;
                          return `${prefix}${text}`;
                        })()
                      : 'No messages yet'}
                  </p>

                  {conversation.unreadCount > 0 && (
                    <Badge className="shrink-0 h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-500 rounded-full flex items-center justify-center">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
