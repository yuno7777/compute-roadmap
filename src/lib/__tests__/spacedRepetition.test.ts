import { describe, expect, it } from "vitest";
import {
  clampQuality,
  createInitialCard,
  getDueCards,
  isCardDue,
  updateReviewCard,
} from "../spacedRepetition";

describe("spacedRepetition (SM-2)", () => {
  it("creates an initial card with default ease 2.5 and immediate dueAt", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    const card = createInitialCard("q-1", "what-is-an-electron", now);

    expect(card.questionId).toBe("q-1");
    expect(card.lessonSlug).toBe("what-is-an-electron");
    expect(card.easeFactor).toBe(2.5);
    expect(card.intervalDays).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.dueAt).toBe("2026-01-01T12:00:00.000Z");
    expect(isCardDue(card, now)).toBe(true);
  });

  it("progresses intervals 1 -> 6 -> round(6 * EF) on consecutive quality >= 3 reviews", () => {
    const day0 = new Date("2026-01-01T00:00:00.000Z");
    let card = createInitialCard("q-2", "voltage-current-circuits", day0);

    // Review 1 with quality 5 -> interval 1 day, rep 1, EF = 2.6
    card = updateReviewCard(card, 5, day0);
    expect(card.repetitions).toBe(1);
    expect(card.intervalDays).toBe(1);
    expect(card.easeFactor).toBeCloseTo(2.6, 4);
    expect(card.dueAt).toBe("2026-01-02T00:00:00.000Z");

    // Review 2 on day 1 with quality 4 -> interval 6 days, rep 2, EF = 2.6
    const day1 = new Date("2026-01-02T00:00:00.000Z");
    card = updateReviewCard(card, 4, day1);
    expect(card.repetitions).toBe(2);
    expect(card.intervalDays).toBe(6);
    expect(card.easeFactor).toBeCloseTo(2.6, 4);
    expect(card.dueAt).toBe("2026-01-08T00:00:00.000Z");

    // Review 3 on day 7 with quality 4 -> interval = round(6 * 2.6) = 16 days, rep 3
    const day7 = new Date("2026-01-08T00:00:00.000Z");
    card = updateReviewCard(card, 4, day7);
    expect(card.repetitions).toBe(3);
    expect(card.intervalDays).toBe(16);
    expect(card.dueAt).toBe("2026-01-24T00:00:00.000Z");
  });

  it("resets repetitions and sets interval to 1 day when quality < 3", () => {
    const day0 = new Date("2026-01-01T00:00:00.000Z");
    let card = createInitialCard("q-3", "mosfets-and-cmos-logic", day0);
    card = updateReviewCard(card, 5, day0);
    card = updateReviewCard(card, 5, new Date("2026-01-02T00:00:00.000Z"));
    expect(card.repetitions).toBe(2);
    expect(card.intervalDays).toBe(6);

    const lapseDay = new Date("2026-01-08T00:00:00.000Z");
    card = updateReviewCard(card, 2, lapseDay);
    expect(card.repetitions).toBe(0);
    expect(card.intervalDays).toBe(1);
    expect(card.lastQuality).toBe(2);
    expect(card.dueAt).toBe("2026-01-09T00:00:00.000Z");
  });

  it("never drops easeFactor below 1.3 even after repeated 0-quality blackouts", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    let card = createInitialCard("q-4", "boolean-algebra-logic", now);

    for (let i = 0; i < 10; i++) {
      card = updateReviewCard(card, 0, now);
    }

    expect(card.easeFactor).toBe(1.3);
  });

  it("clamps out-of-range or non-finite quality values into 0..5", () => {
    expect(clampQuality(-3)).toBe(0);
    expect(clampQuality(9)).toBe(5);
    expect(clampQuality(3.6)).toBe(4);
    expect(clampQuality(Number.NaN)).toBe(0);
  });

  it("filters and sorts due cards accurately", () => {
    const now = new Date("2026-01-10T12:00:00.000Z");
    const overdue = {
      ...createInitialCard("q-old", "l1", new Date("2026-01-05T00:00:00.000Z")),
      easeFactor: 2.2,
    };
    const dueNow = {
      ...createInitialCard("q-now", "l2", now),
      easeFactor: 2.5,
    };
    const dueTieHarder = {
      ...createInitialCard("q-hard", "l3", now),
      easeFactor: 1.8,
    };
    const future = createInitialCard(
      "q-future",
      "l4",
      new Date("2026-01-15T00:00:00.000Z")
    );

    const due = getDueCards(
      {
        "q-future": future,
        "q-now": dueNow,
        "q-old": overdue,
        "q-hard": dueTieHarder,
      },
      now
    );

    expect(due.map((c) => c.questionId)).toEqual([
      "q-old",
      "q-hard",
      "q-now",
    ]);
    expect(isCardDue(future, now)).toBe(false);
  });
});
