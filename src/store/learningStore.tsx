"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createInitialCard, updateReviewCard } from "@/lib/spacedRepetition";
import type { DifficultyLevel, TrackId } from "@/types/curriculum";
import type {
  ExamScore,
  LearningState,
  LessonProgress,
  LessonQuizScore,
  MistakeRecord,
  SpacedRepetitionCard,
} from "@/types/progress";

export const LEARNING_STATE_STORAGE_KEY = "compute_learning_state_v1";

function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return getLocalDateKey(dt);
}

export function createDefaultLearningState(
  todayKey: string = getLocalDateKey()
): LearningState {
  return {
    version: 1,
    dailyGoalMinutes: 30,
    todayMinutes: 0,
    streakDays: 0,
    lastActiveDate: todayKey,
    explanationMode: "intermediate",
    theme: "system",
    distractionFree: false,
    bookmarks: [],
    notes: {},
    completedLessons: {},
    lessonQuizScores: {},
    examScores: {},
    mistakes: [],
    reviewCards: {},
  };
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function isValidDifficulty(val: unknown): val is DifficultyLevel {
  return val === "beginner" || val === "intermediate" || val === "advanced";
}

function isValidTheme(val: unknown): val is LearningState["theme"] {
  return val === "light" || val === "dark" || val === "system";
}

/**
 * Validate and normalize an arbitrary parsed JSON value into a LearningState.
 * Returns either the validated state or a descriptive validation error.
 */
export function validateLearningState(
  raw: unknown
): { ok: true; state: LearningState } | { ok: false; error: string } {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Root JSON value must be an object." };
  }

  if (typeof raw.version !== "number" || raw.version < 1) {
    return { ok: false, error: "Invalid or missing numeric 'version'." };
  }

  const defaults = createDefaultLearningState();

  const dailyGoalMinutes =
    typeof raw.dailyGoalMinutes === "number" &&
    Number.isFinite(raw.dailyGoalMinutes) &&
    raw.dailyGoalMinutes >= 5 &&
    raw.dailyGoalMinutes <= 480
      ? Math.round(raw.dailyGoalMinutes)
      : defaults.dailyGoalMinutes;

  const todayMinutes =
    typeof raw.todayMinutes === "number" &&
    Number.isFinite(raw.todayMinutes) &&
    raw.todayMinutes >= 0
      ? raw.todayMinutes
      : 0;

  const streakDays =
    typeof raw.streakDays === "number" &&
    Number.isFinite(raw.streakDays) &&
    raw.streakDays >= 0
      ? Math.floor(raw.streakDays)
      : 0;

  const lastActiveDate =
    typeof raw.lastActiveDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastActiveDate)
      ? raw.lastActiveDate
      : defaults.lastActiveDate;

  const explanationMode = isValidDifficulty(raw.explanationMode)
    ? raw.explanationMode
    : defaults.explanationMode;

  const theme = isValidTheme(raw.theme) ? raw.theme : defaults.theme;
  const distractionFree =
    typeof raw.distractionFree === "boolean" ? raw.distractionFree : false;

  if (raw.bookmarks !== undefined && !Array.isArray(raw.bookmarks)) {
    return { ok: false, error: "'bookmarks' must be an array of lesson slugs." };
  }
  const bookmarks = Array.isArray(raw.bookmarks)
    ? Array.from(
        new Set(raw.bookmarks.filter((b): b is string => typeof b === "string"))
      )
    : [];

  if (raw.notes !== undefined && !isPlainObject(raw.notes)) {
    return { ok: false, error: "'notes' must be an object mapping slugs to text." };
  }
  const notes: Record<string, string> = {};
  if (isPlainObject(raw.notes)) {
    for (const [k, v] of Object.entries(raw.notes)) {
      if (typeof v === "string") notes[k] = v;
    }
  }

  if (
    raw.completedLessons !== undefined &&
    !isPlainObject(raw.completedLessons)
  ) {
    return { ok: false, error: "'completedLessons' must be an object." };
  }
  const completedLessons: Record<string, LessonProgress> = {};
  if (isPlainObject(raw.completedLessons)) {
    for (const [slug, val] of Object.entries(raw.completedLessons)) {
      if (isPlainObject(val) && typeof val.completed === "boolean") {
        completedLessons[slug] = {
          lessonSlug:
            typeof val.lessonSlug === "string" ? val.lessonSlug : slug,
          completed: val.completed,
          completedAt:
            typeof val.completedAt === "string" ? val.completedAt : undefined,
          lastVisitedAt:
            typeof val.lastVisitedAt === "string"
              ? val.lastVisitedAt
              : new Date().toISOString(),
          timeSpentMinutes:
            typeof val.timeSpentMinutes === "number" &&
            Number.isFinite(val.timeSpentMinutes)
              ? Math.max(0, val.timeSpentMinutes)
              : 0,
          scrollProgress:
            typeof val.scrollProgress === "number"
              ? val.scrollProgress
              : undefined,
        };
      }
    }
  }

  if (
    raw.lessonQuizScores !== undefined &&
    !isPlainObject(raw.lessonQuizScores)
  ) {
    return { ok: false, error: "'lessonQuizScores' must be an object." };
  }
  const lessonQuizScores: Record<string, LessonQuizScore> = {};
  if (isPlainObject(raw.lessonQuizScores)) {
    for (const [slug, val] of Object.entries(raw.lessonQuizScores)) {
      if (
        isPlainObject(val) &&
        typeof val.score === "number" &&
        typeof val.total === "number"
      ) {
        lessonQuizScores[slug] = {
          score: val.score,
          total: val.total,
          percentage:
            typeof val.percentage === "number" ? val.percentage : 0,
          bestPercentage:
            typeof val.bestPercentage === "number" ? val.bestPercentage : 0,
          attempts: typeof val.attempts === "number" ? val.attempts : 1,
          lastAttemptAt:
            typeof val.lastAttemptAt === "string"
              ? val.lastAttemptAt
              : new Date().toISOString(),
        };
      }
    }
  }

  if (raw.examScores !== undefined && !isPlainObject(raw.examScores)) {
    return { ok: false, error: "'examScores' must be an object." };
  }
  const examScores: Record<string, ExamScore> = {};
  if (isPlainObject(raw.examScores)) {
    for (const [trackId, val] of Object.entries(raw.examScores)) {
      if (
        isPlainObject(val) &&
        typeof val.score === "number" &&
        typeof val.total === "number"
      ) {
        examScores[trackId] = {
          score: val.score,
          total: val.total,
          percentage:
            typeof val.percentage === "number" ? val.percentage : 0,
          passed: Boolean(val.passed),
          bestPercentage:
            typeof val.bestPercentage === "number" ? val.bestPercentage : 0,
          attempts: typeof val.attempts === "number" ? val.attempts : 1,
          lastAttemptAt:
            typeof val.lastAttemptAt === "string"
              ? val.lastAttemptAt
              : new Date().toISOString(),
        };
      }
    }
  }

  if (raw.mistakes !== undefined && !Array.isArray(raw.mistakes)) {
    return { ok: false, error: "'mistakes' must be an array." };
  }
  const mistakes: MistakeRecord[] = [];
  if (Array.isArray(raw.mistakes)) {
    for (const item of raw.mistakes) {
      if (
        isPlainObject(item) &&
        typeof item.id === "string" &&
        typeof item.questionId === "string" &&
        typeof item.prompt === "string"
      ) {
        mistakes.push({
          id: item.id,
          questionId: item.questionId,
          lessonSlug:
            typeof item.lessonSlug === "string" ? item.lessonSlug : undefined,
          trackId:
            typeof item.trackId === "string"
              ? (item.trackId as TrackId)
              : undefined,
          conceptTag:
            typeof item.conceptTag === "string" ? item.conceptTag : "general",
          prompt: item.prompt,
          userAnswer:
            (item.userAnswer as MistakeRecord["userAnswer"]) ?? "",
          correctAnswer:
            (item.correctAnswer as MistakeRecord["correctAnswer"]) ?? "",
          timestamp:
            typeof item.timestamp === "string"
              ? item.timestamp
              : new Date().toISOString(),
          resolved: Boolean(item.resolved),
        });
      }
    }
  }

  if (raw.reviewCards !== undefined && !isPlainObject(raw.reviewCards)) {
    return { ok: false, error: "'reviewCards' must be an object." };
  }
  const reviewCards: Record<string, SpacedRepetitionCard> = {};
  if (isPlainObject(raw.reviewCards)) {
    for (const [qId, val] of Object.entries(raw.reviewCards)) {
      if (
        isPlainObject(val) &&
        typeof val.questionId === "string" &&
        typeof val.easeFactor === "number" &&
        typeof val.intervalDays === "number" &&
        typeof val.repetitions === "number" &&
        typeof val.dueAt === "string"
      ) {
        reviewCards[qId] = {
          questionId: val.questionId,
          lessonSlug:
            typeof val.lessonSlug === "string" ? val.lessonSlug : "",
          easeFactor: val.easeFactor,
          intervalDays: val.intervalDays,
          repetitions: val.repetitions,
          dueAt: val.dueAt,
          lastQuality:
            typeof val.lastQuality === "number" ? val.lastQuality : 0,
        };
      }
    }
  }

  return {
    ok: true,
    state: {
      version: 1,
      dailyGoalMinutes,
      todayMinutes,
      streakDays,
      lastActiveDate,
      explanationMode,
      theme,
      distractionFree,
      bookmarks,
      notes,
      completedLessons,
      lessonQuizScores,
      examScores,
      mistakes,
      reviewCards,
    },
  };
}

