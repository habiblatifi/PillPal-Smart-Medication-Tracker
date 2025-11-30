import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { DollarSignIcon, XIcon, LightBulbIcon } from './icons';
import { generateCostSavings, CostSavingSuggestion } from '../services/costSavingService';

interface CostSavingSuggestionsProps {
  medications: Medication[];
  onDismiss: (suggestionId: string) => void;
}

const CostSavingSuggestions: React.FC<CostSavingSuggestionsProps> = ({
  medications,
  onDismiss,
}) => {
  const [suggestions, setSuggestions] = useState<CostSavingSuggestion[]>([]);

  useEffect(() => {
    const newSuggestions = generateCostSavings(medications);
    // Filter dismissed suggestions
    const dismissed = JSON.parse(localStorage.getItem('dismissedCostSuggestions') || '[]');
    const activeSuggestions = newSuggestions.filter(s => !dismissed.includes(s.id));
    setSuggestions(activeSuggestions);
  }, [medications]);

  const handleDismiss = (suggestionId: string) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedCostSuggestions') || '[]');
    dismissed.push(suggestionId);
    localStorage.setItem('dismissedCostSuggestions', JSON.stringify(dismissed));
    onDismiss(suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <DollarSignIcon className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900">Cost-Saving Opportunities</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <div
            key={suggestion.id}
            className="bg-white bg-opacity-50 rounded-lg p-3 border border-green-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <LightBulbIcon className="h-4 w-4 text-green-600" />
                  <p className="font-semibold text-green-900 text-sm">{suggestion.medicationName}</p>
                </div>
                <p className="text-sm text-green-800 mb-2">{suggestion.suggestion}</p>
                {suggestion.potentialSavings && (
                  <p className="text-xs font-semibold text-green-700">
                    Potential Savings: {suggestion.potentialSavings}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDismiss(suggestion.id)}
                className="p-1 hover:bg-green-100 rounded-full transition-colors flex-shrink-0 ml-2"
              >
                <XIcon className="h-4 w-4 text-green-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-green-700">
        <p>💡 Tip: Always consult with your healthcare provider before making any changes to your medications.</p>
      </div>
    </div>
  );
};


export default CostSavingSuggestions;

