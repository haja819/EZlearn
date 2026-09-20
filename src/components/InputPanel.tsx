import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { ExplanationLevel } from '../types';
import { SAMPLE_TOPICS } from '../data/sampleExplanations';

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
      setOcrError('Please select an image file (PNG, JPG, or WEBP).');
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

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Request failed (${res.status}): ${errText.slice(0, 200)}`);
          }

          const data = await res.json();
          if (data.error) {
            throw new Error(data.error || 'Failed to extract text from image.');
          }

          if (data.text) {
            onChangeText(data.text);
          } else {
            setOcrError('No readable text found in this photo. Try another picture.');
          }
        } catch (err: any) {
          setOcrError(err.message || 'Error processing image.');
        } finally {
          setOcrLoading(false);
        }
      };
      reader.onerror = () => {
        setOcrError('Could not read the selected image file.');
        setOcrLoading(false);
      };
    } catch (err: any) {
      setOcrError(err.message || 'Failed to upload photo.');
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
    <section
      id="input-section"
      className="border border-[var(--color-border)] bg-[var(--bg-paper)] p-5 sm:p-6 rounded-md"
    >
      {/* Notebook Section Heading */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3 text-left">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-ink)] leading-snug">
            What are you studying?
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
            Paste textbook notes, confusing paragraphs, or homework prompts
          </p>
        </div>

        {/* OCR Photo Button */}
        <div>
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
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--pill-bg)] text-[var(--text-ink)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Upload a photo of your textbook notes to extract text"
          >
            {ocrLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-simple)]" />
                <span>Reading photo...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-[var(--accent-example)]" />
                <span>Upload notes photo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {ocrError && (
        <div className="mb-3 p-3 bg-[var(--input-bg)] border-l-3 border-[var(--accent-keypoints)] text-xs text-[var(--text-ink)] flex items-center justify-between">
          <span>{ocrError}</span>
          <button
            type="button"
            onClick={() => setOcrError(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-ink)] ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Textarea */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border rounded-md transition-colors ${
          dragActive
            ? 'border-[var(--accent-simple)] bg-[var(--input-bg)]'
            : 'border-[var(--color-border)] bg-[var(--input-bg)] focus-within:border-[var(--text-ink)]'
        }`}
      >
        <textarea
          id="study-text-input"
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste or write textbook text here..."
          rows={5}
          className="w-full p-3.5 bg-transparent text-[var(--text-ink)] placeholder:text-[var(--text-muted)] placeholder:opacity-60 focus:outline-none text-sm sm:text-base resize-y leading-relaxed font-sans"
        />

        {dragActive && (
          <div className="absolute inset-0 bg-[var(--input-bg)] flex flex-col items-center justify-center rounded-md pointer-events-none border-2 border-dashed border-[var(--accent-simple)]">
            <Upload className="w-6 h-6 mb-1 text-[var(--accent-simple)]" />
            <p className="text-xs font-medium text-[var(--text-ink)]">
              Drop textbook photo here to extract text
            </p>
          </div>
        )}

        {/* Textarea Bottom Status Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span>
              {wordCount} words, {charCount} characters
            </span>
            <span className="hidden sm:inline opacity-70">
              (Press Ctrl+Enter to explain)
            </span>
          </div>

          {text.length > 0 && (
            <button
              id="btn-clear-text"
              type="button"
              onClick={() => onChangeText('')}
              className="inline-flex items-center gap-1 hover:text-[var(--accent-keypoints)] transition-colors cursor-pointer"
              title="Clear input text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Try an Example Prompts */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-left">
        <span className="text-[var(--text-muted)] mr-1">Try an example:</span>
        {SAMPLE_TOPICS.map((topic, i) => (
          <button
            key={i}
            id={`btn-sample-topic-${i}`}
            type="button"
            onClick={() => {
              onChangeText(topic.text);
              onChangeLevel(topic.level);
            }}
            className="text-[var(--text-ink)] hover:text-[var(--accent-simple)] underline decoration-[var(--color-border)] underline-offset-2 py-0.5 px-1 rounded transition-colors cursor-pointer"
          >
            {topic.title}
          </button>
        ))}
      </div>

      {/* Segmented Pill Level Selector & Explain Trigger */}
      <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left">
        {/* Segmented Pill Toggle for Level */}
        <div className="space-y-1">
          <span className="text-xs text-[var(--text-muted)] font-sans block">
            Explanation level
          </span>
          <div
            id="segmented-level-toggle"
            role="radiogroup"
            aria-label="Explanation level"
            className="inline-flex p-1 bg-[var(--pill-bg)] rounded-full border border-[var(--color-border)]"
          >
            <button
              id="level-btn-very-simple"
              type="button"
              role="radio"
              aria-checked={level === 'very_simple'}
              onClick={() => onChangeLevel('very_simple')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                level === 'very_simple'
                  ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              Very simple
            </button>

            <button
              id="level-btn-simple"
              type="button"
              role="radio"
              aria-checked={level === 'simple'}
              onClick={() => onChangeLevel('simple')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                level === 'simple'
                  ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              Simple
            </button>

            <button
              id="level-btn-detailed"
              type="button"
              role="radio"
              aria-checked={level === 'detailed'}
              onClick={() => onChangeLevel('detailed')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                level === 'detailed'
                  ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>

        {/* Explain Action Button */}
        <div className="flex sm:justify-end">
          <button
            id="btn-explain"
            type="button"
            disabled={isLoading || text.trim().length === 0}
            onClick={onExplain}
            className="w-full sm:w-auto px-5 py-2 rounded-md bg-[var(--text-ink)] text-[var(--bg-paper)] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Translating notes...</span>
              </>
            ) : (
              <>
                <span>Explain in plain English</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
