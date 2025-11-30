import React, { useState } from 'react';
import { BehavioralPattern, Medication } from '../types';
import { AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from './icons';

interface BehavioralPatternAlertProps {
  patterns: BehavioralPattern[];
  medications: Medication[];
  onAcceptSuggestion: (patternId: string, medicationId: string, suggestion: string) => void;
  onDismiss: (patternId: string) => void;
}

const BehavioralPatternAlert: React.FC<BehavioralPatternAlertProps> = ({
  patterns,
  medications,
  onAcceptSuggestion,
  onDismiss,
}) => {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(new Set());

  if (patterns.length === 0) {
    return null;
  }

  const activePatterns = patterns.filter(p => !dismissedPatterns.has(p.medicationId + p.patternType));

  if (activePatterns.length === 0) {
    return null;
  }

  const getMedicationName = (medicationId: string) => {
    const med = medications.find(m => m.id === medicationId);
    return med ? `${med.name} ${med.dosage}` : 'Unknown medication';
  };

  const getDayName = (day?: number) => {
    if (day === undefined) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getPatternDescription = (pattern: BehavioralPattern) => {
    switch (pattern.patternType) {
      case 'missed_day':
        return `You often miss doses on ${getDayName(pattern.dayOfWeek)} (${pattern.frequency} times)`;
      case 'late_time':
        return `Your ${pattern.timeWindow} doses are frequently late (${pattern.frequency} times)`;
      case 'frequent_snooze':
        return `You frequently snooze ${pattern.timeWindow} reminders (${pattern.frequency} times)`;
      default:
        return 'Pattern detected';
    }
  };

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-800 p-4 rounded-r-lg shadow-lg" role="alert">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center flex-1">
          <AlertTriangleIcon className="h-6 w-6 text-orange-500 mr-4" />
          <div className="flex-1">
            <p className="font-bold">Pattern Detected</p>
            <p className="text-sm opacity-90">We noticed some patterns in your medication routine</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {activePatterns.map((pattern, index) => {
          const patternId = `${pattern.medicationId}-${pattern.patternType}-${index}`;
          const isExpanded = expandedPattern === patternId;

          return (
            <div key={patternId} className="bg-orange-100 p-3 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">
                    {getMedicationName(pattern.medicationId)}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    {getPatternDescription(pattern)}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedPattern(isExpanded ? null : patternId)}
                  className="ml-2 p-1 rounded-full hover:bg-orange-200 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-orange-700" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-orange-700" />
                  )}
                </button>
              </div>

              {isExpanded && pattern.suggestion && (
                <div className="mt-3 pt-3 border-t border-orange-300 animate-fade-in">
                  <p className="text-sm font-semibold text-orange-900 mb-2">Suggestion:</p>
                  <p className="text-sm text-orange-800 mb-3">{pattern.suggestion}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onAcceptSuggestion(patternId, pattern.medicationId, pattern.suggestion!);
                        setDismissedPatterns(prev => new Set([...prev, patternId]));
                        setExpandedPattern(null);
                      }}
                      className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Apply Suggestion
                    </button>
                    <button
                      onClick={() => {
                        onDismiss(patternId);
                        setDismissedPatterns(prev => new Set([...prev, patternId]));
                        setExpandedPattern(null);
                      }}
                      className="px-4 py-2 bg-orange-200 text-orange-800 rounded-lg text-sm font-semibold hover:bg-orange-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BehavioralPatternAlert;

