import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { ArrowRightIcon, CheckCircleIcon } from './icons';

interface OnboardingQuestionnaireProps {
  onComplete: (preferences: Partial<UserPreferences>, mode: 'chronic' | 'short-term' | 'as-needed') => void;
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{
    wakeTime?: string;
    sleepTime?: string;
    techComfort?: 'beginner' | 'intermediate' | 'advanced';
    medicationType?: 'chronic' | 'short-term' | 'as-needed' | 'mixed';
    detailPreference?: 'minimal' | 'moderate' | 'detailed';
  }>({});

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const preferences: Partial<UserPreferences> = {
      reminderStyle: answers.detailPreference === 'minimal' ? 'minimal' : 
                     answers.detailPreference === 'moderate' ? 'simple' : 'detailed',
      easyMode: answers.techComfort === 'beginner',
      lowLiteracyMode: answers.techComfort === 'beginner',
      motivationalMessages: true,
      showTips: answers.techComfort !== 'beginner',
    };

    let mode: 'chronic' | 'short-term' | 'as-needed' = 'chronic';
    if (answers.medicationType === 'short-term') mode = 'short-term';
    if (answers.medicationType === 'as-needed') mode = 'as-needed';

    onComplete(preferences, mode);
  };

  const updateAnswer = (key: keyof typeof answers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="p-6 border-b shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to PillPal!</h2>
            <span className="text-sm text-gray-500">Step {step} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">What time do you usually wake up?</h3>
              <input
                type="time"
                value={answers.wakeTime || '07:00'}
                onChange={(e) => updateAnswer('wakeTime', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm text-lg p-3"
              />
              <p className="text-sm text-gray-500">This helps us schedule your morning medications</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">What time do you usually go to sleep?</h3>
              <input
                type="time"
                value={answers.sleepTime || '22:00'}
                onChange={(e) => updateAnswer('sleepTime', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm text-lg p-3"
              />
              <p className="text-sm text-gray-500">This helps us schedule your evening medications</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How comfortable are you with technology?</h3>
              <div className="space-y-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => updateAnswer('techComfort', level)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      answers.techComfort === level
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800 capitalize">{level}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {level === 'beginner' && 'I prefer simple, easy-to-use interfaces'}
                      {level === 'intermediate' && 'I\'m comfortable with most apps and features'}
                      {level === 'advanced' && 'I like detailed controls and customization'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">What type of medications are you managing?</h3>
              <div className="space-y-3">
                {([
                  { value: 'chronic', label: 'Chronic Conditions', desc: 'Long-term medications (e.g., blood pressure, diabetes)' },
                  { value: 'short-term', label: 'Short Course', desc: 'Temporary medications (e.g., antibiotics, pain relief)' },
                  { value: 'as-needed', label: 'As-Needed', desc: 'Medications taken when needed (e.g., pain, allergies)' },
                  { value: 'mixed', label: 'Mixed', desc: 'Combination of the above' },
                ] as const).map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateAnswer('medicationType', option.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      answers.medicationType === option.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{option.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How much detail do you prefer in reminders?</h3>
              <div className="space-y-3">
                {([
                  { value: 'minimal', label: 'Minimal', desc: 'Simple reminders, just the basics' },
                  { value: 'moderate', label: 'Moderate', desc: 'Some details, not overwhelming' },
                  { value: 'detailed', label: 'Detailed', desc: 'Full information and tips' },
                ] as const).map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateAnswer('detailPreference', option.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      answers.detailPreference === option.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{option.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="p-6 border-t bg-gray-50 flex justify-between shrink-0">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-5 py-2.5 rounded-lg font-semibold ${
              step === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2"
          >
            {step === totalSteps ? 'Get Started' : 'Next'}
            {step < totalSteps && <ArrowRightIcon className="h-5 w-5" />}
            {step === totalSteps && <CheckCircleIcon className="h-5 w-5" />}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire;

