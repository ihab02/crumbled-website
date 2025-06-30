'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Save, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';

interface PaymentMethod {
  enabled: boolean;
  name: string;
  description: string;
}

interface PaymentMethods {
  cod: PaymentMethod;
  paymob: PaymentMethod;
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    cod: { enabled: true, name: 'Cash on Delivery', description: 'Pay when you receive your order' },
    paymob: { enabled: true, name: 'Paymob', description: 'Secure online payment' }
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/settings/payment-methods');
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.paymentMethods);
      } else {
        toast.error('Failed to load payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodToggle = (methodKey: keyof PaymentMethods) => {
    const updatedMethods = { ...paymentMethods };
    updatedMethods[methodKey].enabled = !updatedMethods[methodKey].enabled;

    // Check if at least one method is enabled
    const enabledCount = Object.values(updatedMethods).filter(method => method.enabled).length;
    if (enabledCount === 0) {
      toast.error('At least one payment method must be enabled');
      return;
    }

    setPaymentMethods(updatedMethods);
  };

  const handleMethodUpdate = (methodKey: keyof PaymentMethods, field: keyof PaymentMethod, value: string | boolean) => {
    setPaymentMethods(prev => ({
      ...prev,
      [methodKey]: {
        ...prev[methodKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethods }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment methods updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update payment methods');
      }
    } catch (error) {
      console.error('Error saving payment methods:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save payment methods');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const enabledMethodsCount = Object.values(paymentMethods).filter(method => method.enabled).length;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <CardTitle>Payment Methods Management</CardTitle>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/settings')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Status Alert */}
            <Alert className={enabledMethodsCount > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {enabledMethodsCount > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={enabledMethodsCount > 0 ? 'text-green-800' : 'text-red-800'}>
                {enabledMethodsCount > 0 
                  ? `${enabledMethodsCount} payment method${enabledMethodsCount > 1 ? 's' : ''} enabled`
                  : 'No payment methods enabled - at least one must be enabled'
                }
              </AlertDescription>
            </Alert>

            {/* Cash on Delivery */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={paymentMethods.cod.enabled}
                      onCheckedChange={() => handleMethodToggle('cod')}
                    />
                    <Label className="text-lg font-semibold">Cash on Delivery (COD)</Label>
                  </div>
                  <Badge variant={paymentMethods.cod.enabled ? 'default' : 'secondary'}>
                    {paymentMethods.cod.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cod-name">Display Name</Label>
                  <Input
                    id="cod-name"
                    value={paymentMethods.cod.name}
                    onChange={(e) => handleMethodUpdate('cod', 'name', e.target.value)}
                    placeholder="Cash on Delivery"
                  />
                </div>
                <div>
                  <Label htmlFor="cod-description">Description</Label>
                  <Textarea
                    id="cod-description"
                    value={paymentMethods.cod.description}
                    onChange={(e) => handleMethodUpdate('cod', 'description', e.target.value)}
                    placeholder="Pay when you receive your order"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Paymob */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={paymentMethods.paymob.enabled}
                      onCheckedChange={() => handleMethodToggle('paymob')}
                    />
                    <Label className="text-lg font-semibold">Paymob</Label>
                  </div>
                  <Badge variant={paymentMethods.paymob.enabled ? 'default' : 'secondary'}>
                    {paymentMethods.paymob.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymob-name">Display Name</Label>
                  <Input
                    id="paymob-name"
                    value={paymentMethods.paymob.name}
                    onChange={(e) => handleMethodUpdate('paymob', 'name', e.target.value)}
                    placeholder="Paymob"
                  />
                </div>
                <div>
                  <Label htmlFor="paymob-description">Description</Label>
                  <Textarea
                    id="paymob-description"
                    value={paymentMethods.paymob.description}
                    onChange={(e) => handleMethodUpdate('paymob', 'description', e.target.value)}
                    placeholder="Secure online payment"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || enabledMethodsCount === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 