import React, { useState } from 'react';
import {
  Baby,
  Sprout,
  Puzzle,
  Target,
  Brain,
  Volume2,
  VolumeX,
  Copy,
  Check,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Bookmark,
  Share2
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
      setSpeechNotice('Speech audio is not available in this browser view.');
      setTimeout(() => setSpeechNotice(null), 3500);
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
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const memoryHook = explanation.remember || explanation.mnemonic || '';
      const textToRead = `${explanation.simple || ''}. Imagine this: ${explanation.example || ''}. Key points: ${(explanation.keyPoints || []).join('. ')}. To remember it: ${memoryHook}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95; // Slightly calmer speaking rate for learning
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch (err) {
      setSpeechNotice('Audio playback could not start in iframe mode.');
      setTimeout(() => setSpeechNotice(null), 3500);
      setIsSpeaking(false);
    }
  };

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Follow-up point clarification ("I still don't understand [X]")
  const handleClarifyPoint = async (pointIndex: number, pointText: string) => {
    const current = pointStates[pointIndex];
    if (current?.data) {
      // If already fetched, toggle expansion
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
          error: err.message || 'Could not simplify right now. Please try again.',
          expanded: true,
        },
      }));
    }
  };

  return (
    <div id="explanation-container" className="space-y-6">
      {/* Top Banner with speech readout and level indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {explanation.topic && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs">
              <span>📌 {explanation.topic}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/90 text-amber-900 border border-amber-300/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {explanation.level === 'very_simple' && 'ELI5 (Explain Like I’m 5)'}
              {explanation.level === 'simple' && 'Standard Student Level'}
              {explanation.level === 'detailed' && 'Detailed Technical Breakdown'}
            </span>
          </span>
          <span className="text-xs text-slate-400">
            {new Date(explanation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-read-aloud"
            type="button"
            onClick={handleToggleSpeech}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              isSpeaking
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Listen to this explanation read aloud"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Read Aloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {explanation.unclear && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
          <span className="text-base">💡</span>
          <div>
            <strong className="font-semibold block">Ambiguous or Brief Query</strong>
            <span>
              This input was very short or general. Your tutor explained the most common academic meaning above. If you had a specific sub-topic in mind, try pasting the full textbook question or sentence!
            </span>
          </div>
        </div>
      )}

      {speechNotice && (
        <div className="p-3 bg-amber-100/80 border border-amber-300 text-amber-950 text-xs rounded-xl flex items-center justify-between">
          <span>{speechNotice}</span>
          <button
            type="button"
            onClick={() => setSpeechNotice(null)}
            className="text-amber-700 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: 👶 Super Simple */}
      <section
        id="section-super-simple"
        className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white p-5 sm:p-6 shadow-xs relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg shadow-2xs">
              👶
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-amber-950 font-display">
                Super Simple
              </h3>
              <p className="text-xs text-amber-800/80 font-medium">
                One or two plain sentences, zero academic jargon
              </p>
            </div>
          </div>

          <button
            id="btn-copy-super-simple"
            type="button"
            onClick={() => handleCopyText(explanation.simple, 'simple')}
            className="p-1.5 text-amber-800/60 hover:text-amber-900 rounded-lg hover:bg-amber-100/60 transition-colors"
            title="Copy plain summary"
          >
            {copiedSection === 'simple' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed mt-3 pl-1">
          {explanation.simple}
        </p>
      </section>

      {/* SECTION 2: 🌱 Real-life Example */}
      <section
        id="section-real-life-example"
        className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-emerald-50/20 to-white p-5 sm:p-6 shadow-xs relative overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-lg shadow-2xs">
              🌱
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-emerald-950 font-display">
                Real-Life Example
              </h3>
              <p className="text-xs text-emerald-800/80 font-medium">
                An "Imagine..." style everyday analogy you can visualize
              </p>
            </div>
          </div>

          <button
            id="btn-copy-example"
            type="button"
            onClick={() => handleCopyText(explanation.example, 'example')}
            className="p-1.5 text-emerald-800/60 hover:text-emerald-900 rounded-lg hover:bg-emerald-100/60 transition-colors"
            title="Copy example"
          >
            {copiedSection === 'example' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="bg-white/80 border border-emerald-200/60 rounded-xl p-4 text-slate-800 text-sm sm:text-base leading-relaxed italic text-emerald-950">
          "{explanation.example}"
        </div>
      </section>

      {/* SECTION 3: 🧩 Break It Down (shown when concept has distinct parts) */}
      {explanation.breakdown && explanation.breakdown.length > 0 && (
        <section
          id="section-breakdown"
          className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 via-sky-50/20 to-white p-5 sm:p-6 shadow-xs relative"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-lg shadow-2xs">
                🧩
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-sky-950 font-display">
                  Break It Down
                </h3>
                <p className="text-xs text-sky-800/80 font-medium">
                  Concept → Parts → How they connect
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {explanation.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-sky-100 p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm font-display">
                      {item.part}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.explanation || item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: 🎯 Key Points + Point-Specific Re-explanation */}
      <section
        id="section-key-points"
        className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-indigo-50/20 to-white p-5 sm:p-6 shadow-xs"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg shadow-2xs">
              🎯
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-indigo-950 font-display">
                Key Points
              </h3>
              <p className="text-xs text-indigo-800/80 font-medium">
                Core takeaways — click "I don't get this one" on any point for an extra-simple breakdown
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          {explanation.keyPoints.map((point, idx) => {
            const state = pointStates[idx];
            const isExpanded = state?.expanded;

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-indigo-100/90 p-4 transition-all shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                      {point}
                    </p>
                  </div>

                  {/* "I don't get this one" button */}
                  <button
                    id={`btn-clarify-point-${idx}`}
                    type="button"
                    disabled={state?.loading}
                    onClick={() => handleClarifyPoint(idx, point)}
                    className="shrink-0 self-start inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition-colors disabled:opacity-60 cursor-pointer"
                    title="Ask AI to re-explain just this point in an ultra-simple way"
                  >
                    {state?.loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Simplifying...</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>I don't get this one</span>
                        {state?.data && (
                          isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Re-explanation Callout */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-indigo-100/80">
                    {state.error ? (
                      <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs">
                        {state.error}
                      </div>
                    ) : state.data ? (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3.5 border border-amber-200/80 text-xs sm:text-sm text-slate-800 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold font-display">
                          <span>🧸</span>
                          <span>Extra-Simple Breakdown of this point:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {state.data.simplifiedExplanation}
                        </p>
                        <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/60">
                          <p className="text-xs text-amber-950">
                            <strong className="font-semibold text-amber-900">Analogous picture:</strong> {state.data.analogy}
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                          <span>💡 Takeaway:</span>
                          <span className="font-normal text-slate-700">{state.data.takeaway}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: 🧠 Remember It */}
      {(explanation.remember || explanation.mnemonic) && (
        <section
          id="section-mnemonic"
          className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 via-rose-50/20 to-white p-5 sm:p-6 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-lg shadow-2xs">
                🧠
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-rose-950 font-display">
                  Remember It
                </h3>
                <p className="text-xs text-rose-800/80 font-medium">
                  Short memorable line, formula, or snappy memory hook
                </p>
              </div>
            </div>

            <button
              id="btn-copy-mnemonic"
              type="button"
              onClick={() => handleCopyText(explanation.remember || explanation.mnemonic || '', 'mnemonic')}
              className="p-1.5 text-rose-800/60 hover:text-rose-900 rounded-lg hover:bg-rose-100/60 transition-colors"
              title="Copy memory hook"
            >
              {copiedSection === 'mnemonic' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="bg-white/90 border border-rose-200/70 rounded-xl p-4 text-rose-950 font-medium text-sm sm:text-base leading-relaxed flex items-center gap-3">
            <div className="w-2 h-10 bg-rose-400 rounded-full shrink-0" />
            <div>
              <span className="font-display font-bold text-slate-900 text-base sm:text-lg block">
                {explanation.remember || explanation.mnemonic}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
