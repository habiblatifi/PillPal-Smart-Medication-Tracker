import React, { useState, useEffect } from 'react';
import { Medication, PRNConfig } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon } from './icons';
import { canTakePRN, recordPRNDose, isPRNMedication } from '../services/prnService';

interface PRNMedicationHandlerProps {
  medication: Medication;
  prnConfig: PRNConfig;
  onTake: (medicationId: string) => void;
  onUpdateConfig: (config: PRNConfig) => void;
}

const PRNMedicationHandler: React.FC<PRNMedicationHandlerProps> = ({
  medication,
  prnConfig,
  onTake,
  onUpdateConfig,
}) => {
  const [checkResult, setCheckResult] = useState<{ canTake: boolean; reason?: string; nextAvailableTime?: Date } | null>(null);

  useEffect(() => {
    const result = canTakePRN(medication, prnConfig);
    setCheckResult(result);
  }, [medication, prnConfig]);

  const handleTakeNow = () => {
    if (!checkResult?.canTake) return;

    const updatedConfig = recordPRNDose(prnConfig);
    onUpdateConfig(updatedConfig);
    onTake(medication.id);
  };

  if (!isPRNMedication(medication)) {
    return null;
  }

  const remainingToday = prnConfig.maxPerDay - prnConfig.takenToday;
  const nextAvailable = checkResult?.nextAvailableTime
    ? new Date(checkResult.nextAvailableTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">As-Needed (PRN) Medication</h3>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Taken Today</p>
            <p className="font-bold text-blue-800">{prnConfig.takenToday} / {prnConfig.maxPerDay}</p>
          </div>
          <div>
            <p className="text-gray-600">Remaining</p>
            <p className="font-bold text-blue-800">{remainingToday} doses</p>
          </div>
        </div>

        {checkResult && (
          <>
            {checkResult.canTake ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-800">Ready to Take</p>
                </div>
                <p className="text-sm text-green-700">
                  Minimum interval met. You can take this medication now.
                </p>
                <button
                  onClick={handleTakeNow}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Take Now
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-red-600" />
                  <p className="font-semibold text-red-800">Not Available Yet</p>
                </div>
                <p className="text-sm text-red-700 mb-2">{checkResult.reason}</p>
                {nextAvailable && (
                  <p className="text-xs text-red-600">
                    Next available: {nextAvailable}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Minimum Interval:</strong> {prnConfig.minIntervalHours} hours</p>
          <p><strong>Maximum Per Day:</strong> {prnConfig.maxPerDay} doses</p>
        </div>
      </div>
    </div>
  );
};

export default PRNMedicationHandler;

