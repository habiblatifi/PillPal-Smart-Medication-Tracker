import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, XIcon } from './icons';
import { initializeVoiceRecognition, parseVoiceCommand, speak, stopSpeaking } from '../services/voiceService';
import { VoiceCommand } from '../services/voiceService';

interface VoiceCommandsProps {
  onCommand: (command: VoiceCommand) => void;
  onClose: () => void;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({ onCommand, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const rec = initializeVoiceRecognition();
    if (rec) {
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        const command = parseVoiceCommand(text);
        if (command) {
          onCommand(command);
          speak(`Command recognized: ${command.action}`);
          setIsListening(false);
          setTimeout(onClose, 1000);
        } else {
          speak("I didn't understand that command. Try saying 'mark taken', 'show schedule', or 'show missed doses'.");
        }
      };

      rec.onerror = (event) => {
        setError(`Recognition error: ${event.error}`);
        setIsListening(false);
        stopSpeaking();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
      setError('Voice recognition is not supported in your browser');
    }

    return () => {
      stopSpeaking();
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const handleStartListening = () => {
    if (!recognition) {
      setError('Voice recognition not available');
      return;
    }

    setError(null);
    setTranscript('');
    setIsListening(true);
    speak('Listening for your command...');
    
    try {
      recognition.start();
    } catch (err) {
      setError('Already listening or microphone not available');
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    stopSpeaking();
  };

  const exampleCommands = [
    "Mark my morning pill as taken",
    "What do I take now?",
    "Show my missed doses",
    "Show my schedule",
    "Show reports",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Voice Commands</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <MicrophoneIcon className="h-12 w-12" />
            </button>
            <p className="mt-4 text-gray-600">
              {isListening ? 'Listening... Speak your command' : 'Tap to start listening'}
            </p>
          </div>

          {transcript && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-1">You said:</p>
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Example Commands:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {exampleCommands.map((cmd, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-indigo-600">•</span>
                  <span>"{cmd}"</span>
                </li>
              ))}
            </ul>
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

export default VoiceCommands;

