'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DeliveryManForm from './DeliveryManForm';

interface DeliveryMan {
  id: number;
  name: string;
  id_number: string;
  home_address: string;
  mobile_phone: string;
  available_from_hour: string;
  available_to_hour: string;
  available_days: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DeliveryMenTab() {
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeliveryMan, setEditingDeliveryMan] = useState<DeliveryMan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDeliveryMen = async () => {
    try {
      const response = await fetch('/api/admin/delivery-men');
      if (!response.ok) {
        throw new Error('Failed to fetch delivery men');
      }
      const data = await response.json();
      setDeliveryMen(data);
    } catch (error) {
      toast.error('Failed to fetch delivery men');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryMen();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this delivery man?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/delivery-men/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete delivery man');
      }

      toast.success('Delivery man deleted successfully');
      fetchDeliveryMen();
    } catch (error) {
      toast.error('Failed to delete delivery man');
    }
  };

  const handleEdit = (deliveryMan: DeliveryMan) => {
    setEditingDeliveryMan(deliveryMan);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingDeliveryMan(null);
    fetchDeliveryMen();
  };

  const filteredDeliveryMen = deliveryMen.filter((deliveryMan) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      deliveryMan.name.toLowerCase().includes(searchLower) ||
      deliveryMan.id_number.toLowerCase().includes(searchLower) ||
      deliveryMan.mobile_phone.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return 'None';
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
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
            placeholder="Search delivery men..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Delivery Man
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available Days
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
            {filteredDeliveryMen.map((deliveryMan) => (
              <tr key={deliveryMan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {deliveryMan.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {deliveryMan.id_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {deliveryMan.mobile_phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTime(deliveryMan.available_from_hour)} - {formatTime(deliveryMan.available_to_hour)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDays(deliveryMan.available_days)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      deliveryMan.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {deliveryMan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(deliveryMan)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(deliveryMan.id)}
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

      {filteredDeliveryMen.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No delivery men found</p>
        </div>
      )}

      {showForm && (
        <DeliveryManForm
          deliveryMan={editingDeliveryMan}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingDeliveryMan(null);
          }}
        />
      )}
    </div>
  );
} 