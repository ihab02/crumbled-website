'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface TimeSlot {
  id: number;
  name: string;
  from_hour: string;
  to_hour: string;
  available_days: string[];
  notes: string | null;
  is_active: boolean;
}

interface TimeSlotFormProps {
  timeSlot?: TimeSlot | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export default function TimeSlotForm({ timeSlot, onSubmit, onCancel }: TimeSlotFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    from_hour: '09:00',
    to_hour: '17:00',
    available_days: [] as string[],
    notes: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [allDaysChecked, setAllDaysChecked] = useState(false);

  useEffect(() => {
    if (timeSlot) {
      setFormData({
        name: timeSlot.name,
        from_hour: timeSlot.from_hour,
        to_hour: timeSlot.to_hour,
        available_days: timeSlot.available_days,
        notes: timeSlot.notes || '',
        is_active: timeSlot.is_active
      });
      setAllDaysChecked(timeSlot.available_days.length === DAYS_OF_WEEK.length);
    }
  }, [timeSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = timeSlot 
        ? `/api/admin/delivery-time-slots/${timeSlot.id}`
        : '/api/admin/delivery-time-slots';
      
      const method = timeSlot ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save time slot');
      }

      toast.success(timeSlot ? 'Time slot updated successfully' : 'Time slot created successfully');
      onSubmit();
    } catch (error) {
      toast.error('Failed to save time slot');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
    setAllDaysChecked(
      formData.available_days.length + (formData.available_days.includes(day) ? -1 : 1) === DAYS_OF_WEEK.length
    );
  };

  const handleSelectAllDays = () => {
    if (allDaysChecked) {
      setFormData(prev => ({ ...prev, available_days: [] }));
      setAllDaysChecked(false);
    } else {
      setFormData(prev => ({ ...prev, available_days: [...DAYS_OF_WEEK] }));
      setAllDaysChecked(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {timeSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Morning Slot, Afternoon Slot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Hour *
              </label>
              <input
                type="time"
                required
                value={formData.from_hour}
                onChange={(e) => setFormData(prev => ({ ...prev, from_hour: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Hour *
              </label>
              <input
                type="time"
                required
                value={formData.to_hour}
                onChange={(e) => setFormData(prev => ({ ...prev, to_hour: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Days *
              </label>
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allDaysChecked}
                    onChange={handleSelectAllDays}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-semibold">Select All</span>
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.available_days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {day}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Additional notes about this time slot..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (timeSlot ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 