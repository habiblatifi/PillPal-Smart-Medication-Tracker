import React, { useState, useEffect } from 'react';
import { Medication, TravelInfo } from '../types';
import { GlobeIcon, CalendarIcon, DownloadIcon, XIcon } from './icons';

interface TravelModeProps {
  medications: Medication[];
  travelInfo: TravelInfo;
  onUpdate: (info: TravelInfo) => void;
  onClose: () => void;
}

const TravelMode: React.FC<TravelModeProps> = ({
  medications,
  travelInfo,
  onUpdate,
  onClose,
}) => {
  const [isActive, setIsActive] = useState(travelInfo.isActive);
  const [departureDate, setDepartureDate] = useState(travelInfo.departureDate || '');
  const [returnDate, setReturnDate] = useState(travelInfo.returnDate || '');
  const [destinationTimezone, setDestinationTimezone] = useState(travelInfo.destinationTimezone || '');
  const [adjustedSchedule, setAdjustedSchedule] = useState(travelInfo.adjustedSchedule || {});

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  ];

  useEffect(() => {
    if (isActive && departureDate && destinationTimezone) {
      calculateAdjustedSchedule();
    }
  }, [isActive, departureDate, returnDate, destinationTimezone]);

  const calculateAdjustedSchedule = () => {
    if (!departureDate || !destinationTimezone) return;

    const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newSchedule: { [medId: string]: { [date: string]: string[] } } = {};

    medications.forEach(med => {
      if (!med.times || med.times.length === 0) return;

      const medSchedule: { [date: string]: string[] } = {};
      const startDate = new Date(departureDate);
      const endDate = returnDate ? new Date(returnDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const adjustedTimes: string[] = [];

        med.times.forEach(time => {
          // Convert time to destination timezone
          const [hours, minutes] = time.split(':').map(Number);
          const localDateTime = new Date(`${dateStr}T${time}:00`);
          
          // Simple timezone offset calculation (in production, use proper timezone library)
          const adjustedTime = adjustTimeForTimezone(localDateTime, localTZ, destinationTimezone);
          adjustedTimes.push(adjustedTime);
        });

        if (adjustedTimes.length > 0) {
          medSchedule[dateStr] = adjustedTimes;
        }
      }

      if (Object.keys(medSchedule).length > 0) {
        newSchedule[med.id] = medSchedule;
      }
    });

    setAdjustedSchedule(newSchedule);
  };

  const adjustTimeForTimezone = (date: Date, fromTZ: string, toTZ: string): string => {
    // Simplified timezone adjustment - in production, use a library like date-fns-tz
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    return `${hour}:${minute}`;
  };

  const handleSave = () => {
    const updatedInfo: TravelInfo = {
      isActive,
      departureDate: isActive ? departureDate : undefined,
      returnDate: isActive ? returnDate : undefined,
      destinationTimezone: isActive ? destinationTimezone : undefined,
      adjustedSchedule: isActive ? adjustedSchedule : undefined,
    };
    onUpdate(updatedInfo);
    onClose();
  };

  const generateTravelDocument = () => {
    const doc = {
      title: 'Medication Travel Schedule',
      generated: new Date().toISOString(),
      travelDates: {
        departure: departureDate,
        return: returnDate,
        timezone: destinationTimezone,
      },
      medications: medications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        times: med.times,
        adjustedTimes: adjustedSchedule[med.id] || {},
        food: med.food,
        quantity: med.quantity,
      })),
      emergencyContact: 'See Emergency Medical ID in app',
    };

    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pillpal-travel-schedule-${departureDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GlobeIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Travel Mode</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>Travel Mode</strong> adjusts your medication reminders for different timezones and generates a travel schedule document.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enable Travel Mode</label>
              <p className="text-xs text-gray-500">Adjust reminders for travel timezone</p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>

          {isActive && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Departure Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Return Date (Optional)
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  min={departureDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeIcon className="h-4 w-4 inline mr-1" />
                  Destination Timezone
                </label>
                <select
                  value={destinationTimezone}
                  onChange={(e) => setDestinationTimezone(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value="">Select timezone...</option>
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              {Object.keys(adjustedSchedule).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Adjusted Schedule Preview</h3>
                  <div className="space-y-2 text-sm">
                    {medications
                      .filter(med => adjustedSchedule[med.id])
                      .map(med => (
                        <div key={med.id} className="border-l-4 border-indigo-400 pl-3">
                          <p className="font-semibold text-gray-800">{med.name}</p>
                          <p className="text-gray-600">
                            Original: {med.times.join(', ')} → 
                            Adjusted: {Object.values(adjustedSchedule[med.id])[0]?.join(', ') || 'Calculating...'}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Always consult with your healthcare provider before making any changes to your medication schedule, especially when traveling across time zones.
                </p>
              </div>
            </div>
          )}

          {isActive && departureDate && destinationTimezone && (
            <button
              onClick={generateTravelDocument}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <DownloadIcon className="h-5 w-5" />
              Download Travel Schedule
            </button>
          )}
        </main>

        <footer className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Save Travel Mode
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TravelMode;

