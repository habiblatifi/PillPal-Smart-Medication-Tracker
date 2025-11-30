import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { CalendarIcon, CheckCircleIcon, XIcon } from './icons';
import { generateCheckInReminders, markCheckInComplete, CheckInReminder } from '../services/periodicCheckInService';

interface PeriodicCheckInProps {
  medications: Medication[];
  onDismiss: (reminderId: string) => void;
}

const PeriodicCheckIn: React.FC<PeriodicCheckInProps> = ({
  medications,
  onDismiss,
}) => {
  const [reminders, setReminders] = useState<CheckInReminder[]>([]);

  useEffect(() => {
    const newReminders = generateCheckInReminders(medications);
    // Filter dismissed reminders
    const dismissed = JSON.parse(localStorage.getItem('dismissedCheckIns') || '[]');
    const activeReminders = newReminders.filter(r => !dismissed.includes(r.id));
    setReminders(activeReminders);
  }, [medications]);

  const handleComplete = (reminder: CheckInReminder) => {
    const type = reminder.id.startsWith('checkin') ? 'checkin' : 'review';
    markCheckInComplete(reminder.medicationId, type);
    onDismiss(reminder.id);
    setReminders(prev => prev.filter(r => r.id !== reminder.id));
  };

  const handleDismiss = (reminderId: string) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedCheckIns') || '[]');
    dismissed.push(reminderId);
    localStorage.setItem('dismissedCheckIns', JSON.stringify(dismissed));
    onDismiss(reminderId);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-3">
      {reminders.map(reminder => {
        const priorityColors = {
          high: 'bg-red-50 border-red-500 text-red-800',
          medium: 'bg-yellow-50 border-yellow-500 text-yellow-800',
          low: 'bg-blue-50 border-blue-500 text-blue-800',
        };

        return (
          <div
            key={reminder.id}
            className={`border-l-4 rounded-r-lg p-4 shadow-lg ${priorityColors[reminder.priority]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <CalendarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Periodic Check-In: {reminder.medicationName}</h4>
                  <p className="text-sm leading-relaxed mb-2">{reminder.message}</p>
                  {reminder.nextCheckIn && (
                    <p className="text-xs opacity-75">
                      Next check-in: {new Date(reminder.nextCheckIn).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleComplete(reminder)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-1"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Done
                </button>
                <button
                  onClick={() => handleDismiss(reminder.id)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PeriodicCheckIn;

