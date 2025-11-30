import React, { useState, useMemo } from 'react';
import { Medication } from '../types';
import { ClockIcon, StarIcon } from './icons';

interface QuickAddMedicationProps {
  medications: Medication[];
  onSelect: (medication: Medication) => void;
  onClose: () => void;
}

const QuickAddMedication: React.FC<QuickAddMedicationProps> = ({
  medications,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Get recently used medications (last 30 days)
  const recentMedications = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return medications
      .filter(med => {
        // Check if medication was used recently (has dose status in last 30 days)
        if (!med.doseStatus) return false;
        
        const recentDates = Object.keys(med.doseStatus)
          .map(key => key.split('T')[0])
          .filter(date => new Date(date) >= thirtyDaysAgo);
        
        return recentDates.length > 0;
      })
      .sort((a, b) => {
        // Sort by most recently used
        const aDates = Object.keys(a.doseStatus || {})
          .map(key => new Date(key.split('T')[0]))
          .filter(date => date >= thirtyDaysAgo)
          .sort((x, y) => y.getTime() - x.getTime());
        
        const bDates = Object.keys(b.doseStatus || {})
          .map(key => new Date(key.split('T')[0]))
          .filter(date => date >= thirtyDaysAgo)
          .sort((x, y) => y.getTime() - x.getTime());
        
        if (aDates.length === 0 && bDates.length === 0) return 0;
        if (aDates.length === 0) return 1;
        if (bDates.length === 0) return -1;
        
        return bDates[0].getTime() - aDates[0].getTime();
      })
      .slice(0, 10); // Top 10 recent
  }, [medications]);

  // Get favorite medications (medications used frequently)
  const favoriteMedications = useMemo(() => {
    return medications
      .map(med => ({
        med,
        usageCount: Object.keys(med.doseStatus || {}).length,
      }))
      .filter(item => item.usageCount > 10) // Used more than 10 times
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5) // Top 5 favorites
      .map(item => item.med);
  }, [medications]);

  const filteredRecent = recentMedications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFavorites = favoriteMedications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (medication: Medication) => {
    onSelect(medication);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Add Medication</h2>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medications..."
            className="w-full border-gray-300 rounded-md shadow-sm px-4 py-2"
            autoFocus
          />
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Favorites */}
          {filteredFavorites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StarIcon className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-800">Favorites</h3>
              </div>
              <div className="space-y-2">
                {filteredFavorites.map(med => (
                  <button
                    key={med.id}
                    onClick={() => handleSelect(med)}
                    className="w-full text-left p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <p className="font-semibold text-gray-800">{med.name}</p>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                    <p className="text-xs text-gray-500 mt-1">{med.frequency}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {filteredRecent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClockIcon className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Recently Used</h3>
              </div>
              <div className="space-y-2">
                {filteredRecent.map(med => (
                  <button
                    key={med.id}
                    onClick={() => handleSelect(med)}
                    className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <p className="font-semibold text-gray-800">{med.name}</p>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                    <p className="text-xs text-gray-500 mt-1">{med.frequency}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredRecent.length === 0 && filteredFavorites.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No medications found' : 'No recent or favorite medications'}
              </p>
            </div>
          )}
        </main>

        <footer className="p-4 bg-gray-50 border-t flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default QuickAddMedication;

