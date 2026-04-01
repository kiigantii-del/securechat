'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send,
  Mic,
  Smile,
  Paperclip,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getSocket } from '@/lib/socket';
import { Message } from '@/lib/types';

interface ChatInputProps {
  onSend: (content: string, type?: 'text' | 'image', replyToId?: string) => void;
  conversationId: string;
}

const COMMON_EMOJIS = [
  '😀', '😂', '🥹', '😍', '🤔', '😅', '😎', '🥺',
  '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '✨',
  '🎉', '🙏', '👏', '💪', '🤝', '👋', '🫡', '💀',
  '🤣', '😘', '🥰', '😏', '🤗', '😴', '🤯', '🥳',
  '😬', '🙈', '🫣', '🤮', '😈', '👻', '💀', '💩',
  '🌈', '🌟', '⚡', '🎵', '📸', '💬', '💭', '📌',
  '✅', '❌', '⭐', '💎', '🏆', '🎯', '🚀', '💡',
  '🏠', '☕', '🍕', '🎂', '🌹', '🍀', '☀️', '🌙',
];

export function ChatInput({ onSend, conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 144) + 'px';
    }
  }, [message]);

  // Listen for reply events
  useEffect(() => {
    const handleReply = (e: Event) => {
      const msg = (e as CustomEvent).detail as Message;
      setReplyTo(msg);
      textareaRef.current?.focus();
    };

    window.addEventListener('reply-to-message', handleReply);
    return () => window.removeEventListener('reply-to-message', handleReply);
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    socket.emit('typing', conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', conversationId);
    }, 2000);
  }, [conversationId]);

  const emitStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    const socket = getSocket();
    socket.emit('stop-typing', conversationId);
  }, [conversationId]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;

    onSend(trimmed, 'text', replyTo?.id);
    setMessage('');
    setReplyTo(null);
    setShowEmojiPicker(false);
    emitStopTyping();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, onSend, replyTo, emitStopTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      emitTyping();
    },
    [emitTyping]
  );

  const handleEmojiClick = useCallback((emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  }, []);

  const handleImageSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = () => {
          onSend(reader.result as string, 'image');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [onSend]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mx-4 mt-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border-l-2 border-emerald-500 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {replyTo.sender?.displayName || replyTo.sender?.username || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.type === 'image' ? '📷 Photo' : replyTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setReplyTo(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-1.5 px-3 py-2.5">
        {/* Emoji Picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-2"
            side="top"
            align="start"
            sideOffset={8}
          >
            <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
              {COMMON_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-9 w-9 flex items-center justify-center text-xl rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Attach / Image */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
          onClick={handleImageSelect}
          title="Attach Image"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            className={`
              w-full resize-none rounded-xl bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              px-4 py-2.5 text-sm
              text-gray-900 dark:text-gray-100
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
              transition-all duration-200
              max-h-36
              leading-relaxed
            `}
          />
        </div>

        {/* Send / Voice */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 shrink-0 p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
