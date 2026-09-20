import React from 'react';
import { X, Sparkles, BookOpen, Lightbulb, HelpCircle, CheckCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden z-10 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg font-display">
              How EZlearn Works
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm text-slate-600">
          <p className="leading-relaxed">
            Most textbooks are written in dense, formal jargon that overloads your working memory. EZlearn acts as your patient study partner, breaking text into five structured mental anchors:
          </p>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-2.5">
              <span className="text-base">👶</span>
              <div>
                <strong className="text-slate-900 font-bold block">Super Simple:</strong>
                <span>The essence stripped of unnecessary jargon in 1-2 plain sentences.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-start gap-2.5">
              <span className="text-base">🌱</span>
              <div>
                <strong className="text-slate-900 font-bold block">Real-life Example:</strong>
                <span>An everyday analogy (like kitchens, traffic, or games) so your brain can visualize it.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/60 flex items-start gap-2.5">
              <span className="text-base">🧩</span>
              <div>
                <strong className="text-slate-900 font-bold block">Break It Down:</strong>
                <span>Dissects the concept into parts and clarifies how each piece connects.</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/60 flex items-start gap-2.5">
              <span className="text-base">🎯</span>
              <div>
                <strong className="text-slate-900 font-bold block">Key Points with "I don't get this one":</strong>
                <span>If any bullet point still feels confusing, click the button underneath it to get an even simpler re-explanation scoped just to that point!</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/60 flex items-start gap-2.5">
              <span className="text-base">🧠</span>
              <div>
                <strong className="text-slate-900 font-bold block">Remember It & Quiz:</strong>
                <span>A snappy mnemonic to lock it down, followed by a 4-option check to verify true comprehension.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm transition-colors"
          >
            Got it, let's study!
          </button>
        </div>
      </div>
    </div>
  );
};
