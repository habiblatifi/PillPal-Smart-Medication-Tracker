import React, { useState, useMemo } from 'react';
import { Medication, SymptomEntry } from '../types';
import { DownloadIcon, ShareIcon, ChartBarIcon, XIcon } from './icons';
import { generateWeeklyCoachingSummary, getCurrentWeekStart } from '../services/coachingService';

interface ProviderReportGeneratorProps {
  medications: Medication[];
  symptomEntries: SymptomEntry[];
  onClose: () => void;
}

const ProviderReportGenerator: React.FC<ProviderReportGeneratorProps> = ({
  medications,
  symptomEntries,
  onClose,
}) => {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'adherence'>('summary');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const weeklySummary = useMemo(() => {
    const weekStart = getCurrentWeekStart();
    return generateWeeklyCoachingSummary(medications, weekStart);
  }, [medications]);

  const generatePDF = () => {
    // In a real implementation, use a library like jsPDF or pdfkit
    const report = generateReportData();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pillpal-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReportData = () => {
    const report: any = {
      generated: new Date().toISOString(),
      reportType,
      dateRange: dateRange.start && dateRange.end ? dateRange : 'Last 30 days',
      medications: medications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        times: med.times,
        food: med.food,
        drugClass: med.drugClass,
      })),
      adherence: {
        weekly: weeklySummary,
        overall: calculateOverallAdherence(),
      },
      symptoms: dateRange.start && dateRange.end
        ? symptomEntries.filter(e => e.date >= dateRange.start && e.date <= dateRange.end)
        : symptomEntries.slice(-30), // Last 30 entries
    };

    return report;
  };

  const calculateOverallAdherence = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    let total = 0;
    let taken = 0;

    medications.forEach(med => {
      last30Days.forEach(date => {
        med.times.forEach(time => {
          total++;
          const key = `${date}T${time}`;
          if (med.doseStatus?.[key] === 'taken') {
            taken++;
          }
        });
      });
    });

    return {
      percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
      taken,
      total,
      period: 'Last 30 days',
    };
  };

  const shareReport = async () => {
    const report = generateReportData();
    const reportText = formatReportForSharing(report);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PillPal Medication Report',
          text: reportText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy
        navigator.clipboard.writeText(reportText);
        alert('Report copied to clipboard!');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(reportText);
      alert('Report copied to clipboard!');
    }
  };

  const formatReportForSharing = (report: any): string => {
    let text = 'PillPal Medication Report\n';
    text += `Generated: ${new Date(report.generated).toLocaleDateString()}\n\n`;
    text += `Adherence: ${report.adherence.overall.percentage}% (${report.adherence.overall.taken}/${report.adherence.overall.total} doses)\n\n`;
    text += 'Medications:\n';
    report.medications.forEach((med: any) => {
      text += `- ${med.name} ${med.dosage} (${med.frequency})\n`;
    });
    return text;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Generate Provider Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm text-blue-800">
              Generate a comprehensive report to share with your healthcare provider. Includes medication list, adherence data, and symptom patterns.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(['summary', 'detailed', 'adherence'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    reportType === type
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-800 capitalize">{type}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm"
                min={dateRange.start}
              />
            </div>
          </div>

          {/* Report Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Report Preview</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {medications.length} medications</p>
              <p>• {weeklySummary.adherencePercentage}% weekly adherence</p>
              <p>• {symptomEntries.length} symptom entries</p>
              <p>• {reportType} format</p>
            </div>
          </div>
        </main>

        <footer className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={shareReport}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <ShareIcon className="h-5 w-5" />
            Share Report
          </button>
          <button
            onClick={generatePDF}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2"
          >
            <DownloadIcon className="h-5 w-5" />
            Download Report
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProviderReportGenerator;

