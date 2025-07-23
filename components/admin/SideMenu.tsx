'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useDebugLogger } from '@/hooks/use-debug-mode';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Store,
  BarChart,
  MessageSquare,
  FileText,
  LogOut,
  Cookie,
  Tag,
  Mail,
  Database,
  Warehouse,
  User,
  Truck,
  Image,
  Target,
  ChefHat,
  Shield,
  Clock,
  Bell,
  MapPin,
  Users2,
  ClipboardList,
  TrendingUp
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'Kitchen Management',
    href: '/admin/kitchen-management',
    icon: ChefHat,
    submenu: [
      {
        title: 'Kitchen Management',
        href: '/admin/kitchen-management',
        icon: ChefHat
      },
      {
        title: 'Kitchen Production',
        href: '/admin/kitchen-production',
        icon: Clock
      },
      {
        title: 'Kitchen Roles',
        href: '/admin/role-management',
        icon: Shield
      }
    ]
  },
  {
    title: 'Order Processing',
    href: '/admin/orders',
    icon: ShoppingCart,
    submenu: [
      {
        title: 'All Orders',
        href: '/admin/orders',
        icon: ShoppingCart
      },
      {
        title: 'Order Batches',
        href: '/admin/order-batches',
        icon: ClipboardList
      },
      {
        title: 'Order Routing',
        href: '/admin/order-routing',
        icon: MapPin
      }
    ]
  },
  {
    title: 'Production Management',
    href: '/admin/kitchen-production',
    icon: Clock,
    submenu: [
      {
        title: 'Production Dashboard',
        href: '/admin/kitchen-production',
        icon: Clock
      },
      {
        title: 'Kitchen Management',
        href: '/admin/kitchen-management',
        icon: ChefHat
      }
    ]
  },
  {
    title: 'Delivery Management',
    href: '/admin/delivery-management',
    icon: Truck
  },
  {
    title: 'Locations',
    href: '/admin/locations',
    icon: MapPin
  },
  {
    title: 'Pricing Management',
    href: '/admin/pricing-rules',
    icon: Tag,
    submenu: [
      {
        title: 'Enhanced Promo Codes',
        href: '/admin/enhanced-promo-codes',
        icon: Tag
      },
      {
        title: 'Pricing Rules',
        href: '/admin/pricing-rules',
        icon: Target
      },
      {
        title: 'Product Prices',
        href: '/admin/product-prices',
        icon: Package
      }
    ]
  },
  {
    title: 'Stock Management',
    href: '/admin/stock',
    icon: Warehouse
  },
  {
    title: 'Product Management',
    href: '/admin/products',
    icon: Package,
    submenu: [
      {
        title: 'Products',
        href: '/admin/products',
        icon: Package
      },
      {
        title: 'Flavors',
        href: '/admin/flavors',
        icon: Cookie
      },
      {
        title: 'Product Types',
        href: '/admin/product-types',
        icon: Tag
      },
      {
        title: 'Sliding Media',
        href: '/admin/sliding-media',
        icon: Image
      }
    ]
  },
  {
    title: 'Customer Management',
    href: '/admin/customers',
    icon: Users,
    submenu: [
      {
        title: 'Customers',
        href: '/admin/customers',
        icon: Users
      },
      {
        title: 'Customer Insights',
        href: '/admin/customer-insights',
        icon: Target
      },
      {
        title: 'Messages',
        href: '/admin/messages',
        icon: MessageSquare
      },
      {
        title: 'Reviews',
        href: '/admin/reviews',
        icon: MessageSquare
      }
    ]
  },
  {
    title: 'Analytics & Reports',
    href: '/admin/analytics',
    icon: BarChart
  },
  {
    title: 'SMS Monitoring',
    href: '/admin/sms-monitoring',
    icon: MessageSquare
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    submenu: [
      {
        title: 'General',
        href: '/admin/settings',
        icon: Settings
      },
      {
        title: 'Email',
        href: '/admin/settings/email',
        icon: Mail
      },
      {
        title: 'Order Mode',
        href: '/admin/order-mode',
        icon: Database
      },
      {
        title: 'Kitchen Settings',
        href: '/admin/kitchen-settings',
        icon: ChefHat
      }
    ]
  }
];

export function SideMenu() {
  const pathname = usePathname();
  const { user, logout, loading } = useAdminAuth();
  const { debugLog } = useDebugLogger();

  debugLog('SideMenu render:', { user, loading, pathname });

  const isActive = (href: string) => pathname === href;
  const isSettingsActive = pathname.startsWith('/admin/settings');
  const isKitchenActive = pathname.startsWith('/admin/kitchen-management') || pathname.startsWith('/admin/kitchen-production') || pathname.startsWith('/admin/role-management');
  const isOrderActive = pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/order-');
  const isProductionActive = pathname.startsWith('/admin/kitchen-production') || pathname.startsWith('/admin/kitchen-management');
  const isProductActive = pathname.startsWith('/admin/products') || pathname.startsWith('/admin/flavors') || pathname.startsWith('/admin/product-') || pathname.startsWith('/admin/sliding-');
  const isCustomerActive = pathname.startsWith('/admin/customers') || pathname.startsWith('/admin/customer-') || pathname.startsWith('/admin/messages');
  const isAnalyticsActive = pathname.startsWith('/admin/analytics');
  const isPricingActive = pathname.startsWith('/admin/enhanced-promo-codes') || pathname.startsWith('/admin/pricing-rules') || pathname.startsWith('/admin/product-prices');

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Store className="h-6 w-6" />
          <span>Crumbled Admin</span>
        </Link>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">{user.username}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Administrator</div>
        </div>
      )}
      
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isItemActive = isActive(item.href);
          const showSubmenu = item.submenu && (
            isItemActive || 
            isSettingsActive || 
            isKitchenActive || 
            isOrderActive || 
            isProductionActive || 
            isProductActive || 
            isCustomerActive || 
            isAnalyticsActive ||
            isPricingActive
          );

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isItemActive
                    ? 'bg-pink-100 text-pink-600'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
              {showSubmenu && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive(subItem.href)
                          ? 'bg-pink-100 text-pink-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <subItem.icon className="h-5 w-5" />
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* Debug info */}
      <div className="border-t p-2 text-xs text-gray-500">
        <div>User: {user ? user.username : 'None'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
      </div>
      
      <div className="border-t p-2">
        <button
          onClick={() => {
            debugLog('Logout button clicked');
            logout();
          }}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="h-5 w-5" />
          {loading ? 'Loading...' : 'Logout'}
        </button>
      </div>
    </div>
  );
} 