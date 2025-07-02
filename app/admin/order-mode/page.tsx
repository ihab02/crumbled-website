"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Package, ShoppingCart, AlertTriangle, Clock, Settings, XCircle, Mail, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OrderMode = "stock_based" | "preorder";

interface TimeWindowSettings {
  enabled: boolean;
  fromTime: string;
  toTime: string;
}

interface CancellationSettings {
  enabled: boolean;
  showInEmail: boolean;
  showOnSuccessPage: boolean;
  timeWindowMinutes: number;
}

interface OrderModeInfo {
  mode: OrderMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const orderModeInfo: Record<OrderMode, OrderModeInfo> = {
  stock_based: {
    mode: "stock_based",
    title: "Stock-Based Mode",
    description:
      "Inventory is checked before accepting orders. Out-of-stock items are blocked unless explicitly allowed.",
    icon: <Package className="h-6 w-6" />,
    color: "bg-green-50 border-green-200",
    features: [
      "Real-time stock validation",
      "Prevents overselling",
      "Configurable out-of-stock allowances",
      "Flavor-level stock checking for packs",
      "Automatic order blocking for unavailable items",
    ],
  },
  preorder: {
    mode: "preorder",
    title: "Preorder Mode",
    description:
      "All products can be ordered regardless of current stock. Stock quantities are tracked but not enforced.",
    icon: <ShoppingCart className="h-6 w-6" />,
    color: "bg-blue-50 border-blue-200",
    features: [
      "No stock restrictions",
      "All items available for order",
      "Stock tracking for reference",
      "Flexible ordering system",
      "Suitable for made-to-order items",
    ],
  },
};

export default function OrderModePage() {
  const [currentMode, setCurrentMode] = useState<OrderMode>("stock_based");
  const [timeWindowSettings, setTimeWindowSettings] = useState<TimeWindowSettings>({
    enabled: false,
    fromTime: "08:00",
    toTime: "17:00"
  });
  const [cancellationSettings, setCancellationSettings] = useState<CancellationSettings>({
    enabled: true,
    showInEmail: true,
    showOnSuccessPage: true,
    timeWindowMinutes: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderMode();
    // eslint-disable-next-line
  }, []);

  const fetchOrderMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/order-mode");
      if (response.status === 403 || response.status === 401) {
        setError("You must be logged in as an admin to access this page.");
        setLoading(false);
        return;
      }
      const result = await response.json();
      if (result.success) {
        setCurrentMode(result.data.orderMode);
        if (result.data.timeWindowSettings) {
          setTimeWindowSettings(result.data.timeWindowSettings);
        }
        if (result.data.cancellationSettings) {
          setCancellationSettings(result.data.cancellationSettings);
        }
      } else {
        setError(result.error || "Failed to fetch order mode");
      }
    } catch (error) {
      setError("Failed to fetch order mode");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderMode = async (newMode: OrderMode) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/order-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderMode: newMode }),
      });
      if (response.status === 403 || response.status === 401) {
        setError("You must be logged in as an admin to access this page.");
        setSaving(false);
        return;
      }
      const result = await response.json();
      if (result.success) {
        setCurrentMode(newMode);
        toast({
          title: "Success",
          description: `Order mode updated to ${orderModeInfo[newMode].title}`,
        });
      } else {
        setError(result.error || "Failed to update order mode");
      }
    } catch (error) {
      setError("Failed to update order mode");
    } finally {
      setSaving(false);
    }
  };

  const updateTimeWindowSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/order-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          timeWindowSettings: timeWindowSettings 
        }),
      });
      if (response.status === 403 || response.status === 401) {
        setError("You must be logged in as an admin to access this page.");
        setSaving(false);
        return;
      }
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Time window settings updated successfully",
        });
      } else {
        setError(result.error || "Failed to update time window settings");
      }
    } catch (error) {
      setError("Failed to update time window settings");
    } finally {
      setSaving(false);
    }
  };

  const updateCancellationSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/order-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cancellationSettings: cancellationSettings 
        }),
      });
      if (response.status === 403 || response.status === 401) {
        setError("You must be logged in as an admin to access this page.");
        setSaving(false);
        return;
      }
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Cancellation settings updated successfully",
        });
      } else {
        setError(result.error || "Failed to update cancellation settings");
      }
    } catch (error) {
      setError("Failed to update cancellation settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order mode settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Mode Settings</h1>
            <p className="text-gray-600 mt-2">
              Configure how the system handles product availability and stock checking
            </p>
          </div>
          <Badge variant={currentMode === "stock_based" ? "default" : "secondary"}>
            Current: {orderModeInfo[currentMode].title}
          </Badge>
        </div>

        {/* Current Mode Alert */}
        <Alert className={orderModeInfo[currentMode].color}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Mode:</strong> {orderModeInfo[currentMode].title}
          </AlertDescription>
        </Alert>

        {/* Mode Selection */}
        <div className="grid gap-6 md:grid-cols-2">
          {Object.values(orderModeInfo).map((modeInfo) => (
            <Card
              key={modeInfo.mode}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                currentMode === modeInfo.mode
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => !saving && updateOrderMode(modeInfo.mode)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${modeInfo.color.replace(
                        "bg-",
                        "bg-"
                      ).replace("border-", "border-")}`}
                    >
                      {modeInfo.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{modeInfo.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{modeInfo.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                  {modeInfo.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Time Window Settings */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Clock className="h-5 w-5" />
              Next-Day Delivery Time Window
            </CardTitle>
            <p className="text-sm text-purple-700">
              Control when customers can place orders for next-day delivery
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="time-window-toggle" className="text-base font-medium">
                  Enable Time Window Enforcement
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, customers can only place next-day delivery orders during the specified time window
                </p>
              </div>
              <Switch
                id="time-window-toggle"
                checked={timeWindowSettings.enabled}
                onCheckedChange={(checked) => 
                  setTimeWindowSettings(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {timeWindowSettings.enabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="from-time">From Time</Label>
                  <Input
                    id="from-time"
                    type="time"
                    value={timeWindowSettings.fromTime}
                    onChange={(e) => 
                      setTimeWindowSettings(prev => ({ ...prev, fromTime: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="to-time">To Time</Label>
                  <Input
                    id="to-time"
                    type="time"
                    value={timeWindowSettings.toTime}
                    onChange={(e) => 
                      setTimeWindowSettings(prev => ({ ...prev, toTime: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                How it works:
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• When enabled, customers can only select next-day delivery during the specified hours</li>
                <li>• Outside these hours, next-day delivery will be automatically disabled</li>
                <li>• Customers will see a clear message explaining why next-day delivery is unavailable</li>
                <li>• The system will suggest the next available delivery date</li>
                <li>• Same-day delivery (if available) remains unaffected by this setting</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={updateTimeWindowSettings}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? "Saving..." : "Save Time Window Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Settings */}
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Order Cancellation Settings
            </CardTitle>
            <p className="text-sm text-red-700">
              Control whether customers can cancel their orders and how the cancellation feature is displayed
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cancellation-toggle" className="text-base font-medium">
                  Enable Order Cancellation
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Master switch to enable or disable the order cancellation feature for all customers
                </p>
              </div>
              <Switch
                id="cancellation-toggle"
                checked={cancellationSettings.enabled}
                onCheckedChange={(checked) => 
                  setCancellationSettings(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {cancellationSettings.enabled && (
              <>
                {/* Display Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label htmlFor="show-in-email" className="text-base font-medium">
                          Show Cancellation in Email
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Include cancellation option in order confirmation emails
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="show-in-email"
                      checked={cancellationSettings.showInEmail}
                      onCheckedChange={(checked) => 
                        setCancellationSettings(prev => ({ ...prev, showInEmail: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-green-600" />
                      <div>
                        <Label htmlFor="show-on-success-page" className="text-base font-medium">
                          Show Cancellation on Success Page
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Display cancellation button on the checkout success page
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="show-on-success-page"
                      checked={cancellationSettings.showOnSuccessPage}
                      onCheckedChange={(checked) => 
                        setCancellationSettings(prev => ({ ...prev, showOnSuccessPage: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Time Window */}
                <div>
                  <Label htmlFor="cancellation-time-window" className="text-base font-medium">
                    Cancellation Time Window (minutes)
                  </Label>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    How long after order placement customers can cancel their orders
                  </p>
                  <Input
                    id="cancellation-time-window"
                    type="number"
                    min="0"
                    max="1440"
                    value={cancellationSettings.timeWindowMinutes}
                    onChange={(e) => 
                      setCancellationSettings(prev => ({ 
                        ...prev, 
                        timeWindowMinutes: parseInt(e.target.value) || 0 
                      }))
                    }
                    className="w-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: 1440 minutes (24 hours)
                  </p>
                </div>
              </>
            )}

            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                How it works:
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• When enabled, customers can cancel orders within the specified time window</li>
                <li>• Cancellation options appear based on your display settings (email, success page)</li>
                <li>• Orders can only be cancelled if they haven't been processed yet</li>
                <li>• The time window starts from the moment the order is placed</li>
                <li>• Cancelled orders are marked as "cancelled" in the system</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={updateCancellationSettings}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? "Saving..." : "Save Cancellation Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 