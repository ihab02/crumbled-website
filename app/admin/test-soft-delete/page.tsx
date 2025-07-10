'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViewToggle } from '@/components/admin/ViewToggle';

export default function TestSoftDeletePage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/run-soft-delete-migration', {
        method: 'POST',
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testViewPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/view-preferences?view_type=products');
      const data = await response.json();
      setTestResults({ type: 'view_preferences', ...data });
    } catch (error) {
      setTestResults({ type: 'view_preferences', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testProductsAPI = async (showDeleted: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products?show_deleted=${showDeleted}`);
      const data = await response.json();
      setTestResults({ type: 'products_api', showDeleted, ...data });
    } catch (error) {
      setTestResults({ type: 'products_api', showDeleted, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseViews = async () => {
    setLoading(true);
    try {
      const views = ['active_products', 'all_products', 'admin_view_preferences'];
      const results = {};
      
      for (const view of views) {
        try {
          const response = await fetch(`/api/test-db-view?view=${view}`);
          const data = await response.json();
          results[view] = data;
        } catch (error) {
          results[view] = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
      
      setTestResults({ type: 'database_views', results });
    } catch (error) {
      setTestResults({ type: 'database_views', success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Soft Delete System Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Database Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runMigration} disabled={loading} className="w-full">
              {loading ? 'Running...' : 'Run Soft Delete Migration'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Preferences Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testViewPreferences} disabled={loading} className="w-full">
              {loading ? 'Testing...' : 'Test View Preferences API'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products API Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => testProductsAPI(false)} disabled={loading} className="w-full">
              Test Active Products
            </Button>
            <Button onClick={() => testProductsAPI(true)} disabled={loading} className="w-full">
              Test All Products (with deleted)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Views Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testDatabaseViews} disabled={loading} className="w-full">
              {loading ? 'Testing...' : 'Test Database Views'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View Toggle Component Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ViewToggle 
            viewType="products" 
            deletedCount={5}
            onToggle={(showDeleted) => {
              console.log('Toggle changed:', showDeleted);
              testProductsAPI(showDeleted);
            }}
          />
        </CardContent>
      </Card>

      {testResults && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 