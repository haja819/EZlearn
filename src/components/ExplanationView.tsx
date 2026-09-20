import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudyExplanation, PointClarificationState } from '../types';

interface ExplanationViewProps {
  explanation: StudyExplanation;
  onSelectLevelAgain?: (level: 'very_simple' | 'simple' | 'detailed') => void;
}

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  explanation,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [pointStates, setPointStates] = useState<Record<number, PointClarificationState>>({});

  // Reset state when a new explanation is displayed
  React.useEffect(() => {
    setPointStates({});
    setCopiedSection(null);
    setSpeechNotice(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
  }, [explanation.id]);

  // Cleanup speech synthesis on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Handle Web Speech Synthesis for audio readout
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechNotice('Speech audio is not supported in this browser view.');
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }

    if (isSpeaking) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const memoryHook = explanation.remember || explanation.mnemonic || '';
      const textToRead = `${explanation.simple || ''}. Imagine this: ${explanation.example || ''}. Key points: ${(explanation.keyPoints || []).join('. ')}. To remember it: ${memoryHook}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch (err) {
      setSpeechNotice('Audio playback could not be started.');
      setTimeout(() => setSpeechNotice(null), 3000);
      setIsSpeaking(false);
    }
  };

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Follow-up point clarification ("I don't understand this point")
  const handleClarifyPoint = async (pointIndex: number, pointText: string) => {
    const current = pointStates[pointIndex];
    if (current?.data) {
      setPointStates((prev) => ({
        ...prev,
        [pointIndex]: {
          ...prev[pointIndex],
          expanded: !prev[pointIndex].expanded,
        },
      }));
      return;
    }

    setPointStates((prev) => ({
      ...prev,
      [pointIndex]: {
        loading: true,
        expanded: true,
      },
    }));

    try {
      const response = await fetch('/api/simplify-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContext: explanation.originalText,
          point: pointText,
          level: explanation.level,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || resJson.error) {
        throw new Error(resJson.error || 'Failed to simplify point');
      }

      setPointStates((prev) => ({
        ...prev,
        [pointIndex]: {
          loading: false,
          data: resJson.data,
          expanded: true,
        },
      }));
    } catch (err: any) {
      setPointStates((prev) => ({
        ...prev,
        [pointIndex]: {
          loading: false,
          error: err.message || 'Could not simplify right now.',
          expanded: true,
        },
      }));
    }
  };

  const levelNames: Record<string, string> = {
    very_simple: 'Very simple level',
    simple: 'Simple student level',
    detailed: 'Detailed level',
  };

  return (
    <div id="explanation-container" className="space-y-8 text-left">
      {/* Notebook Header Bar */}
      <div className="border-b border-[var(--color-border)] pb-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {explanation.topic && (
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-ink)] leading-tight">
                {explanation.topic}
              </h2>
            )}
            <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
              {levelNames[explanation.level] || 'Study explanation'}
            </p>
          </div>

          {/* Quick Actions (Audio Readout & Copy All) */}
          <div className="flex items-center gap-2">
            <button
              id="btn-read-aloud"
              type="button"
              onClick={handleToggleSpeech}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--pill-bg)] text-[var(--text-ink)] transition-colors cursor-pointer"
              title="Listen to this explanation read aloud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[var(--accent-keypoints)]" />
                  <span>Stop audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[var(--accent-example)]" />
                  <span>Read aloud</span>
                </>
              )}
            </button>

            <button
              id="btn-copy-all"
              type="button"
              onClick={() => {
                const fullText = `${explanation.topic ? `${explanation.topic}\n\n` : ''}Simple explanation:\n${explanation.simple}\n\nReal-life example:\n${explanation.example}\n\nKey points:\n${explanation.keyPoints.map(p => `• ${p}`).join('\n')}\n\nRemember:\n${explanation.remember || explanation.mnemonic}`;
                handleCopyText(fullText, 'all');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--pill-bg)] text-[var(--text-ink)] transition-colors cursor-pointer"
              title="Copy entire study note to clipboard"
            >
              {copiedSection === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--accent-example)]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Copy note</span>
                </>
              )}
            </button>
          </div>
        </div>

        {explanation.unclear && (
          <div className="p-3 border-l-[3px] border-[var(--accent-simple)] bg-[var(--input-bg)] text-xs text-[var(--text-ink)] rounded-r-md">
            <p className="font-semibold mb-0.5">Brief query note</p>
            <p className="text-[var(--text-muted)]">
              This input was short or general. Your tutor explained the primary academic meaning. If you had a specific question, you can paste the full textbook sentence.
            </p>
          </div>
        )}

        {speechNotice && (
          <div className="p-2.5 border-l-[3px] border-[var(--accent-simple)] bg-[var(--input-bg)] text-xs text-[var(--text-ink)] rounded-r-md flex items-center justify-between">
            <span>{speechNotice}</span>
            <button
              type="button"
              onClick={() => setSpeechNotice(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-ink)] ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: Simple Explanation (Mustard Left Border #C98A12) */}
      <section
        id="section-super-simple"
        className="border-l-[3px] sm:border-l-4 border-[var(--accent-simple)] pl-4 sm:pl-5 py-1"
      >
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--text-ink)]">
            Simple explanation
          </h3>
          <button
            id="btn-copy-super-simple"
            type="button"
            onClick={() => handleCopyText(explanation.simple, 'simple')}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-ink)] p-1 transition-colors cursor-pointer"
            title="Copy simple explanation"
          >
            {copiedSection === 'simple' ? (
              <Check className="w-3.5 h-3.5 text-[var(--accent-example)]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-sm sm:text-base text-[var(--text-ink)] font-sans leading-relaxed">
          {explanation.simple}
        </p>
      </section>

      {/* SECTION 2: Real-Life Example (Teal Left Border #1F6F63) */}
      <section
        id="section-real-life-example"
        className="border-l-[3px] sm:border-l-4 border-[var(--accent-example)] pl-4 sm:pl-5 py-1"
      >
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--text-ink)]">
            Real-life example
          </h3>
          <button
            id="btn-copy-example"
            type="button"
            onClick={() => handleCopyText(explanation.example, 'example')}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-ink)] p-1 transition-colors cursor-pointer"
            title="Copy example"
          >
            {copiedSection === 'example' ? (
              <Check className="w-3.5 h-3.5 text-[var(--accent-example)]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-sm sm:text-base text-[var(--text-ink)] font-sans leading-relaxed italic opacity-95">
          {explanation.example}
        </p>
      </section>

      {/* SECTION 3: Break It Down (Breakdown Left Border) */}
      {explanation.breakdown && explanation.breakdown.length > 0 && (
        <section
          id="section-breakdown"
          className="border-l-[3px] sm:border-l-4 border-[var(--accent-breakdown)] pl-4 sm:pl-5 py-1 space-y-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--text-ink)]">
              Break it down
            </h3>
          </div>

          <div className="space-y-2.5">
            {explanation.breakdown.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <h4 className="text-sm font-semibold font-serif text-[var(--text-ink)]">
                  {idx + 1}. {item.part}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] font-sans leading-relaxed pl-3.5">
                  {item.explanation || item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: Key Points (Berry Left Border #9C3648) */}
      <section
        id="section-key-points"
        className="border-l-[3px] sm:border-l-4 border-[var(--accent-keypoints)] pl-4 sm:pl-5 py-1 space-y-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--text-ink)]">
            Key points
          </h3>
        </div>

        <ul className="space-y-3 list-none p-0 m-0">
          {explanation.keyPoints.map((point, idx) => {
            const state = pointStates[idx];
            const isExpanded = state?.expanded;

            return (
              <li key={idx} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="text-[var(--accent-keypoints)] font-bold text-xs mt-1">
                      —
                    </span>
                    <p className="text-sm sm:text-base text-[var(--text-ink)] font-sans leading-relaxed">
                      {point}
                    </p>
                  </div>

                  {/* "I don't get this one" margin clarification trigger */}
                  <button
                    id={`btn-clarify-point-${idx}`}
                    type="button"
                    disabled={state?.loading}
                    onClick={() => handleClarifyPoint(idx, point)}
                    className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text-ink)] underline decoration-[var(--color-border)] underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer pt-0.5"
                    title="Ask for a simpler re-explanation of just this point"
                  >
                    {state?.loading ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-simple)]" />
                        <span>Explaining...</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-[var(--accent-keypoints)]" />
                        <span>Clarify this</span>
                        {state?.data && (
                          isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </button>
                </div>

                {/* Inline Re-explanation Callout */}
                {isExpanded && (
                  <div className="ml-5 mt-2 pl-3 border-l-2 border-[var(--accent-simple)] bg-[var(--input-bg)] py-2 pr-3 rounded-r-md text-xs sm:text-sm text-[var(--text-ink)] space-y-1.5">
                    {state.error ? (
                      <div className="text-[var(--accent-keypoints)]">
                        {state.error}
                      </div>
                    ) : state.data ? (
                      <>
                        <p className="font-medium leading-relaxed">
                          {state.data.simplifiedExplanation}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] italic">
                          Imagine: {state.data.analogy}
                        </p>
                        <p className="text-xs text-[var(--text-ink)] font-medium">
                          Takeaway: {state.data.takeaway}
                        </p>
                      </>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 5: Remember It (Berry Left Border #9C3648) */}
      {(explanation.remember || explanation.mnemonic) && (
        <section
          id="section-mnemonic"
          className="border-l-[3px] sm:border-l-4 border-[var(--accent-keypoints)] pl-4 sm:pl-5 py-1"
        >
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--text-ink)]">
              Remember this
            </h3>
            <button
              id="btn-copy-mnemonic"
              type="button"
              onClick={() => handleCopyText(explanation.remember || explanation.mnemonic || '', 'mnemonic')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-ink)] p-1 transition-colors cursor-pointer"
              title="Copy memory anchor"
            >
              {copiedSection === 'mnemonic' ? (
                <Check className="w-3.5 h-3.5 text-[var(--accent-example)]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <p className="text-sm sm:text-base font-serif font-medium text-[var(--text-ink)] leading-relaxed">
            "{explanation.remember || explanation.mnemonic}"
          </p>
        </section>
      )}
    </div>
  );
};
