'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import Link from 'next/link';
import { Mail, ShoppingCart, CreditCard, Bug } from 'lucide-react';
import { DebugDemo } from '@/components/debug-demo';
import { DebugTest } from '@/components/debug-test';
import { useDebugMode } from '@/hooks/use-debug-mode';

export default function SettingsPage() {
  const [cartLifetime, setCartLifetime] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isDebugMode, setDebugMode } = useDebugMode();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        setCartLifetime(data.settings.cart_lifetime_days);
        // Debug mode is managed by the context, no need to set it here
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_lifetime_days: cartLifetime,
          debug_mode: isDebugMode,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <DebugDemo />
      <DebugTest />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cart Lifetime (days)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={cartLifetime}
                  onChange={(e) => setCartLifetime(Number(e.target.value))}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How long should abandoned carts be kept before being cleared?
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Configure which payment methods are available to customers during checkout.
              </p>
              <Link href="/admin/settings/payment-methods">
                <Button className="bg-pink-600 hover:bg-pink-700">
                  Manage Payment Methods
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Debug Mode
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable detailed logging for troubleshooting and development
                  </p>
                </div>
                <Switch
                  checked={isDebugMode}
                  onCheckedChange={setDebugMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Configure your email server settings for sending notifications and order confirmations.
              </p>
              <Link href="/admin/settings/email">
                <Button className="bg-pink-600 hover:bg-pink-700">
                  Configure Email Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 