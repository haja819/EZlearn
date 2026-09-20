import React from 'react';
import { BookOpen, Sparkles, History, HelpCircle } from 'lucide-react';

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
    <header id="app-header" className="border-b border-amber-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm ring-2 ring-amber-200/60">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                EZlearn
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/80">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Student Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Paste confusing textbook notes & get crystal-clear breakdowns, analogies, and quizzes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="header-help-btn"
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="How it works"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">How it works</span>
          </button>

          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/70 transition-colors shadow-2xs"
            title="View past explanations in this session"
          >
            <History className="w-4 h-4 text-amber-700" />
            <span>Past Explanations</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
