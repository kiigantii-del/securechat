'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, MessageSquare, Phone, RefreshCw, TrendingUp } from 'lucide-react';
import { useAppStore, getAuthHeaders } from '@/lib/store';
import { AdminStats, ActivityItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  LogIn,
  PhoneCall,
  Send,
} from 'lucide-react';

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  change?: string;
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'user_created':
      return <UserPlus className="size-4 text-blue-500" />;
    case 'user_login':
      return <LogIn className="size-4 text-emerald-500" />;
    case 'call_made':
      return <PhoneCall className="size-4 text-purple-500" />;
    case 'message_sent':
      return <Send className="size-4 text-orange-500" />;
    default:
      return <Activity className="size-4 text-gray-500" />;
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setAdminStats = useAppStore((s) => s.setAdminStats);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/stats', { headers });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      const statsData: AdminStats = data.stats || data;
      setStats(statsData);
      setAdminStats(statsData);
    } catch {
      // Use store stats as fallback
      const storeStats = useAppStore.getState().adminStats;
      if (storeStats) setStats(storeStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards: StatCard[] = stats
    ? [
        {
          label: 'Total Users',
          value: stats.totalUsers,
          icon: <Users className="size-5 text-white" />,
          bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          iconBgColor: 'bg-emerald-500/20',
        },
        {
          label: 'Active Users',
          value: stats.activeUsers,
          icon: <Activity className="size-5 text-white" />,
          bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
          iconBgColor: 'bg-green-500/20',
        },
        {
          label: 'Total Messages',
          value: stats.totalMessages,
          icon: <MessageSquare className="size-5 text-white" />,
          bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
          iconBgColor: 'bg-teal-500/20',
        },
        {
          label: 'Total Calls',
          value: stats.totalCalls,
          icon: <Phone className="size-5 text-white" />,
          bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
          iconBgColor: 'bg-cyan-500/20',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your SecureChat platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-6">
                  <div className={`flex size-12 items-center justify-center rounded-xl ${card.bgColor} shadow-lg`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-0.5">{card.value.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-500" />
              Recent Activity
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {stats?.recentActivity.length || 0} events
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-full max-w-sm" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentActivity.length ? (
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
