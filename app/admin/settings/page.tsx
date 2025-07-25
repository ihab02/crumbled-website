'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import Link from 'next/link';
import { ShoppingCart, Bug, Share2 } from 'lucide-react';
import { DebugDemo } from '@/components/debug-demo';
import { DebugTest } from '@/components/debug-test';
import { useDebugMode } from '@/hooks/use-debug-mode';

export default function SettingsPage() {
  const [cartLifetime, setCartLifetime] = useState(2);
  const [socialSettings, setSocialSettings] = useState({
    whatsapp_number: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isDebugMode, setDebugMode } = useDebugMode();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsResponse, socialResponse] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/social-settings')
      ]);
      
      const settingsData = await settingsResponse.json();
      const socialData = await socialResponse.json();
      
      if (settingsData.success) {
        setCartLifetime(settingsData.settings.cart_lifetime_days);
      }
      
      if (socialData.success) {
        setSocialSettings(socialData.settings);
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
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSocialSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/social-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialSettings),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Social media settings saved successfully');
      } else {
        throw new Error('Failed to save social media settings');
      }
    } catch (error) {
      console.error('Error saving social media settings:', error);
      toast.error('Failed to save social media settings');
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
              <Share2 className="h-5 w-5" />
              Social Media & Contact Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <Input
                  type="text"
                  placeholder="201040920275"
                  value={socialSettings.whatsapp_number}
                  onChange={(e) => setSocialSettings(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your WhatsApp number in international format (without +)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook URL
                </label>
                <Input
                  type="url"
                  placeholder="https://www.facebook.com/yourpage"
                  value={socialSettings.facebook_url}
                  onChange={(e) => setSocialSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Facebook page or profile URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram URL
                </label>
                <Input
                  type="url"
                  placeholder="https://www.instagram.com/crumbled.eg"
                  value={socialSettings.instagram_url}
                  onChange={(e) => setSocialSettings(prev => ({ ...prev, instagram_url: e.target.value }))}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Instagram profile URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TikTok URL
                </label>
                <Input
                  type="url"
                  placeholder="https://www.tiktok.com/@crumbled.eg"
                  value={socialSettings.tiktok_url}
                  onChange={(e) => setSocialSettings(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your TikTok profile URL
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSaveSocialSettings}
                  disabled={isSaving}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {isSaving ? 'Saving...' : 'Save Social Media Settings'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 