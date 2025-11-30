import React, { useState, useEffect } from 'react';
import { Medication, DoseStatus } from '../types';
import { CheckCircleIcon, XIcon, BellIcon } from './icons';

interface EscalatingReminderProps {
  medication: Medication;
  date: string;
  time: string;
  stage: number; // 0 = first, 1 = follow-up, 2 = check-in
  onMarkTaken: () => void;
  onSkip: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

const EscalatingReminder: React.FC<EscalatingReminderProps> = ({
  medication,
  date,
  time,
  stage,
  onMarkTaken,
  onSkip,
  onSnooze,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const stageMessages = {
    0: "Time to take your medication",
    1: "Reminder: Don't forget your medication",
    2: "Check-in: Did you take your medication?",
  };

  const stageColors = {
    0: "bg-blue-500",
    1: "bg-orange-500",
    2: "bg-red-500",
  };

  const snoozeOptions = [
    { label: '5 min', minutes: 5 },
    { label: '10 min', minutes: 10 },
    { label: '15 min', minutes: 15 },
  ];

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] ${stageColors[stage as keyof typeof stageColors]} text-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <BellIcon className="h-6 w-6" />
          <div>
            <p className="font-bold text-lg">{medication.name}</p>
            <p className="text-sm opacity-90">{medication.dosage}</p>
            <p className="text-xs opacity-75 mt-1">{time}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <p className="text-sm mb-4 opacity-90">
        {stageMessages[stage as keyof typeof stageMessages]}
      </p>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => {
            setIsVisible(false);
            onMarkTaken();
          }}
          className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircleIcon className="h-5 w-5" />
          Mark as Taken
        </button>

        {/* Snooze Options */}
        {stage < 2 && (
          <div className="flex gap-2">
            {snoozeOptions.map(option => (
              <button
                key={option.minutes}
                onClick={() => {
                  setIsVisible(false);
                  onSnooze(option.minutes);
                }}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            setIsVisible(false);
            onSkip();
          }}
          className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Skip This Dose
        </button>
      </div>
    </div>
  );
};

export default EscalatingReminder;