function rollDateState(state: LearningState, todayKey: string): LearningState {
  if (state.lastActiveDate === todayKey) return state;
  const yesterdayKey = getPreviousDateKey(todayKey);
  const streakDays =
    state.lastActiveDate === yesterdayKey ? state.streakDays : 0;
  return {
    ...state,
    todayMinutes: 0,
    streakDays,
    lastActiveDate: todayKey,
  };
}

function applyActivityMinutes(
  prev: LearningState,
  minutesToAdd: number
): Pick<LearningState, "todayMinutes" | "streakDays" | "lastActiveDate"> {
  const todayKey = getLocalDateKey();
  const rolled = rollDateState(prev, todayKey);
  const nextMinutes = Math.max(0, rolled.todayMinutes + minutesToAdd);
  const streakDays =
    minutesToAdd > 0 && rolled.streakDays === 0 ? 1 : rolled.streakDays;

  return {
    todayMinutes: nextMinutes,
    streakDays,
    lastActiveDate: todayKey,
  };
}

export interface RecordMistakeInput {
  questionId: string;
  lessonSlug?: string;
  trackId?: TrackId;
  conceptTag: string;
  prompt: string;
  userAnswer: MistakeRecord["userAnswer"];
  correctAnswer: MistakeRecord["correctAnswer"];
}

