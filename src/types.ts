export type ExplanationLevel = 'very_simple' | 'simple' | 'detailed';

export interface BreakdownPart {
  part: string;
  description: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyExplanation {
  id: string;
  timestamp: number;
  originalText: string;
  level: ExplanationLevel;
  simple: string;
  example: string;
  breakdown: BreakdownPart[];
  keyPoints: string[];
  mnemonic: string;
  quiz: QuizQuestion[];
}

export interface SimplifiedPointResponse {
  simplifiedExplanation: string;
  analogy: string;
  takeaway: string;
}

export interface PointClarificationState {
  loading: boolean;
  error?: string;
  data?: SimplifiedPointResponse;
  expanded: boolean;
}
