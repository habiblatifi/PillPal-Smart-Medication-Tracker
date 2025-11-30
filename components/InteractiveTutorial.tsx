import React, { useState } from 'react';
import { XIcon, ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from './icons';

interface TutorialStep {
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      title: 'Welcome to PillPal!',
      content: 'This quick tour will help you get started. You can skip at any time.',
    },
    {
      title: 'Add Your First Medication',
      content: 'Tap the + button at the bottom right to add a medication. You can take a photo, upload an image, or enter details manually.',
      target: '.add-medication-button',
      position: 'left',
    },
    {
      title: 'View Your Schedule',
      content: 'The calendar shows all your scheduled medications. Tap any date to see details.',
      target: '.calendar-container',
      position: 'top',
    },
    {
      title: 'Mark Doses as Taken',
      content: 'When you take a medication, tap "Mark as Taken" to record it. This helps track your adherence.',
      target: '.medication-card',
      position: 'bottom',
    },
    {
      title: 'Check Interactions',
      content: 'PillPal automatically checks for drug interactions when you add medications. Look for alerts at the top.',
      target: '.interaction-alert',
      position: 'top',
    },
    {
      title: 'Track Symptoms',
      content: 'Use the Symptom Journal to log how you\'re feeling. This helps identify patterns over time.',
      target: '.symptom-journal',
      position: 'bottom',
    },
    {
      title: 'View Reports',
      content: 'Check the Reports tab to see your adherence statistics and medication history.',
      target: '.reports-tab',
      position: 'bottom',
    },
    {
      title: 'Customize Settings',
      content: 'Visit Settings to enable Easy Mode, adjust text size, set up app lock, and more.',
      target: '.settings-tab',
      position: 'bottom',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[200]" />

      {/* Tutorial Card */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl z-[201] p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              {currentStep + 1}
            </div>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{currentStepData.title}</h3>
          <p className="text-gray-600 leading-relaxed">{currentStepData.content}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              Next
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
            >
              Get Started
              <CheckCircleIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default InteractiveTutorial;

