import React, { useState } from 'react';
import { EmergencyInfo, Medication } from '../types';
import { AlertTriangleIcon, PencilIcon, XIcon } from './icons';

interface EmergencyMedicalIDProps {
  emergencyInfo: EmergencyInfo;
  medications: Medication[];
  onUpdate: (info: EmergencyInfo) => void;
  isLockScreen?: boolean;
}

const EmergencyMedicalID: React.FC<EmergencyMedicalIDProps> = ({
  emergencyInfo,
  medications,
  onUpdate,
  isLockScreen = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EmergencyInfo>(emergencyInfo);

  const criticalMedications = medications
    .filter(med => {
      // Consider medications critical if they're for serious conditions
      const criticalClasses = ['anticoagulant', 'insulin', 'heart', 'blood pressure', 'seizure', 'epilepsy'];
      const medClass = med.drugClass?.toLowerCase() || '';
      return criticalClasses.some(c => medClass.includes(c));
    })
    .map(med => med.name);

  const handleSave = () => {
    onUpdate({
      ...formData,
      criticalMedications: formData.criticalMedications.length > 0 
        ? formData.criticalMedications 
        : criticalMedications,
    });
    setIsEditing(false);
  };

  if (isLockScreen) {
    // Lock screen version - minimal, always visible
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 z-[200] border-t-4 border-red-800">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangleIcon className="h-5 w-5" />
            <p className="font-bold text-sm">EMERGENCY MEDICAL INFORMATION</p>
          </div>
          <div className="text-xs space-y-1">
            <p><strong>Name:</strong> {emergencyInfo.name}</p>
            <p><strong>Contact:</strong> {emergencyInfo.emergencyContact} - {emergencyInfo.emergencyPhone}</p>
            {emergencyInfo.criticalMedications.length > 0 && (
              <p><strong>Critical Meds:</strong> {emergencyInfo.criticalMedications.slice(0, 3).join(', ')}</p>
            )}
            {emergencyInfo.allergies.length > 0 && (
              <p><strong>Allergies:</strong> {emergencyInfo.allergies.join(', ')}</p>
            )}
            {emergencyInfo.conditions.length > 0 && (
              <p><strong>Conditions:</strong> {emergencyInfo.conditions.slice(0, 2).join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            Emergency Medical ID
          </h3>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData(emergencyInfo);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label>
            <input
              type="tel"
              value={formData.emergencyPhone}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Critical Medications (comma-separated)</label>
            <input
              type="text"
              value={formData.criticalMedications.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                criticalMedications: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              })}
              className="w-full border-gray-300 rounded-md shadow-sm"
              placeholder="e.g., Warfarin, Insulin, Metformin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies (comma-separated)</label>
            <input
              type="text"
              value={formData.allergies.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              })}
              className="w-full border-gray-300 rounded-md shadow-sm"
              placeholder="e.g., Penicillin, Latex"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions (comma-separated)</label>
            <input
              type="text"
              value={formData.conditions.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                conditions: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              })}
              className="w-full border-gray-300 rounded-md shadow-sm"
              placeholder="e.g., Diabetes, Hypertension"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type (Optional)</label>
              <select
                value={formData.bloodType || ''}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value || undefined })}
                className="w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Not specified</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name (Optional)</label>
            <input
              type="text"
              value={formData.doctorName || ''}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value || undefined })}
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Phone (Optional)</label>
            <input
              type="tel"
              value={formData.doctorPhone || ''}
              onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value || undefined })}
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData(emergencyInfo);
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-4 border-red-600 p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="h-6 w-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-800">Emergency Medical ID</h3>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-600 hover:bg-red-100 rounded-full transition-colors"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-gray-700">Name:</p>
          <p className="text-gray-800">{emergencyInfo.name || 'Not set'}</p>
        </div>

        <div>
          <p className="font-semibold text-gray-700">Emergency Contact:</p>
          <p className="text-gray-800">
            {emergencyInfo.emergencyContact} - {emergencyInfo.emergencyPhone}
          </p>
        </div>

        {emergencyInfo.criticalMedications.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700">Critical Medications:</p>
            <p className="text-gray-800">{emergencyInfo.criticalMedications.join(', ')}</p>
          </div>
        )}

        {emergencyInfo.allergies.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700">Allergies:</p>
            <p className="text-gray-800">{emergencyInfo.allergies.join(', ')}</p>
          </div>
        )}

        {emergencyInfo.conditions.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700">Medical Conditions:</p>
            <p className="text-gray-800">{emergencyInfo.conditions.join(', ')}</p>
          </div>
        )}

        {emergencyInfo.bloodType && (
          <div>
            <p className="font-semibold text-gray-700">Blood Type:</p>
            <p className="text-gray-800">{emergencyInfo.bloodType}</p>
          </div>
        )}

        {emergencyInfo.doctorName && (
          <div>
            <p className="font-semibold text-gray-700">Doctor:</p>
            <p className="text-gray-800">
              {emergencyInfo.doctorName}
              {emergencyInfo.doctorPhone && ` - ${emergencyInfo.doctorPhone}`}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-red-300">
        <p className="text-xs text-gray-600">
          💡 This information is accessible from your lock screen for emergency responders.
        </p>
      </div>
    </div>
  );
};

export default EmergencyMedicalID;

