import React, { useState } from 'react';
import { DownloadIcon, TrashIcon, UploadIcon, ShareIcon, XIcon } from './icons';
import { exportAllData, downloadBackup, emailBackup, restoreFromFile, clearAllData } from '../services/backupService';

interface DataManagementProps {
  onClose: () => void;
  onDataCleared: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onClose, onDataCleared }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDownload = () => {
    downloadBackup();
    alert('Backup downloaded successfully!');
  };

  const handleEmail = () => {
    emailBackup();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const result = await restoreFromFile(file);
    setIsRestoring(false);

    if (result.success) {
      alert('Data restored successfully! Please refresh the page.');
      window.location.reload();
    } else {
      alert(`Restore failed: ${result.errors.join(', ')}`);
    }
  };

  const handleDeleteAll = () => {
    if (showDeleteConfirm) {
      clearAllData();
      alert('All data has been deleted. The page will reload.');
      onDataCleared();
      window.location.reload();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const backupData = exportAllData();
  const dataSize = JSON.stringify(backupData).length;
  const dataSizeKB = (dataSize / 1024).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Data Management</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Data Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Your Data</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {backupData.medications.length} medications</p>
              <p>• {backupData.symptomEntries.length} symptom entries</p>
              <p>• Data size: {dataSizeKB} KB</p>
              <p>• Last exported: {new Date(backupData.exported).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Export & Backup</h3>
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <DownloadIcon className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Download Backup</p>
                    <p className="text-xs text-gray-600">Save to your device</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleEmail}
                className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <ShareIcon className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Email Backup</p>
                    <p className="text-xs text-gray-600">Send to your email</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Restore */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Restore from Backup</h3>
            <label className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <UploadIcon className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Restore from File</p>
                  <p className="text-xs text-gray-600">Upload a backup file</p>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
                disabled={isRestoring}
              />
            </label>
            {isRestoring && (
              <p className="text-sm text-purple-600 mt-2">Restoring data...</p>
            )}
          </div>

          {/* Delete All Data */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-red-800 mb-3">Danger Zone</h3>
            {!showDeleteConfirm ? (
              <button
                onClick={handleDeleteAll}
                className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <TrashIcon className="h-5 w-5 text-red-600" />
                  <div className="text-left">
                    <p className="font-semibold text-red-800">Delete All Data</p>
                    <p className="text-xs text-red-600">Permanently remove all your data</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="font-semibold text-red-800 mb-2">⚠️ Confirm Deletion</p>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently delete ALL your data including medications, symptoms, and settings. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="p-4 bg-gray-50 border-t flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DataManagement;

