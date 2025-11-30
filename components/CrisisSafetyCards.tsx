import React, { useState } from 'react';
import { EmergencyInfo, Medication } from '../types';
import { AlertTriangleIcon, XIcon, PhoneIcon, HeartIcon, ChevronDownIcon } from './icons';

interface CrisisSafetyCardsProps {
  emergencyInfo: EmergencyInfo;
  medications: Medication[];
  onClose: () => void;
}

const CrisisSafetyCards: React.FC<CrisisSafetyCardsProps> = ({
  emergencyInfo,
  medications,
  onClose,
}) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const crisisCards = [
    {
      id: 'overdose',
      title: '🚨 Suspected Overdose',
      instructions: [
        'Call 911 immediately',
        'Do not induce vomiting unless instructed by poison control',
        'Have medication bottle ready for emergency responders',
        'Call Poison Control: 1-800-222-1222',
      ],
      color: 'red',
    },
    {
      id: 'allergic-reaction',
      title: '⚠️ Severe Allergic Reaction',
      instructions: [
        'Call 911 immediately if experiencing difficulty breathing, swelling, or severe symptoms',
        'Use epinephrine auto-injector if prescribed',
        'Take antihistamine if available and not contraindicated',
        'Stay calm and monitor symptoms',
      ],
      color: 'orange',
    },
    {
      id: 'missed-critical',
      title: '⏰ Missed Critical Medication',
      instructions: [
        'Check if it\'s safe to take now (consider timing with other doses)',
        'Do NOT double up on doses unless instructed by healthcare provider',
        'Contact your pharmacist or doctor for guidance',
        'Set additional reminders to prevent future misses',
      ],
      color: 'yellow',
    },
    {
      id: 'drug-interaction',
      title: '💊 Suspected Drug Interaction',
      instructions: [
        'Stop taking the medications if severe symptoms occur',
        'Contact your doctor or pharmacist immediately',
        'Call Poison Control: 1-800-222-1222 if severe',
        'Have a list of all medications ready',
      ],
      color: 'red',
    },
  ];

  const getCardColor = (color: string) => {
    const colors: { [key: string]: string } = {
      red: 'bg-red-50 border-red-500 text-red-800',
      orange: 'bg-orange-50 border-orange-500 text-orange-800',
      yellow: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    };
    return colors[color] || colors.yellow;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-800">Crisis & Safety Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Emergency Contact */}
          {emergencyInfo.emergencyPhone && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <PhoneIcon className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Emergency Contact</h3>
              </div>
              <p className="text-red-800">
                {emergencyInfo.emergencyContact}: {emergencyInfo.emergencyPhone}
              </p>
              <button
                onClick={() => window.location.href = `tel:${emergencyInfo.emergencyPhone}`}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Call Now
              </button>
            </div>
          )}

          {/* Crisis Cards */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 mb-3">Emergency Response Cards</h3>
            {crisisCards.map(card => (
              <div
                key={card.id}
                className={`border-l-4 rounded-r-lg p-4 cursor-pointer transition-all ${
                  activeCard === card.id
                    ? getCardColor(card.color) + ' shadow-lg'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => setActiveCard(activeCard === card.id ? null : card.id)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">{card.title}</h4>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      activeCard === card.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {activeCard === card.id && (
                  <div className="mt-3 space-y-2">
                    {card.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-lg">•</span>
                        <p className="text-sm">{instruction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Critical Medications */}
          {emergencyInfo.criticalMedications && emergencyInfo.criticalMedications.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <HeartIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Critical Medications</h3>
              </div>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                {emergencyInfo.criticalMedications.map((med, index) => (
                  <li key={index} className="text-sm">{med}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Allergies */}
          {emergencyInfo.allergies && emergencyInfo.allergies.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Known Allergies</h3>
              </div>
              <ul className="list-disc list-inside text-red-800 space-y-1">
                {emergencyInfo.allergies.map((allergy, index) => (
                  <li key={index} className="text-sm">{allergy}</li>
                ))}
              </ul>
            </div>
          )}
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

export default CrisisSafetyCards;

