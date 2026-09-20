import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[var(--bg-paper)] text-[var(--text-ink)] rounded-md border border-[var(--color-border)] z-10 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <h3 className="font-serif font-bold text-lg text-[var(--text-ink)]">
              Notebook guide
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              How EZlearn structures your study material
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-[var(--text-muted)] font-sans">
          <p className="leading-relaxed text-[var(--text-ink)]">
            Dense textbook paragraphs are translated into five margin-annotated notebook blocks:
          </p>

          <div className="space-y-3">
            <div className="border-l-[3px] border-[var(--accent-simple)] pl-3.5 py-0.5">
              <strong className="text-[var(--text-ink)] font-serif block text-sm">
                1. Simple explanation
              </strong>
              <span>The core idea in everyday terms without academic barrier words.</span>
            </div>

            <div className="border-l-[3px] border-[var(--accent-example)] pl-3.5 py-0.5">
              <strong className="text-[var(--text-ink)] font-serif block text-sm">
                2. Real-life example
              </strong>
              <span>An analogy starting with "Imagine..." so you can visualize the concept.</span>
            </div>

            <div className="border-l-[3px] border-[var(--accent-breakdown)] pl-3.5 py-0.5">
              <strong className="text-[var(--text-ink)] font-serif block text-sm">
                3. Break it down
              </strong>
              <span>Step-by-step components and how each connects to the whole.</span>
            </div>

            <div className="border-l-[3px] border-[var(--accent-keypoints)] pl-3.5 py-0.5">
              <strong className="text-[var(--text-ink)] font-serif block text-sm">
                4. Key points with point-by-point clarification
              </strong>
              <span>Click "Clarify this" on any point for an extra-simple mini explanation.</span>
            </div>

            <div className="border-l-[3px] border-[var(--accent-keypoints)] pl-3.5 py-0.5">
              <strong className="text-[var(--text-ink)] font-serif block text-sm">
                5. Remember this & self-check questions
              </strong>
              <span>A snappy memory hook followed by 3 quick check questions to verify understanding.</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--text-ink)] text-[var(--bg-paper)] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Back to notebook
          </button>
        </div>
      </div>
    </div>
  );
};
