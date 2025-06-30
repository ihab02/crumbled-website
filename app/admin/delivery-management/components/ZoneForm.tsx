'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Zone {
  id: number;
  name: string;
  city_id: number;
  city_name: string;
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

interface City {
  id: number;
  name: string;
  is_active: number;
}

interface TimeSlot {
  id: number;
  name: string;
  from_hour: string;
  to_hour: string;
  is_active: boolean;
}

interface ZoneFormProps {
  zone?: Zone | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ZoneForm({ zone, onSubmit, onCancel }: ZoneFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    city_id: '',
    delivery_days: 0,
    time_slot_id: '',
    delivery_fee: 0.00,
    is_active: 1,
  });
  const [cities, setCities] = useState<City[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
    fetchTimeSlots();
  }, [zone]);

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        city_id: zone.city_id.toString(),
        delivery_days: zone.delivery_days,
        time_slot_id: zone.time_slot_id?.toString() || '',
        delivery_fee: Number(zone.delivery_fee || 0),
        is_active: zone.is_active,
      });
    } else {
      setFormData({
        name: '',
        city_id: '',
        delivery_days: 0,
        time_slot_id: '',
        delivery_fee: 0.00,
        is_active: 1,
      });
    }
  }, [zone]);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/admin/cities');
      if (response.ok) {
        const data = await response.json();
        if (zone) {
          setCities(data);
        } else {
          setCities(data.filter((city: City) => city.is_active === 1));
        }
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch('/api/admin/delivery-time-slots');
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data.filter((slot: TimeSlot) => slot.is_active));
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = zone ? `/api/admin/zones/${zone.id}` : '/api/admin/zones';
      const method = zone ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        city_id: parseInt(formData.city_id),
        delivery_days: parseInt(formData.delivery_days.toString()),
        time_slot_id: formData.time_slot_id ? parseInt(formData.time_slot_id) : null,
        delivery_fee: parseFloat(formData.delivery_fee.toString()),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to save zone');
      }

      toast.success(zone ? 'Zone updated successfully' : 'Zone created successfully');
      onSubmit();
    } catch (error) {
      toast.error('Failed to save zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {zone ? 'Edit Zone' : 'Add New Zone'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Zone Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="city_id" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <select
                id="city_id"
                value={formData.city_id}
                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} {city.is_active !== 1 && '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="delivery_days" className="block text-sm font-medium text-gray-700">
                Delivery Days
              </label>
              <select
                id="delivery_days"
                value={formData.delivery_days}
                onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value={0}>Same day (0 days)</option>
                <option value={1}>Next day (1 day)</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={4}>4 days</option>
                <option value={5}>5 days</option>
                <option value={6}>6 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>

            <div>
              <label htmlFor="time_slot_id" className="block text-sm font-medium text-gray-700">
                Time Slot (Optional)
              </label>
              <select
                id="time_slot_id"
                value={formData.time_slot_id}
                onChange={(e) => setFormData({ ...formData, time_slot_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">No time slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} ({slot.from_hour} - {slot.to_hour})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700">
                Delivery Fee (EGP)
              </label>
              <input
                type="number"
                id="delivery_fee"
                step="0.01"
                min="0"
                value={formData.delivery_fee}
                onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (zone ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 