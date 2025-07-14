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

interface Kitchen {
  id: number;
  name: string;
  is_active: boolean;
  capacity: {
    max_orders_per_hour: number;
    max_batches_per_day: number;
    current_orders: number;
    current_batches: number;
  };
}

interface KitchenZoneAssignment {
  kitchen_id: number;
  zone_id: number;
  is_primary: boolean;
  priority: number;
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
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedKitchens, setSelectedKitchens] = useState<KitchenZoneAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
    fetchTimeSlots();
    fetchKitchens();
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
      fetchZoneKitchens(zone.id);
    } else {
      setFormData({
        name: '',
        city_id: '',
        delivery_days: 0,
        time_slot_id: '',
        delivery_fee: 0.00,
        is_active: 1,
      });
      setSelectedKitchens([]);
    }
  }, [zone]);

  const fetchCities = async () => {
    try {
      console.log('Fetching cities...');
      const response = await fetch('/api/admin/cities');
      if (response.ok) {
        const data = await response.json();
        console.log('Cities loaded:', data);
        if (zone) {
          setCities(data);
        } else {
          setCities(data.filter((city: City) => city.is_active === 1));
        }
      } else {
        console.error('Failed to fetch cities:', response.statusText);
        toast.error('Failed to load cities');
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      toast.error('Failed to load cities');
    }
  };

  const fetchTimeSlots = async () => {
    try {
      console.log('Fetching time slots...');
      const response = await fetch('/api/admin/delivery-time-slots');
      if (response.ok) {
        const data = await response.json();
        console.log('Time slots loaded:', data);
        setTimeSlots(data.filter((slot: TimeSlot) => slot.is_active));
      } else {
        console.error('Failed to fetch time slots:', response.statusText);
        toast.error('Failed to load time slots');
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      toast.error('Failed to load time slots');
    }
  };

  const fetchKitchens = async () => {
    try {
      console.log('Fetching kitchens...');
      const response = await fetch('/api/admin/kitchens?includeCapacity=true');
      if (response.ok) {
        const data = await response.json();
        console.log('Kitchens loaded:', data);
        // Handle both array and object with data property
        const kitchensData = Array.isArray(data) ? data : (data.data || []);
        setKitchens(kitchensData);
      } else {
        console.error('Failed to fetch kitchens:', response.statusText);
        toast.error('Failed to load kitchens');
      }
    } catch (error) {
      console.error('Failed to fetch kitchens:', error);
      toast.error('Failed to load kitchens');
    }
  };

  const fetchZoneKitchens = async (zoneId: number) => {
    try {
      const response = await fetch(`/api/admin/zones/${zoneId}/kitchens`);
      if (response.ok) {
        const data = await response.json();
        setSelectedKitchens(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch zone kitchens:', error);
      setSelectedKitchens([]);
    }
  };

  const handleKitchenToggle = (kitchenId: number) => {
    const existingIndex = selectedKitchens.findIndex(k => k.kitchen_id === kitchenId);
    
    if (existingIndex >= 0) {
      // Remove kitchen
      const updated = selectedKitchens.filter(k => k.kitchen_id !== kitchenId);
      setSelectedKitchens(updated);
    } else {
      // Add kitchen with default priority
      const newAssignment: KitchenZoneAssignment = {
        kitchen_id: kitchenId,
        zone_id: zone?.id || 0,
        is_primary: selectedKitchens.length === 0, // First kitchen is primary
        priority: selectedKitchens.length + 1,
        is_active: true
      };
      setSelectedKitchens([...selectedKitchens, newAssignment]);
    }
  };

  const handlePriorityChange = (kitchenId: number, newPriority: number) => {
    const updated = selectedKitchens.map(k => {
      if (k.kitchen_id === kitchenId) {
        return { ...k, priority: newPriority };
      }
      return k;
    });
    setSelectedKitchens(updated);
  };

  const handlePrimaryToggle = (kitchenId: number) => {
    const updated = selectedKitchens.map(k => ({
      ...k,
      is_primary: k.kitchen_id === kitchenId
    }));
    setSelectedKitchens(updated);
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
        kitchen_assignments: selectedKitchens
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

  const getKitchenById = (kitchenId: number) => {
    return kitchens.find(k => k.id === kitchenId);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {zone ? 'Edit Zone' : 'Add New Zone'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Zone Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Kitchen Assignment Section */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Kitchen Assignments</h4>
              <p className="text-sm text-gray-600 mb-4">
                Select which kitchens will serve this zone and set their priority order.
              </p>

              {/* Available Kitchens */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Available Kitchens</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {kitchens.map((kitchen) => {
                    const isSelected = selectedKitchens.some(k => k.kitchen_id === kitchen.id);
                    const assignment = selectedKitchens.find(k => k.kitchen_id === kitchen.id);
                    
                    return (
                      <div
                        key={kitchen.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleKitchenToggle(kitchen.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h6 className="font-medium text-sm">{kitchen.name}</h6>
                            <p className="text-xs text-gray-500">
                              Capacity: {kitchen.capacity.max_orders_per_hour}/hr
                            </p>
                            <p className="text-xs text-gray-500">
                              Status: {kitchen.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleKitchenToggle(kitchen.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Kitchens with Priority */}
              {selectedKitchens.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Assigned Kitchens (Priority Order)</h5>
                  <div className="space-y-3">
                    {selectedKitchens
                      .sort((a, b) => a.priority - b.priority)
                      .map((assignment, index) => {
                        const kitchen = getKitchenById(assignment.kitchen_id);
                        if (!kitchen) return null;

                        return (
                          <div key={assignment.kitchen_id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1">
                              <span className="text-sm font-medium text-gray-500 w-8">
                                #{assignment.priority}
                              </span>
                              <div className="flex-1">
                                <h6 className="font-medium text-sm">{kitchen.name}</h6>
                                <p className="text-xs text-gray-500">
                                  Capacity: {kitchen.capacity.max_orders_per_hour}/hr
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={assignment.is_primary}
                                  onChange={() => handlePrimaryToggle(assignment.kitchen_id)}
                                  className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-1 text-xs text-gray-600">Primary</span>
                              </label>
                              
                              <select
                                value={assignment.priority}
                                onChange={(e) => handlePriorityChange(assignment.kitchen_id, parseInt(e.target.value))}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                {selectedKitchens.map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    Priority {i + 1}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
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