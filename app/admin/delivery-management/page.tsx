'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import toast from 'react-hot-toast';
import DeliveryMenTab from './components/DeliveryMenTab';
import TimeSlotsTab from './components/TimeSlotsTab';
import CitiesTab from './components/CitiesTab';
import ZonesTab from './components/ZonesTab';

export default function DeliveryManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'delivery-men' | 'time-slots' | 'cities' | 'zones'>('delivery-men');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Delivery Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage delivery personnel, time slots, cities, and zones for order delivery
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('delivery-men')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'delivery-men'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Delivery Men
                </button>
                <button
                  onClick={() => setActiveTab('time-slots')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'time-slots'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Time Slots
                </button>
                <button
                  onClick={() => setActiveTab('cities')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'cities'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Cities
                </button>
                <button
                  onClick={() => setActiveTab('zones')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'zones'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Zones
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'delivery-men' && <DeliveryMenTab />}
            {activeTab === 'time-slots' && <TimeSlotsTab />}
            {activeTab === 'cities' && <CitiesTab />}
            {activeTab === 'zones' && <ZonesTab />}
          </div>
        </div>
      </div>
    </div>
  );
} 