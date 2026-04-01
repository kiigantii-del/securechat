'use client';

import { Shield, MessageCircle, Users, Phone, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

export function LandingPage() {
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              SecureChat
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setView('admin-login')}
            >
              Admin
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
              onClick={() => setView('user-login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4">
        <div className="py-20 md:py-32 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Secure & Private
            <span className="text-emerald-600 dark:text-emerald-400 block">Messaging</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Send messages, make voice and video calls with end-to-end encryption.
            Your conversations stay private and secure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 rounded-xl"
              onClick={() => setView('user-login')}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-xl text-base"
              onClick={() => setView('admin-login')}
            >
              Admin Portal
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="pb-20 md:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="End-to-End Encrypted"
              description="Every message is encrypted so only you and the recipient can read them."
            />
            <FeatureCard
              icon={<Phone className="h-6 w-6" />}
              title="Voice & Video Calls"
              description="Crystal-clear voice and video calls with real-time media streaming."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Group Conversations"
              description="Create groups with friends, family, or colleagues for team communication."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Admin Controls"
              description="Admin panel to manage users, monitor activity, and control access."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Real-Time Sync"
              description="Instant message delivery with WebSocket-powered real-time communication."
            />
            <FeatureCard
              icon={<MessageCircle className="h-6 w-6" />}
              title="Rich Messaging"
              description="Send text, images, and file attachments with read receipts."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            SecureChat &copy; {new Date().getFullYear()} &middot; Privacy-first messaging
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
