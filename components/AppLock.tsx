import React, { useState, useEffect } from 'react';
import { AppSecurity } from '../types';
import { LockClosedIcon } from './icons';

interface AppLockProps {
  security: AppSecurity;
  onUnlock: () => void;
  onSetPin: (pin: string) => void;
}

const AppLock: React.FC<AppLockProps> = ({ security, onUnlock, onSetPin }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [error, setError] = useState('');

  // Simple PIN hash (in production, use proper hashing)
  const hashPin = (pin: string): string => {
    return btoa(pin).split('').reverse().join('');
  };

  const handlePinSubmit = () => {
    if (isSettingPin) {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
      onSetPin(hashPin(pin));
      setIsSettingPin(false);
      setPin('');
      setConfirmPin('');
      setError('');
    } else {
      if (security.pinHash && hashPin(pin) === security.pinHash) {
        onUnlock();
        setPin('');
        setError('');
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    }
  };

  const handleBiometric = async () => {
    if ('credentials' in navigator && 'get' in navigator.credentials) {
      try {
        const credential = await (navigator.credentials as any).get({
          publicKey: {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            userVerification: 'required',
          },
        });
        if (credential) {
          onUnlock();
        }
      } catch (error) {
        console.error('Biometric authentication failed:', error);
        setError('Biometric authentication failed');
      }
    } else {
      // Fallback: simulate biometric (in real app, use WebAuthn API)
      setError('Biometric authentication not available');
    }
  };

  if (!security.isLocked && security.lockMethod === 'none') {
    return null;
  }

  if (!security.isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <LockClosedIcon className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">
            {isSettingPin ? 'Set PIN' : 'App Locked'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSettingPin 
              ? 'Enter a 4-digit PIN to secure your app'
              : 'Enter your PIN to continue'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isSettingPin ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                className="w-full text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••"
                maxLength={6}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                className="w-full text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••"
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsSettingPin(false);
                  setPin('');
                  setConfirmPin('');
                  setError('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                Set PIN
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                className="w-full text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter PIN"
                maxLength={6}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (num === '⌫') {
                      setPin(prev => prev.slice(0, -1));
                    } else if (num !== '') {
                      setPin(prev => {
                        const newPin = prev + num;
                        if (newPin.length >= 4 && security.pinHash) {
                          setTimeout(() => {
                            if (hashPin(newPin) === security.pinHash) {
                              onUnlock();
                              setPin('');
                            } else if (newPin.length === 6) {
                              setError('Incorrect PIN');
                              setPin('');
                            }
                          }, 100);
                        }
                        return newPin.slice(0, 6);
                      });
                    }
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 rounded-lg text-xl font-semibold transition-colors"
                  disabled={num === ''}
                >
                  {num}
                </button>
              ))}
            </div>

            {security.lockMethod === 'biometric' && (
              <button
                onClick={handleBiometric}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <span>🔐</span>
                Use Biometric
              </button>
            )}

            <button
              onClick={handlePinSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Unlock
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLock;

