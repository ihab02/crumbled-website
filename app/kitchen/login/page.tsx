'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  Building2, 
  LogIn, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface Kitchen {
  id: number;
  name: string;
  address: string;
}

export default function KitchenLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [availableKitchens, setAvailableKitchens] = useState<Kitchen[]>([]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    kitchenId: ''
  });

  useEffect(() => {
    // Check if user is already logged in
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/kitchen/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // User is already logged in, redirect to kitchen dashboard
          router.push('/kitchen/dashboard');
        }
      }
    } catch (err) {
      // Session check failed, user needs to log in
      console.log('No existing session found');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kitchen/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          kitchenId: formData.kitchenId || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success) {
        // If user has multiple kitchens and no kitchen was selected
        if (data.data.availableKitchens.length > 1 && !formData.kitchenId) {
          setAvailableKitchens(data.data.availableKitchens);
          setError('Please select a kitchen to continue');
          setLoading(false);
          return;
        }

        // Login successful, redirect to dashboard
        router.push('/kitchen/dashboard');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKitchenSelect = async (kitchenId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kitchen/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenId: parseInt(kitchenId) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select kitchen');
      }

      if (data.success) {
        // Kitchen selected successfully, redirect to dashboard
        router.push('/kitchen/dashboard');
      } else {
        throw new Error(data.error || 'Failed to select kitchen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select kitchen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Kitchen Login
            </CardTitle>
            <p className="text-gray-600">
              Access your kitchen dashboard
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {availableKitchens.length > 1 && !formData.kitchenId ? (
              // Kitchen selection form
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kitchen-select">Select Kitchen</Label>
                  <Select 
                    value={formData.kitchenId} 
                    onValueChange={(value) => setFormData({ ...formData, kitchenId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your kitchen" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableKitchens.map(kitchen => (
                        <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2" />
                            {kitchen.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => handleKitchenSelect(formData.kitchenId)}
                  disabled={!formData.kitchenId || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Selecting Kitchen...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Continue to Kitchen
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Login form
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your username"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact your kitchen administrator
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 