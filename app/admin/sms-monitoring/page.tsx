'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

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

      {/* Hourly Distribution Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Hourly Distribution</h2>
        <div className="h-80">
          {/* @ts-ignore */}
          <ResponsiveContainer width="100%" height="100%">
            {/* @ts-ignore */}
            <LineChart data={data.hourlyDistribution}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis
                dataKey="hour"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              {/* @ts-ignore */}
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              {/* @ts-ignore */}
              <Legend />
              {/* @ts-ignore */}
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4F46E5"
                name="Total Messages"
              />
              {/* @ts-ignore */}
              <Line
                type="monotone"
                dataKey="successful"
                stroke="#10B981"
                name="Successful Messages"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Errors Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Top Error Messages</h2>
        <div className="h-80">
          {/* @ts-ignore */}
          <ResponsiveContainer width="100%" height="100%">
            {/* @ts-ignore */}
            <BarChart data={data.topErrors}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis dataKey="error_message" />
              {/* @ts-ignore */}
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip />
              {/* @ts-ignore */}
              <Legend />
              {/* @ts-ignore */}
              <Bar dataKey="count" fill="#EF4444" name="Error Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 