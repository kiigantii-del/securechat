'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { User, UserStatus } from '@/lib/types';
import { getAuthHeaders } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_COLORS: Record<UserStatus, string> = {
  online: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800',
  offline: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  away: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  busy: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
};

function getStatusLabel(status: UserStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface UserFormData {
  displayName: string;
  username: string;
  password: string;
  bio: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    displayName: '',
    username: '',
    password: '',
    bio: '',
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/users', { headers });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.bio.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setFormData({ displayName: '', username: '', password: '', bio: '' });
    setEditingUser(null);
    setShowPassword(false);
  };

  const openAddDialog = () => {
    resetForm();
    setIsUserDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      displayName: user.displayName,
      username: user.username,
      password: '',
      bio: user.bio,
    });
    setShowPassword(false);
    setIsUserDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }

    setIsSaving(true);
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const headers = getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      const body: Record<string, string> = {
        displayName: formData.displayName,
        username: formData.username,
        bio: formData.bio,
      };

      if (editingUser) body.id = editingUser.id;
      if (formData.password.trim()) body.password = formData.password;

      const res = await fetch('/api/users', {
        method,
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save user');
      }

      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
      setIsUserDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/users?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete user');

      toast.success('User deleted successfully');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDisplayNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      displayName: value,
      // Auto-generate username suggestion if not editing
      username: editingUser ? prev.username : value.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, ''),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <UserPlus className="size-4" />
          Add New User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-48">{user.bio || 'No bio'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">@{user.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${STATUS_COLORS[user.status]}`}
                      >
                        {getStatusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{user.displayName}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${STATUS_COLORS[user.status]}`}
                      >
                        {getStatusLabel(user.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No users match your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>

      {/* User count */}
      {!isLoading && filteredUsers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center md:text-left">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsUserDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user account details. Leave password blank to keep unchanged.'
                : 'Create a new user account for the platform.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g. John Doe"
                value={formData.displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="e.g. john.doe"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              />
              {!editingUser && (
                <p className="text-[11px] text-muted-foreground">
                  Auto-generated from display name. You can customize it.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingUser ? '(leave blank to keep unchanged)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editingUser ? 'Enter new password' : 'Enter a strong password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="A short bio..."
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsUserDialogOpen(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.displayName}</span> (@{deleteTarget?.username})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 gap-2"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
