'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/use-admin-auth';
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
  User
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart
  },
  {
    title: 'Stock Management',
    href: '/admin/stock',
    icon: Warehouse
  },
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
    title: 'Customers',
    href: '/admin/customers',
    icon: Users
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Store
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart
  },
  {
    title: 'Messages',
    href: '/admin/messages',
    icon: MessageSquare
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: FileText
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
      }
    ]
  }
];

export function SideMenu() {
  const pathname = usePathname();
  const { user, logout, loading } = useAdminAuth();

  console.log('SideMenu render:', { user, loading, pathname });

  const isActive = (href: string) => pathname === href;
  const isSettingsActive = pathname.startsWith('/admin/settings');

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
      
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const isItemActive = isActive(item.href);
          const showSubmenu = item.submenu && (isItemActive || isSettingsActive);

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
            console.log('Logout button clicked');
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