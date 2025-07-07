'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SMSStats {
  total_sent: number;
  successful: number;
  failed: number;
  success_rate: number;
}

interface RateLimitStats {
  total_limited: number;
  unique_limited_phones: number;
}

interface ErrorStats {
  error_message: string;
  count: number;
}

interface HourlyStats {
  hour: string;
  count: number;
  successful: number;
}

interface MonitoringData {
  stats: SMSStats;
  rateLimits: RateLimitStats;
  topErrors: ErrorStats[];
  hourlyDistribution: HourlyStats[];
  period: string;
  timestamp: string;
}

export default function SMSMonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState('24h');
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ period });
        if (phone) params.append('phone', phone);
        
        const response = await fetch(`/api/admin/sms-monitoring?${params}`);
        if (!response.ok) throw new Error('Failed to fetch monitoring data');
        
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period, phone]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">SMS Monitoring Dashboard</h1>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <input
            type="text"
            placeholder="Filter by phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total SMS Sent</h3>
          <p className="text-2xl font-bold">{data.stats.total_sent}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Success Rate</h3>
          <p className="text-2xl font-bold">{data.stats.success_rate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Failed Messages</h3>
          <p className="text-2xl font-bold text-red-600">{data.stats.failed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Rate Limited Phones</h3>
          <p className="text-2xl font-bold text-yellow-600">{data.rateLimits.unique_limited_phones}</p>
        </div>
      </div>

      {/* Hourly Distribution Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Hourly Distribution</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Messages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Successful</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.hourlyDistribution.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.hour).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.successful}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.count > 0 ? ((item.successful / item.count) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Errors Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Top Error Messages</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topErrors.map((error, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{error.error_message}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{error.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 