export interface LearningStoreContextValue {
  state: LearningState;
  hydrated: boolean;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: LearningState["theme"]) => void;
  setDistractionFree: (enabled: boolean) => void;
  toggleDistractionFree: () => void;
  setExplanationMode: (mode: DifficultyLevel) => void;
  setDailyGoalMinutes: (minutes: number) => void;
  addStudyMinutes: (minutes: number, lessonSlug?: string) => void;
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  setLessonNote: (slug: string, content: string) => void;
  markLessonVisited: (slug: string) => void;
  toggleLessonComplete: (slug: string, forceState?: boolean) => void;
  recordLessonQuizScore: (slug: string, score: number, total: number) => void;
  recordExamScore: (
    trackId: TrackId,
    score: number,
    total: number,
    passingScore: number
  ) => void;
  recordMistake: (input: RecordMistakeInput) => void;
  resolveMistake: (mistakeId: string) => void;
  resolveMistakesForQuestion: (questionId: string) => void;
  reviewQuestion: (
    questionId: string,
    lessonSlug: string,
    quality: number
  ) => void;
  ensureReviewCard: (questionId: string, lessonSlug: string) => void;
  exportLearningState: () => string;
  importLearningState: (
    json: string
  ) => { ok: true } | { ok: false; error: string };
  resetLearningState: () => void;
}

