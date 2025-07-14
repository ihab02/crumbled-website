'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Cookie, Tag, Package } from 'lucide-react';
import { SideMenu } from '@/components/admin/SideMenu';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide side menu on login page for security
  const isLoginPage = pathname === '/admin/login';
  const isActive = (path: string) => {
    return pathname === path;
  };

  // If it's the login page, render without the side menu
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // For all other admin pages, show the side menu
  return (
    <div className="flex h-screen bg-gray-50">
      <SideMenu />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
} 