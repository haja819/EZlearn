import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { ExplanationView } from './components/ExplanationView';
import { QuizCard } from './components/QuizCard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HelpModal } from './components/HelpModal';
import { ExplanationLevel, StudyExplanation } from './types';
import { Sparkles, AlertCircle, RefreshCw, BookOpen, ArrowUp, Lightbulb } from 'lucide-react';

const STORAGE_KEY = 'eli5_study_translator_history';

export default function App() {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<ExplanationLevel>('very_simple');
  const [currentExplanation, setCurrentExplanation] = useState<StudyExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StudyExplanation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Load session history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          // Set latest explanation as current active
          setCurrentExplanation(parsed[0]);
          setText(parsed[0].originalText);
          setLevel(parsed[0].level);
        }
      }
    } catch (e) {
      console.warn('Could not load session history from localStorage');
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: StudyExplanation[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 30)));
    } catch (e) {
      console.warn('Could not save to localStorage');
    }
  };

  const handleExplain = async (overrideText?: string, overrideLevel?: ExplanationLevel) => {
    const textToExplain = overrideText ?? text;
    const levelToUse = overrideLevel ?? level;

    if (!textToExplain.trim()) {
      setError('Please paste or type textbook notes or questions to explain.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToExplain,
          level: levelToUse,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate explanation. Please try again.');
      }

      const explanationData = json.data;

      const newExplanation: StudyExplanation = {
        id: `exp_${Date.now()}`,
        timestamp: Date.now(),
        originalText: textToExplain,
        level: levelToUse,
        topic: explanationData.topic || '',
        simple: explanationData.simple || 'Concept explained simply.',
        example: explanationData.example || '',
        breakdown: Array.isArray(explanationData.breakdown) ? explanationData.breakdown : [],
        keyPoints: Array.isArray(explanationData.keyPoints) ? explanationData.keyPoints : [],
        mnemonic: explanationData.mnemonic || explanationData.remember || '',
        remember: explanationData.remember || explanationData.mnemonic || '',
        unclear: Boolean(explanationData.unclear),
        quiz: Array.isArray(explanationData.quiz) ? explanationData.quiz : [],
      };

      setCurrentExplanation(newExplanation);

      // Add to front of history without duplicate original text
      const updatedHistory = [
        newExplanation,
        ...history.filter((h) => h.originalText !== textToExplain),
      ];
      saveHistory(updatedHistory);

      // Smooth scroll to explanation view
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Error generating explanation:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const handleSelectHistoryItem = (item: StudyExplanation) => {
    setCurrentExplanation(item);
    setText(item.originalText);
    setLevel(item.level);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-amber-50/30 text-slate-800">
      {/* Top App Header */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Friendly Welcome / Subtitle Banner */}
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-900 border border-amber-200">
            <span>✨ Turn Academic Jargon into Crystal-Clear Mental Anchors</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            Study Smarter, Not Harder
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            No endless walls of text. Get high-impact ELI5 breakdowns, relatable analogies, auto-extracted key points, and instant self-check quizzes.
          </p>
        </div>

        {/* Input Card */}
        <InputPanel
          text={text}
          onChangeText={setText}
          level={level}
          onChangeLevel={setLevel}
          onExplain={() => handleExplain()}
          isLoading={isLoading}
        />

        {/* Error Alert */}
        {error && (
          <div
            id="error-alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-bold block mb-0.5">Could not translate text</span>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => handleExplain()}
              className="text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Container / Anchor */}
        <div ref={resultsRef} className="pt-2">
          {isLoading && (
            <div id="loading-skeleton" className="space-y-4 py-8">
              <div className="p-6 rounded-2xl bg-white border border-amber-200/80 shadow-xs animate-pulse space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-200" />
                  <div className="h-5 bg-amber-200/80 rounded w-1/4" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-200 rounded w-4/6" />
                <div className="h-4 bg-slate-200 rounded w-3/6" />
              </div>

              <div className="p-6 rounded-2xl bg-white border border-emerald-200/80 shadow-xs animate-pulse space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200" />
                  <div className="h-5 bg-emerald-200/80 rounded w-1/3" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>

              <div className="text-center py-4">
                <p className="text-sm font-semibold text-amber-800 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Synthesizing analogies, breakdowns, and quiz questions...</span>
                </p>
              </div>
            </div>
          )}

          {!isLoading && currentExplanation && (
            <div className="space-y-8 animate-fade-in">
              {/* Main 5-Part Structured Explanation */}
              <ExplanationView
                explanation={currentExplanation}
                onSelectLevelAgain={(newLevel) => {
                  setLevel(newLevel);
                  handleExplain(currentExplanation.originalText, newLevel);
                }}
              />

              {/* Auto-Generated Multiple Choice Knowledge Quiz */}
              <QuizCard quiz={currentExplanation.quiz} />
            </div>
          )}

          {!isLoading && !currentExplanation && (
            <div className="rounded-2xl border border-dashed border-amber-300/80 bg-white/60 p-8 sm:p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-2xs">
                💡
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  Ready to translate difficult study material?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Paste any difficult textbook excerpt or homework prompt above, or pick one of the quick sample topics to see the 5-step breakdown in action.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sample = "Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy through oxidative phosphorylation. High-energy electrons travel through the electron transport chain, generating a proton gradient across the inner mitochondrial membrane.";
                    setText(sample);
                    setLevel('very_simple');
                    handleExplain(sample, 'very_simple');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 text-xs font-semibold border border-amber-300/70 transition-colors shadow-2xs cursor-pointer"
                >
                  ⚡ Try: Mitochondria & ATP (ELI5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = "Quantum superposition is a fundamental principle of quantum mechanics stating that any two or more quantum states can be added together and the result will be another valid quantum state. An electron exists partly in all theoretically possible states simultaneously until measurement.";
                    setText(sample);
                    setLevel('simple');
                    handleExplain(sample, 'simple');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  ⚛️ Try: Quantum Superposition (Student)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-200/40 py-6 text-center text-xs text-slate-400 bg-white/40">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EZlearn • Designed for stressed students studying anywhere</span>
          <span>Zero accounts required • Instant structured breakdowns</span>
        </div>
      </footer>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentId={currentExplanation?.id}
        onSelect={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
