import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { AlertTriangleIcon, XIcon, CalendarIcon } from './icons';
import { getSeasonalAlerts, getPreventiveAlerts, SeasonalAlert } from '../services/seasonalAlertService';

interface SeasonalAlertsProps {
  medications: Medication[];
  userPreferences: any;
  onDismiss: (alertId: string) => void;
  onAddMedication?: (medicationData: Partial<Medication>) => void;
}

const SeasonalAlerts: React.FC<SeasonalAlertsProps> = ({
  medications,
  userPreferences,
  onDismiss,
  onAddMedication,
}) => {
  const [alerts, setAlerts] = useState<SeasonalAlert[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    const seasonal = getSeasonalAlerts(medications);
    const preventive = getPreventiveAlerts(medications);
    const allAlerts = [...seasonal, ...preventive];

    // Filter dismissed alerts
    const dismissed = JSON.parse(localStorage.getItem('dismissedSeasonalAlerts') || '[]');
    const activeAlerts = allAlerts.filter(alert => !dismissed.includes(alert.id));

    // Sort by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    activeAlerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setAlerts(activeAlerts);
  }, [medications]);

  const handleDismiss = (alertId: string) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedSeasonalAlerts') || '[]');
    dismissed.push(alertId);
    localStorage.setItem('dismissedSeasonalAlerts', JSON.stringify(dismissed));
    onDismiss(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (alerts.length === 0 || !userPreferences.showTips) return null;

  const priorityColors = {
    high: 'bg-red-50 border-red-500 text-red-800',
    medium: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    low: 'bg-blue-50 border-blue-500 text-blue-800',
  };

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`border-l-4 rounded-r-lg p-4 shadow-lg ${priorityColors[alert.priority]}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <CalendarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{alert.title}</h4>
                <p className="text-sm leading-relaxed">{alert.message}</p>
                {alert.actionText && (
                  <button
                    onClick={() => {
                      if (onAddMedication) {
                        // Create pre-filled medication based on alert type
                        // For vaccines, set a default time (user can change it)
                        const defaultTime = new Date();
                        defaultTime.setHours(10, 0, 0, 0); // 10:00 AM
                        const timeString = defaultTime.toTimeString().slice(0, 5); // HH:MM format
                        
                        const medicationData: Partial<Medication> = {
                          name: alert.type === 'flu' ? 'Flu Shot (Influenza Vaccine)' : 
                                alert.type === 'vaccine' ? 'COVID-19 Booster' :
                                alert.type === 'allergy' ? 'Allergy Medication' : 'Preventive Medication',
                          dosage: alert.type === 'flu' || alert.type === 'vaccine' ? '1 dose' : '',
                          frequency: alert.type === 'flu' || alert.type === 'vaccine' ? 'Once annually' : 'As needed',
                          times: alert.type === 'flu' || alert.type === 'vaccine' ? [timeString] : ['09:00'],
                          food: 'No specific instructions',
                          drugClass: alert.type === 'flu' || alert.type === 'vaccine' ? 'Vaccine' : 'Preventive',
                          sideEffects: alert.type === 'flu' || alert.type === 'vaccine' ? 
                            'Mild soreness at injection site, low-grade fever, fatigue' : 
                            'Varies by medication',
                          usageNote: alert.type === 'flu' ? 
                            'Annual influenza vaccination to prevent flu' :
                            alert.type === 'vaccine' ?
                            'COVID-19 booster shot for enhanced protection' :
                            'Preventive medication',
                        };
                        onAddMedication(medicationData);
                      }
                    }}
                    className="mt-2 px-3 py-1.5 bg-white bg-opacity-50 rounded-lg text-sm font-semibold hover:bg-opacity-70 transition-colors"
                  >
                    {alert.actionText}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeasonalAlerts;

