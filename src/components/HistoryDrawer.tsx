import React from 'react';
import { X, History, Clock, BookOpen } from 'lucide-react';
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
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-[var(--bg-paper)] text-[var(--text-ink)] h-full z-10 flex flex-col border-l border-[var(--color-border)]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent-simple)]" />
            <div>
              <h3 className="font-serif font-bold text-base text-[var(--text-ink)]">
                Session history
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans">
                Past explanations from this notebook session
              </p>
            </div>
          </div>
          <button
            id="close-history-drawer"
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--text-muted)]">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--text-ink)]" />
              <p className="text-sm font-medium">No past notes yet</p>
              <p className="text-xs mt-1">
                Your explained topics will appear here during this study session.
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
                  className={`p-3 rounded-md border-l-[3px] border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-l-[var(--accent-simple)] border-[var(--color-border)] bg-[var(--input-bg)]'
                      : 'border-l-[var(--color-border)] border-[var(--color-border-subtle)] hover:border-l-[var(--accent-simple)] bg-[var(--bg-paper)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-[var(--text-ink)]">
                      {item.topic || (item.level === 'very_simple' ? 'Very simple' : item.level === 'simple' ? 'Simple' : 'Detailed')}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {item.simple}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              {history.length} saved {history.length === 1 ? 'note' : 'notes'}
            </span>
            <button
              id="clear-history-btn"
              type="button"
              onClick={onClearHistory}
              className="text-xs text-[var(--accent-keypoints)] hover:underline cursor-pointer"
            >
              Clear notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
