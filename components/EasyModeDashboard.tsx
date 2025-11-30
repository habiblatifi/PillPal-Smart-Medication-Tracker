import React from 'react';
import { Medication, DoseStatus } from '../types';
import { CheckCircleIcon, XIcon } from './icons';

interface EasyModeDashboardProps {
  medications: Medication[];
  updateDoseStatus: (id: string, date: string, time: string, status: DoseStatus | null) => void;
  todayString: string;
}

const EasyModeDashboard: React.FC<EasyModeDashboardProps> = ({
  medications,
  updateDoseStatus,
  todayString,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's doses
  const todayDoses = medications.flatMap(med => 
    med.times.map(time => ({
      med,
      time,
      status: med.doseStatus?.[`${todayString}T${time}`] as DoseStatus | undefined,
    }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const upcomingDoses = todayDoses.filter(dose => {
    const doseTime = new Date(`${todayString}T${dose.time}`);
    return doseTime > new Date() || !dose.status;
  });

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Today's Medications</h1>
        <p className="text-lg text-gray-600">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {upcomingDoses.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">All done for today!</p>
          <p className="text-gray-500 mt-2">Great job taking your medications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingDoses.map((dose, index) => {
            const isPast = new Date(`${todayString}T${dose.time}`) < new Date();
            const isTaken = dose.status === 'taken';
            const isSkipped = dose.status === 'skipped';

            return (
              <div
                key={`${dose.med.id}-${dose.time}-${index}`}
                className={`bg-white p-6 rounded-2xl shadow-lg border-4 ${
                  isTaken
                    ? 'border-green-500 bg-green-50'
                    : isSkipped
                    ? 'border-gray-400 bg-gray-50'
                    : isPast
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {dose.med.name}
                  </h2>
                  <p className="text-lg text-gray-600">{dose.med.dosage}</p>
                  <p className="text-xl font-semibold text-gray-700 mt-2">
                    {dose.time}
                  </p>
                </div>

                <div className="flex gap-3">
                  {!isTaken && !isSkipped && (
                    <>
                      <button
                        onClick={() => updateDoseStatus(dose.med.id, todayString, dose.time, 'taken')}
                        className="flex-1 bg-green-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="h-8 w-8" />
                        TAKEN
                      </button>
                      <button
                        onClick={() => updateDoseStatus(dose.med.id, todayString, dose.time, 'skipped')}
                        className="flex-1 bg-gray-400 text-white py-4 rounded-xl text-xl font-bold hover:bg-gray-500 transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <XIcon className="h-8 w-8" />
                        SKIP
                      </button>
                    </>
                  )}
                  {isTaken && (
                    <div className="flex-1 bg-green-100 text-green-800 py-4 rounded-xl text-xl font-bold text-center">
                      ✓ TAKEN
                    </div>
                  )}
                  {isSkipped && (
                    <div className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-xl text-xl font-bold text-center">
                      SKIPPED
                    </div>
                  )}
                </div>

                {dose.med.food !== 'No specific instructions' && (
                  <p className="text-center mt-3 text-sm font-medium text-gray-600">
                    {dose.med.food === 'With food' ? '🍽️ Take with food' : '⏰ Take without food'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EasyModeDashboard;

