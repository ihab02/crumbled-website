'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useDebugLogger } from '@/hooks/use-debug-mode';

interface EmailSettings {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  is_active: boolean;
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const { debugLog } = useDebugLogger();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [settings, setSettings] = useState<EmailSettings>({
    id: 0,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_ssl: false,
    use_tls: true,
    is_active: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      debugLog('🔍 Fetching email settings...');
      const response = await fetch('/api/admin/settings/email');
      const data = await response.json();

      debugLog('🔍 Email settings response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch email settings');
      }

      if (data.settings) {
        debugLog('✅ Email settings loaded:', data.settings);
        setSettings(data.settings);
      } else {
        debugLog('⚠️ No email settings found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error fetching email settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch email settings');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'smtp_port' ? parseInt(value) || 587 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      debugLog('💾 Saving email settings:', settings);
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      debugLog('💾 Save response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save email settings');
      }

      toast.success('Email settings saved successfully');
      
      // Refresh the settings to show the saved data
      await fetchSettings();
      
      // Don't redirect immediately, let user see the saved data
      // router.push('/admin/settings');
    } catch (error) {
      console.error('❌ Error saving email settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a recipient email address');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settings,
          test_email: testEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setTestResult({
        success: true,
        message: 'Test email sent successfully',
        details: `Email was sent to ${testEmail}`
      });
      toast.success('Test email sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send test email';
      setTestResult({
        success: false,
        message: 'Failed to send test email',
        details: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  name="smtp_host"
                  value={settings.smtp_host}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  name="smtp_port"
                  type="number"
                  value={settings.smtp_port}
                  onChange={handleChange}
                  placeholder="587"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Common ports: 587 (TLS), 465 (SSL), 25 (Unencrypted)
                </p>
              </div>

              <div>
                <Label htmlFor="smtp_username">SMTP Username</Label>
                <Input
                  id="smtp_username"
                  name="smtp_username"
                  value={settings.smtp_username}
                  onChange={handleChange}
                  placeholder="your-email@gmail.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="smtp_password">SMTP Password</Label>
                <Input
                  id="smtp_password"
                  name="smtp_password"
                  type="password"
                  value={settings.smtp_password}
                  onChange={handleChange}
                  placeholder="Your SMTP password or app password"
                  required
                />
              </div>

              <div>
                <Label htmlFor="from_email">From Email</Label>
                <Input
                  id="from_email"
                  name="from_email"
                  type="email"
                  value={settings.from_email}
                  onChange={handleChange}
                  placeholder="noreply@yourdomain.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  name="from_name"
                  value={settings.from_name}
                  onChange={handleChange}
                  placeholder="Your Company Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_ssl"
                  checked={settings.use_ssl}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, use_ssl: checked }));
                    if (checked) {
                      setSettings(prev => ({ ...prev, use_tls: false }));
                    }
                  }}
                />
                <Label htmlFor="use_ssl" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Use SSL
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="use_tls"
                  checked={settings.use_tls}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, use_tls: checked }));
                    if (checked) {
                      setSettings(prev => ({ ...prev, use_ssl: false }));
                    }
                  }}
                />
                <Label htmlFor="use_tls" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Use TLS
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={settings.is_active}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Enable Email Service</Label>
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="test_email">Test Email Recipient</Label>
              <div className="flex gap-2">
                <Input
                  id="test_email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to send test to"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testing || !testEmail}
                >
                  {testing ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-md ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h4 className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </h4>
                </div>
                {testResult.details && (
                  <p className={`mt-2 text-sm ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.details}
                  </p>
                )}
              </div>
            )}

            <Alert className="mt-6">
              <AlertDescription>
                <p className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>For secure email sending:</span>
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use SSL with port 465 for secure connections</li>
                  <li>Use TLS with port 587 for encrypted connections</li>
                  <li>For Gmail, use an App Password instead of your regular password</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/settings')}
              >
                Back to Settings
              </Button>
              <Button type="submit" disabled={loading || testing}>
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 