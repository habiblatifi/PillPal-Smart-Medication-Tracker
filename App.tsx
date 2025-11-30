import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Medication, InteractionResult, View, DoseStatus, UserPreferences } from './types';
import { checkInteractions } from './services/geminiService';
import Dashboard from './components/Dashboard';
import MedicationListScreen from './components/MedicationListScreen';
import AddMedicationModal from './components/AddMedicationModal';
import InteractionAlert from './components/InteractionAlert';
import { PlusIcon } from './components/icons';
// ClockIcon defined below
import BottomNav from './components/BottomNav';
import ReportsScreen from './components/ReportsScreen';
import SettingsScreen from './components/SettingsScreen';
import ConfirmationModal from './components/ConfirmationModal';
import MissedDosesModal from './components/MissedDosesModal';
import AdherenceStreakWidget from './components/AdherenceStreakWidget';
import SymptomJournal from './components/SymptomJournal';
import EasyModeDashboard from './components/EasyModeDashboard';
import AppLock from './components/AppLock';
import BehavioralPatternAlert from './components/BehavioralPatternAlert';
import WeeklyCoachingSummary from './components/WeeklyCoachingSummary';
import EmergencyMedicalID from './components/EmergencyMedicalID';
import DashboardWidgetConfig from './components/DashboardWidgetConfig';
import TravelMode from './components/TravelMode';
import QuickAddMedication from './components/QuickAddMedication';
import OnboardingQuestionnaire from './components/OnboardingQuestionnaire';
import InteractiveTutorial from './components/InteractiveTutorial';
import ContextualTips from './components/ContextualTips';
import CaregiverDashboard from './components/CaregiverDashboard';
import PRNMedicationHandler from './components/PRNMedicationHandler';
import SeasonalAlerts from './components/SeasonalAlerts';
import CostSavingSuggestions from './components/CostSavingSuggestions';
import CrisisSafetyCards from './components/CrisisSafetyCards';
import PeriodicCheckIn from './components/PeriodicCheckIn';
import AccessHistory from './components/AccessHistory';
import { logAction } from './services/auditLogService';
import { undoService } from './services/undoService';
import { analyzeBehavioralPatterns } from './services/behaviorService';
import { generateWeeklyCoachingSummary, getCurrentWeekStart } from './services/coachingService';
import { checkDoseSafety } from './services/doseSafetyService';
import { canTakePRN, isPRNMedication, getDefaultPRNConfig } from './services/prnService';
import { SymptomEntry, AppSecurity, UndoAction, BehavioralPattern, MedicationEducation, TravelInfo, PRNConfig } from './types';

