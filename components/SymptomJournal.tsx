import React, { useState, useMemo } from 'react';
import { SymptomEntry, Medication } from '../types';
import { PencilIcon, XIcon } from './icons';

interface SymptomJournalProps {
  medications: Medication[];
  onSave: (entry: SymptomEntry) => void;
  compact?: boolean;
}

const SymptomJournal: React.FC<SymptomJournalProps> = ({ medications, onSave, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<'😊' | '😐' | '😞' | '😢' | '😴'>('😊');
  const [painLevel, setPainLevel] = useState<number>(0);
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const commonSymptoms = ['Headache', 'Dizziness', 'Nausea', 'Fatigue', 'Pain', 'Anxiety', 'Insomnia'];
  const commonSideEffects = ['Drowsiness', 'Dry mouth', 'Upset stomach', 'Rash', 'Dizziness'];

  const handleSave = () => {
    const now = new Date();
    const entry: SymptomEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      medicationId: selectedMedication || undefined,
      symptoms,
      mood,
      painLevel: painLevel > 0 ? painLevel : undefined,
      sideEffects: sideEffects.length > 0 ? sideEffects : undefined,
      notes: notes.trim() || undefined,
    };
    onSave(entry);
    // Reset form
    setSelectedMedication('');
    setSymptoms([]);
    setMood('😊');
    setPainLevel(0);
    setSideEffects([]);
    setNotes('');
    setIsOpen(false);
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const toggleSideEffect = (effect: string) => {
    setSideEffects(prev => 
      prev.includes(effect)
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  };

  if (compact && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-50 border-2 border-blue-200 text-blue-800 p-4 rounded-xl hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">Log Symptoms</span>
          <span className="text-2xl">📝</span>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Symptom & Side Effect Journal</h3>
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-50 border-2 border-blue-200 text-blue-800 p-4 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold">Log Symptoms</span>
            <span className="text-2xl">📝</span>
          </div>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Medication Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Medication (Optional)
            </label>
            <select
              value={selectedMedication}
              onChange={(e) => setSelectedMedication(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">None</option>
              {medications.map(med => (
                <option key={med.id} value={med.id}>
                  {med.name} {med.dosage}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
            <div className="flex gap-3">
              {(['😊', '😐', '😞', '😢', '😴'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-4xl p-2 rounded-lg transition-all ${
                    mood === m ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    symptoms.includes(symptom)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Pain Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pain Level (0-10): {painLevel}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Side Effects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Side Effects</label>
            <div className="flex flex-wrap gap-2">
              {commonSideEffects.map(effect => (
                <button
                  key={effect}
                  onClick={() => toggleSideEffect(effect)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    sideEffects.includes(effect)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="w-full border-gray-300 rounded-md shadow-sm"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Save Entry
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomJournal;

