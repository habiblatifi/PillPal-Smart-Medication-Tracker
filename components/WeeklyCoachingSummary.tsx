import React, { useState } from 'react';
import { WeeklyCoachingSummary as CoachingSummary } from '../types';
import { TrophyIcon, FireIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface WeeklyCoachingSummaryProps {
  summary: CoachingSummary;
  compact?: boolean;
}

const WeeklyCoachingSummary: React.FC<WeeklyCoachingSummaryProps> = ({ summary, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const weekEnd = new Date(summary.weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = `${new Date(summary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const adherenceColor = summary.adherencePercentage >= 90
    ? 'text-green-600'
    : summary.adherencePercentage >= 75
    ? 'text-yellow-600'
    : 'text-red-600';

  if (compact && !isExpanded) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Weekly Adherence</p>
            <p className="text-3xl font-bold">{summary.adherencePercentage}%</p>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronDownIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Weekly Summary</h3>
          <p className="text-sm text-gray-600 mt-1">{weekRange}</p>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Adherence Percentage */}
      <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <p className="text-sm text-gray-600 mb-2">Adherence Rate</p>
        <p className={`text-5xl font-bold ${adherenceColor} mb-2`}>
          {summary.adherencePercentage}%
        </p>
        <p className="text-sm text-gray-600">
          {summary.takenDoses} of {summary.totalDoses} doses taken
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{summary.takenDoses}</p>
          <p className="text-xs text-gray-600 mt-1">Taken</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{summary.missedDoses}</p>
          <p className="text-xs text-gray-600 mt-1">Missed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.totalDoses}</p>
          <p className="text-xs text-gray-600 mt-1">Total</p>
        </div>
      </div>

      {/* Time Window Analysis */}
      {(summary.bestTimeWindow !== 'N/A' || summary.worstTimeWindow !== 'N/A') && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Time Window Analysis</p>
          <div className="space-y-2">
            {summary.bestTimeWindow !== 'N/A' && (
              <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                <span className="text-sm text-gray-700">Best:</span>
                <span className="text-sm font-semibold text-green-700 capitalize">
                  {summary.bestTimeWindow}
                </span>
              </div>
            )}
            {summary.worstTimeWindow !== 'N/A' && (
              <div className="flex items-center justify-between bg-red-50 p-2 rounded-lg">
                <span className="text-sm text-gray-700">Needs Improvement:</span>
                <span className="text-sm font-semibold text-red-700 capitalize">
                  {summary.worstTimeWindow}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievements */}
      {summary.achievements.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            <p className="text-sm font-semibold text-gray-700">Achievements</p>
          </div>
          <div className="space-y-1">
            {summary.achievements.map((achievement, index) => (
              <p key={index} className="text-sm text-gray-700 bg-yellow-50 p-2 rounded-lg">
                {achievement}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {summary.suggestions.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FireIcon className="h-5 w-5 text-orange-500" />
            <p className="text-sm font-semibold text-gray-700">Suggestions</p>
          </div>
          <div className="space-y-1">
            {summary.suggestions.map((suggestion, index) => (
              <p key={index} className="text-sm text-gray-700 bg-blue-50 p-2 rounded-lg">
                💡 {suggestion}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCoachingSummary;

