'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Shield, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useDeferredInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return deferredPrompt;
}

export function PWAInstallPrompt() {
  const deferredPrompt = useDeferredInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const dismissedRef = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('pwa-prompt-dismissed') !== null;
  });

  const dismissed = dismissedRef[0];

  useEffect(() => {
    if (!deferredPrompt || dismissed) return;
    const timer = setTimeout(() => setShowPrompt(true), 5000);
    return () => clearTimeout(timer);
  }, [deferredPrompt, dismissed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-prompt-dismissed', 'true');
    }
  }, []);

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-600/30">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Install SecureChat</p>
              <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Button
          onClick={handleInstall}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl"
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </div>
    </div>
  );
}

export function AdminPWAInstall() {
  const deferredPrompt = useDeferredInstallPrompt();

  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
  }, [deferredPrompt]);

  if (isInstalled) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstall}
      className="text-muted-foreground hover:text-foreground gap-2"
    >
      <Shield className="h-4 w-4" />
      Install Admin App
    </Button>
  );
}
