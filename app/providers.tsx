'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/components/cart-provider';
import { WishlistProvider } from '@/components/wishlist-provider';
import { DebugModeProvider } from '@/hooks/use-debug-mode';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <DebugModeProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <Toaster position="top-right" />
            </WishlistProvider>
          </CartProvider>
        </DebugModeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 