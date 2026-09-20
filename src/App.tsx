import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { ExplanationView } from './components/ExplanationView';
import { QuizCard } from './components/QuizCard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HelpModal } from './components/HelpModal';
import { ExplanationLevel, StudyExplanation } from './types';
import { AlertCircle } from 'lucide-react';

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
          const sanitizedHistory: StudyExplanation[] = parsed
            .filter((item: any) => item && typeof item === 'object' && item.originalText)
            .map((item: any) => ({
              ...item,
              breakdown: Array.isArray(item.breakdown) ? item.breakdown : [],
              keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
              quiz: Array.isArray(item.quiz) ? item.quiz : [],
              remember: item.remember || item.mnemonic || '',
              mnemonic: item.remember || item.mnemonic || '',
            }));
          if (sanitizedHistory.length > 0) {
            setHistory(sanitizedHistory);
            setCurrentExplanation(sanitizedHistory[0]);
            setText(sanitizedHistory[0].originalText);
            setLevel(sanitizedHistory[0].level || 'very_simple');
          }
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

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Request failed (${response.status}): ${errText.slice(0, 200)}`);
      }

      const json = await response.json();

      if (!json.success) {
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-paper)] text-[var(--text-ink)] font-sans">
      {/* Top App Header */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Single Centered Column (max-width ~640px, left-aligned) */}
      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
        {/* Intro Subtitle */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-ink)] leading-tight">
            Turn confusing notes into plain English
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Get structured breakdowns, everyday analogies, key takeaways, and quick self-check questions.
          </p>
        </div>

        {/* Input Block */}
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
            className="p-3.5 border-l-[3px] border-[var(--accent-keypoints)] bg-[var(--input-bg)] text-[var(--text-ink)] flex items-start justify-between gap-3 text-xs sm:text-sm rounded-r-md"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--accent-keypoints)] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Could not translate</strong>
                <p className="text-[var(--text-muted)]">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleExplain()}
              className="text-xs font-semibold text-[var(--accent-keypoints)] underline hover:opacity-80 cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Container / Anchor */}
        <div ref={resultsRef} className="pt-2">
          {isLoading && (
            <div id="loading-skeleton" className="space-y-5 py-4">
              <div className="border-l-[3px] border-[var(--accent-simple)] pl-4 py-1 space-y-2 opacity-60">
                <div className="h-4 bg-[var(--color-border)] rounded w-1/3" />
                <div className="h-3.5 bg-[var(--color-border)] rounded w-full" />
                <div className="h-3.5 bg-[var(--color-border)] rounded w-4/5" />
              </div>

              <div className="border-l-[3px] border-[var(--accent-example)] pl-4 py-1 space-y-2 opacity-60">
                <div className="h-4 bg-[var(--color-border)] rounded w-1/4" />
                <div className="h-3.5 bg-[var(--color-border)] rounded w-5/6" />
              </div>

              <p className="text-xs text-[var(--text-muted)] font-sans italic pl-4">
                Writing your notebook explanation...
              </p>
            </div>
          )}

          {!isLoading && currentExplanation && (
            <div className="notebook-fade-in space-y-8">
              {/* Main 5-Part Structured Explanation with Left Borders Only */}
              <ExplanationView
                key={`explanation-${currentExplanation.id}`}
                explanation={currentExplanation}
                onSelectLevelAgain={(newLevel) => {
                  setLevel(newLevel);
                  handleExplain(currentExplanation.originalText, newLevel);
                }}
              />

              {/* Self-check questions */}
              <QuizCard
                key={`quiz-${currentExplanation.id}`}
                quiz={currentExplanation.quiz}
              />
            </div>
          )}

          {!isLoading && !currentExplanation && (
            <div className="border border-[var(--color-border)] p-6 rounded-md space-y-3">
              <h3 className="text-base font-serif font-semibold text-[var(--text-ink)]">
                Ready to study
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Paste any difficult textbook excerpt or homework prompt above, or try one of these sample topics:
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const sample = "Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy through oxidative phosphorylation. High-energy electrons travel through the electron transport chain, generating a proton gradient across the inner mitochondrial membrane.";
                    setText(sample);
                    setLevel('very_simple');
                    handleExplain(sample, 'very_simple');
                  }}
                  className="px-2.5 py-1 rounded border border-[var(--color-border)] hover:border-[var(--text-ink)] text-[var(--text-ink)] transition-colors cursor-pointer"
                >
                  Mitochondria & ATP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = "Quantum superposition is a fundamental principle of quantum mechanics stating that any two or more quantum states can be added together and the result will be another valid quantum state. An electron exists partly in all theoretically possible states simultaneously until measurement.";
                    setText(sample);
                    setLevel('simple');
                    handleExplain(sample, 'simple');
                  }}
                  className="px-2.5 py-1 rounded border border-[var(--color-border)] hover:border-[var(--text-ink)] text-[var(--text-ink)] transition-colors cursor-pointer"
                >
                  Quantum superposition
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--color-border)] py-6 text-xs text-[var(--text-muted)]">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-baseline justify-between gap-2">
          <span>EZlearn study notebook</span>
          <span>Structured mental anchors in plain English</span>
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
