import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  Warehouse
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
      <div className="border-t p-2">
        <button
          onClick={() => {
            // Handle logout
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
} 