const LearningStoreContext = createContext<LearningStoreContextValue | null>(
  null
);

function applyDomTheme(theme: LearningState["theme"]): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const root = document.documentElement;
  root.dataset.theme = effective;
  root.classList.toggle("dark", effective === "dark");
  root.style.colorScheme = effective;
  return effective;
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearningState>(() =>
    createDefaultLearningState()
  );
  const [hydrated, setHydrated] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    let initialTheme: LearningState["theme"] = "system";
    try {
      const raw = window.localStorage.getItem(LEARNING_STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validation = validateLearningState(parsed);
        if (validation.ok) {
          const rolled = rollDateState(validation.state, getLocalDateKey());
          setState(rolled);
          initialTheme = rolled.theme;
        }
      }
    } catch {
      // Ignore corrupted localStorage and fall back to defaults
    } finally {
      setResolvedTheme(applyDomTheme(initialTheme));
      setHydrated(true);
    }
  }, []);

  // Persist state whenever it updates after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        LEARNING_STATE_STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [state, hydrated]);

  // Synchronize theme attribute + .dark class + system media query listener
  useEffect(() => {
    if (!hydrated) return;
    setResolvedTheme(applyDomTheme(state.theme));
    if (state.theme !== "system" || typeof window === "undefined") {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      setResolvedTheme(applyDomTheme("system"));
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [state.theme, hydrated]);

  const setTheme = useCallback((theme: LearningState["theme"]) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const setDistractionFree = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, distractionFree: enabled }));
  }, []);

  const toggleDistractionFree = useCallback(() => {
    setState((prev) => ({
      ...prev,
      distractionFree: !prev.distractionFree,
    }));
  }, []);

  const setExplanationMode = useCallback((explanationMode: DifficultyLevel) => {
    setState((prev) => ({ ...prev, explanationMode }));
  }, []);

  const setDailyGoalMinutes = useCallback((minutes: number) => {
    const clamped = Math.max(5, Math.min(240, Math.round(minutes)));
    setState((prev) => ({ ...prev, dailyGoalMinutes: clamped }));
  }, []);

  const addStudyMinutes = useCallback(
    (minutes: number, lessonSlug?: string) => {
      if (!Number.isFinite(minutes) || minutes <= 0) return;
      setState((prev) => {
        const activity = applyActivityMinutes(prev, minutes);
        if (!lessonSlug) {
          return { ...prev, ...activity };
        }
        const existing = prev.completedLessons[lessonSlug];
        const nowIso = new Date().toISOString();
        const updatedLesson: LessonProgress = existing
          ? {
              ...existing,
              lastVisitedAt: nowIso,
              timeSpentMinutes: existing.timeSpentMinutes + minutes,
            }
          : {
              lessonSlug,
              completed: false,
              lastVisitedAt: nowIso,
              timeSpentMinutes: minutes,
            };
        return {
          ...prev,
          ...activity,
          completedLessons: {
            ...prev.completedLessons,
            [lessonSlug]: updatedLesson,
          },
        };
      });
    },
    []
  );

  const toggleBookmark = useCallback((slug: string) => {
    setState((prev) => {
      const exists = prev.bookmarks.includes(slug);
      return {
        ...prev,
        bookmarks: exists
          ? prev.bookmarks.filter((b) => b !== slug)
          : [...prev.bookmarks, slug],
      };
    });
  }, []);

  const isBookmarked = useCallback(
    (slug: string) => state.bookmarks.includes(slug),
    [state.bookmarks]
  );

  const setLessonNote = useCallback((slug: string, content: string) => {
    setState((prev) => {
      const nextNotes = { ...prev.notes };
      if (content.trim() === "") {
        delete nextNotes[slug];
      } else {
        nextNotes[slug] = content;
      }
      return { ...prev, notes: nextNotes };
    });
  }, []);

  const markLessonVisited = useCallback((slug: string) => {
    setState((prev) => {
      const existing = prev.completedLessons[slug];
      const nowIso = new Date().toISOString();
      const todayKey = getLocalDateKey();
      const rolled = rollDateState(prev, todayKey);
      const streakDays = rolled.streakDays === 0 ? 1 : rolled.streakDays;

      return {
        ...rolled,
        streakDays,
        completedLessons: {
          ...rolled.completedLessons,
          [slug]: existing
            ? { ...existing, lastVisitedAt: nowIso }
            : {
                lessonSlug: slug,
                completed: false,
                lastVisitedAt: nowIso,
                timeSpentMinutes: 0,
              },
        },
      };
    });
  }, []);

  const toggleLessonComplete = useCallback(
    (slug: string, forceState?: boolean) => {
      setState((prev) => {
        const existing = prev.completedLessons[slug];
        const nextCompleted =
          typeof forceState === "boolean" ? forceState : !existing?.completed;
        const nowIso = new Date().toISOString();
        const activity = nextCompleted
          ? applyActivityMinutes(prev, 2)
          : {
              todayMinutes: prev.todayMinutes,
              streakDays: prev.streakDays,
              lastActiveDate: prev.lastActiveDate,
            };

        return {
          ...prev,
          ...activity,
          completedLessons: {
            ...prev.completedLessons,
            [slug]: {
              lessonSlug: slug,
              completed: nextCompleted,
              completedAt: nextCompleted
                ? existing?.completedAt ?? nowIso
                : undefined,
              lastVisitedAt: nowIso,
              timeSpentMinutes: existing?.timeSpentMinutes ?? 0,
              scrollProgress: existing?.scrollProgress,
            },
          },
        };
      });
    },
    []
  );

  const recordLessonQuizScore = useCallback(
    (slug: string, score: number, total: number) => {
      const safeTotal = Math.max(1, total);
      const percentage = Math.round((score / safeTotal) * 100);
      const nowIso = new Date().toISOString();

      setState((prev) => {
        const existing = prev.lessonQuizScores[slug];
        const activity = applyActivityMinutes(prev, 1);
        return {
          ...prev,
          ...activity,
          lessonQuizScores: {
            ...prev.lessonQuizScores,
            [slug]: {
              score,
              total: safeTotal,
              percentage,
              bestPercentage: Math.max(
                existing?.bestPercentage ?? 0,
                percentage
              ),
              attempts: (existing?.attempts ?? 0) + 1,
              lastAttemptAt: nowIso,
            },
          },
        };
      });
    },
    []
  );

  const recordExamScore = useCallback(
    (
      trackId: TrackId,
      score: number,
      total: number,
      passingScore: number
    ) => {
      const safeTotal = Math.max(1, total);
      const percentage = Math.round((score / safeTotal) * 100);
      const passed = percentage >= passingScore;
      const nowIso = new Date().toISOString();

      setState((prev) => {
        const existing = prev.examScores[trackId];
        const activity = applyActivityMinutes(prev, 3);
        return {
          ...prev,
          ...activity,
          examScores: {
            ...prev.examScores,
            [trackId]: {
              score,
              total: safeTotal,
              percentage,
              passed: Boolean(existing?.passed || passed),
              bestPercentage: Math.max(
                existing?.bestPercentage ?? 0,
                percentage
              ),
              attempts: (existing?.attempts ?? 0) + 1,
              lastAttemptAt: nowIso,
            },
          },
        };
      });
    },
    []
  );

  const recordMistake = useCallback((input: RecordMistakeInput) => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const newRecord: MistakeRecord = {
        id: `${input.questionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        questionId: input.questionId,
        lessonSlug: input.lessonSlug,
        trackId: input.trackId,
        conceptTag: input.conceptTag,
        prompt: input.prompt,
        userAnswer: input.userAnswer,
        correctAnswer: input.correctAnswer,
        timestamp: nowIso,
        resolved: false,
      };
      return {
        ...prev,
        mistakes: [newRecord, ...prev.mistakes].slice(0, 500),
      };
    });
  }, []);

  const resolveMistake = useCallback((mistakeId: string) => {
    setState((prev) => ({
      ...prev,
      mistakes: prev.mistakes.map((m) =>
        m.id === mistakeId ? { ...m, resolved: true } : m
      ),
    }));
  }, []);

  const resolveMistakesForQuestion = useCallback((questionId: string) => {
    setState((prev) => ({
      ...prev,
      mistakes: prev.mistakes.map((m) =>
        m.questionId === questionId ? { ...m, resolved: true } : m
      ),
    }));
  }, []);

  const ensureReviewCard = useCallback(
    (questionId: string, lessonSlug: string) => {
      setState((prev) => {
        if (prev.reviewCards[questionId]) return prev;
        return {
          ...prev,
          reviewCards: {
            ...prev.reviewCards,
            [questionId]: createInitialCard(questionId, lessonSlug),
          },
        };
      });
    },
    []
  );

  const reviewQuestion = useCallback(
    (questionId: string, lessonSlug: string, quality: number) => {
      setState((prev) => {
        const existing =
          prev.reviewCards[questionId] ??
          createInitialCard(questionId, lessonSlug);
        const updated = updateReviewCard(existing, quality);
        const activity = applyActivityMinutes(prev, 1);

        return {
          ...prev,
          ...activity,
          reviewCards: {
            ...prev.reviewCards,
            [questionId]: updated,
          },
          mistakes:
            quality >= 3
              ? prev.mistakes.map((m) =>
                  m.questionId === questionId ? { ...m, resolved: true } : m
                )
              : prev.mistakes,
        };
      });
    },
    []
  );

  const exportLearningState = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importLearningState = useCallback(
    (json: string): { ok: true } | { ok: false; error: string } => {
      try {
        const parsed = JSON.parse(json);
        const result = validateLearningState(parsed);
        if (!result.ok) {
          return { ok: false, error: result.error };
        }
        setState(rollDateState(result.state, getLocalDateKey()));
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Invalid JSON syntax.",
        };
      }
    },
    []
  );

  const resetLearningState = useCallback(() => {
    setState(createDefaultLearningState());
  }, []);

  const value = useMemo<LearningStoreContextValue>(
    () => ({
      state,
      hydrated,
      resolvedTheme,
      setTheme,
      setDistractionFree,
      toggleDistractionFree,
      setExplanationMode,
      setDailyGoalMinutes,
      addStudyMinutes,
      toggleBookmark,
      isBookmarked,
      setLessonNote,
      markLessonVisited,
      toggleLessonComplete,
      recordLessonQuizScore,
      recordExamScore,
      recordMistake,
      resolveMistake,
      resolveMistakesForQuestion,
      reviewQuestion,
      ensureReviewCard,
      exportLearningState,
      importLearningState,
      resetLearningState,
    }),
    [
      state,
      hydrated,
      resolvedTheme,
      setTheme,
      setDistractionFree,
      toggleDistractionFree,
      setExplanationMode,
      setDailyGoalMinutes,
      addStudyMinutes,
      toggleBookmark,
      isBookmarked,
      setLessonNote,
      markLessonVisited,
      toggleLessonComplete,
      recordLessonQuizScore,
      recordExamScore,
      recordMistake,
      resolveMistake,
      resolveMistakesForQuestion,
      reviewQuestion,
      ensureReviewCard,
      exportLearningState,
      importLearningState,
      resetLearningState,
    ]
  );

  return (
    <LearningStoreContext.Provider value={value}>
      {children}
    </LearningStoreContext.Provider>
  );
}

export function useLearningStore(): LearningStoreContextValue {
  const ctx = useContext(LearningStoreContext);
  if (!ctx) {
    throw new Error("useLearningStore must be used within a LearningProvider");
  }
  return ctx;
}
