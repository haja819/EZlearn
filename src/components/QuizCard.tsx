import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../types';

interface QuizCardProps {
  quiz: QuizQuestion[];
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  // Store user's selected option index for each question: { [questionIdx: number]: optionIdx }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = quiz.length;
  const isCompleted = answeredCount === totalCount && totalCount > 0;

  // Calculate score
  const correctCount = Object.entries(selectedAnswers).reduce((acc, [qIdxStr, chosenOptionIdx]) => {
    const qIdx = parseInt(qIdxStr, 10);
    return quiz[qIdx]?.correctIndex === chosenOptionIdx ? acc + 1 : acc;
  }, 0);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    // If already answered this question, don't allow changing to preserve honest self-test
    if (selectedAnswers[questionIdx] !== undefined) return;

    const newAnswers = {
      ...selectedAnswers,
      [questionIdx]: optionIdx,
    };
    setSelectedAnswers(newAnswers);

    // If this completes the quiz and score is good, launch confetti!
    if (Object.keys(newAnswers).length === totalCount && !hasTriggeredConfetti) {
      const finalScore = Object.entries(newAnswers).reduce((acc, [qIdxStr, chosen]) => {
        const qIdx = parseInt(qIdxStr, 10);
        return quiz[qIdx]?.correctIndex === chosen ? acc + 1 : acc;
      }, 0);

      if (finalScore >= Math.ceil(totalCount / 2)) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (e) {
          // ignore if canvas not supported
        }
        setHasTriggeredConfetti(true);
      }
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setHasTriggeredConfetti(false);
  };

  if (!quiz || quiz.length === 0) return null;

  return (
    <section
      id="quiz-section"
      className="mt-8 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/50 via-white to-amber-50/30 p-5 sm:p-7 shadow-sm"
    >
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-violet-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-xl shadow-2xs">
            📝
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <span>Quick Knowledge Check</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-violet-100 text-violet-800">
                {quiz.length} Questions
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Test your understanding right now with instant feedback
            </p>
          </div>
        </div>

        {answeredCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Answered: {answeredCount}/{totalCount}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 px-2.5 py-1 rounded-lg hover:bg-violet-100/60 transition-colors"
              title="Reset and retake quiz"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {quiz.map((q, qIdx) => {
          const userAnswer = selectedAnswers[qIdx];
          const hasAnswered = userAnswer !== undefined;
          const isCorrect = hasAnswered && userAnswer === q.correctIndex;

          return (
            <div
              key={qIdx}
              id={`quiz-question-${qIdx}`}
              className={`rounded-xl border p-4 sm:p-5 transition-all bg-white ${
                hasAnswered
                  ? isCorrect
                    ? 'border-emerald-200 ring-2 ring-emerald-100/60'
                    : 'border-rose-200 ring-2 ring-rose-100/60'
                  : 'border-slate-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-2.5 mb-3.5">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 font-display leading-snug">
                  {q.question}
                </h4>
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-0 sm:pl-8">
                {q.options.map((optionText, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const isThisOptionCorrect = optIdx === q.correctIndex;

                  let optionClasses = 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 text-slate-700';

                  if (hasAnswered) {
                    if (isThisOptionCorrect) {
                      optionClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                    } else if (isSelected) {
                      optionClasses = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-500';
                    } else {
                      optionClasses = 'border-slate-200 opacity-60 text-slate-500';
                    }
                  }

                  const optionLetter = ['A', 'B', 'C', 'D'][optIdx] || optIdx + 1;

                  return (
                    <button
                      key={optIdx}
                      id={`quiz-${qIdx}-opt-${optIdx}`}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${optionClasses}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {optionLetter}
                      </span>
                      <span className="flex-1 leading-relaxed">{optionText}</span>
                      {hasAnswered && isThisOptionCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {hasAnswered && isSelected && !isThisOptionCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after answering */}
              {hasAnswered && (
                <div
                  className={`mt-3.5 sm:ml-8 p-3 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                    isCorrect
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isCorrect ? '🎉' : '💡'}
                  </div>
                  <div>
                    <span className="font-bold block mb-0.5">
                      {isCorrect ? 'Correct!' : `The correct answer was (${['A', 'B', 'C', 'D'][q.correctIndex]}):`}
                    </span>
                    <p>{q.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiz Completion Banner */}
      {isCompleted && (
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl">
              {correctCount === totalCount ? '🏆' : correctCount >= totalCount / 2 ? '🌟' : '📚'}
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold font-display">
                {correctCount === totalCount
                  ? 'Perfect Score! You mastered this concept!'
                  : correctCount >= totalCount / 2
                  ? 'Great effort! You’ve got the core fundamentals.'
                  : 'Good practice! Review the analogies above and try again.'}
              </h4>
              <p className="text-xs text-white/80">
                You scored {correctCount} out of {totalCount} correct ({Math.round((correctCount / totalCount) * 100)}%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors shadow-xs"
          >
            Practice Again
          </button>
        </div>
      )}
    </section>
  );
};
