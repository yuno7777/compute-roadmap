import type { SpacedRepetitionCard } from "@/types/progress";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Clamp a review quality rating onto the SM-2 integer scale [0..5].
 */
export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0;
  return Math.max(0, Math.min(5, Math.round(quality)));
}

/**
 * Create an initial SM-2 review card that is immediately due.
 */
export function createInitialCard(
  questionId: string,
  lessonSlug: string,
  now: Date = new Date()
): SpacedRepetitionCard {
  return {
    questionId,
    lessonSlug,
    easeFactor: DEFAULT_EASE_FACTOR,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now.toISOString(),
    lastQuality: 0,
  };
}

/**
 * Apply one SM-2 review event with quality 0..5 and return the updated card.
 *
 * Quality scale:
 * - 0: Complete blackout
 * - 1: Incorrect, familiar upon seeing answer
 * - 2: Incorrect, answer seemed easy to remember
 * - 3: Correct with serious difficulty
 * - 4: Correct after hesitation
 * - 5: Perfect recall
 */
export function updateReviewCard(
  card: SpacedRepetitionCard,
  quality: number,
  now: Date = new Date()
): SpacedRepetitionCard {
  const q = clampQuality(quality);

  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(card.intervalDays * card.easeFactor));
    }
    repetitions += 1;
  }

  const rawEase =
    card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const easeFactor = Math.max(MIN_EASE_FACTOR, Number(rawEase.toFixed(4)));

  const dueAt = new Date(now.getTime() + intervalDays * MS_PER_DAY).toISOString();

  return {
    questionId: card.questionId,
    lessonSlug: card.lessonSlug,
    easeFactor,
    intervalDays,
    repetitions,
    dueAt,
    lastQuality: q,
  };
}

/**
 * Return true if the card's dueAt timestamp is at or before `now`.
 */
export function isCardDue(
  card: SpacedRepetitionCard,
  now: Date = new Date()
): boolean {
  const dueMs = Date.parse(card.dueAt);
  if (Number.isNaN(dueMs)) return true;
  return dueMs <= now.getTime();
}

/**
 * Return all due cards sorted earliest-due first, breaking ties by lower ease factor.
 */
export function getDueCards(
  cards: Record<string, SpacedRepetitionCard> | SpacedRepetitionCard[],
  now: Date = new Date()
): SpacedRepetitionCard[] {
  const list = Array.isArray(cards) ? cards : Object.values(cards);
  return list
    .filter((card) => isCardDue(card, now))
    .sort((a, b) => {
      const dueDiff = Date.parse(a.dueAt) - Date.parse(b.dueAt);
      if (!Number.isNaN(dueDiff) && dueDiff !== 0) {
        return dueDiff;
      }
      return a.easeFactor - b.easeFactor;
    });
}
