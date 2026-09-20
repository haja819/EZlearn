import React from 'react';
import { BookOpen, History, HelpCircle } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  onOpenHistory,
  onOpenHelp,
}) => {
  return (
    <header
      id="app-header"
      className="border-b border-[var(--color-border)] bg-[var(--bg-paper)]"
    >
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {/* Notebook Title & Subtitle */}
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[var(--accent-example)] shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-ink)] leading-tight tracking-normal">
              EZlearn
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              Study notebook and plain-English translator
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="header-help-btn"
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-ink)] px-2.5 py-1.5 rounded-md border border-transparent hover:border-[var(--color-border)] transition-colors"
            title="How this notebook works"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-ink)] px-2.5 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--pill-bg)] transition-colors"
            title="View past explanations in this study session"
          >
            <History className="w-3.5 h-3.5 text-[var(--accent-simple)]" />
            <span>Past notes</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[var(--accent-keypoints)] text-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
