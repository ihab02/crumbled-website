'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AdminUser {
  id: number;
  username: string;
  type: 'admin';
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        // Redirect to login if not authenticated
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('Logout function called');
    try {
      const response = await fetch('/api/auth/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });

      console.log('Logout response:', response.status, response.ok);

      if (response.ok) {
        setUser(null);
        toast.success('Logged out successfully');
        router.push('/admin/login');
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return {
    user,
    loading,
    logout,
    checkAuth
  };
} 