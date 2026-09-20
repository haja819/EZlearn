export type ExplanationLevel = 'very_simple' | 'simple' | 'detailed';

export interface BreakdownPart {
  part: string;
  explanation?: string;
  description?: string;
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
  topic?: string;
  simple: string;
  example: string;
  breakdown: BreakdownPart[];
  keyPoints: string[];
  mnemonic?: string;
  remember?: string;
  unclear?: boolean;
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

