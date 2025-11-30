import React, { useState, useMemo } from 'react';
import { Medication, Caregiver, DoseStatus } from '../types';
import { UserIcon, EyeIcon, PencilIcon } from './icons';

interface CaregiverDashboardProps {
  medications: Medication[];
  caregivers: Caregiver[];
  currentDate: string;
  onMarkDose: (medicationId: string, date: string, time: string, status: DoseStatus) => void;
  accessLevel: 'view' | 'manage';
}

const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  medications,
  caregivers,
  currentDate,
  onMarkDose,
  accessLevel,
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const getDosesForDate = (date: string) => {
    const doses: Array<{ med: Medication; time: string; status?: DoseStatus }> = [];
    
    medications.forEach(med => {
      med.times.forEach(time => {
        const dateTimeKey = `${date}T${time}`;
        const status = med.doseStatus?.[dateTimeKey];
        doses.push({ med, time, status });
      });
    });

    return doses.sort((a, b) => a.time.localeCompare(b.time));
  };

  const todayDoses = useMemo(() => getDosesForDate(selectedDate), [selectedDate, medications]);
  const upcomingDoses = todayDoses.filter(dose => {
    const doseTime = new Date(`${selectedDate}T${dose.time}`);
    return doseTime > new Date() || !dose.status;
  });

  const adherenceStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    let totalDoses = 0;
    let takenDoses = 0;

    medications.forEach(med => {
      last7Days.forEach(date => {
        med.times.forEach(time => {
          totalDoses++;
          const dateTimeKey = `${date}T${time}`;
          if (med.doseStatus?.[dateTimeKey] === 'taken') {
            takenDoses++;
          }
        });
      });
    });

    return {
      percentage: totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0,
      taken: takenDoses,
      total: totalDoses,
    };
  }, [medications]);

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Caregiver Dashboard</h1>
              <p className="text-sm text-gray-500">
                {accessLevel === 'manage' ? 'Full Access' : 'View Only'}
              </p>
            </div>
          </div>
        </div>

        {/* Adherence Overview */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl mb-6">
          <h2 className="text-lg font-semibold mb-2">7-Day Adherence</h2>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-4xl font-bold">{adherenceStats.percentage}%</p>
              <p className="text-sm opacity-90">{adherenceStats.taken} of {adherenceStats.total} doses</p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">View Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Today's Medications */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Medications for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>

          {upcomingDoses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No medications scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDoses.map((dose, index) => {
                const isPast = new Date(`${selectedDate}T${dose.time}`) < new Date();
                const isTaken = dose.status === 'taken';
                const isSkipped = dose.status === 'skipped';

                return (
                  <div
                    key={`${dose.med.id}-${dose.time}-${index}`}
                    className={`p-4 rounded-lg border-2 ${
                      isTaken
                        ? 'bg-green-50 border-green-300'
                        : isSkipped
                        ? 'bg-gray-50 border-gray-300'
                        : isPast
                        ? 'bg-red-50 border-red-300'
                        : 'bg-blue-50 border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{dose.med.name}</h3>
                        <p className="text-sm text-gray-600">{dose.med.dosage}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-1">
                          {dose.time}
                          {isPast && !isTaken && (
                            <span className="ml-2 text-red-600">(Missed)</span>
                          )}
                        </p>
                      </div>

                      {accessLevel === 'manage' && !isTaken && !isSkipped && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onMarkDose(dose.med.id, selectedDate, dose.time, 'taken')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                          >
                            Mark Taken
                          </button>
                          <button
                            onClick={() => onMarkDose(dose.med.id, selectedDate, dose.time, 'skipped')}
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-semibold hover:bg-gray-500"
                          >
                            Skip
                          </button>
                        </div>
                      )}

                      {isTaken && (
                        <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                          ✓ Taken
                        </span>
                      )}

                      {isSkipped && (
                        <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-semibold">
                          Skipped
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaregiverDashboard;

