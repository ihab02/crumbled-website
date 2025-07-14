'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DebugFixPasswordPage() {
  const [email, setEmail] = useState('ihab02@gmail.com');
  const [newPassword, setNewPassword] = useState('test123');
  const [isLoading, setIsLoading] = useState(false);

  const handleFixPassword = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/debug-fix-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password fixed successfully!');
        console.log('Fixed credentials:', data.credentials);
      } else {
        toast.error(data.error || 'Failed to fix password');
      }
    } catch (error) {
      console.error('Error fixing password:', error);
      toast.error('Failed to fix password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fix User Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <Button
            onClick={handleFixPassword}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Fixing Password...' : 'Fix Password'}
          </Button>
          
          <div className="text-sm text-gray-600 mt-4">
            <p><strong>Current Issue:</strong> Password hash mismatch</p>
            <p><strong>Solution:</strong> This will re-hash the password with bcrypt (12 salt rounds)</p>
            <p><strong>After fixing:</strong> Use the new password to login</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 