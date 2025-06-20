'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Zone {
  id: number;
  name: string;
  delivery_fee: number;
  is_active: boolean;
}

interface City {
  id: number;
  name: string;
  is_active: boolean;
  zones: Zone[];
}

export default function LocationsPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCity, setNewCity] = useState({ name: '', zones: [] as { name: string; delivery_fee: number }[] });
  const [newZone, setNewZone] = useState({ cityId: '', name: '', delivery_fee: 0 });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      const data = await response.json();
      setCities(data);
    } catch (error) {
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCity)
      });

      if (!response.ok) {
        throw new Error('Failed to add city');
      }

      toast.success('City added successfully');
      setNewCity({ name: '', zones: [] });
      fetchLocations();
    } catch (error) {
      toast.error('Failed to add city');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/locations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newZone)
      });

      if (!response.ok) {
        throw new Error('Failed to add zone');
      }

      toast.success('Zone added successfully');
      setNewZone({ cityId: '', name: '', delivery_fee: 0 });
      fetchLocations();
    } catch (error) {
      toast.error('Failed to add zone');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (type: 'city' | 'zone', id: number, currentStatus: boolean) => {
    setLoading(true);

    try {
      const response = await fetch('/api/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          id,
          isActive: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${type} status`);
      }

      toast.success(`${type} status updated successfully`);
      fetchLocations();
    } catch (error) {
      toast.error(`Failed to update ${type} status`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Locations</h1>

        {/* Add City Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New City</h2>
          <form onSubmit={handleAddCity} className="space-y-4">
            <div>
              <label htmlFor="cityName" className="block text-sm font-medium text-gray-700">
                City Name
              </label>
              <input
                type="text"
                id="cityName"
                value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add City
            </button>
          </form>
        </div>

        {/* Add Zone Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Zone</h2>
          <form onSubmit={handleAddZone} className="space-y-4">
            <div>
              <label htmlFor="citySelect" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <select
                id="citySelect"
                value={newZone.cityId}
                onChange={(e) => setNewZone({ ...newZone, cityId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="zoneName" className="block text-sm font-medium text-gray-700">
                Zone Name
              </label>
              <input
                type="text"
                id="zoneName"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700">
                Delivery Fee
              </label>
              <input
                type="number"
                id="deliveryFee"
                value={newZone.delivery_fee}
                onChange={(e) => setNewZone({ ...newZone, delivery_fee: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
                min="0"
                step="0.01"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Zone
            </button>
          </form>
        </div>

        {/* Cities and Zones List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Cities and Zones</h2>
          </div>
          <div className="border-t border-gray-200">
            {cities.map((city) => (
              <div key={city.id} className="border-b border-gray-200 last:border-b-0">
                <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{city.name}</h3>
                    <button
                      onClick={() => handleToggleStatus('city', city.id, city.is_active)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        city.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {city.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                {city.zones.length > 0 && (
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {city.zones.map((zone) => (
                        <div
                          key={zone.id}
                          className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{zone.name}</h4>
                            <p className="text-sm text-gray-500">
                              Delivery Fee: EGP {zone.delivery_fee.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleStatus('zone', zone.id, zone.is_active)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              zone.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {zone.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 