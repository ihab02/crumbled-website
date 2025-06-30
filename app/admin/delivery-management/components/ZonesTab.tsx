'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ZoneForm from './ZoneForm';

interface Zone {
  id: number;
  name: string;
  city_id: number;
  city_name: string;
  city_is_active: number;
  delivery_days: number;
  time_slot_id: number | null;
  time_slot_name: string | null;
  time_slot_from: string | null;
  time_slot_to: string | null;
  delivery_fee: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function ZonesTab() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/admin/zones');
      if (!response.ok) {
        throw new Error('Failed to fetch zones');
      }
      const data = await response.json();
      setZones(data);
    } catch (error) {
      toast.error('Failed to fetch zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this zone?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/zones/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete zone');
      }

      toast.success('Zone deleted successfully');
      fetchZones();
    } catch (error) {
      toast.error('Failed to delete zone');
    }
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingZone(null);
    fetchZones();
  };

  const filteredZones = zones.filter((zone) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      zone.name.toLowerCase().includes(searchLower) ||
      zone.city_name.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDeliveryDaysText = (days: number) => {
    if (days === 0) return 'Same day';
    if (days === 1) return 'Next day';
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search zones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Zone
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zone Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Slot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredZones.map((zone) => (
              <tr key={zone.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {zone.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {zone.city_name}
                  {zone.city_is_active === 0 && (
                    <span className="ml-1 text-xs text-red-600">(Inactive)</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getDeliveryDaysText(zone.delivery_days)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {zone.time_slot_name ? (
                    <span>
                      {zone.time_slot_name}<br />
                      <span className="text-xs text-gray-400">
                        {formatTime(zone.time_slot_from!)} - {formatTime(zone.time_slot_to!)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">No time slot</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Number(zone.delivery_fee || 0).toFixed(2)} EGP
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      zone.is_active === 1 && zone.city_is_active === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {zone.is_active === 1 && zone.city_is_active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(zone)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredZones.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No zones found</p>
        </div>
      )}

      {showForm && (
        <ZoneForm
          key={editingZone?.id || 'new'}
          zone={editingZone}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingZone(null);
          }}
        />
      )}
    </div>
  );
} 