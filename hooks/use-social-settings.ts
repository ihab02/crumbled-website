'use client';

import { useState, useEffect } from 'react';

interface SocialSettings {
  whatsapp_number: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
}

export function useSocialSettings() {
  const [settings, setSettings] = useState<SocialSettings>({
    whatsapp_number: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/social-settings');
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.settings);
        } else {
          setError('Failed to load social settings');
        }
      } catch (err) {
        setError('Failed to load social settings');
        console.error('Error fetching social settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading, error };
} 