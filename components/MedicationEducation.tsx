import React, { useState } from 'react';
import { Medication, MedicationEducation } from '../types';
import { InformationCircleIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from './icons';

interface MedicationEducationProps {
  medication: Medication;
  education?: MedicationEducation;
  onUpdateEducation?: (education: MedicationEducation) => void;
  compact?: boolean;
}

const MedicationEducation: React.FC<MedicationEducationProps> = ({
  medication,
  education,
  onUpdateEducation,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [purpose, setPurpose] = useState(education?.purpose || '');
  const [notes, setNotes] = useState(education?.summary || '');

  const handleSave = () => {
    if (onUpdateEducation) {
      const updatedEducation: MedicationEducation = {
        medicationId: medication.id,
        purpose: purpose.trim() || undefined,
        summary: notes.trim() || undefined,
        ...education,
      };
      onUpdateEducation(updatedEducation);
    }
    setIsEditing(false);
  };

  const commonPurposes = [
    'for blood pressure',
    'prevents migraines',
    'for nerve pain',
    'for heart health',
    'for diabetes',
    'for cholesterol',
    'for anxiety',
    'for depression',
    'for pain relief',
    'for inflammation',
  ];

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5" />
          <span className="font-semibold">Learn More</span>
        </div>
        <ChevronDownIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">About {medication.name}</h3>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you taking this medication?
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {commonPurposes.map(p => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    purpose === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Or enter your own reason..."
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this medication..."
              className="w-full border-gray-300 rounded-md shadow-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setPurpose(education?.purpose || '');
                setNotes(education?.summary || '');
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Purpose */}
          {education?.purpose && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-blue-900 mb-1">Purpose</p>
              <p className="text-sm text-blue-800">{education.purpose}</p>
            </div>
          )}

          {/* Summary */}
          {education?.summary && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Summary</p>
              <p className="text-sm text-gray-600 leading-relaxed">{education.summary}</p>
            </div>
          )}

          {/* How to Take */}
          {medication.food !== 'No specific instructions' && (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm font-semibold text-yellow-900 mb-1">How to Take</p>
              <p className="text-sm text-yellow-800">
                {medication.food === 'With food'
                  ? '🍽️ Take with food to reduce nausea and improve absorption.'
                  : '⏰ Take on an empty stomach (1 hour before or 2 hours after meals) for best absorption.'}
              </p>
            </div>
          )}

          {/* Drug Class */}
          {medication.drugClass && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Drug Class</p>
              <p className="text-sm text-gray-600">{medication.drugClass}</p>
            </div>
          )}

          {/* Side Effects */}
          {medication.sideEffects && (
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <p className="text-sm font-semibold text-red-900 mb-1">Common Side Effects</p>
              <p className="text-sm text-red-800 leading-relaxed">{medication.sideEffects}</p>
            </div>
          )}

          {/* Usage Note */}
          {medication.usageNote && (
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-semibold text-green-900 mb-1">Usage</p>
              <p className="text-sm text-green-800">{medication.usageNote}</p>
            </div>
          )}

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            {education ? 'Edit Information' : 'Add Information'}
          </button>
        </div>
      )}

      {/* Contextual Tips */}
      {!isEditing && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">💡 Tips</p>
          {medication.food === 'With food' && (
            <p className="text-xs text-gray-600 mb-1">
              Taking with food reduces nausea and improves absorption for many medications like this.
            </p>
          )}
          {medication.frequency.toLowerCase().includes('antibiotic') && (
            <p className="text-xs text-gray-600 mb-1">
              Try to keep antibiotic doses evenly spaced throughout the day for best effectiveness.
            </p>
          )}
          {medication.times.length > 2 && (
            <p className="text-xs text-gray-600">
              For multiple daily doses, spacing them evenly helps maintain consistent levels in your body.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicationEducation;

