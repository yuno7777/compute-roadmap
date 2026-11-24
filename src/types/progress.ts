import type { DifficultyLevel, TrackId } from "./curriculum";

export interface LessonProgress {
  lessonSlug: string;
  completed: boolean;
  completedAt?: string;
  lastVisitedAt: string;
  timeSpentMinutes: number;
  scrollProgress?: number;
}

export interface MistakeRecord {
  id: string;
  questionId: string;
  lessonSlug?: string;
  trackId?: TrackId;
  conceptTag: string;
  prompt: string;
  userAnswer: string | string[] | boolean | number | Record<string, string>;
  correctAnswer: string | string[] | boolean | number | Record<string, string>;
  timestamp: string;
  resolved: boolean;
}

export interface SpacedRepetitionCard {
  questionId: string;
  lessonSlug: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastQuality: number;
}

export interface LessonQuizScore {
  score: number;
  total: number;
  percentage: number;
  bestPercentage: number;
  attempts: number;
  lastAttemptAt: string;
}

export interface ExamScore {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  bestPercentage: number;
  attempts: number;
  lastAttemptAt: string;
}

export interface LearningState {
  version: number;
  dailyGoalMinutes: number;
  todayMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  explanationMode: DifficultyLevel;
  theme: "light" | "dark" | "system";
  distractionFree: boolean;
  bookmarks: string[];
  notes: Record<string, string>;
  completedLessons: Record<string, LessonProgress>;
  lessonQuizScores: Record<string, LessonQuizScore>;
  examScores: Record<string, ExamScore>;
  mistakes: MistakeRecord[];
  reviewCards: Record<string, SpacedRepetitionCard>;
}
