// Fix: Add missing Web Speech API type definitions.
// These interfaces are for the Web Speech API, which is not yet fully standardized
// and might not be available in all TypeScript lib files.

declare global {
  // See: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
    readonly message: string;
  }

  // See: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface AIStudio {
    camera: {
      getPicture: () => Promise<Blob>;
    };
  }
  // Add Web Speech API types for voice input
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    // Fix: Add aistudio to Window interface for proper type checking
    aistudio?: AIStudio;
  }
}

export type DoseStatus = 'taken' | 'skipped';

export interface InteractionDetail {
  description: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Unknown';
  management: string;
  interactingDrugs?: string[];
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // e.g., ['08:00', '20:00']
  food: 'With food' | 'Without food' | 'No specific instructions';
  doseStatus?: { [dateTime: string]: DoseStatus }; // Tracks intake, e.g., { '2023-10-27T08:00': 'taken' }
  missedDoseReasons?: { [dateTime: string]: string }; // Tracks reasons for missed doses
  image?: string; // Base64 encoded image string from camera or search
  quantity?: number;
  refillThreshold?: number;
  refillNotified?: boolean; // To prevent spamming refill notifications
  drugClass?: string; // From Gemini
  sideEffects?: string; // From Gemini
  imprint?: string; // e.g., "APO 10"
  shape?: string;
  color?: string;
  refillHistory?: string[]; // Array of ISO date strings 'YYYY-MM-DD'
  usageNote?: string;
  similarMeds?: string[];
  startDate?: string; // ISO date string for tapering schedules 'YYYY-MM-DD'
  taperingSchedule?: { day: number; tablets: number }[]; // For multi-day tapering schedules
}

export interface InteractionResult {
  hasInteractions: boolean;
  summary: string;
  details?: InteractionDetail[];
}

export enum View {
  Dashboard = 'dashboard',
  Meds = 'meds',
  Reports = 'reports',
  Settings = 'settings',
}

// Dashboard Widget Configuration (moved before UserPreferences)
export interface DashboardWidget {
  id: string;
  type: 'upcoming' | 'adherence' | 'streaks' | 'symptoms' | 'refills' | 'interactions';
  enabled: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

export interface UserPreferences {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  voiceGuidance: boolean;
  calendarSync: boolean;
  calendarProvider?: 'google' | 'apple';
  adaptiveNotifications: boolean;
  offlineMode: boolean;
  lastSyncTime?: string;
  easyMode?: boolean;
  lowLiteracyMode?: boolean;
  dashboardWidgets?: DashboardWidget[];
  reminderStyle?: 'detailed' | 'simple' | 'minimal';
  motivationalMessages?: boolean;
  showTips?: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  accessLevel: 'view' | 'manage';
  addedDate: string;
}

export interface NotificationBehavior {
  medicationId: string;
  averageResponseTime?: number; // minutes
  snoozeCount: number;
  lateDoseCount: number;
  adjustedTimes: string[]; // Adjusted reminder times
  lastReminderTime?: string; // ISO timestamp
  reminderStage?: number; // 0 = first, 1 = follow-up, 2 = check-in
}

// Adherence & Gamification
export interface AdherenceStreak {
  currentStreak: number; // Days
  longestStreak: number;
  lastStreakDate: string; // ISO date
  totalDosesTaken: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  type: 'days' | 'doses';
  target: number;
  achieved: boolean;
  achievedDate?: string;
  badge?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate?: string;
  category: 'streak' | 'adherence' | 'consistency' | 'milestone';
}

// Symptom & Side-Effect Journal
export interface SymptomEntry {
  id: string;
  date: string; // ISO date
  time: string; // HH:mm
  medicationId?: string;
  symptoms: string[];
  mood: '😊' | '😐' | '😞' | '😢' | '😴';
  painLevel?: number; // 0-10
  notes?: string;
  sideEffects?: string[];
}

// Behavioral Patterns
export interface BehavioralPattern {
  medicationId: string;
  patternType: 'missed_day' | 'late_time' | 'frequent_snooze';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  timeWindow?: string; // e.g., "morning", "evening"
  frequency: number; // How often this pattern occurs
  suggestion?: string;
}

// Medication Education
export interface MedicationEducation {
  medicationId: string;
  purpose?: string; // "for blood pressure"
  summary?: string;
  howToTake?: string;
  commonSideEffects?: string[];
  seriousSideEffects?: string[];
  foodNotes?: string;
  interactionNotes?: string;
  videoUrl?: string;
  infographicUrl?: string;
}

// Emergency & Safety
export interface EmergencyInfo {
  name: string;
  emergencyContact: string;
  emergencyPhone: string;
  criticalMedications: string[];
  allergies: string[];
  conditions: string[];
  bloodType?: string;
  doctorName?: string;
  doctorPhone?: string;
}

// App Security
export interface AppSecurity {
  isLocked: boolean;
  lockMethod: 'none' | 'pin' | 'biometric';
  pinHash?: string;
  lockTimeout: number; // minutes
  lastUnlockTime?: string;
}

// Undo Action
export interface UndoAction {
  id: string;
  type: 'dose_taken' | 'dose_skipped' | 'medication_added' | 'medication_deleted' | 'medication_edited';
  timestamp: string;
  data: any; // Action-specific data
  undo: () => void;
}

// Weekly Coaching Summary
export interface WeeklyCoachingSummary {
  weekStart: string; // ISO date
  adherencePercentage: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  bestTimeWindow: string;
  worstTimeWindow: string;
  suggestions: string[];
  achievements: string[];
}

// Travel Mode
export interface TravelInfo {
  isActive: boolean;
  destinationTimezone?: string;
  departureDate?: string;
  returnDate?: string;
  adjustedSchedule?: { [medicationId: string]: { [date: string]: string[] } };
}

// PRN (As-Needed) Medication Logic
export interface PRNConfig {
  medicationId: string;
  minIntervalHours: number;
  maxPerDay: number;
  lastTakenTime?: string;
  takenToday: number;
  resetDate: string; // ISO date
}