import React, { useState } from 'react';
import { DownloadIcon, PlusIcon, TrashIcon, CogIcon, GlobeIcon, LockClosedIcon, MicrophoneIcon, ChartBarIcon, ArrowRightIcon } from './icons';
import { UserPreferences, Caregiver, AppSecurity, EmergencyInfo, TravelInfo } from '../types';
import DashboardWidgetConfig from './DashboardWidgetConfig';
import TravelMode from './TravelMode';
import EmergencyMedicalID from './EmergencyMedicalID';
import DataManagement from './DataManagement';
import ProviderReportGenerator from './ProviderReportGenerator';
import VoiceCommands from './VoiceCommands';
import CrisisSafetyCards from './CrisisSafetyCards';
import AccessHistory from './AccessHistory';

interface SettingsScreenProps {
  onExportData: () => void;
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: UserPreferences) => void;
  appSecurity?: AppSecurity;
  setAppSecurity?: (security: AppSecurity) => void;
  emergencyInfo?: EmergencyInfo;
  onUpdateEmergencyInfo?: (info: EmergencyInfo) => void;
  medications?: any[];
  symptomEntries?: any[];
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onExportData, 
  userPreferences, 
  setUserPreferences,
  appSecurity,
  setAppSecurity,
  emergencyInfo,
  onUpdateEmergencyInfo,
  medications = [],
  symptomEntries = [],
}) => {
  const [reminderSound, setReminderSound] = useState('Default');
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [showTravelMode, setShowTravelMode] = useState(false);
  const [showEmergencyID, setShowEmergencyID] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showProviderReport, setShowProviderReport] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [showCrisisCards, setShowCrisisCards] = useState(false);
  const [showAccessHistory, setShowAccessHistory] = useState(false);
  const [travelInfo, setTravelInfo] = useState<TravelInfo>(() => {
    try {
      const saved = localStorage.getItem('travelInfo');
      return saved ? JSON.parse(saved) : { isActive: false };
    } catch {
      return { isActive: false };
    }
  });
  const [caregivers, setCaregivers] = useState<Caregiver[]>(() => {
    try {
      const saved = localStorage.getItem('caregivers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newCaregiverName, setNewCaregiverName] = useState('');
  const [newCaregiverEmail, setNewCaregiverEmail] = useState('');
  const [newCaregiverAccess, setNewCaregiverAccess] = useState<'view' | 'manage'>('view');

  const addCaregiver = () => {
    if (!newCaregiverName || !newCaregiverEmail) return;
    const newCaregiver: Caregiver = {
      id: Date.now().toString(),
      name: newCaregiverName,
      email: newCaregiverEmail,
      accessLevel: newCaregiverAccess,
      addedDate: new Date().toISOString(),
    };
    setCaregivers(prev => {
      const updated = [...prev, newCaregiver];
      localStorage.setItem('caregivers', JSON.stringify(updated));
      return updated;
    });
    setNewCaregiverName('');
    setNewCaregiverEmail('');
  };

  const removeCaregiver = (id: string) => {
    setCaregivers(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('caregivers', JSON.stringify(updated));
      return updated;
    });
  };

  const syncCalendar = async () => {
    if (!userPreferences.calendarSync) return;
    
    try {
      // Generate iCal format for calendar export
      const generateICal = () => {
        const medications = JSON.parse(localStorage.getItem('medications') || '[]');
        let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PillPal//Medication Tracker//EN\n';
        
        medications.forEach((med: any) => {
          med.times.forEach((time: string) => {
            const [hours, mins] = time.split(':');
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(mins));
            
            ical += `BEGIN:VEVENT\n`;
            ical += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
            ical += `DTEND:${new Date(startDate.getTime() + 15 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
            ical += `SUMMARY:Take ${med.name} (${med.dosage})\n`;
            ical += `DESCRIPTION:Medication reminder for ${med.name}\n`;
            ical += `RRULE:FREQ=DAILY;COUNT=365\n`;
            ical += `END:VEVENT\n`;
          });
        });
        
        ical += 'END:VCALENDAR';
        return ical;
      };

      if (userPreferences.calendarProvider === 'google') {
        // For Google Calendar, we'll generate an iCal file that can be imported
        const icalContent = generateICal();
        const blob = new Blob([icalContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pillpal-medications.ics';
        link.click();
        URL.revokeObjectURL(url);
        
        setUserPreferences({ ...userPreferences, lastSyncTime: new Date().toISOString() });
        alert('Calendar file downloaded! Import it into Google Calendar or your preferred calendar app.');
      } else if (userPreferences.calendarProvider === 'apple') {
        // Apple Calendar can import iCal files directly
        const icalContent = generateICal();
        const blob = new Blob([icalContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pillpal-medications.ics';
        link.click();
        URL.revokeObjectURL(url);
        
        setUserPreferences({ ...userPreferences, lastSyncTime: new Date().toISOString() });
        alert('Calendar file downloaded! Double-click to add to Apple Calendar.');
      }
    } catch (error) {
      console.error('Calendar sync error:', error);
      alert('Failed to sync with calendar. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      {/* Accessibility Settings */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Accessibility</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-2">Text Size</label>
            <select 
              id="fontSize"
              value={userPreferences.fontSize}
              onChange={(e) => setUserPreferences({ ...userPreferences, fontSize: e.target.value as 'normal' | 'large' | 'extra-large' })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="highContrast" className="block text-sm font-medium text-gray-700">High Contrast Mode</label>
              <p className="text-xs text-gray-500">Improves visibility for low vision users</p>
            </div>
            <input
              type="checkbox"
              id="highContrast"
              checked={userPreferences.highContrast}
              onChange={(e) => setUserPreferences({ ...userPreferences, highContrast: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="easyMode" className="block text-sm font-medium text-gray-700">Easy Mode</label>
              <p className="text-xs text-gray-500">Simplified interface with large buttons</p>
            </div>
            <input
              type="checkbox"
              id="easyMode"
              checked={userPreferences.easyMode || false}
              onChange={(e) => setUserPreferences({ ...userPreferences, easyMode: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="lowLiteracyMode" className="block text-sm font-medium text-gray-700">Low-Literacy Mode</label>
              <p className="text-xs text-gray-500">Large icons and simple labels</p>
            </div>
            <input
              type="checkbox"
              id="lowLiteracyMode"
              checked={userPreferences.lowLiteracyMode || false}
              onChange={(e) => setUserPreferences({ ...userPreferences, lowLiteracyMode: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="voiceGuidance" className="block text-sm font-medium text-gray-700">Voice Guidance</label>
              <p className="text-xs text-gray-500">Announce actions and confirmations</p>
            </div>
            <input
              type="checkbox"
              id="voiceGuidance"
              checked={userPreferences.voiceGuidance}
              onChange={(e) => setUserPreferences({ ...userPreferences, voiceGuidance: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="reminderStyle" className="block text-sm font-medium text-gray-700 mb-2">Reminder Style</label>
            <select
              id="reminderStyle"
              value={userPreferences.reminderStyle || 'detailed'}
              onChange={(e) => setUserPreferences({ ...userPreferences, reminderStyle: e.target.value as 'detailed' | 'simple' | 'minimal' })}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="minimal">Minimal</option>
              <option value="simple">Simple</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Customization */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Dashboard Customization</h3>
        <div className="space-y-4">
          <button
            onClick={() => setShowWidgetConfig(true)}
            className="w-full flex items-center justify-between p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CogIcon className="h-5 w-5 text-indigo-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-800">Customize Widgets</p>
                <p className="text-xs text-gray-600">Reorder and configure dashboard widgets</p>
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="motivationalMessages" className="block text-sm font-medium text-gray-700">Motivational Messages</label>
              <p className="text-xs text-gray-500">Show streaks, badges, and encouragement</p>
            </div>
            <input
              type="checkbox"
              id="motivationalMessages"
              checked={userPreferences.motivationalMessages !== false}
              onChange={(e) => setUserPreferences({ ...userPreferences, motivationalMessages: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="showTips" className="block text-sm font-medium text-gray-700">Show Tips</label>
              <p className="text-xs text-gray-500">Display helpful tips and feature discovery</p>
            </div>
            <input
              type="checkbox"
              id="showTips"
              checked={userPreferences.showTips !== false}
              onChange={(e) => setUserPreferences({ ...userPreferences, showTips: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* App Security */}
      {appSecurity && setAppSecurity && (
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
            <LockClosedIcon className="h-5 w-5 text-indigo-600" />
            App Security
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="lockMethod" className="block text-sm font-medium text-gray-700 mb-2">Lock Method</label>
              <select
                id="lockMethod"
                value={appSecurity.lockMethod}
                onChange={(e) => {
                  const method = e.target.value as 'none' | 'pin' | 'biometric';
                  setAppSecurity({ ...appSecurity, lockMethod: method, isLocked: false });
                }}
                className="w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="none">No Lock</option>
                <option value="pin">PIN Lock</option>
                <option value="biometric">Biometric</option>
              </select>
            </div>
            {appSecurity.lockMethod !== 'none' && (
              <div>
                <label htmlFor="lockTimeout" className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Lock Timeout (minutes)
                </label>
                <input
                  type="number"
                  id="lockTimeout"
                  min="1"
                  max="60"
                  value={appSecurity.lockTimeout}
                  onChange={(e) => setAppSecurity({ ...appSecurity, lockTimeout: parseInt(e.target.value) || 5 })}
                  className="w-full border-gray-300 rounded-md shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-1">App will lock after this many minutes of inactivity</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Medical ID */}
      {emergencyInfo && onUpdateEmergencyInfo && (
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Emergency Medical ID</h3>
          <button
            onClick={() => setShowEmergencyID(true)}
            className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <p className="font-semibold text-red-800">Edit Emergency Information</p>
            <p className="text-xs text-red-600 mt-1">Accessible from lock screen for first responders</p>
          </button>
        </div>
      )}

      {/* Travel Mode */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-indigo-600" />
          Travel Mode
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">
                {travelInfo.isActive ? 'Active' : 'Inactive'}
              </p>
              {travelInfo.isActive && travelInfo.departureDate && (
                <p className="text-xs text-gray-600">
                  Departure: {new Date(travelInfo.departureDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowTravelMode(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              {travelInfo.isActive ? 'Manage' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Commands */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
          <MicrophoneIcon className="h-5 w-5 text-indigo-600" />
          Voice Commands
        </h3>
        <button
          onClick={() => setShowVoiceCommands(true)}
          className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
        >
          <p className="font-semibold text-gray-800">Open Voice Commands</p>
          <p className="text-xs text-gray-600 mt-1">Use voice to mark doses, view schedule, and more</p>
        </button>
      </div>

      {/* Provider Reports */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-indigo-600" />
          Provider Reports
        </h3>
        <button
          onClick={() => setShowProviderReport(true)}
          className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
        >
          <p className="font-semibold text-gray-800">Generate Provider Report</p>
          <p className="text-xs text-gray-600 mt-1">Create shareable report for your healthcare provider</p>
        </button>
      </div>

      {/* Crisis & Safety */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Crisis & Safety</h3>
        <button
          onClick={() => setShowCrisisCards(true)}
          className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
        >
          <p className="font-semibold text-red-800">View Crisis & Safety Cards</p>
          <p className="text-xs text-red-600 mt-1">Emergency response information and safety guidelines</p>
        </button>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Privacy & Security</h3>
        <button
          onClick={() => setShowAccessHistory(true)}
          className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
        >
          <p className="font-semibold text-gray-800">View Access History</p>
          <p className="text-xs text-gray-600 mt-1">Audit logs of all actions and data access</p>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Notification Settings</h3>
        <div>
            <label htmlFor="reminderSound" className="block text-sm font-medium text-gray-700">Reminder Sound</label>
            <select 
              name="reminderSound" 
              id="reminderSound" 
              value={reminderSound}
              onChange={(e) => setReminderSound(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option>Default</option>
                <option>Chime</option>
                <option>Alert</option>
                <option>Bell</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Custom sounds for notifications have limited support across devices and browsers.</p>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="adaptiveNotifications" className="block text-sm font-medium text-gray-700">Smart Adaptive Notifications</label>
              <p className="text-xs text-gray-500">Adjust reminder times based on your behavior</p>
            </div>
            <input
              type="checkbox"
              id="adaptiveNotifications"
              checked={userPreferences.adaptiveNotifications}
              onChange={(e) => setUserPreferences({ ...userPreferences, adaptiveNotifications: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Calendar Integration */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Calendar Integration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="calendarSync" className="block text-sm font-medium text-gray-700">Enable Calendar Sync</label>
              <p className="text-xs text-gray-500">Sync medication reminders with your calendar</p>
            </div>
            <input
              type="checkbox"
              id="calendarSync"
              checked={userPreferences.calendarSync}
              onChange={(e) => setUserPreferences({ ...userPreferences, calendarSync: e.target.checked })}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          {userPreferences.calendarSync && (
            <>
              <div>
                <label htmlFor="calendarProvider" className="block text-sm font-medium text-gray-700 mb-2">Calendar Provider</label>
                <select
                  id="calendarProvider"
                  value={userPreferences.calendarProvider || 'google'}
                  onChange={(e) => setUserPreferences({ ...userPreferences, calendarProvider: e.target.value as 'google' | 'apple' })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="google">Google Calendar</option>
                  <option value="apple">Apple Calendar</option>
                </select>
              </div>
              <button
                onClick={syncCalendar}
                className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sync Now
              </button>
              {userPreferences.lastSyncTime && (
                <p className="text-xs text-gray-500">Last synced: {new Date(userPreferences.lastSyncTime).toLocaleString()}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Multi-User Support */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Caregiver Access</h3>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Caregiver access is currently stored locally on this device. For remote access, a backend server with authentication would be required. Caregivers added here can view/manage medications when they have access to this device and browser.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Caregiver Name"
              value={newCaregiverName}
              onChange={(e) => setNewCaregiverName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newCaregiverEmail}
              onChange={(e) => setNewCaregiverEmail(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={newCaregiverAccess}
              onChange={(e) => setNewCaregiverAccess(e.target.value as 'view' | 'manage')}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="view">View Only</option>
              <option value="manage">Full Access</option>
            </select>
            <button
              onClick={addCaregiver}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Caregiver
            </button>
          </div>
          {caregivers.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-semibold text-gray-700">Active Caregivers:</p>
              {caregivers.map(caregiver => (
                <div key={caregiver.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{caregiver.name}</p>
                    <p className="text-xs text-gray-500">{caregiver.email} • {caregiver.accessLevel === 'view' ? 'View Only' : 'Full Access'}</p>
                  </div>
                  <button
                    onClick={() => removeCaregiver(caregiver.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Offline Mode */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Offline Mode</h3>
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="offlineMode" className="block text-sm font-medium text-gray-700">Enable Offline Mode</label>
            <p className="text-xs text-gray-500">Work without internet, sync when connected</p>
          </div>
          <input
            type="checkbox"
            id="offlineMode"
            checked={userPreferences.offlineMode}
            onChange={(e) => setUserPreferences({ ...userPreferences, offlineMode: e.target.checked })}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
        {userPreferences.offlineMode && userPreferences.lastSyncTime && (
          <p className="text-xs text-gray-500 mt-2">Last synced: {new Date(userPreferences.lastSyncTime).toLocaleString()}</p>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Data Management</h3>
        <div className="space-y-3">
          <button
            onClick={onExportData}
            className="flex items-center justify-center gap-2 w-full bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
          >
            <DownloadIcon className="w-5 h-5"/>
            Export Medication Data (CSV)
          </button>
          <button
            onClick={() => setShowDataManagement(true)}
            className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
          >
            <p className="font-semibold text-gray-800">Backup & Restore</p>
            <p className="text-xs text-gray-600 mt-1">Full backup, restore, or delete all data</p>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">About PillPal</h3>
        <div className="space-y-2 text-gray-600">
          <p>
            PillPal is your personal medication management assistant, designed to help you stay on track with your health regimen.
          </p>
          <p>
            Easily add medications, set reminders, check for potential drug interactions, and track your adherence over time. Our goal is to make managing your health simpler and safer.
          </p>
          <p className="font-semibold pt-2">Version: 1.3.0</p>
        </div>
      </div>
      
       <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 border-b pb-2 mb-4">Disclaimer</h3>
        <p className="text-sm text-gray-600">
            PillPal is an informational tool and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with your doctor or pharmacist regarding your medications and health conditions. The drug interaction checker uses AI and may not be exhaustive or entirely accurate.
        </p>
      </div>

      {/* Modals */}
      {showWidgetConfig && (
        <DashboardWidgetConfig
          userPreferences={userPreferences}
          onUpdate={(widgets) => {
            setUserPreferences({ ...userPreferences, dashboardWidgets: widgets });
            setShowWidgetConfig(false);
          }}
          onClose={() => setShowWidgetConfig(false)}
        />
      )}

      {showTravelMode && (
        <TravelMode
          medications={medications}
          travelInfo={travelInfo}
          onUpdate={(info) => {
            setTravelInfo(info);
            localStorage.setItem('travelInfo', JSON.stringify(info));
            setShowTravelMode(false);
          }}
          onClose={() => setShowTravelMode(false)}
        />
      )}

      {showEmergencyID && emergencyInfo && onUpdateEmergencyInfo && (
        <EmergencyMedicalID
          emergencyInfo={emergencyInfo}
          medications={medications}
          onUpdate={(info) => {
            onUpdateEmergencyInfo(info);
            setShowEmergencyID(false);
          }}
          isLockScreen={false}
        />
      )}

      {showDataManagement && (
        <DataManagement
          onClose={() => setShowDataManagement(false)}
          onDataCleared={() => {
            setShowDataManagement(false);
            window.location.reload();
          }}
        />
      )}

      {showProviderReport && (
        <ProviderReportGenerator
          medications={medications}
          symptomEntries={symptomEntries}
          onClose={() => setShowProviderReport(false)}
        />
      )}

      {showVoiceCommands && (
        <VoiceCommands
          onCommand={(command) => {
            console.log('Voice command:', command);
            // Handle voice commands - this would be integrated with App.tsx
          }}
          onClose={() => setShowVoiceCommands(false)}
        />
      )}

      {showCrisisCards && emergencyInfo && (
        <CrisisSafetyCards
          emergencyInfo={emergencyInfo}
          medications={medications}
          onClose={() => setShowCrisisCards(false)}
        />
      )}

      {showAccessHistory && (
        <AccessHistory
          onClose={() => setShowAccessHistory(false)}
        />
      )}

    </div>
  );
};

export default SettingsScreen;