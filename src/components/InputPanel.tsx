import React, { useState, useRef } from 'react';
import { Sparkles, Camera, Upload, Trash2, ArrowRight, Loader2, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { ExplanationLevel } from '../types';
import { SAMPLE_TOPICS, SampleTopic } from '../data/sampleExplanations';

interface InputPanelProps {
  text: string;
  onChangeText: (value: string) => void;
  level: ExplanationLevel;
  onChangeLevel: (level: ExplanationLevel) => void;
  onExplain: () => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  text,
  onChangeText,
  level,
  onChangeLevel,
  onExplain,
  isLoading,
}) => {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleImageFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setOcrError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setOcrLoading(true);
    setOcrError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type,
            }),
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Failed to extract text from image.');
          }

          if (data.text) {
            onChangeText(data.text);
          } else {
            setOcrError('No readable study text detected in this image. Try another photo.');
          }
        } catch (err: any) {
          setOcrError(err.message || 'Error processing image.');
        } finally {
          setOcrLoading(false);
        }
      };
      reader.onerror = () => {
        setOcrError('Failed to read the image file.');
        setOcrLoading(false);
      };
    } catch (err: any) {
      setOcrError(err.message || 'Failed to upload image.');
      setOcrLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim().length > 0 && !isLoading) {
        onExplain();
      }
    }
  };

  return (
    <section id="input-section" className="bg-white rounded-2xl border border-amber-200/70 p-5 sm:p-6 shadow-sm">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <span>What are you studying?</span>
          </h2>
          <p className="text-xs text-slate-500">
            Paste confusing sentences, textbook paragraphs, research papers, or homework questions.
          </p>
        </div>

        {/* OCR Photo Button */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageFile(e.target.files[0]);
              }
            }}
            accept="image/*"
            className="hidden"
          />
          <button
            id="btn-upload-notes-photo"
            type="button"
            disabled={ocrLoading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors disabled:opacity-50"
            title="Upload a photo of your textbook or notes to extract text"
          >
            {ocrLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Scanning photo...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-amber-700" />
                <span>Snap or Upload Notes (OCR)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {ocrError && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{ocrError}</span>
          <button
            type="button"
            onClick={() => setOcrError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Text Area with Drag & Drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-xl border transition-all ${
          dragActive
            ? 'border-amber-500 ring-4 ring-amber-100 bg-amber-50/40'
            : 'border-slate-200 focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-100/70 bg-slate-50/50'
        }`}
      >
        <textarea
          id="study-text-input"
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste textbook paragraph or study concept here... (e.g. 'The Keynesian fiscal multiplier reflects the ratio of change in national income...')"
          rows={6}
          className="w-full p-4 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-hidden text-sm sm:text-base resize-y leading-relaxed font-sans"
        />

        {dragActive && (
          <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl pointer-events-none text-amber-900 border-2 border-dashed border-amber-500">
            <Upload className="w-8 h-8 mb-2 animate-bounce text-amber-600" />
            <p className="text-sm font-semibold">Drop textbook photo or notes here to OCR</p>
          </div>
        )}

        {/* Textarea Bottom Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/70 bg-white/70 rounded-b-xl text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              {wordCount} words • {charCount} chars
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-400">Press Cmd+Enter to explain</span>
          </div>

          {text.length > 0 && (
            <button
              id="btn-clear-text"
              type="button"
              onClick={() => onChangeText('')}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors"
              title="Clear input text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Try an Example Chips */}
      <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 shrink-0 flex items-center gap-1 font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Try an example:
        </span>
        {SAMPLE_TOPICS.map((topic, i) => (
          <button
            key={i}
            id={`btn-sample-topic-${i}`}
            type="button"
            onClick={() => {
              onChangeText(topic.text);
              onChangeLevel(topic.level);
            }}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-50/70 hover:bg-amber-100 text-slate-700 border border-amber-200/60 font-medium transition-colors cursor-pointer"
          >
            {topic.title}
          </button>
        ))}
      </div>

      {/* Level Selector & Explain Trigger */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Explanation Level Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Explanation Level
          </label>
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 gap-1">
            <button
              id="level-btn-very-simple"
              type="button"
              onClick={() => onChangeLevel('very_simple')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                level === 'very_simple'
                  ? 'bg-amber-400 text-slate-900 shadow-xs ring-1 ring-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>👶</span>
              <span>Very Simple</span>
              <span className="hidden sm:inline text-[11px] font-normal opacity-85">(ELI5)</span>
            </button>

            <button
              id="level-btn-simple"
              type="button"
              onClick={() => onChangeLevel('simple')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                level === 'simple'
                  ? 'bg-amber-400 text-slate-900 shadow-xs ring-1 ring-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🎒</span>
              <span>Simple</span>
              <span className="hidden sm:inline text-[11px] font-normal opacity-85">(Student)</span>
            </button>

            <button
              id="level-btn-detailed"
              type="button"
              onClick={() => onChangeLevel('detailed')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                level === 'detailed'
                  ? 'bg-amber-400 text-slate-900 shadow-xs ring-1 ring-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🔬</span>
              <span>Detailed</span>
              <span className="hidden sm:inline text-[11px] font-normal opacity-85">(Technical)</span>
            </button>
          </div>
        </div>

        {/* Big Action Button */}
        <div className="flex items-end">
          <button
            id="btn-explain"
            type="button"
            disabled={isLoading || text.trim().length === 0}
            onClick={onExplain}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Translating to ELI5...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>Explain in Plain English</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
