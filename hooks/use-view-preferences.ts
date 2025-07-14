import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface ViewPreferences {
  show_deleted: boolean;
  view_type: 'products' | 'flavors' | 'product_types' | 'orders';
}

export function useViewPreferences(viewType: ViewPreferences['view_type']) {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<ViewPreferences>({
    show_deleted: false,
    view_type: viewType
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, viewType]);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/view-preferences?view_type=${viewType}`);
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
      } else {
        setError(data.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load preferences');
      console.error('Error loading view preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  const updatePreferences = useCallback(async (showDeleted: boolean) => {
    try {
      setError(null);

      const response = await fetch('/api/admin/view-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          view_type: viewType,
          show_deleted: showDeleted
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(prev => ({
          ...prev,
          show_deleted: showDeleted
        }));
        return true;
      } else {
        setError(data.error || 'Failed to update preferences');
        return false;
      }
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating view preferences:', err);
      return false;
    }
  }, [viewType]);

  const toggleShowDeleted = useCallback(async () => {
    const newShowDeleted = !preferences.show_deleted;
    return await updatePreferences(newShowDeleted);
  }, [preferences.show_deleted, updatePreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    toggleShowDeleted,
    refresh: loadPreferences
  };
} 