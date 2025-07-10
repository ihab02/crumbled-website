'use client';

import { useEffect } from 'react';
import { useDebugLogger } from '@/hooks/use-debug-mode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug } from 'lucide-react';

export function DebugDemo() {
  const { debugLog, isDebugMode } = useDebugLogger();

  useEffect(() => {
    debugLog('DebugDemo component mounted', { isDebugMode });
  }, [debugLog, isDebugMode]);

  const handleTestLog = () => {
    debugLog('Test button clicked', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      debugMode: isDebugMode
    });
  };

  const handleTestError = () => {
    debugLog('Simulating an error for debugging', {
      error: 'This is a test error',
      stack: new Error().stack,
      context: 'Debug demo component'
    });
  };

  if (!isDebugMode) {
    return null; // Don't show the demo when debug mode is off
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          Debug Mode Active
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-orange-700 mb-4">
          Debug mode is enabled. Check the browser console for debug logs.
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handleTestLog}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Test Debug Log
          </Button>
          <Button 
            onClick={handleTestError}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Test Error Log
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 