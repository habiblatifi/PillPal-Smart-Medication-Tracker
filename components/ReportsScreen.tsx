import React, { useMemo, useState } from 'react';
import { Medication } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

interface ReportsScreenProps {
  medications: Medication[];
}

const MedicationHistoryLog: React.FC<{medications: Medication[]}> = ({ medications }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    
    const history = useMemo(() => {
        const log: {date: Date; med: Medication, time: string, status: 'taken' | 'skipped' | 'missed', reason?: string}[] = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        medications.forEach(med => {
            for (let i = 0; i < 30; i++) { // Look back 30 days
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                
                if (date > new Date()) continue; // Don't log future doses

                const dateStr = date.toISOString().split('T')[0];
                med.times.forEach(time => {
                    const dateTime = new Date(`${dateStr}T${time}`);
                    if (dateTime > new Date()) return; // Don't log future times on the current day

                    const dateTimeKey = `${dateStr}T${time}`;
                    const status = med.doseStatus?.[dateTimeKey];

                    if (status) {
                        log.push({ date: dateTime, med, time, status });
                    } else {
                        const reason = med.missedDoseReasons?.[dateTimeKey];
                        log.push({ date: dateTime, med, time, status: 'missed', reason });
                    }
                });
            }
        });
        
        return log.sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [medications]);

    if (history.length === 0) {
        return <p className="text-center text-gray-500 py-8">No medication history available.</p>;
    }

    const totalPages = Math.ceil(history.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = history.slice(startIndex, endIndex);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">Medication History Log</h4>
                <button
                    onClick={() => {
                        setIsExpanded(!isExpanded);
                        if (!isExpanded) setCurrentPage(0);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-600" /> : <ChevronDownIcon className="h-5 w-5 text-gray-600" />}
                </button>
            </div>
            {isExpanded && (
                <div className="space-y-3 animate-fade-in">
                    <div className="min-h-[200px]">
                        {currentItems.map((entry, index) => {
                const statusConfig = {
                    taken: { color: 'border-green-500', label: 'Taken', text: 'text-green-800' },
                    skipped: { color: 'border-gray-400', label: 'Skipped', text: 'text-gray-800' },
                    missed: { color: 'border-red-500', label: 'Missed', text: 'text-red-800' },
                };
                const config = statusConfig[entry.status];

                return (
                    <div key={index} className={`p-3 rounded-lg bg-gray-50 border-l-4 ${config.color}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-gray-800">{entry.med.name} <span className="font-normal text-sm text-gray-600">{entry.med.dosage}</span></p>
                                <p className="text-sm text-gray-500">{entry.date.toLocaleDateString()} at {entry.time}</p>
                            </div>
                            <span className={`font-semibold text-sm flex-shrink-0 ml-2 ${config.text}`}>{config.label}</span>
                        </div>
                         {entry.reason && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Reason:</span> {entry.reason}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                    currentPage === 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                ← Previous
                            </button>
                            <span className="text-sm text-gray-700 font-medium">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                    currentPage >= totalPages - 1
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
    );
};

const RefillHistoryLog: React.FC<{medications: Medication[]}> = ({ medications }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    
    const history = useMemo(() => {
      const log: {date: string; medName: string}[] = [];
      medications.forEach(med => {
        if (med.refillHistory) {
          med.refillHistory.forEach(dateStr => {
            log.push({ date: dateStr, medName: med.name });
          });
        }
      });
      return log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [medications]);
  
    if (history.length === 0) {
      return <p className="text-center text-gray-500 py-4">No refill history recorded.</p>;
    }
  
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = history.slice(startIndex, endIndex);

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700">Refill History</h4>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded) setCurrentPage(0);
            }}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-600" /> : <ChevronDownIcon className="h-5 w-5 text-gray-600" />}
          </button>
        </div>
        {isExpanded && (
          <div className="space-y-2 animate-fade-in">
            <div className="min-h-[150px]">
              {currentItems.map((entry, index) => (
          <div key={index} className="p-2 rounded-lg bg-gray-50 flex justify-between items-center">
            <p className="font-semibold text-sm">{entry.medName}</p>
            <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
          </div>
        ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    currentPage === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    currentPage >= totalPages - 1
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
    );
  };

const AdherenceByMedication: React.FC<{medications: Medication[]}> = ({ medications }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    
    const adherenceData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return medications.map(med => {
            let scheduled = 0;
            let taken = 0;
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                med.times.forEach(time => {
                    const dateTime = new Date(`${dateStr}T${time}`);
                    if (dateTime < new Date()) {
                        scheduled++;
                        if (med.doseStatus?.[`${dateStr}T${time}`] === 'taken') {
                            taken++;
                        }
                    }
                });
            }
            const percentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;
            return { id: med.id, name: med.name, percentage };
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [medications]);

    if (adherenceData.length === 0) {
        return <p className="text-center text-gray-500 py-4">No data for this report.</p>;
    }

    const totalPages = Math.ceil(adherenceData.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = adherenceData.slice(startIndex, endIndex);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">Adherence by Medication</h4>
                <button
                    onClick={() => {
                        setIsExpanded(!isExpanded);
                        if (!isExpanded) setCurrentPage(0);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-600" /> : <ChevronDownIcon className="h-5 w-5 text-gray-600" />}
                </button>
            </div>
            {isExpanded && (
                <div className="space-y-4 animate-fade-in">
                    <div className="min-h-[200px]">
                        {currentItems.map(data => (
                <div key={data.id}>
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-sm text-gray-700">{data.name}</p>
                        <p className="font-bold text-sm text-gray-800">{data.percentage}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${data.percentage}%` }}
                        ></div>
                    </div>
                </div>
            ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                    currentPage === 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                ← Previous
                            </button>
                            <span className="text-sm text-gray-700 font-medium">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                    currentPage >= totalPages - 1
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
    );
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ medications }) => {

  const adherenceData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const report = {
      weekly: { taken: 0, scheduled: 0 },
      monthly: { taken: 0, scheduled: 0 },
      last7Days: [] as { day: string; adherence: number }[],
    };

    // Last 30 days for monthly
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let dailyScheduled = 0;
      let dailyTaken = 0;

      medications.forEach(med => {
        med.times.forEach(time => {
            const dateTime = new Date(`${dateStr}T${time}`);
            if (dateTime < new Date()){
                 dailyScheduled++;
                 if (med.doseStatus?.[`${dateStr}T${time}`] === 'taken') {
                    dailyTaken++;
                 }
            }
        });
      });

      if (i < 7) {
        report.weekly.scheduled += dailyScheduled;
        report.weekly.taken += dailyTaken;
        report.last7Days.unshift({ 
            day: date.toLocaleDateString('en-US', { weekday: 'short' }), 
            adherence: dailyScheduled > 0 ? (dailyTaken / dailyScheduled) * 100 : 0
        });
      }

      report.monthly.scheduled += dailyScheduled;
      report.monthly.taken += dailyTaken;
    }

    return report;
  }, [medications]);

  const weeklyAdherence = adherenceData.weekly.scheduled > 0 
    ? Math.round((adherenceData.weekly.taken / adherenceData.weekly.scheduled) * 100) 
    : 0;
    
  const monthlyAdherence = adherenceData.monthly.scheduled > 0 
    ? Math.round((adherenceData.monthly.taken / adherenceData.monthly.scheduled) * 100) 
    : 0;

  // Calculate upcoming doses for next 7 days
  const upcomingDoses = useMemo(() => {
    const doses: { date: Date; med: Medication; time: string }[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      medications.forEach(med => {
        med.times.forEach(time => {
          doses.push({ date, med, time });
        });
      });
    }
    
    return doses.sort((a, b) => {
      const dateA = new Date(`${a.date.toISOString().split('T')[0]}T${a.time}`);
      const dateB = new Date(`${b.date.toISOString().split('T')[0]}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    }).slice(0, 5); // Show next 5 doses
  }, [medications]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let hasMissedDose = false;
      medications.forEach(med => {
        med.times.forEach(time => {
          const dateTime = new Date(`${dateStr}T${time}`);
          if (dateTime < today) {
            const dateTimeKey = `${dateStr}T${time}`;
            if (!med.doseStatus?.[dateTimeKey] || med.doseStatus[dateTimeKey] !== 'taken') {
              hasMissedDose = true;
            }
          }
        });
      });
      
      if (hasMissedDose && i > 0) break;
      if (!hasMissedDose) streak++;
    }
    
    return streak;
  }, [medications]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Progress</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white p-4 rounded-xl shadow-lg">
          <p className="text-4xl font-bold">{weeklyAdherence}<span className="text-2xl opacity-80">%</span></p>
          <p className="text-sm font-semibold mt-1">Weekly Adherence</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white p-4 rounded-xl shadow-lg">
          <p className="text-4xl font-bold">{monthlyAdherence}<span className="text-2xl opacity-80">%</span></p>
          <p className="text-sm font-semibold mt-1">Monthly Adherence</p>
        </div>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg text-center">
        <p className="text-4xl font-bold">{currentStreak}</p>
        <p className="text-sm font-semibold mt-1">Day Streak 🔥</p>
        <p className="text-xs opacity-90 mt-1">Keep it up!</p>
      </div>

      {/* Upcoming Doses */}
      {upcomingDoses.length > 0 && (() => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [currentPage, setCurrentPage] = useState(0);
        const itemsPerPage = 3;
        const totalPages = Math.ceil(upcomingDoses.length / itemsPerPage);
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = upcomingDoses.slice(startIndex, endIndex);
        
        return (
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-700">Upcoming Doses (Next 5)</h3>
              <button
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  if (!isExpanded) setCurrentPage(0);
                }}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-600" /> : <ChevronDownIcon className="h-5 w-5 text-gray-600" />}
              </button>
            </div>
            {isExpanded && (
              <div className="space-y-2 animate-fade-in">
                <div className="min-h-[150px]">
                  {currentItems.map((dose, index) => {
              const dateStr = dose.date.toISOString().split('T')[0];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{dose.med.name}</p>
                    <p className="text-sm text-gray-600">{dose.med.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-600">
                      {isToday ? 'Today' : dose.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-500">{dose.time}</p>
                  </div>
                </div>
              );
            })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        currentPage === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-700 font-medium">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        currentPage >= totalPages - 1
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
        );
      })()}
      
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-700 mb-4">Last 7 Days</h3>
        {medications.length > 0 ? (
          <div className="flex justify-around items-end h-40 space-x-2">
            {adherenceData.last7Days.map(({ day, adherence }, index) => (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="w-full h-full flex items-end">
                  <div 
                    className="w-full bg-gradient-to-b from-indigo-400 to-blue-500 rounded-t-md group-hover:opacity-80 transition-all"
                    style={{ height: `${adherence}%` }}
                    title={`${Math.round(adherence)}%`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{day}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No medication data to generate a report.</p>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <AdherenceByMedication medications={medications} />
      </div>

       <div className="bg-white p-4 rounded-xl shadow-lg">
        <MedicationHistoryLog medications={medications} />
      </div>

       <div className="bg-white p-4 rounded-xl shadow-lg">
        <RefillHistoryLog medications={medications} />
      </div>

    </div>
  );
};

export default ReportsScreen;