import React from 'react';
import { X, History, Trash2, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { StudyExplanation } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: StudyExplanation[];
  currentId?: string;
  onSelect: (item: StudyExplanation) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  currentId,
  onSelect,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col border-l border-amber-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display">Session History</h3>
              <p className="text-xs text-slate-500">Past explanations from this study session</p>
            </div>
          </div>
          <button
            id="close-history-drawer"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-sm font-medium text-slate-600">No explanations saved yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Paste any text and hit "Explain" to start building your study log!
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isSelected = item.id === currentId;
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-400 shadow-2xs'
                      : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.level === 'very_simple' ? '👶 ELI5' : item.level === 'simple' ? '🎒 Student' : '🔬 Detailed'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-1 font-display mb-1">
                    {item.originalText}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.simple}
                  </p>

                  <div className="mt-2.5 flex items-center justify-end text-xs font-semibold text-amber-700 gap-1">
                    <span>View Explanation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {history.length} {history.length === 1 ? 'item' : 'items'} saved
            </span>
            <button
              id="btn-clear-history"
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
