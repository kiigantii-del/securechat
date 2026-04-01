'use client';

import { useState, useCallback } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Reply,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Message, User } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function StatusIcon({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-gray-300" />;
    case 'sent':
      return <Check className="h-3 w-3 text-gray-300" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-gray-300" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-emerald-300" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-300" />;
    default:
      return null;
  }
}

function MessageContextMenu({
  message,
  isOwn,
  onReply,
  onDelete,
  position,
  onClose,
}: {
  message: Message;
  isOwn: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  position: { x: number; y: number };
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      {/* Menu */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
        style={{
          top: Math.min(position.y, window.innerHeight - 150),
          left: Math.min(position.x, window.innerWidth - 180),
        }}
      >
        {onReply && (
          <button
            onClick={() => { onReply(message); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Reply className="h-4 w-4" />
            Reply
          </button>
        )}
        {isOwn && onDelete && (
          <button
            onClick={() => { onDelete(message.id); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>
    </>
  );
}

export function MessageBubble({
  message,
  isOwn,
  isGroup,
  onReply,
  onDelete,
}: MessageBubbleProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const getTimeString = () => {
    try {
      return new Date(message.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // System messages
  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <div className="px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60">
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
            {message.content}
          </span>
        </div>
      </div>
    );
  }

  // Deleted messages
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[75%] md:max-w-[60%]">
          <div
            className={`
              px-4 py-2 rounded-xl
              ${isOwn
                ? 'bg-emerald-600/20 dark:bg-emerald-700/20 rounded-tr-sm'
                : 'bg-white dark:bg-gray-800 rounded-tl-sm shadow-sm'
              }
            `}
          >
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              This message was deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Image message
  if (message.type === 'image') {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[75%] md:max-w-[60%]">
          {isGroup && !isOwn && message.sender && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1 px-1">
              {message.sender.displayName || message.sender.username}
            </p>
          )}
          <div
            className={`rounded-xl overflow-hidden ${
              isOwn
                ? 'rounded-tr-sm'
                : 'rounded-tl-sm shadow-sm'
            }`}
            onContextMenu={handleContextMenu}
          >
            <div className="bg-gray-100 dark:bg-gray-700">
              <img
                src={message.content}
                alt="Shared image"
                className="max-w-full max-h-72 object-cover cursor-pointer rounded-t-xl"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div
              className={`px-3 py-1.5 flex items-center justify-end gap-1.5 ${
                isOwn
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              <span className="text-[10px] opacity-80">{getTimeString()}</span>
              {isOwn && <StatusIcon status={message.status} />}
            </div>
          </div>
          {contextMenu && (
            <MessageContextMenu
              message={message}
              isOwn={isOwn}
              onReply={onReply}
              onDelete={onDelete}
              position={contextMenu}
              onClose={() => setContextMenu(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // Reply-to preview
  const replyToMessage = message.replyTo;

  // Text message
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%] md:max-w-[60%]">
        {/* Sender name for group chats */}
        {isGroup && !isOwn && message.sender && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1 px-1">
            {message.sender.displayName || message.sender.username}
          </p>
        )}

        <div
          className={`
            relative px-3 py-2 rounded-xl shadow-sm
            ${isOwn
              ? 'bg-emerald-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
            }
          `}
          onContextMenu={handleContextMenu}
        >
          {/* Reply-to preview */}
          {replyToMessage && (
            <div
              className={`
                mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2
                ${isOwn
                  ? 'bg-emerald-700/50 border-white/30'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-emerald-500'
                }
              `}
            >
              <p className={`text-[10px] font-semibold mb-0.5 ${isOwn ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {replyToMessage.sender?.displayName || replyToMessage.sender?.username || 'Unknown'}
              </p>
              <p className={`text-xs truncate ${isOwn ? 'text-emerald-100/70' : 'text-gray-500 dark:text-gray-400'}`}>
                {replyToMessage.type === 'image' ? '📷 Photo' : replyToMessage.content}
              </p>
            </div>
          )}

          {/* Message content */}
          <div className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">
            {linkify(message.content)}
          </div>

          {/* Timestamp and status */}
          <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
            <span
              className={`text-[10px] ${
                isOwn ? 'text-emerald-100/60' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {getTimeString()}
            </span>
            {isOwn && <StatusIcon status={message.status} />}
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <MessageContextMenu
            message={message}
            isOwn={isOwn}
            onReply={onReply}
            onDelete={onDelete}
            position={contextMenu}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
