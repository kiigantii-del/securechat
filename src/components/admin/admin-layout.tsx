'use client';

import { useState } from 'react';
import { Shield, LogOut, LayoutDashboard, Users, Settings, Menu, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AdminDashboard from './admin-dashboard';
import UserManagement from './user-management';
import AdminSettings from './admin-settings';

type AdminSection = 'dashboard' | 'users' | 'settings';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="size-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-4" /> },
];

export default function AdminLayout() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r z-30">
        <SidebarContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          currentUser={currentUser}
          getInitials={getInitials}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarContent
          activeSection={activeSection}
          setActiveSection={(section) => {
            setActiveSection(section);
            setSidebarOpen(false);
          }}
          currentUser={currentUser}
          getInitials={getInitials}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar - Mobile */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600">
              <Shield className="size-4 text-white" />
            </div>
            <span className="font-semibold text-sm">SecureChat Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  activeSection,
  setActiveSection,
  currentUser,
  getInitials,
  handleLogout,
}: {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  currentUser: any;
  getInitials: (name: string) => string;
  handleLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 shadow-sm shadow-emerald-600/30">
          <Shield className="size-4.5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">SecureChat</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeSection === item.id
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t p-3 space-y-3">
        {currentUser && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                {getInitials(currentUser.displayName || currentUser.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">Administrator</p>
            </div>
          </div>
        )}
        <Separator />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive px-3 h-9"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="text-sm">Log out</span>
        </Button>
      </div>
    </div>
  );
}
