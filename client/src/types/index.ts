export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Course {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  _count?: {
    materials: number;
    quizzes: number;
  };
}

export interface Material {
  id: string;
  courseId: string;
  type: 'PDF' | 'DOCX' | 'URL';
  name: string;
  originalFilename?: string;
  storagePath?: string;
  url?: string;
  contentText?: string;
  wordCount?: number;
  pageCount?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  customTags: string[];
  uploadedAt: string;
  lastScrapedAt?: string;
  fileSize?: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  userId: string;
  quizType: 'FLASHCARD' | 'MULTIPLE_CHOICE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  questionCount: number;
  topicFocus?: string;
  materialIds: string[];
  createdAt: string;
  completedAt?: string;
  score?: number;
  timeSpent?: number;
  answeredCount?: number; // Number of answered questions for incomplete quizzes
  questions?: Question[];
  course?: {
    id: string;
    name: string;
  };
}

export interface Question {
  id: string;
  quizId: string;
  materialId: string;
  questionText: string;
  questionType: 'FLASHCARD' | 'MULTIPLE_CHOICE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctAnswer: string;
  options: string[];
  explanation: string;
  sourceReference?: string;
  flagged: boolean;
  userNotes?: string;
  answeredCorrectly?: boolean;
  userAnswer?: string;
  attemptNumber: number;
}

