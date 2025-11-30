import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, XIcon } from './icons';

interface Tip {
  id: string;
  title: string;
  message: string;
  category: 'feature' | 'safety' | 'tip' | 'reminder';
  dismissible: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualTipsProps {
  userPreferences: any;
  medications: any[];
  onDismiss: (tipId: string) => void;
}

const ContextualTips: React.FC<ContextualTipsProps> = ({
  userPreferences,
  medications,
  onDismiss,
}) => {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!userPreferences.showTips) return;

    const tips: Tip[] = [];

    // Feature discovery tips
    if (medications.length === 0) {
      tips.push({
        id: 'first-medication',
        title: 'Get Started',
        message: 'Tap the + button to add your first medication. You can take a photo or enter details manually.',
        category: 'feature',
        dismissible: true,
      });
    }

    if (medications.length > 0 && !userPreferences.easyMode) {
      tips.push({
        id: 'easy-mode',
        title: 'Try Easy Mode',
        message: 'Enable Easy Mode in Settings for a simplified interface with large buttons.',
        category: 'feature',
        dismissible: true,
        action: {
          label: 'Enable Now',
          onClick: () => {
            // This would need to be passed as a prop
            console.log('Enable Easy Mode');
          },
        },
      });
    }

    // Safety tips
    if (medications.length > 3) {
      tips.push({
        id: 'interaction-check',
        title: 'Check Interactions',
        message: 'PillPal automatically checks for drug interactions. Look for alerts at the top of your dashboard.',
        category: 'safety',
        dismissible: true,
      });
    }

    // Seasonal tips
    const month = new Date().getMonth();
    if (month >= 2 && month <= 5) { // Spring
      tips.push({
        id: 'allergy-season',
        title: 'Allergy Season',
        message: 'Spring is here! Consider adding allergy medications if you need them.',
        category: 'reminder',
        dismissible: true,
      });
    }

    if (month >= 9 && month <= 11) { // Fall
      tips.push({
        id: 'flu-season',
        title: 'Flu Season',
        message: 'Flu season is approaching. Consider getting your flu shot and adding it to your medication list.',
        category: 'reminder',
        dismissible: true,
      });
    }

    // Note: More comprehensive seasonal alerts are handled by SeasonalAlerts component

    // Show first available tip
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '[]');
    const availableTip = tips.find(tip => !dismissedTips.includes(tip.id));
    
    if (availableTip) {
      setCurrentTip(availableTip);
    }
  }, [userPreferences, medications]);

  const handleDismiss = () => {
    if (currentTip) {
      const dismissed = JSON.parse(localStorage.getItem('dismissedTips') || '[]');
      dismissed.push(currentTip.id);
      localStorage.setItem('dismissedTips', JSON.stringify(dismissed));
      onDismiss(currentTip.id);
      setCurrentTip(null);
    }
  };

  if (!currentTip || !userPreferences.showTips) return null;

  const categoryColors = {
    feature: 'bg-blue-50 border-blue-500 text-blue-800',
    safety: 'bg-red-50 border-red-500 text-red-800',
    tip: 'bg-green-50 border-green-500 text-green-800',
    reminder: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  };

  return (
    <div className={`fixed bottom-24 left-4 right-4 max-w-md mx-auto z-40 ${categoryColors[currentTip.category]} border-l-4 rounded-r-lg p-4 shadow-lg animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <InformationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{currentTip.title}</h4>
            <p className="text-sm leading-relaxed">{currentTip.message}</p>
            {currentTip.action && (
              <button
                onClick={() => {
                  currentTip.action?.onClick();
                  handleDismiss();
                }}
                className="mt-2 px-3 py-1.5 bg-white bg-opacity-50 rounded-lg text-sm font-semibold hover:bg-opacity-70"
              >
                {currentTip.action.label}
              </button>
            )}
          </div>
        </div>
        {currentTip.dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors flex-shrink-0"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContextualTips;

