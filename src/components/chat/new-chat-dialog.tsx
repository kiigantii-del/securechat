'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users } from 'lucide-react';
import { getAuthHeaders } from '@/lib/store';
import { User, Conversation } from '@/lib/types';
import { toast } from 'sonner';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewChatDialog({
  open,
  onOpenChange,
  currentUser,
  onConversationCreated,
}: NewChatDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingWithId, setCreatingWithId] = useState<string | null>(null);

  // Fetch available users when dialog opens
  useEffect(() => {
    if (!open || !currentUser) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      setSearchQuery('');
      try {
        const headers = getAuthHeaders();
        const res = await fetch('/api/users/available', { headers });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        } else {
          toast.error('Failed to load users');
        }
      } catch {
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [open, currentUser?.id]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Handle starting a conversation with a user
  const handleSelectUser = async (user: User) => {
    if (!currentUser || creatingWithId) return;

    setCreatingWithId(user.id);
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId1: currentUser.id,
          userId2: user.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onConversationCreated(data.conversation);
        onOpenChange(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to create conversation');
      }
    } catch {
      toast.error('Failed to create conversation');
    } finally {
      setCreatingWithId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 [&>button]:hidden">
        {/* Emerald header bar */}
        <div className="bg-emerald-600 dark:bg-emerald-700 px-4 py-3.5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              New Chat
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Search input */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="max-h-80 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {searchQuery ? 'No users found' : 'No users available'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'There are no other users to chat with'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="py-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    disabled={creatingWithId === user.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className={`font-semibold text-sm ${
                            user.status === 'online'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {user.displayName
                            .split(' ')
                            .map((n) => n.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.status === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                        {creatingWithId === user.id && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                            Creating...
                          </span>
                        )}
                      </p>
                    </div>
                    {user.status === 'online' && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                        online
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
