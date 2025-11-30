import React, { useState } from 'react';
import { DashboardWidget, UserPreferences } from '../types';
import { CogIcon, XIcon, GripVerticalIcon } from './icons';

interface DashboardWidgetConfigProps {
  userPreferences: UserPreferences;
  onUpdate: (widgets: DashboardWidget[]) => void;
  onClose: () => void;
}

const DashboardWidgetConfig: React.FC<DashboardWidgetConfigProps> = ({
  userPreferences,
  onUpdate,
  onClose,
}) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    userPreferences.dashboardWidgets || getDefaultWidgets()
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const widgetTypes: { type: DashboardWidget['type']; label: string; icon: string; description: string }[] = [
    { type: 'upcoming', label: 'Upcoming Doses', icon: '📅', description: 'Today\'s medication schedule' },
    { type: 'adherence', label: 'Adherence Chart', icon: '📊', description: 'Adherence statistics and trends' },
    { type: 'streaks', label: 'Streaks & Badges', icon: '🔥', description: 'Current streaks and achievements' },
    { type: 'symptoms', label: 'Symptom Journal', icon: '📝', description: 'Recent symptom entries' },
    { type: 'refills', label: 'Refill Status', icon: '💊', description: 'Medication refill reminders' },
    { type: 'interactions', label: 'Interactions', icon: '⚠️', description: 'Drug interaction alerts' },
  ];

  function getDefaultWidgets(): DashboardWidget[] {
    return [
      { id: '1', type: 'upcoming', enabled: true, order: 0, size: 'large' },
      { id: '2', type: 'adherence', enabled: true, order: 1, size: 'medium' },
      { id: '3', type: 'streaks', enabled: true, order: 2, size: 'medium' },
      { id: '4', type: 'symptoms', enabled: false, order: 3, size: 'small' },
      { id: '5', type: 'refills', enabled: true, order: 4, size: 'small' },
      { id: '6', type: 'interactions', enabled: true, order: 5, size: 'small' },
    ];
  }

  const handleToggle = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === widgetId ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(prev =>
      prev.map(w => (w.id === widgetId ? { ...w, size } : w))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedIndex];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(index, 0, draggedWidget);

    // Update order
    const updatedWidgets = newWidgets.map((w, i) => ({ ...w, order: i }));
    setWidgets(updatedWidgets);
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onUpdate(widgets);
    onClose();
  };

  const enabledWidgets = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order);
  const disabledWidgets = widgets.filter(w => !w.enabled);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CogIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Customize Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Enabled Widgets - Draggable */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Active Widgets (Drag to Reorder)</h3>
            <div className="space-y-2">
              {enabledWidgets.map((widget, index) => {
                const widgetInfo = widgetTypes.find(w => w.type === widget.type);
                return (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={() => handleDragStart(widgets.findIndex(w => w.id === widget.id))}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 flex items-center gap-4 cursor-move hover:border-indigo-300 transition-colors"
                  >
                    <GripVerticalIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{widgetInfo?.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{widgetInfo?.label}</p>
                          <p className="text-xs text-gray-500">{widgetInfo?.description}</p>
                        </div>
                      </div>
                    </div>
                    <select
                      value={widget.size}
                      onChange={(e) => handleSizeChange(widget.id, e.target.value as 'small' | 'medium' | 'large')}
                      className="border-gray-300 rounded-md text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                    <button
                      onClick={() => handleToggle(widget.id)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                    >
                      Disable
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disabled Widgets */}
          {disabledWidgets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Available Widgets</h3>
              <div className="grid grid-cols-2 gap-3">
                {disabledWidgets.map(widget => {
                  const widgetInfo = widgetTypes.find(w => w.type === widget.type);
                  return (
                    <div
                      key={widget.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{widgetInfo?.icon}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{widgetInfo?.label}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(widget.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200"
                      >
                        Enable
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        <footer className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DashboardWidgetConfig;

