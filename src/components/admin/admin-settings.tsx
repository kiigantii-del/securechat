'use client';

import { useState } from 'react';
import { Settings, Bell, ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AppSettings {
  appName: string;
  messageRetention: string;
  maxFileSize: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: string;
  ipWhitelist: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'SecureChat',
    messageRetention: '30',
    maxFileSize: '25',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: '24',
    ipWhitelist: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
  });

  const handleSave = async () => {
    setIsSaving(true);

    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // In a real app, this would call the API
      // await fetch('/api/settings', { method: 'PUT', body: JSON.stringify({ appSettings, securitySettings, notificationSettings }) });

      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your SecureChat platform settings
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="size-5 text-emerald-500" />
            App Settings
          </CardTitle>
          <CardDescription>
            Configure general application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={appSettings.appName}
                onChange={(e) =>
                  setAppSettings((prev) => ({ ...prev, appName: e.target.value }))
                }
                placeholder="Enter app name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={appSettings.maxFileSize}
                onChange={(e) =>
                  setAppSettings((prev) => ({ ...prev, maxFileSize: e.target.value }))
                }
                placeholder="25"
                min="1"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="messageRetention">Default Message Retention</Label>
            <Select
              value={appSettings.messageRetention}
              onValueChange={(value) =>
                setAppSettings((prev) => ({ ...prev, messageRetention: value }))
              }
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="0">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-500" />
            Security
          </CardTitle>
          <CardDescription>
            Manage security settings and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all user accounts
              </p>
            </div>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSecuritySettings((prev) => ({ ...prev, twoFactorAuth: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Session Timeout</Label>
            <p className="text-sm text-muted-foreground">
              Duration before inactive sessions expire
            </p>
            <Select
              value={securitySettings.sessionTimeout}
              onValueChange={(value) =>
                setSecuritySettings((prev) => ({ ...prev, sessionTimeout: value }))
              }
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="ipWhitelist">IP Whitelist</Label>
            <p className="text-sm text-muted-foreground">
              Comma-separated list of allowed IP addresses (leave empty to allow all)
            </p>
            <Textarea
              id="ipWhitelist"
              value={securitySettings.ipWhitelist}
              onChange={(e) =>
                setSecuritySettings((prev) => ({ ...prev, ipWhitelist: e.target.value }))
              }
              placeholder="e.g. 192.168.1.1, 10.0.0.1"
              rows={3}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="size-5 text-emerald-500" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for important events
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  emailNotifications: checked,
                }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send push notifications for real-time alerts
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  pushNotifications: checked,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
