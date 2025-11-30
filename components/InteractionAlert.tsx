import React, { useState } from 'react';
import { InteractionResult } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface InteractionAlertProps {
  result: InteractionResult | null;
  onCheck: () => void;
  isLoading: boolean;
}

const InteractionAlert: React.FC<InteractionAlertProps> = ({ result, onCheck, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  if (!result) return null;

  const hasInteractions = result.hasInteractions;
  
  // Pagination: Summary on page 0, then 1 detail per page
  const totalPages = hasInteractions && result.details 
    ? result.details.length  // Total pages = number of details (page 0 is summary, pages 1+ are details)
    : 0;

  const severityStyles: { [key: string]: string } = {
    Severe: 'bg-red-600 text-white',
    Moderate: 'bg-orange-500 text-white',
    Mild: 'bg-yellow-400 text-gray-800',
    Unknown: 'bg-gray-400 text-white',
  };

  return (
    <div className={`p-4 rounded-xl shadow-lg ${hasInteractions ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className={`flex-shrink-0 ${hasInteractions ? 'text-red-500' : 'text-green-500'}`}>
            {hasInteractions ? <AlertTriangleIcon className="h-6 w-6" /> : <CheckCircleIcon className="h-6 w-6" />}
          </div>
          <div className="flex-1 ml-4">
            <h3 className={`text-lg font-semibold ${hasInteractions ? 'text-red-800' : 'text-green-800'}`}>
              {hasInteractions ? "Interaction Alert" : "No Interactions Found"}
            </h3>
          </div>
        </div>
        {(hasInteractions && result.details && result.details.length > 0) && (
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded) setCurrentPage(0); // Reset to first page when expanding
            }}
            className="ml-4 p-1 rounded-full hover:bg-opacity-20 transition-colors"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronUpIcon className={`h-5 w-5 ${hasInteractions ? 'text-red-700' : 'text-green-700'}`} />
            ) : (
              <ChevronDownIcon className={`h-5 w-5 ${hasInteractions ? 'text-red-700' : 'text-green-700'}`} />
            )}
          </button>
        )}
      </div>
      
      {isExpanded && hasInteractions && result.details && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Summary page (page 0) */}
          {currentPage === 0 && (
            <div className="min-h-[120px]">
              <p className="text-sm text-red-700 leading-relaxed whitespace-pre-wrap">
                {result.summary}
              </p>
            </div>
          )}
          
          {/* Detail pages */}
          {currentPage > 0 && currentPage <= result.details.length && (
            <div className="min-h-[120px]">
              {(() => {
                const detail = result.details[currentPage - 1];
                return (
                  <div className="border-t border-red-200 pt-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-red-800 text-base">
                          {detail.interactingDrugs && detail.interactingDrugs.length > 0
                            ? detail.interactingDrugs.join(' + ')
                            : 'Potential Interaction'}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full ${severityStyles[detail.severity] || severityStyles.Unknown}`}>
                        {detail.severity}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-2 leading-relaxed whitespace-pre-wrap">{detail.description}</p>
                    <p className="mt-3 text-sm">
                      <span className="font-semibold text-red-800">Management: </span>
                      <span className="text-red-700 leading-relaxed whitespace-pre-wrap">{detail.management}</span>
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Pagination controls */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-red-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  currentPage === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                ← Previous
              </button>
              <span className="text-sm text-red-700 font-medium">
                {currentPage === 0 ? 'Summary' : `Detail ${currentPage} of ${result.details.length}`}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  currentPage >= totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractionAlert;