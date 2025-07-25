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
  TrendingUp,
  CreditCard,
  Phone,
  Star,
  Building2,
  Route
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'Order Management',
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
        title: 'Order Mode',
        href: '/admin/order-mode',
        icon: Database
      }
    ]
  },
  {
    title: 'Kitchen Operations',
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
        title: 'Role Management',
        href: '/admin/role-management',
        icon: Shield
      }
    ]
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
        icon: Star
      }
    ]
  },
  {
    title: 'Delivery & Locations',
    href: '/admin/delivery-management',
    icon: Truck,
    submenu: [
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
        title: 'Delivery Men',
        href: '/admin/delivery-men',
        icon: Users2
      },
      {
        title: 'Time Slots',
        href: '/admin/delivery-time-slots',
        icon: Clock
      }
    ]
  },
  {
    title: 'Pricing & Promotions',
    href: '/admin/pricing-rules',
    icon: Tag,
    submenu: [
      {
        title: 'Pricing Rules',
        href: '/admin/pricing-rules',
        icon: Target
      },
      {
        title: 'Enhanced Promo Codes',
        href: '/admin/enhanced-promo-codes',
        icon: Tag
      },
      {
        title: 'Promo Codes',
        href: '/admin/promo-codes',
        icon: CreditCard
      }
    ]
  },
  {
    title: 'Inventory & Stock',
    href: '/admin/stock',
    icon: Warehouse
  },
  {
    title: 'Analytics & Reports',
    href: '/admin/analytics',
    icon: BarChart,
    submenu: [
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart
      },
      {
        title: 'SMS Monitoring',
        href: '/admin/sms-monitoring',
        icon: Phone
      }
    ]
  },
  {
    title: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    submenu: [
      {
        title: 'General Settings',
        href: '/admin/settings',
        icon: Settings
      },
      {
        title: 'Email Settings',
        href: '/admin/settings/email',
        icon: Mail
      },
      {
        title: 'Payment Methods',
        href: '/admin/settings/payment-methods',
        icon: CreditCard
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
  
  // Check if any submenu should be expanded based on current path
  const shouldExpandSubmenu = (item: any) => {
    if (!item.submenu) return false;
    
    return item.submenu.some((subItem: any) => {
      const subPath = subItem.href;
      return pathname === subPath || pathname.startsWith(subPath + '/');
    });
  };

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
          const showSubmenu = item.submenu && shouldExpandSubmenu(item);

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