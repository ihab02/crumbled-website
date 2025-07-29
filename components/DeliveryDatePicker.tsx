"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryDate {
  date: string;
  dayName: string;
  formattedDate: string;
  isToday: boolean;
  isTomorrow: boolean;
}

interface DeliveryDatePickerProps {
  zoneId: number | null;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  disabled?: boolean;
}

export default function DeliveryDatePicker({ 
  zoneId, 
  onDateSelect, 
  selectedDate, 
  disabled = false 
}: DeliveryDatePickerProps) {
  const [availableDates, setAvailableDates] = useState<DeliveryDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoneInfo, setZoneInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeWindowRestriction, setTimeWindowRestriction] = useState<any>(null);
  const [showAllDates, setShowAllDates] = useState(false);

  useEffect(() => {
    if (zoneId) {
      fetchAvailableDates();
      setShowAllDates(false); // Reset to show only selected date when zone changes
    } else {
      setAvailableDates([]);
      setZoneInfo(null);
      setShowAllDates(false);
    }
  }, [zoneId]);

  // Reset showAllDates when selectedDate changes externally
  useEffect(() => {
    setShowAllDates(false);
  }, [selectedDate]);

  const fetchAvailableDates = async () => {
    if (!zoneId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch time window restrictions first
      const timeWindowResponse = await fetch('/api/check-time-window');
      const timeWindowResult = await timeWindowResponse.json();
      
      if (timeWindowResult.success) {
        setTimeWindowRestriction(timeWindowResult.data);
      }
      
      // Fetch available delivery dates
      const response = await fetch(`/api/zones/available-delivery-dates?zoneId=${zoneId}&daysAhead=21`);
      const result = await response.json();
      
      if (result.success) {
        let dates = result.data.availableDeliveryDates;
        
        // Filter out next-day delivery if outside time window
        if (timeWindowResult.success && !timeWindowResult.data.nextDayDeliveryAvailable) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowString = tomorrow.toISOString().split('T')[0];
          
          dates = dates.filter((date: DeliveryDate) => {
            // Keep same-day delivery and dates beyond next-day
            const dateObj = new Date(date.date);
            const today = new Date();
            const dayDiff = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            return dayDiff !== 1; // Remove next-day delivery (dayDiff === 1)
          });
        }
        
        setAvailableDates(dates);
        setZoneInfo(result.data);
        
        // Auto-select the closest available date if no date is selected
        if (!selectedDate && dates.length > 0) {
          onDateSelect(dates[0].date);
        }
      } else {
        setError(result.error || 'Failed to fetch delivery dates');
        toast.error('Failed to load delivery dates');
      }
    } catch (error) {
      console.error('Error fetching delivery dates:', error);
      setError('Failed to load delivery dates');
      toast.error('Failed to load delivery dates');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    if (disabled) return;
    onDateSelect(date);
    setShowAllDates(false); // Hide the date list after selection
  };

  const getDateBadge = (date: DeliveryDate) => {
    if (date.isToday) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Today</Badge>;
    }
    if (date.isTomorrow) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Tomorrow</Badge>;
    }
    return null;
  };

  const getDeliveryTimeText = () => {
    if (!zoneInfo?.timeSlot) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="h-4 w-4" />
        <span>
          Delivery time: {zoneInfo.timeSlot.fromHour.substring(0, 5)} - {zoneInfo.timeSlot.toHour.substring(0, 5)}
        </span>
      </div>
    );
  };

  if (!zoneId) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Please select a delivery zone to see available dates</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading available dates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-red-200 bg-red-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAvailableDates}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {availableDates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No delivery dates available for this zone</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Date Display */}
          {selectedDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      {availableDates.find(d => d.date === selectedDate)?.formattedDate}
                    </div>
                    <div className="text-sm text-blue-700 capitalize">
                      {availableDates.find(d => d.date === selectedDate)?.dayName}
                    </div>
                    {/* Time Slot Information */}
                    {zoneInfo?.timeSlot && (
                      <div className="text-sm text-blue-600 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {zoneInfo.timeSlot.fromHour.substring(0, 5)} - {zoneInfo.timeSlot.toHour.substring(0, 5)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getDateBadge(availableDates.find(d => d.date === selectedDate)!)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllDates(!showAllDates)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    {showAllDates ? 'Hide Options' : 'Change Date'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* All Available Dates (Hidden by default) */}
          {showAllDates && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Select a different delivery date:
              </div>
              <div className="grid gap-2">
                {availableDates.map((date) => (
                  <Button
                    key={date.date}
                      variant={selectedDate === date.date ? "default" : "outline"}
                      className={`justify-between h-auto p-3 ${
                        selectedDate === date.date 
                          ? 'bg-blue-50 border-blue-200 text-blue-900' 
                          : 'hover:bg-gray-50'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleDateSelect(date.date)}
                      disabled={disabled}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="font-medium">{date.formattedDate}</div>
                          <div className="text-sm text-gray-500 capitalize">{date.dayName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDateBadge(date)}
                        {selectedDate === date.date && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {timeWindowRestriction && !timeWindowRestriction.nextDayDeliveryAvailable && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Next-Day Delivery Unavailable</p>
                <p className="text-xs mb-2">
                  Next-day delivery is currently unavailable due to order time restrictions.
                </p>
                {timeWindowRestriction.nextAvailableTime && (
                  <p className="text-xs">
                    <strong>Next available:</strong> {timeWindowRestriction.nextAvailableTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
} 