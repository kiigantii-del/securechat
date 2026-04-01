'use client';

import { useEffect } from 'react';
import { useAppStore, restoreSession } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { LandingPage } from '@/components/landing-page';
import { UserLogin } from '@/components/auth/user-login';
import { ChatLayout } from '@/components/chat/chat-layout';
import AdminLogin from '@/components/admin/admin-login';
import AdminLayout from '@/components/admin/admin-layout';

export default function Home() {
  const { currentView, currentUser, isAdmin, login, setView } = useAppStore();

  // Restore session on mount
  useEffect(() => {
    const session = restoreSession();
    if (session) {
      login(session.user, session.isAdmin);
      const socket = getSocket();
      socket.emit('auth', { userId: session.user.id, username: session.user.username });
      setView(session.isAdmin ? 'admin' : 'chat');
    }
  }, [login, setView]);

  // Render based on current view
  switch (currentView) {
    case 'user-login':
      return <UserLogin />;

    case 'chat':
      if (!currentUser) {
        setView('landing');
        return null;
      }
      return <ChatLayout />;

    case 'admin-login':
      return <AdminLogin />;

    case 'admin':
      if (!currentUser || !isAdmin) {
        setView('landing');
        return null;
      }
      return <AdminLayout />;

    case 'landing':
    default:
      return <LandingPage />;
  }
}