const App: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const savedMeds = localStorage.getItem('medications');
      return savedMeds ? JSON.parse(savedMeds) : [];
    } catch (error) {
      console.error("Failed to parse medications from localStorage", error);
      return [];
    }
  });

  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [isLoadingInteraction, setIsLoadingInteraction] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState<{
      title: string;
      message: string;
      onConfirm: () => void;
      confirmText?: string;
      actionStyle?: 'default' | 'danger';
  }>({
      title: '',
      message: '',
      onConfirm: () => {},
      actionStyle: 'danger',
  });
  const [missedDoses, setMissedDoses] = useState<{ med: Medication; date: string; time: string }[]>([]);
  const [isMissedDosesModalOpen, setIsMissedDosesModalOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('userPreferences');
      return saved ? JSON.parse(saved) : {
        fontSize: 'normal',
        highContrast: false,
        voiceGuidance: false,
        calendarSync: false,
        adaptiveNotifications: true,
        offlineMode: true,
      };
    } catch {
      return {
        fontSize: 'normal',
        highContrast: false,
        voiceGuidance: false,
        calendarSync: false,
        adaptiveNotifications: true,
        offlineMode: true,
        easyMode: false,
        lowLiteracyMode: false,
        reminderStyle: 'detailed' as const,
        motivationalMessages: true,
        showTips: true,
      };
    }
  });
  const [actionFeedback, setActionFeedback] = useState<{ type: 'add' | 'edit' | 'delete'; message: string } | null>(null);
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>(() => {
    try {
      const saved = localStorage.getItem('symptomEntries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appSecurity, setAppSecurity] = useState<AppSecurity>(() => {
    try {
      const saved = localStorage.getItem('appSecurity');
      return saved ? JSON.parse(saved) : {
        isLocked: false,
        lockMethod: 'none' as const,
        lockTimeout: 5,
      };
    } catch {
      return {
        isLocked: false,
        lockMethod: 'none' as const,
        lockTimeout: 5,
      };
    }
  });
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [behavioralPatterns, setBehavioralPatterns] = useState<BehavioralPattern[]>([]);
  const [medicationEducations, setMedicationEducations] = useState<{ [medId: string]: MedicationEducation }>(() => {
    try {
      const saved = localStorage.getItem('medicationEducations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [emergencyInfo, setEmergencyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('emergencyInfo');
      return saved ? JSON.parse(saved) : {
        name: '',
        emergencyContact: '',
        emergencyPhone: '',
        criticalMedications: [],
        allergies: [],
        conditions: [],
      };
    } catch {
      return {
        name: '',
        emergencyContact: '',
        emergencyPhone: '',
        criticalMedications: [],
        allergies: [],
        conditions: [],
      };
    }
  });
  const [travelInfo, setTravelInfo] = useState<TravelInfo>(() => {
    try {
      const saved = localStorage.getItem('travelInfo');
      return saved ? JSON.parse(saved) : { isActive: false };
    } catch {
      return { isActive: false };
    }
  });
  const [prnConfigs, setPRNConfigs] = useState<{ [medId: string]: PRNConfig }>(() => {
    try {
      const saved = localStorage.getItem('prnConfigs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    return !hasSeenOnboarding;
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('medications', JSON.stringify(medications));
      if (userPreferences.offlineMode) {
        localStorage.setItem('lastSyncTime', new Date().toISOString());
      }
    } catch (error) {
       console.error("Failed to save medications to localStorage", error);
       if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
            alert("Storage is full. Please remove some medications with large images or clear application data.");
       }
    }
  }, [medications, userPreferences.offlineMode]);

  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    } catch (error) {
      console.error("Failed to save user preferences", error);
    }
  }, [userPreferences]);

  // Apply accessibility preferences
  useEffect(() => {
    const root = document.documentElement;
    if (userPreferences.fontSize === 'large') {
      root.style.fontSize = '110%';
    } else if (userPreferences.fontSize === 'extra-large') {
      root.style.fontSize = '130%';
    } else {
      root.style.fontSize = '100%';
    }
    
    if (userPreferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [userPreferences.fontSize, userPreferences.highContrast]);
  
  // Smart Adaptive Notifications
  const getAdjustedTime = useCallback((med: Medication, scheduledTime: string): string => {
    if (!userPreferences.adaptiveNotifications) return scheduledTime;
    
    try {
      const behaviorKey = `notificationBehavior_${med.id}`;
      const behaviorStr = localStorage.getItem(behaviorKey);
      if (!behaviorStr) return scheduledTime;
      
      const behavior = JSON.parse(behaviorStr);
      const adjustedTimes = behavior.adjustedTimes || [];
      const timeIndex = med.times.indexOf(scheduledTime);
      
      if (adjustedTimes[timeIndex]) {
        return adjustedTimes[timeIndex];
      }
      
      // Calculate average response time and adjust
      if (behavior.averageResponseTime && behavior.averageResponseTime > 5) {
        const [hours, mins] = scheduledTime.split(':').map(Number);
        const adjustedMins = mins - Math.min(behavior.averageResponseTime, 15); // Max 15 min early
        const adjustedHours = adjustedMins < 0 ? hours - 1 : hours;
        const finalMins = adjustedMins < 0 ? 60 + adjustedMins : adjustedMins;
        return `${adjustedHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Error calculating adjusted time:', e);
    }
    
    return scheduledTime;
  }, [userPreferences.adaptiveNotifications]);

  const updateNotificationBehavior = useCallback((medId: string, scheduledTime: string, actualTime: string) => {
    if (!userPreferences.adaptiveNotifications) return;
    
    try {
      const behaviorKey = `notificationBehavior_${medId}`;
      const behaviorStr = localStorage.getItem(behaviorKey);
      const behavior = behaviorStr ? JSON.parse(behaviorStr) : {
        averageResponseTime: 0,
        snoozeCount: 0,
        lateDoseCount: 0,
        adjustedTimes: [],
      };
      
      const [schedH, schedM] = scheduledTime.split(':').map(Number);
      const [actualH, actualM] = actualTime.split(':').map(Number);
      const schedMinutes = schedH * 60 + schedM;
      const actualMinutes = actualH * 60 + actualM;
      const diffMinutes = actualMinutes - schedMinutes;
      
      if (diffMinutes > 0) {
        behavior.lateDoseCount++;
        behavior.averageResponseTime = (behavior.averageResponseTime * (behavior.lateDoseCount - 1) + diffMinutes) / behavior.lateDoseCount;
        
        // Adjust future notifications to be earlier
        const timeIndex = medications.find(m => m.id === medId)?.times.indexOf(scheduledTime) || 0;
        if (!behavior.adjustedTimes[timeIndex]) {
          behavior.adjustedTimes[timeIndex] = scheduledTime;
        }
        const [hours, mins] = behavior.adjustedTimes[timeIndex].split(':').map(Number);
        const adjustedMins = mins - Math.min(Math.round(behavior.averageResponseTime), 15);
        const adjustedHours = adjustedMins < 0 ? hours - 1 : hours;
        const finalMins = adjustedMins < 0 ? 60 + adjustedMins : adjustedMins;
        behavior.adjustedTimes[timeIndex] = `${adjustedHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`;
      }
      
      localStorage.setItem(behaviorKey, JSON.stringify(behavior));
    } catch (e) {
      console.error('Error updating notification behavior:', e);
    }
  }, [userPreferences.adaptiveNotifications, medications]);

  // Handle Dose and Refill Notifications
  useEffect(() => {
    if ('Notification' in window && window.Notification.permission !== 'granted') {
      window.Notification.requestPermission();
    }

    const interval = setInterval(() => {
      if (window.Notification && window.Notification.permission === 'granted') {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const todayStr = now.toISOString().split('T')[0];

        medications.forEach(med => {
          // Dose reminders with adaptive timing
          med.times.forEach(scheduledTime => {
            const adjustedTime = getAdjustedTime(med, scheduledTime);
            if (adjustedTime === currentTime) {
              const dateTimeKey = `${todayStr}T${scheduledTime}`;
              if (!med.doseStatus?.[dateTimeKey]) {
                new window.Notification(`Time for your ${med.name}`, {
                  body: `It's time to take your ${med.dosage} dose.`,
                  icon: '/favicon.ico' 
                });
              }
            }
          });

          // Refill reminders (check once daily around 9 AM)
          if (currentTime === '09:00') {
            if (
                med.quantity !== undefined &&
                med.refillThreshold !== undefined &&
                med.quantity <= med.refillThreshold &&
                !med.refillNotified
            ) {
                new window.Notification(`Refill ${med.name}`, {
                    body: `You have ${med.quantity} pills left. Time to get a refill.`,
                    icon: '/favicon.ico'
                });
                setMedications(prev => prev.map(m => m.id === med.id ? {...m, refillNotified: true} : m));
            }
            // Reset notification status if they refill
            if (
                med.quantity !== undefined &&
                med.refillThreshold !== undefined &&
                med.quantity > med.refillThreshold &&
                med.refillNotified
            ) {
                setMedications(prev => prev.map(m => m.id === med.id ? {...m, refillNotified: false} : m));
            }
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [medications, getAdjustedTime]);

  // Check for missed doses once per session
  useEffect(() => {
    const lastCheckStr = sessionStorage.getItem('lastMissedDoseCheck');
    if (lastCheckStr) {
      return; // Already checked in this session
    }

    const checkMissedDoses = () => {
      const now = new Date();
      const foundMissedDoses: { med: Medication; date: string; time: string }[] = [];

      medications.forEach(med => {
        // Check today and yesterday
        for (let i = 0; i < 2; i++) {
          const dateToCheck = new Date();
          dateToCheck.setDate(now.getDate() - i);
          const dateStr = dateToCheck.toISOString().split('T')[0];

          med.times.forEach(time => {
            const doseDateTime = new Date(`${dateStr}T${time}`);
            // If the scheduled time is in the past
            if (doseDateTime < now) {
              const dateTimeKey = `${dateStr}T${time}`;
              const status = med.doseStatus?.[dateTimeKey];
              if (!status) { // Undefined status means neither taken nor skipped
                foundMissedDoses.push({ med, date: dateStr, time });
              }
            }
          });
        }
      });

      if (foundMissedDoses.length > 0) {
        // Sort with the most recent missed dose first
        foundMissedDoses.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        setMissedDoses(foundMissedDoses);
        setIsMissedDosesModalOpen(true);
      }
      
      sessionStorage.setItem('lastMissedDoseCheck', 'true');
    };

    const timerId = setTimeout(checkMissedDoses, 2000);

    return () => clearTimeout(timerId);
  }, [medications]);


  const handleInteractionCheck = useCallback(async () => {
    if (medications.length > 1) {
      setIsLoadingInteraction(true);
      try {
        const medNames = medications.map(m => `${m.name} ${m.dosage}`);
        const result = await checkInteractions(medNames);
        setInteractionResult(result);
      } catch (error) {
        console.error("Error checking interactions:", error);
        setInteractionResult(null);
      } finally {
        setIsLoadingInteraction(false);
      }
    } else {
      setInteractionResult(null);
    }
  }, [medications]);

  useEffect(() => {
    handleInteractionCheck();
  }, [medications, handleInteractionCheck]);

  const showActionFeedback = (type: 'add' | 'edit' | 'delete', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 3000);
    
    // Haptic feedback (vibration) if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Voice guidance if enabled
    if (userPreferences.voiceGuidance && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const addMedication = (med: Omit<Medication, 'id'>) => {
    const newMed: Medication = { ...med, id: Date.now().toString() };
    setMedications(prev => [...prev, newMed]);
    showActionFeedback('add', `Added ${med.name} to your medication list`);
  };
  
  const updateMedication = (updatedMed: Medication) => {
    setMedications(prev => prev.map(med => med.id === updatedMed.id ? updatedMed : med));
    showActionFeedback('edit', `Updated ${updatedMed.name}`);
    logAction('edit', 'medication', updatedMed.id, `Updated medication: ${updatedMed.name}`);
  };

  const deleteMedication = (id: string) => {
    const med = medications.find(m => m.id === id);
    setMedications(prev => prev.filter(med => med.id !== id));
    if (med) {
      showActionFeedback('delete', `Removed ${med.name} from your medication list`);
      logAction('delete', 'medication', id, `Deleted medication: ${med.name}`);
    }
  };
  
  const handleEdit = (med: Medication) => {
    setEditingMedication(med);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (med: Medication) => {
    setConfirmModalProps({
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${med.name}? This action cannot be undone.`,
        onConfirm: () => deleteMedication(med.id),
        actionStyle: 'danger',
        confirmText: 'Delete',
    });
    setIsConfirmModalOpen(true);
  };

  const requestConfirmation = (props: Omit<typeof confirmModalProps, 'onConfirm' | 'message' | 'title'> & { onConfirm: () => void, message: string, title: string }) => {
    setConfirmModalProps({
        ...props,
        actionStyle: props.actionStyle || 'default',
    });
    setIsConfirmModalOpen(true);
  };


  const handleConfirmAction = () => {
      confirmModalProps.onConfirm();
      setIsConfirmModalOpen(false);
  };
  
  const handleCancelConfirmation = () => {
      setIsConfirmModalOpen(false);
  };
  
  const openAddModal = (prefilledData?: Partial<Medication>) => {
    setEditingMedication(null);
    setIsModalOpen(true);
    // Store prefilled data to be used by AddMedicationModal
    if (prefilledData) {
      localStorage.setItem('prefilledMedication', JSON.stringify(prefilledData));
    }
  };

  const updateDoseStatus = (id: string, date: string, time: string, status: DoseStatus | null) => {
    // Track notification behavior for adaptive notifications
    if (status === 'taken' && userPreferences.adaptiveNotifications) {
      const now = new Date();
      const actualTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      updateNotificationBehavior(id, time, actualTime);
    }
    const dateTimeKey = `${date}T${time}`;
    
    // Get current medication state for undo action
    const med = medications.find(m => m.id === id);
    if (!med) return;
    
    const oldStatus = med.doseStatus?.[dateTimeKey];
    
    // Create undo action
    const undoAction: UndoAction = {
      id: Date.now().toString(),
      type: status === 'taken' ? 'dose_taken' : 'dose_skipped',
      timestamp: new Date().toISOString(),
      data: { id, date, time, oldStatus },
      undo: () => {
        setMedications(prevMed => prevMed.map(m => {
          if (m.id === id) {
            const newDoseStatus = { ...m.doseStatus };
            if (oldStatus) {
              newDoseStatus[dateTimeKey] = oldStatus;
            } else {
              delete newDoseStatus[dateTimeKey];
            }
            return { ...m, doseStatus: newDoseStatus };
          }
          return m;
        }));
      },
    };
    
    // Add undo action and show toast
    undoService.addAction(undoAction);
    setUndoAction(undoAction);
    setTimeout(() => setUndoAction(null), 5000); // Show undo for 5 seconds
    
    // Update medication state
    setMedications(prev => prev.map(med => {
      if (med.id === id) {
        const newDoseStatus = { ...(med.doseStatus || {}) };

        if (status === null) { // This means un-marking the dose
          delete newDoseStatus[dateTimeKey];
        } else {
          newDoseStatus[dateTimeKey] = status;
        }

        let newQuantity = med.quantity;
        if (typeof newQuantity === 'number') {
            if (status === 'taken' && oldStatus !== 'taken') {
                newQuantity -= 1;
            } else if (oldStatus === 'taken' && status !== 'taken') {
                newQuantity += 1;
            }
        }
        
        return { ...med, doseStatus: newDoseStatus, quantity: newQuantity };
      }
      return med;
    }));
  };

  const saveMissedDoseReasons = (reasonsToSave: { [medId: string]: { [dateTimeKey: string]: string } }) => {
    setMedications(prevMeds =>
        prevMeds.map(med => {
            if (reasonsToSave[med.id]) {
                const newReasons = { ...(med.missedDoseReasons || {}) };
                Object.assign(newReasons, reasonsToSave[med.id]);
                return { ...med, missedDoseReasons: newReasons };
            }
            return med;
        })
    );
  };

  const logRefill = (id: string) => {
    const medToRefill = medications.find(m => m.id === id);
    if (!medToRefill) return;

    const newQuantityStr = window.prompt(`Enter the new quantity for ${medToRefill.name}:`, medToRefill.quantity?.toString() || '30');
    if (newQuantityStr === null) return; // User cancelled

    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
        alert("Please enter a valid number.");
        return;
    }

    setMedications(prev =>
      prev.map(med => {
        if (med.id === id) {
          const newHistory = [...(med.refillHistory || []), new Date().toISOString().split('T')[0]];
          return {
            ...med,
            refillHistory: newHistory,
            quantity: newQuantity,
            refillNotified: false
          };
        }
        return med;
      })
    );
  };

  const exportData = () => {
    if (medications.length === 0) {
        alert("No data to export.");
        return;
    }

    // Helper to escape CSV fields
    const escapeCsv = (field: any) => `"${String(field ?? '').replace(/"/g, '""')}"`;

    // Export Medication List
    const medHeaders = ['Name', 'Dosage', 'Frequency', 'Food Instructions', 'Times', 'Quantity', 'Refill Threshold', 'Drug Class', 'Imprint', 'Shape', 'Color'];
    const medRows = medications.map(med => [
        escapeCsv(med.name),
        escapeCsv(med.dosage),
        escapeCsv(med.frequency),
        escapeCsv(med.food),
        escapeCsv(med.times.join(', ')),
        med.quantity ?? '',
        med.refillThreshold ?? '',
        escapeCsv(med.drugClass),
        escapeCsv(med.imprint),
        escapeCsv(med.shape),
        escapeCsv(med.color),
    ]);

    const medCsvContent = "data:text/csv;charset=utf-8," 
        + medHeaders.join(",") + "\n" 
        + medRows.map(e => e.join(",")).join("\n");

    const medEncodedUri = encodeURI(medCsvContent);
    const medLink = document.createElement("a");
    medLink.setAttribute("href", medEncodedUri);
    medLink.setAttribute("download", "pillpal_medications.csv");
    document.body.appendChild(medLink);
    medLink.click();
    document.body.removeChild(medLink);


    // Export Dose History
    const historyLog: {date: string; time: string; name: string; status: DoseStatus | 'missed'; reason?: string}[] = [];
    medications.forEach(med => {
        const allDateTimeKeys = new Set([
          ...Object.keys(med.doseStatus || {}),
          ...Object.keys(med.missedDoseReasons || {}),
        ]);

        allDateTimeKeys.forEach(dateTimeKey => {
            const [date, time] = dateTimeKey.split('T');
            const status = med.doseStatus?.[dateTimeKey];
            const reason = med.missedDoseReasons?.[dateTimeKey];
            
            historyLog.push({
                date,
                time,
                name: med.name,
                status: status || 'missed',
                reason: reason,
            });
        });
    });

    if (historyLog.length > 0) {
        const historyHeaders = ['Date', 'Time', 'Medication Name', 'Status', 'Reason'];
        const historyRows = historyLog
            .sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
            .map(log => [
            log.date,
            log.time,
            escapeCsv(log.name),
            log.status,
            escapeCsv(log.reason)
        ]);
        const historyCsvContent = "data:text/csv;charset=utf-8," 
            + historyHeaders.join(",") + "\n" 
            + historyRows.map(e => e.join(",")).join("\n");
        
        const historyEncodedUri = encodeURI(historyCsvContent);
        const historyLink = document.createElement("a");
        historyLink.setAttribute("href", historyEncodedUri);
        historyLink.setAttribute("download", "pillpal_dose_history.csv");
        document.body.appendChild(historyLink);
        historyLink.click();
        document.body.removeChild(historyLink);
    }
  };


  // Generate weekly coaching summary
  const weeklySummary = useMemo(() => {
    const weekStart = getCurrentWeekStart();
    return generateWeeklyCoachingSummary(medications, weekStart);
  }, [medications]);

  const handleSaveSymptom = (entry: SymptomEntry) => {
    setSymptomEntries(prev => [...prev, entry]);
  };

  const handleAcceptPatternSuggestion = (patternId: string, medicationId: string, suggestion: string) => {
    // Apply suggestion - in a real app, this would update medication times
    console.log('Applying suggestion:', suggestion, 'for medication:', medicationId);
    // For now, just remove the pattern
    setBehavioralPatterns(prev => prev.filter(p => 
      `${p.medicationId}-${p.patternType}` !== patternId
    ));
  };

  const handleDismissPattern = (patternId: string) => {
    setBehavioralPatterns(prev => prev.filter(p => 
      `${p.medicationId}-${p.patternType}` !== patternId
    ));
  };

  const handleUpdateEducation = (education: MedicationEducation) => {
    setMedicationEducations(prev => ({
      ...prev,
      [education.medicationId]: education,
    }));
  };

  const renderView = () => {
    // Check if Easy Mode is enabled
    if (userPreferences.easyMode && currentView === View.Dashboard) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      return (
        <EasyModeDashboard
          medications={medications}
          updateDoseStatus={updateDoseStatus}
          todayString={todayString}
        />
      );
    }

    switch (currentView) {
      case View.Dashboard:
        return (
          <Dashboard 
            medications={medications} 
            updateDoseStatus={updateDoseStatus} 
            logRefill={logRefill} 
            interactionResult={interactionResult} 
            requestConfirmation={requestConfirmation}
            userPreferences={userPreferences}
            symptomEntries={symptomEntries}
            onSaveSymptom={handleSaveSymptom}
            behavioralPatterns={behavioralPatterns}
            onAcceptPatternSuggestion={handleAcceptPatternSuggestion}
            onDismissPattern={handleDismissPattern}
            weeklySummary={weeklySummary}
            medicationEducations={medicationEducations}
            onUpdateEducation={handleUpdateEducation}
            emergencyInfo={emergencyInfo}
            onUpdateEmergencyInfo={setEmergencyInfo}
            onAddMedication={(medicationData) => {
              openAddModal(medicationData);
            }}
          />
        );
      case View.Meds:
        return <MedicationListScreen medications={medications} onEdit={handleEdit} onDeleteRequest={handleDeleteRequest} />;
      case View.Reports:
        return <ReportsScreen medications={medications} />;
      case View.Settings:
        return <SettingsScreen 
          onExportData={exportData} 
          userPreferences={userPreferences}
          setUserPreferences={setUserPreferences}
          appSecurity={appSecurity}
          setAppSecurity={setAppSecurity}
          emergencyInfo={emergencyInfo}
          onUpdateEmergencyInfo={setEmergencyInfo}
          medications={medications}
          symptomEntries={symptomEntries}
        />;
      default:
        return <Dashboard 
          medications={medications} 
          updateDoseStatus={updateDoseStatus} 
          logRefill={logRefill} 
          interactionResult={interactionResult} 
          requestConfirmation={requestConfirmation}
          userPreferences={userPreferences}
        />;
    }
  };

  const fontSizeClass = userPreferences.fontSize === 'large' ? 'text-base' : 
                       userPreferences.fontSize === 'extra-large' ? 'text-lg' : 'text-sm';
  const contrastClass = userPreferences.highContrast ? 'high-contrast' : '';

  const handleVoiceCommand = (command: any) => {
    switch (command.action) {
      case 'mark_taken':
        // Find medication and mark as taken
        if (command.medication) {
          const med = medications.find(m => 
            m.name.toLowerCase().includes(command.medication.toLowerCase())
          );
          if (med) {
            const today = new Date().toISOString().split('T')[0];
            const nextTime = med.times.find(t => {
              const time = new Date(`${today}T${t}`);
              return time > new Date();
            }) || med.times[0];
            if (nextTime) {
              updateDoseStatus(med.id, today, nextTime, 'taken');
            }
          }
        }
        break;
      case 'show_schedule':
        setCurrentView(View.Dashboard);
        break;
      case 'show_missed':
        // Show missed doses
        break;
      case 'add_medication':
        setIsModalOpen(true);
        break;
      case 'show_reports':
        setCurrentView(View.Reports);
        break;
    }
  };

  const handleOnboardingComplete = (preferences: Partial<UserPreferences>, mode: string) => {
    setUserPreferences({ ...userPreferences, ...preferences });
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleQuickAddSelect = (medication: Medication) => {
    // Clone medication for quick add
    const newMed: Medication = {
      ...medication,
      id: Date.now().toString(),
      doseStatus: {},
      quantity: medication.quantity || undefined,
    };
    addMedication(newMed);
  };

  return (
    <div className={`bg-gray-50 min-h-screen font-sans ${contrastClass}`}>
      {/* Onboarding Questionnaire */}
      {showOnboarding && (
        <OnboardingQuestionnaire
          onComplete={handleOnboardingComplete}
          onSkip={() => {
            localStorage.setItem('hasSeenOnboarding', 'true');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Interactive Tutorial */}
      {showTutorial && (
        <InteractiveTutorial
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}

      {/* App Lock */}
      {appSecurity.isLocked && (
        <AppLock
          security={appSecurity}
          onUnlock={() => setAppSecurity(prev => ({ 
            ...prev, 
            isLocked: false, 
            lastUnlockTime: new Date().toISOString() 
          }))}
          onSetPin={(pinHash) => setAppSecurity(prev => ({ 
            ...prev, 
            pinHash, 
            lockMethod: 'pin' as const 
          }))}
        />
      )}

      {/* Emergency Medical ID on Lock Screen */}
      {appSecurity.isLocked && emergencyInfo.name && (
        <EmergencyMedicalID
          emergencyInfo={emergencyInfo}
          medications={medications}
          onUpdate={setEmergencyInfo}
          isLockScreen={true}
        />
      )}

      {/* Contextual Tips */}
      <ContextualTips
        userPreferences={userPreferences}
        medications={medications}
        onDismiss={(tipId) => setDismissedTips(prev => [...prev, tipId])}
      />

      {/* Seasonal Alerts */}
      <SeasonalAlerts
        medications={medications}
        userPreferences={userPreferences}
        onDismiss={(alertId) => {
          const dismissed = JSON.parse(localStorage.getItem('dismissedSeasonalAlerts') || '[]');
          dismissed.push(alertId);
          localStorage.setItem('dismissedSeasonalAlerts', JSON.stringify(dismissed));
        }}
        onAddMedication={(medicationData) => {
          openAddModal(medicationData);
        }}
      />

      {/* Cost Saving Suggestions */}
      <CostSavingSuggestions
        medications={medications}
        onDismiss={(suggestionId) => {
          const dismissed = JSON.parse(localStorage.getItem('dismissedCostSuggestions') || '[]');
          dismissed.push(suggestionId);
          localStorage.setItem('dismissedCostSuggestions', JSON.stringify(dismissed));
        }}
      />

      {/* Periodic Check-In Reminders */}
      <PeriodicCheckIn
        medications={medications}
        onDismiss={(reminderId) => {
          const dismissed = JSON.parse(localStorage.getItem('dismissedCheckIns') || '[]');
          dismissed.push(reminderId);
          localStorage.setItem('dismissedCheckIns', JSON.stringify(dismissed));
        }}
      />

      {/* Quick Add Medication */}
      {showQuickAdd && (
        <QuickAddMedication
          medications={medications}
          onSelect={handleQuickAddSelect}
          onClose={() => setShowQuickAdd(false)}
        />
      )}

      {actionFeedback && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in ${
          actionFeedback.type === 'add' ? 'bg-green-500 text-white' :
          actionFeedback.type === 'edit' ? 'bg-blue-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          <p className="font-semibold">{actionFeedback.message}</p>
        </div>
      )}
      <div className="container mx-auto max-w-lg h-screen flex flex-col shadow-2xl app-container">
        <header className="brand-gradient text-white p-4 text-center sticky top-0 z-10 shadow-lg">
          <h1 className="text-2xl font-bold tracking-wide">PillPal</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
          {renderView()}
        </main>

        {currentView !== View.Meds && (
          <div className="fixed bottom-20 right-1/2 translate-x-1/2 mb-4 z-20 flex gap-2" style={{'left': 'calc(50% - 0px - (100vw - 32rem)/2)'}}>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="bg-green-600 text-white rounded-full p-3 shadow-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-transform hover:scale-110"
              aria-label="Quick add medication"
              title="Quick Add"
            >
              <ClockIcon className="h-6 w-6" />
            </button>
            <button
              onClick={openAddModal}
              className="brand-gradient text-white rounded-full p-4 shadow-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-transform hover:scale-110"
              aria-label="Add new medication"
            >
              <PlusIcon className="h-8 w-8" />
            </button>
          </div>
        )}

        <BottomNav currentView={currentView} setView={setCurrentView} />

        {isModalOpen && (
          <AddMedicationModal
            onClose={() => setIsModalOpen(false)}
            onAdd={addMedication}
            onUpdate={updateMedication}
            existingMedication={editingMedication}
            medications={medications}
            requestConfirmation={requestConfirmation}
          />
        )}

        {isConfirmModalOpen && (
          <ConfirmationModal
            isOpen={isConfirmModalOpen}
            title={confirmModalProps.title}
            message={confirmModalProps.message}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelConfirmation}
            confirmText={confirmModalProps.confirmText}
            actionStyle={confirmModalProps.actionStyle}
          />
        )}

        {isMissedDosesModalOpen && (
          <MissedDosesModal
            missedDoses={missedDoses}
            onClose={() => setIsMissedDosesModalOpen(false)}
            onSaveReasons={saveMissedDoseReasons}
            requestConfirmation={requestConfirmation}
          />
        )}
      </div>
    </div>
  );
};

// Add ClockIcon if not exists
const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default App;