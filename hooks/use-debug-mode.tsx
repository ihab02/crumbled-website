'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    originalConsoleDebug?: typeof console.debug;
  }
}

interface DebugModeContextType {
  isDebugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  refreshDebugMode: () => Promise<void>;
}

const DebugModeContext = createContext<DebugModeContextType | undefined>(undefined);

export function DebugModeProvider({ children }: { children: ReactNode }) {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDebugMode = async () => {
    try {
      const response = await fetch('/api/debug-mode');
      const data = await response.json();
      
      if (data.success) {
        const debugMode = data.debugMode;
        setIsDebugMode(debugMode);
        
        // Set console.debug behavior based on debug mode
        if (debugMode) {
          // Restore original console.debug
          if (window.originalConsoleDebug) {
            console.debug = window.originalConsoleDebug;
          }
        } else {
          // Store original console.debug and disable it
          if (!window.originalConsoleDebug) {
            window.originalConsoleDebug = console.debug;
          }
          console.debug = () => {};
        }
      }
    } catch (error) {
      console.error('Error fetching debug mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setDebugMode = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debug_mode: enabled,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsDebugMode(enabled);
        
        // Update console.debug behavior
        if (enabled) {
          // Restore original console.debug
          if (window.originalConsoleDebug) {
            console.debug = window.originalConsoleDebug;
          }
        } else {
          // Store original console.debug and disable it
          if (!window.originalConsoleDebug) {
            window.originalConsoleDebug = console.debug;
          }
          console.debug = () => {};
        }
      } else {
        throw new Error(data.error || 'Failed to update debug mode');
      }
    } catch (error) {
      console.error('Error updating debug mode:', error);
      throw error;
    }
  };

  const refreshDebugMode = async () => {
    await fetchDebugMode();
  };

  useEffect(() => {
    fetchDebugMode();
  }, []);

  // Don't render children until we've loaded the debug mode
  if (isLoading) {
    return null;
  }

  return (
    <DebugModeContext.Provider value={{ isDebugMode, setDebugMode, refreshDebugMode }}>
      {children}
    </DebugModeContext.Provider>
  );
}

export function useDebugMode() {
  const context = useContext(DebugModeContext);
  if (context === undefined) {
    throw new Error('useDebugMode must be used within a DebugModeProvider');
  }
  return context;
}

// Debug logger hook for frontend components
export function useDebugLogger() {
  const { isDebugMode } = useDebugMode();

  const debugLog = React.useCallback((message: string, ...args: any[]) => {
    if (isDebugMode) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }, [isDebugMode]);

  return { debugLog, isDebugMode };
} 