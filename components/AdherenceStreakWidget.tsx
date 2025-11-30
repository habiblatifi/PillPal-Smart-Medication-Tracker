import React from 'react';
import { AdherenceStreak, Badge } from '../types';
import { calculateAdherenceStreak, getEarnedBadges, getMotivationalMessage } from '../services/adherenceService';
import { Medication } from '../types';
import { FireIcon, TrophyIcon } from './icons';

interface AdherenceStreakWidgetProps {
  medications: Medication[];
  compact?: boolean;
}

const AdherenceStreakWidget: React.FC<AdherenceStreakWidgetProps> = ({ medications, compact = false }) => {
  const streak = calculateAdherenceStreak(medications);
  const badges = getEarnedBadges(streak);
  const message = getMotivationalMessage(streak);

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Current Streak</p>
            <p className="text-3xl font-bold flex items-center gap-2">
              <FireIcon className="h-8 w-8" />
              {streak.currentStreak} days
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Best Streak</p>
            <p className="text-2xl font-bold">{streak.longestStreak} days</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Your Streak</h3>
        {badges.length > 0 && (
          <div className="flex gap-2">
            {badges.slice(0, 3).map(badge => (
              <span key={badge.id} className="text-2xl" title={badge.description}>
                {badge.icon}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-indigo-600 flex items-center justify-center gap-2">
            <FireIcon className="h-8 w-8" />
            {streak.currentStreak}
          </p>
          <p className="text-sm text-gray-600 mt-1">Current Streak</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600 flex items-center justify-center gap-2">
            <TrophyIcon className="h-8 w-8" />
            {streak.longestStreak}
          </p>
          <p className="text-sm text-gray-600 mt-1">Best Streak</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{streak.totalDosesTaken}</p>
          <p className="text-sm text-gray-600 mt-1">Total Doses</p>
        </div>
      </div>

      {streak.milestones.filter(m => m.achieved).length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Recent Achievements</p>
          <div className="flex flex-wrap gap-2">
            {streak.milestones
              .filter(m => m.achieved)
              .slice(0, 3)
              .map(milestone => (
                <span
                  key={milestone.id}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"
                >
                  {milestone.type === 'days' ? `${milestone.target} days` : `${milestone.target} doses`}
                </span>
              ))}
          </div>
        </div>
      )}

      {message && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700 italic">{message}</p>
        </div>
      )}
    </div>
  );
};

export default AdherenceStreakWidget;

