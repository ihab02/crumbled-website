"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OrderMode = "stock_based" | "preorder";

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
      </div>
    </div>
  );
} 