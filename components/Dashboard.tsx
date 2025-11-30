import React, { useState, useEffect, useMemo } from 'react';
import { Medication, DoseStatus, InteractionResult } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, AlertTriangleIcon, PillIcon, SkipIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import InteractionAlert from './InteractionAlert';
import AdherenceStreakWidget from './AdherenceStreakWidget';
import SymptomJournal from './SymptomJournal';
import BehavioralPatternAlert from './BehavioralPatternAlert';
import WeeklyCoachingSummary from './WeeklyCoachingSummary';
import SeasonalAlerts from './SeasonalAlerts';
import CostSavingSuggestions from './CostSavingSuggestions';
import PeriodicCheckIn from './PeriodicCheckIn';

interface DashboardProps {
  medications: Medication[];
  updateDoseStatus: (id: string, date: string, time: string, status: DoseStatus | null) => void;
  logRefill: (id: string) => void;
  interactionResult?: InteractionResult | null;
  requestConfirmation?: (props: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    actionStyle?: 'default' | 'danger';
  }) => void;
  userPreferences?: any;
  symptomEntries?: any[];
  onSaveSymptom?: (entry: any) => void;
  behavioralPatterns?: any[];
  onAcceptPatternSuggestion?: (patternId: string, medicationId: string, suggestion: string) => void;
  onDismissPattern?: (patternId: string) => void;
  weeklySummary?: any;
  medicationEducations?: any;
  onUpdateEducation?: (education: any) => void;
  emergencyInfo?: any;
  onUpdateEmergencyInfo?: (info: any) => void;
  onAddMedication?: (medicationData: Partial<Medication>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  medications, 
  updateDoseStatus, 
  logRefill, 
  interactionResult, 
  requestConfirmation,
  userPreferences,
  symptomEntries = [],
  onSaveSymptom,
  behavioralPatterns = [],
  onAcceptPatternSuggestion,
  onDismissPattern,
  weeklySummary,
  medicationEducations = {},
  onUpdateEducation,
  emergencyInfo,
  onUpdateEmergencyInfo,
  onAddMedication,
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isRefillExpanded, setIsRefillExpanded] = useState(false);
  const [refillCurrentPage, setRefillCurrentPage] = useState(0);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(0);
  const [isMissedDosesExpanded, setIsMissedDosesExpanded] = useState(false);
  const [missedDosesCurrentPage, setMissedDosesCurrentPage] = useState(0);
  
  // Reset history pagination when selected date changes
  useEffect(() => {
    setHistoryCurrentPage(0);
    setIsHistoryExpanded(false);
  }, [selectedDate]);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
  const todayString = today.toISOString().split('T')[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const getDosesForDate = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return medications.flatMap(med => {
        // Check if medication has a tapering schedule
        if (med.taperingSchedule && med.startDate) {
          const startDate = new Date(med.startDate);
          startDate.setHours(0, 0, 0, 0);
          const currentDate = new Date(date);
          currentDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const dayNumber = daysDiff + 1; // Day 1 is the start date
          
          // Find the schedule entry for this day
          const scheduleEntry = med.taperingSchedule.find(s => s.day === dayNumber);
          if (scheduleEntry) {
            // Generate times for this day based on number of tablets
            const numTablets = scheduleEntry.tablets;
            if (numTablets <= 0) return [];
            
            // Generate times evenly spread throughout the day
            const startHour = 8;
            const endHour = 22;
            const totalMinutes = (endHour - startHour) * 60;
            const interval = numTablets > 1 ? totalMinutes / (numTablets - 1) : 0;
            
            const times: string[] = [];
            for (let i = 0; i < numTablets; i++) {
              const minutes = startHour * 60 + i * interval;
              const hours = Math.floor(minutes / 60);
              const mins = Math.round(minutes % 60);
              times.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
            }
            
            return times.map(time => ({ ...med, date: dateStr, time }));
          } else if (dayNumber > med.taperingSchedule[med.taperingSchedule.length - 1].day) {
            // Past the tapering schedule, no doses
            return [];
          } else {
            // Before the schedule starts or between days, no doses
            return [];
          }
        }
        
        // Regular medication - use stored times
        return med.times.map(time => ({ ...med, date: dateStr, time }));
      });
  };

  const upcomingMedications = getDosesForDate(today);
  const lowStockMeds = medications.filter(m => m.quantity !== undefined && m.refillThreshold !== undefined && m.quantity <= m.refillThreshold);
  
  // Calculate missed doses (doses that were scheduled in the past but not taken)
  const missedDoses = useMemo(() => {
    const now = new Date();
    const missed: { med: Medication; date: string; time: string }[] = [];
    const todayDoses = getDosesForDate(today);
    
    medications.forEach(med => {
      todayDoses.filter(d => d.id === med.id).forEach(dose => {
        const doseDateTime = new Date(`${dose.date}T${dose.time}`);
        // Check if dose was scheduled in the past (more than 30 minutes ago to allow for late takes)
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        
        if (doseDateTime < thirtyMinutesAgo) {
          const dateTimeKey = `${dose.date}T${dose.time}`;
          const status = med.doseStatus?.[dateTimeKey];
          
          // If not taken or skipped, it's missed
          if (status !== 'taken' && status !== 'skipped') {
            missed.push({
              med: med,
              date: dose.date,
              time: dose.time
            });
          }
        }
      });
    });
    
    return missed;
  }, [medications, todayString]);


  const changeMonth = (offset: number) => {
    setViewDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };
  
  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Previous month">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h3 className="font-bold text-lg text-gray-800">{monthName}</h3>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Next month">
            <ChevronRightIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
          {weekDays.map(day => <div key={day} className="font-semibold text-gray-400 text-xs">{day}</div>)}
          {blanks.map(blank => <div key={`blank-${blank}`}></div>)}
          {days.map(day => {
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0,0,0,0);
            const dateStr = dayDate.toISOString().split('T')[0];
            const isToday = dayDate.getTime() === today.getTime();
            const isSelected = selectedDate && dayDate.getTime() === selectedDate.getTime();

            const dosesForDay = getDosesForDate(dayDate);
            const totalDoses = dosesForDay.length;
            const takenDoses = dosesForDay.filter(dose => dose.doseStatus?.[`${dateStr}T${dose.time}`] === 'taken').length;
            
            let adherenceRing = null;
            if (totalDoses > 0 && (dayDate <= today)) {
              const adherenceRatio = takenDoses / totalDoses;
              if (adherenceRatio === 1) {
                adherenceRing = 'ring-green-500';
              } else if (adherenceRatio > 0) {
                adherenceRing = 'ring-yellow-500';
              } else if (dayDate < today) {
                adherenceRing = 'ring-red-500';
              }
            }

            return (
              <div key={day} className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedDate(dayDate)}>
                <span className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${isToday ? 'brand-gradient text-white font-bold shadow-md' : isSelected ? 'bg-gray-200 text-gray-800' : 'text-gray-700 hover:bg-gray-100'} ${adherenceRing ? `ring-2 ring-offset-2 ${adherenceRing}` : ''}`}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderSelectedDateDetails = () => {
      if (!selectedDate) return null;
      
      const dosesForDay = getDosesForDate(selectedDate);
      if (dosesForDay.length === 0) return null;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const dateString = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const itemsPerPage = 5;
      const totalPages = Math.ceil(dosesForDay.length / itemsPerPage);
      const startIndex = historyCurrentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = dosesForDay.slice(startIndex, endIndex);

      return (
          <div className="bg-white p-4 rounded-xl shadow-lg space-y-3 mt-4 animate-fade-in">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-800">History for {dateString}</h3>
                  <button
                      onClick={() => {
                        setIsHistoryExpanded(!isHistoryExpanded);
                        if (!isHistoryExpanded) setHistoryCurrentPage(0);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label={isHistoryExpanded ? "Collapse details" : "Expand details"}
                  >
                      {isHistoryExpanded ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                      ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                      )}
                  </button>
              </div>
              {isHistoryExpanded && (
                  <div className="space-y-2 animate-fade-in">
                      <div className="min-h-[150px]">
                          {currentItems.map((dose, index) => {
                              const status = dose.doseStatus?.[`${dateStr}T${dose.time}`];
                              const doseDateTime = new Date(`${dateStr}T${dose.time}`);
                              const now = new Date();
                              const isFuture = doseDateTime > now;
                              
                              const statusConfig = {
                                  taken: { color: 'bg-green-500', label: 'Taken', badge: 'bg-green-100 text-green-800' },
                                  skipped: { color: 'bg-gray-400', label: 'Skipped', badge: 'bg-gray-100 text-gray-800' },
                                  missed: { color: 'bg-red-500', label: 'Missed', badge: 'bg-red-100 text-red-800' },
                                  scheduled: { color: 'bg-blue-500', label: 'Scheduled', badge: 'bg-blue-100 text-blue-800' },
                              };
                              
                              // For future dates, show "Scheduled" instead of "Missed"
                              const currentStatus = status 
                                  ? statusConfig[status] 
                                  : (isFuture ? statusConfig.scheduled : statusConfig.missed);
                              
                              return (
                                <div key={`${dose.id}-${dose.time}-${index}`} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`}></div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{dose.name} <span className="text-sm text-gray-500 font-normal">{dose.dosage}</span></p>
                                            <p className="text-sm text-gray-500">{dose.time}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.badge}`}>
                                        {currentStatus.label}
                                    </span>
                                </div>
                              );
                          })}
                      </div>
                      {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <button
                                  onClick={() => setHistoryCurrentPage(prev => Math.max(0, prev - 1))}
                                  disabled={historyCurrentPage === 0}
                                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                      historyCurrentPage === 0
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                              >
                                  ← Previous
                              </button>
                              <span className="text-sm text-gray-700 font-medium">
                                  Page {historyCurrentPage + 1} of {totalPages}
                              </span>
                              <button
                                  onClick={() => setHistoryCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                  disabled={historyCurrentPage >= totalPages - 1}
                                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                      historyCurrentPage >= totalPages - 1
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                              >
                                  Next →
                              </button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">{getGreeting()}</h2>
        <p className="text-gray-500">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Unified Alerts Section */}
      <div className="space-y-4">
        {/* Seasonal Alerts - Show at top */}
        {userPreferences?.showTips && (
          <SeasonalAlerts
            medications={medications}
            userPreferences={userPreferences}
            onDismiss={() => {}}
            onAddMedication={onAddMedication}
          />
        )}

        {/* Cost Saving Suggestions */}
        <CostSavingSuggestions
          medications={medications}
          onDismiss={() => {}}
        />

        {/* Periodic Check-In */}
        <PeriodicCheckIn
          medications={medications}
          onDismiss={() => {}}
        />

        {/* Adherence Streak Widget */}
        {userPreferences?.motivationalMessages && (
          <AdherenceStreakWidget medications={medications} compact={false} />
        )}

        {/* Weekly Coaching Summary */}
        {weeklySummary && userPreferences?.motivationalMessages && (
          <WeeklyCoachingSummary summary={weeklySummary} compact={true} />
        )}

        {/* Behavioral Pattern Alerts */}
        {behavioralPatterns.length > 0 && onAcceptPatternSuggestion && onDismissPattern && (
          <BehavioralPatternAlert
            patterns={behavioralPatterns}
            medications={medications}
            onAcceptSuggestion={onAcceptPatternSuggestion}
            onDismiss={onDismissPattern}
          />
        )}

        {interactionResult && <InteractionAlert result={interactionResult} onCheck={() => {}} isLoading={false} />}

        {missedDoses.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-r-lg shadow-lg" role="alert">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className="py-1"><AlertTriangleIcon className="h-6 w-6 text-red-500 mr-4"/></div>
                <div className="flex-1">
                  <p className="font-bold">Missed Doses</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMissedDosesExpanded(!isMissedDosesExpanded);
                  if (!isMissedDosesExpanded) setMissedDosesCurrentPage(0);
                }}
                className="ml-4 p-1 rounded-full hover:bg-red-100 transition-colors"
                aria-label={isMissedDosesExpanded ? "Collapse details" : "Expand details"}
              >
                {isMissedDosesExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-red-700" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-red-700" />
                )}
              </button>
            </div>
            {isMissedDosesExpanded && (
              <div className="mt-4 space-y-4 animate-fade-in">
                {(() => {
                  const itemsPerPage = 3;
                  const totalPages = Math.ceil(missedDoses.length / itemsPerPage);
                  const startIndex = missedDosesCurrentPage * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentMissed = missedDoses.slice(startIndex, endIndex);
                  
                  return (
                    <>
                      <div className="space-y-2 min-h-[100px]">
                        {currentMissed.map(({ med, date, time }, index) => {
                          const doseDateTime = new Date(`${date}T${time}`);
                          return (
                            <div key={`${med.id}-${date}-${time}-${index}`} className="flex items-center justify-between bg-red-100 p-3 rounded-lg">
                              <div>
                                <p className="text-sm font-medium">{med.name} {med.dosage}</p>
                                <p className="text-xs text-red-700">Scheduled for {doseDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {time}</p>
                              </div>
                              <button
                                onClick={() => {
                                  if (requestConfirmation) {
                                    requestConfirmation({
                                      title: 'Mark Dose as Taken',
                                      message: `Are you sure you want to mark "${med.name} ${med.dosage}" as taken? Please make sure you did not click by mistake.`,
                                      onConfirm: () => {
                                        updateDoseStatus(med.id, date, time, 'taken');
                                      },
                                      confirmText: 'Yes, Mark Taken',
                                      cancelText: 'Cancel',
                                      actionStyle: 'default',
                                    });
                                  } else {
                                    updateDoseStatus(med.id, date, time, 'taken');
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-red-200 text-red-800 rounded-full hover:bg-red-300 transition-colors"
                              >
                                Mark Taken
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-red-200">
                          <button
                            onClick={() => setMissedDosesCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={missedDosesCurrentPage === 0}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                              missedDosesCurrentPage === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            ← Previous
                          </button>
                          <span className="text-sm text-red-700 font-medium">
                            Page {missedDosesCurrentPage + 1} of {totalPages}
                          </span>
                          <button
                            onClick={() => setMissedDosesCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={missedDosesCurrentPage >= totalPages - 1}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                              missedDosesCurrentPage >= totalPages - 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {lowStockMeds.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg shadow-lg" role="alert">
              <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                      <div className="py-1"><AlertTriangleIcon className="h-6 w-6 text-yellow-500 mr-4"/></div>
                      <div className="flex-1">
                          <p className="font-bold">Refill Reminder</p>
                      </div>
                  </div>
                  <button
                      onClick={() => {
                        setIsRefillExpanded(!isRefillExpanded);
                        if (!isRefillExpanded) setRefillCurrentPage(0); // Reset to first page when expanding
                      }}
                      className="ml-4 p-1 rounded-full hover:bg-yellow-100 transition-colors"
                      aria-label={isRefillExpanded ? "Collapse details" : "Expand details"}
                  >
                      {isRefillExpanded ? (
                          <ChevronUpIcon className="h-5 w-5 text-yellow-700" />
                      ) : (
                          <ChevronDownIcon className="h-5 w-5 text-yellow-700" />
                      )}
                  </button>
              </div>
              {isRefillExpanded && (
                  <div className="mt-4 space-y-4 animate-fade-in">
                      {(() => {
                        const itemsPerPage = 3;
                        const totalPages = Math.ceil(lowStockMeds.length / itemsPerPage);
                        const startIndex = refillCurrentPage * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const currentMeds = lowStockMeds.slice(startIndex, endIndex);
                        
                        return (
                          <>
                            <div className="space-y-2 min-h-[100px]">
                              {currentMeds.map(med => (
                                <div key={med.id} className="flex items-center justify-between bg-yellow-100 p-3 rounded-lg">
                                  <p className="text-sm font-medium">{med.name} is running low ({med.quantity} left).</p>
                                  <button 
                                    onClick={() => logRefill(med.id)} 
                                    className="px-3 py-1.5 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300 transition-colors"
                                  >
                                    Log Refill
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                                <button
                                  onClick={() => setRefillCurrentPage(prev => Math.max(0, prev - 1))}
                                  disabled={refillCurrentPage === 0}
                                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                    refillCurrentPage === 0
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  }`}
                                >
                                  ← Previous
                                </button>
                                <span className="text-sm text-yellow-700 font-medium">
                                  Page {refillCurrentPage + 1} of {totalPages}
                                </span>
                                <button
                                  onClick={() => setRefillCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                  disabled={refillCurrentPage >= totalPages - 1}
                                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                    refillCurrentPage >= totalPages - 1
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  }`}
                                >
                                  Next →
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                  </div>
              )}
          </div>
        )}
      </div>

      {renderCalendar()}
      {renderSelectedDateDetails()}
      
      {/* Symptom Journal */}
      {onSaveSymptom && (
        <SymptomJournal
          medications={medications}
          onSave={onSaveSymptom}
          compact={true}
        />
      )}

      {upcomingMedications.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800 pt-1 pb-1">Today's Medications</h3>
          {(() => {
            // Group medications by name and sort by time
            const grouped = upcomingMedications.reduce((acc, dose) => {
              if (!acc[dose.name]) {
                acc[dose.name] = [];
              }
              acc[dose.name].push(dose);
              return acc;
            }, {} as Record<string, typeof upcomingMedications>);
            
            // Sort each group by time, then sort groups by first time
            const sortedGroups = Object.entries(grouped)
              .map(([name, doses]) => ({
                name,
                doses: doses.sort((a, b) => a.time.localeCompare(b.time))
              }))
              .sort((a, b) => a.doses[0].time.localeCompare(b.doses[0].time));
            
            return sortedGroups.map((group, groupIndex) => {
              // Separate taken and not-taken doses
              const takenDoses = group.doses.filter(d => d.doseStatus?.[`${todayString}T${d.time}`] === 'taken');
              const notTakenDoses = group.doses.filter(d => d.doseStatus?.[`${todayString}T${d.time}`] !== 'taken');
              const takenTimes = takenDoses.map(d => d.time).sort();
              const firstDose = group.doses[0];
              const pillDetails = [firstDose.color, firstDose.shape, firstDose.imprint && `Imprint: ${firstDose.imprint}`].filter(Boolean).join(' • ');

              return (
                <div key={group.name} className="mb-3">
                  {group.doses.length > 1 && (
                    <div className="mb-2 px-2">
                      <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">{group.name}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {/* Show one box for all taken doses */}
                    {takenDoses.length > 0 && (
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-green-200 bg-green-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-100 flex-shrink-0">
                              {firstDose.image ? 
                                <img src={firstDose.image} alt={firstDose.name} className="w-12 h-12 object-cover rounded-xl" /> :
                                <PillIcon className="w-6 h-6 text-green-600" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold text-base text-gray-900 truncate">{firstDose.name}</p>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">✓ TAKEN</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">{firstDose.dosage}</p>
                              <p className="text-xs text-green-700 font-medium mt-0.5">{takenTimes.join(', ')}</p>
                            </div>
                          </div>
                          {firstDose.food !== 'No specific instructions' && (
                            <div className="ml-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">🍽️</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Show individual boxes for not-taken doses */}
                    {notTakenDoses.map((dose, index) => {
                      const status = dose.doseStatus?.[`${todayString}T${dose.time}`];
                      const isSkipped = status === 'skipped';
                      const isTaken = status === 'taken';

                      return (
                        <div 
                          key={`${dose.id}-${dose.time}-${index}`} 
                          className={`bg-white p-3 rounded-xl shadow-sm border transition-all duration-200 ${
                            isSkipped 
                              ? 'border-gray-200 bg-gray-50/50' 
                              : isTaken
                              ? 'border-green-200 bg-green-50/50'
                              : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Icon and Info */}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 ${
                                isSkipped 
                                  ? 'bg-gray-100' 
                                  : isTaken
                                  ? 'bg-green-100'
                                  : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                              }`}>
                                {dose.image ? 
                                  <img src={dose.image} alt={dose.name} className="w-12 h-12 object-cover rounded-xl" /> :
                                  <PillIcon className={`w-6 h-6 ${isSkipped ? 'text-gray-400' : isTaken ? 'text-green-600' : 'text-indigo-500'}`} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className={`font-semibold text-base truncate ${
                                    isSkipped ? 'text-gray-500' : isTaken ? 'text-green-800' : 'text-gray-900'
                                  }`}>
                                    {group.doses.length > 1 ? dose.name : dose.name}
                                  </p>
                                  {isSkipped && (
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full flex-shrink-0">SKIPPED</span>
                                  )}
                                  {isTaken && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">✓ TAKEN</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 truncate">{dose.dosage}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className={`text-xs font-semibold ${
                                    isSkipped ? 'text-gray-500' : isTaken ? 'text-green-700' : 'text-indigo-600'
                                  }`}>
                                    {dose.time}
                                  </p>
                                  {dose.food !== 'No specific instructions' && (
                                    <span className="text-xs text-gray-500">🍽️ {dose.food === 'With food' ? 'With food' : 'Without food'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!isTaken && (
                                <button
                                  onClick={() => {
                                    if (requestConfirmation) {
                                      requestConfirmation({
                                        title: 'Mark as Taken',
                                        message: `Are you sure you want to mark "${dose.name}" (${dose.dosage}) at ${dose.time} as taken? Please make sure you did not click by mistake.`,
                                        onConfirm: () => {
                                          updateDoseStatus(dose.id, todayString, dose.time, 'taken');
                                        },
                                        confirmText: 'Yes, Mark Taken',
                                        cancelText: 'Cancel',
                                        actionStyle: 'default',
                                      });
                                    } else {
                                      updateDoseStatus(dose.id, todayString, dose.time, 'taken');
                                    }
                                  }}
                                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-sm"
                                >
                                  TAKEN
                                </button>
                              )}
                              {!isSkipped && !isTaken && (
                                <button
                                  onClick={() => {
                                    if (requestConfirmation) {
                                      requestConfirmation({
                                        title: 'Skip Dose',
                                        message: `Are you sure you want to skip "${dose.name}" (${dose.dosage}) at ${dose.time}? Please make sure you did not click by mistake.`,
                                        onConfirm: () => {
                                          updateDoseStatus(dose.id, todayString, dose.time, 'skipped');
                                        },
                                        confirmText: 'Yes, Skip',
                                        cancelText: 'Cancel',
                                        actionStyle: 'default',
                                      });
                                    } else {
                                      updateDoseStatus(dose.id, todayString, dose.time, 'skipped');
                                    }
                                  }}
                                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95"
                                  aria-label="Skip dose"
                                >
                                  SKIP
                                </button>
                              )}
                              {isSkipped && !isTaken && (
                                <button
                                  onClick={() => {
                                    if (requestConfirmation) {
                                      requestConfirmation({
                                        title: 'Unskip Dose',
                                        message: `Are you sure you want to unskip "${dose.name}" (${dose.dosage}) at ${dose.time}?`,
                                        onConfirm: () => {
                                          updateDoseStatus(dose.id, todayString, dose.time, null);
                                        },
                                        confirmText: 'Yes, Unskip',
                                        cancelText: 'Cancel',
                                        actionStyle: 'default',
                                      });
                                    } else {
                                      updateDoseStatus(dose.id, todayString, dose.time, null);
                                    }
                                  }}
                                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95"
                                  aria-label="Unskip dose"
                                >
                                  Unskip
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
            });
          })()}
        </div>
      ) : (
        <div className="text-center py-10 px-4 bg-white rounded-xl shadow-lg">
          <PillIcon className="mx-auto h-12 w-12 text-gray-300"/>
          <p className="text-gray-600 font-medium mt-4">No medications scheduled for today.</p>
          <p className="text-gray-500 text-sm mt-1">Add a new medication to get started!</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;