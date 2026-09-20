import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../types';

interface QuizCardProps {
  quiz: QuizQuestion[];
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  React.useEffect(() => {
    setSelectedAnswers({});
    setHasTriggeredConfetti(false);
  }, [quiz]);

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = quiz.length;
  const isCompleted = answeredCount === totalCount && totalCount > 0;

  const correctCount = Object.entries(selectedAnswers).reduce((acc, [qIdxStr, chosenOptionIdx]) => {
    const qIdx = parseInt(qIdxStr, 10);
    return quiz[qIdx]?.correctIndex === chosenOptionIdx ? acc + 1 : acc;
  }, 0);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (selectedAnswers[questionIdx] !== undefined) return;

    const newAnswers = {
      ...selectedAnswers,
      [questionIdx]: optionIdx,
    };
    setSelectedAnswers(newAnswers);

    if (Object.keys(newAnswers).length === totalCount && !hasTriggeredConfetti) {
      const finalScore = Object.entries(newAnswers).reduce((acc, [qIdxStr, chosen]) => {
        const qIdx = parseInt(qIdxStr, 10);
        return quiz[qIdx]?.correctIndex === chosen ? acc + 1 : acc;
      }, 0);

      if (finalScore >= Math.ceil(totalCount / 2)) {
        try {
          confetti({
            particleCount: 50,
            spread: 50,
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
      className="mt-8 border-t border-[var(--color-border)] pt-6 space-y-6 text-left"
    >
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-ink)]">
            Self-check questions
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
            Test your understanding right now with quick feedback
          </p>
        </div>

        {answeredCount > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--text-muted)]">
              Answered {answeredCount} of {totalCount}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[var(--text-ink)] hover:text-[var(--accent-simple)] transition-colors cursor-pointer"
              title="Reset questions"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {quiz.map((q, qIdx) => {
          const userAnswer = selectedAnswers[qIdx];
          const hasAnswered = userAnswer !== undefined;
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div
              key={qIdx}
              className="border-l-[3px] border-[var(--color-border)] pl-4 sm:pl-5 py-1 space-y-3"
            >
              <p className="text-sm sm:text-base font-serif font-semibold text-[var(--text-ink)]">
                {qIdx + 1}. {q.question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const isCorrectOption = optIdx === q.correctIndex;

                  let borderClass = 'border-[var(--color-border)] hover:border-[var(--text-ink)]';
                  let bgClass = 'bg-[var(--bg-paper)]';
                  let textClass = 'text-[var(--text-ink)]';

                  if (hasAnswered) {
                    if (isCorrectOption) {
                      borderClass = 'border-[var(--accent-example)]';
                      bgClass = 'bg-[var(--input-bg)]';
                      textClass = 'text-[var(--text-ink)] font-medium';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-[var(--accent-keypoints)]';
                      bgClass = 'bg-[var(--input-bg)]';
                      textClass = 'text-[var(--text-ink)]';
                    } else {
                      borderClass = 'border-[var(--color-border-subtle)] opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-2.5 rounded-md border ${borderClass} ${bgClass} ${textClass} text-xs sm:text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default`}
                    >
                      <span className="flex-1">{opt}</span>
                      {hasAnswered && isCorrectOption && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--accent-example)] shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-[var(--accent-keypoints)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback note */}
              {hasAnswered && (
                <div className="mt-2 text-xs text-[var(--text-muted)] font-sans leading-relaxed">
                  <span className="font-semibold text-[var(--text-ink)]">
                    {isCorrect ? 'Correct! ' : 'Explanation: '}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion summary */}
      {isCompleted && (
        <div className="p-3 border-l-[3px] border-[var(--accent-example)] bg-[var(--input-bg)] text-xs text-[var(--text-ink)] rounded-r-md flex items-center justify-between">
          <span>
            Score: {correctCount} of {totalCount} correct.
            {correctCount === totalCount ? ' Excellent job!' : ' Good self-check practice.'}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-[var(--text-ink)] underline decoration-[var(--color-border)] hover:text-[var(--accent-simple)] cursor-pointer ml-3"
          >
            Review and retry
          </button>
        </div>
      )}
    </section>
  );
};
