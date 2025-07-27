'use client';

import { usePathname } from 'next/navigation';
import PopupAds from './PopupAds';

export default function PopupAdsWrapper() {
  const pathname = usePathname();
  
  return <PopupAds currentPath={pathname} />;
} 