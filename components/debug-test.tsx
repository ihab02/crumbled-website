'use client';

import { useEffect } from 'react';
import { useDebugLogger } from '@/hooks/use-debug-mode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugTest() {
  const { debugLog, isDebugMode } = useDebugLogger();

  useEffect(() => {
    debugLog('DebugTest component mounted', { isDebugMode });
  }, [debugLog, isDebugMode]);

  const handleTestClick = () => {
    debugLog('Test button clicked', {
      timestamp: new Date().toISOString(),
      debugMode: isDebugMode
    });
  };

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">
          Debug Mode Test - Status: {isDebugMode ? 'ENABLED' : 'DISABLED'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-700 mb-4">
          Current debug mode: <strong>{isDebugMode ? 'ON' : 'OFF'}</strong>
        </p>
        <Button 
          onClick={handleTestClick}
          variant="outline"
          size="sm"
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          Test Debug Log
        </Button>
        <p className="text-xs text-blue-600 mt-2">
          Check browser console for debug logs (only visible when debug mode is enabled)
        </p>
      </CardContent>
    </Card>
  );
} 