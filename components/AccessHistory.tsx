import React, { useState, useMemo } from 'react';
import { DownloadIcon, TrashIcon } from './icons';
import { getAuditLogs, getFilteredAuditLogs, clearAuditLogs, exportAuditLogs, AuditLogEntry } from '../services/auditLogService';

interface AccessHistoryProps {
  onClose: () => void;
}

const AccessHistory: React.FC<AccessHistoryProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<{
    action?: AuditLogEntry['action'];
    resource?: AuditLogEntry['resource'];
    startDate?: string;
    endDate?: string;
  }>({});

  const logs = useMemo(() => {
    return getFilteredAuditLogs(filter);
  }, [filter]);

  const handleExport = () => {
    const logData = exportAuditLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pillpal-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      clearAuditLogs();
      window.location.reload();
    }
  };

  const actionColors: { [key: string]: string } = {
    add: 'bg-green-100 text-green-800',
    edit: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    view: 'bg-gray-100 text-gray-800',
    export: 'bg-purple-100 text-purple-800',
    share: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Access History & Audit Logs</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-gray-800 mb-2">Filters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={filter.action || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value as AuditLogEntry['action'] || undefined }))}
                  className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="add">Add</option>
                  <option value="edit">Edit</option>
                  <option value="delete">Delete</option>
                  <option value="view">View</option>
                  <option value="export">Export</option>
                  <option value="share">Share</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <select
                  value={filter.resource || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, resource: e.target.value as AuditLogEntry['resource'] || undefined }))}
                  className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                >
                  <option value="">All Resources</option>
                  <option value="medication">Medication</option>
                  <option value="symptom">Symptom</option>
                  <option value="settings">Settings</option>
                  <option value="data">Data</option>
                  <option value="report">Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filter.startDate || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                  className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filter.endDate || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                  className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                />
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                Logs ({logs.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-1"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No logs found</p>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-xs text-gray-500">ID: {log.resourceId}</span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-xs text-gray-600">{log.details}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
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

export default AccessHistory;

