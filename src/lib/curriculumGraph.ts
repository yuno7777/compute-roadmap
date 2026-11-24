import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { ALL_LESSONS } from "@/data/lessons";
import type {
  CurriculumPlanEntry,
  DomainId,
  Lesson,
  TrackId,
} from "@/types/curriculum";
import type {
  LessonProgress,
  LessonQuizScore,
  MistakeRecord,
} from "@/types/progress";

type CompletedInput =
  | Record<string, LessonProgress>
  | Set<string>
  | string[];

function toCompletedSet(completed: CompletedInput): Set<string> {
  if (completed instanceof Set) return completed;
  if (Array.isArray(completed)) return new Set(completed);
  const set = new Set<string>();
  for (const [slug, progress] of Object.entries(completed)) {
    if (progress?.completed) {
      set.add(slug);
    }
  }
  return set;
}

/**
 * Deterministic Kahn topological sort over the curriculum DAG,
 * breaking ties by lesson `number`.
 */
export function topologicalSort(
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): CurriculumPlanEntry[] {
  const bySlug = new Map<string, CurriculumPlanEntry>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const entry of entries) {
    bySlug.set(entry.slug, entry);
    inDegree.set(entry.slug, 0);
    adj.set(entry.slug, []);
  }

  for (const entry of entries) {
    for (const prereq of entry.prerequisites) {
      if (!bySlug.has(prereq)) continue;
      adj.get(prereq)!.push(entry.slug);
      inDegree.set(entry.slug, (inDegree.get(entry.slug) ?? 0) + 1);
    }
  }

  const ready: CurriculumPlanEntry[] = entries
    .filter((e) => (inDegree.get(e.slug) ?? 0) === 0)
    .sort((a, b) => a.number - b.number);

  const ordered: CurriculumPlanEntry[] = [];
  const visited = new Set<string>();

  while (ready.length > 0) {
    const current = ready.shift()!;
    if (visited.has(current.slug)) continue;
    visited.add(current.slug);
    ordered.push(current);

    for (const nextSlug of adj.get(current.slug) ?? []) {
      const nextDegree = (inDegree.get(nextSlug) ?? 0) - 1;
      inDegree.set(nextSlug, nextDegree);
      if (nextDegree === 0) {
        const nextEntry = bySlug.get(nextSlug);
        if (nextEntry) {
          ready.push(nextEntry);
          ready.sort((a, b) => a.number - b.number);
        }
      }
    }
  }

  // Defensive fallback if any entry remained unvisited due to a malformed cycle
  if (ordered.length < entries.length) {
    const remaining = entries
      .filter((e) => !visited.has(e.slug))
      .sort((a, b) => a.number - b.number);
    ordered.push(...remaining);
  }

  return ordered;
}

/**
 * Compute longest-path topological depth for every lesson slug (root = 0).
 */
export function getTopologicalDepths(
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): Record<string, number> {
  const ordered = topologicalSort(entries);
  const depths: Record<string, number> = {};

  for (const entry of ordered) {
    let maxPrereqDepth = -1;
    for (const prereq of entry.prerequisites) {
      if (prereq in depths) {
        maxPrereqDepth = Math.max(maxPrereqDepth, depths[prereq]);
      }
    }
    depths[entry.slug] = maxPrereqDepth + 1;
  }

  return depths;
}

/**
 * Return all transitive prerequisite slugs for `slug` in topological order.
 */
export function getPrerequisitesRecursive(
  slug: string,
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): string[] {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const collected = new Set<string>();
  const stack = [...(bySlug.get(slug)?.prerequisites ?? [])];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (collected.has(current) || current === slug) continue;
    collected.add(current);
    const entry = bySlug.get(current);
    if (entry) {
      for (const prereq of entry.prerequisites) {
        if (!collected.has(prereq)) {
          stack.push(prereq);
        }
      }
    }
  }

  return topologicalSort(entries)
    .filter((entry) => collected.has(entry.slug))
    .map((entry) => entry.slug);
}

/**
 * Return direct downstream lessons that list `slug` as a prerequisite.
 */
export function getDependents(
  slug: string,
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): CurriculumPlanEntry[] {
  return entries
    .filter((entry) => entry.prerequisites.includes(slug))
    .sort((a, b) => a.number - b.number);
}

/**
 * Return all transitive downstream dependent slugs for `slug`.
 */
export function getDependentsRecursive(
  slug: string,
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): string[] {
  const dependents = new Set<string>();
  const queue = [slug];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dep of getDependents(current, entries)) {
      if (!dependents.has(dep.slug)) {
        dependents.add(dep.slug);
        queue.push(dep.slug);
      }
    }
  }

  return topologicalSort(entries)
    .filter((e) => dependents.has(e.slug))
    .map((e) => e.slug);
}

/**
 * Return unmet direct prerequisite entries for a lesson.
 */
export function getUnmetPrerequisites(
  slug: string,
  completedLessons: CompletedInput,
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): CurriculumPlanEntry[] {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const entry = bySlug.get(slug);
  if (!entry) return [];
  const completed = toCompletedSet(completedLessons);

  return entry.prerequisites
    .filter((prereqSlug) => !completed.has(prereqSlug))
    .map((prereqSlug) => bySlug.get(prereqSlug))
    .filter((e): e is CurriculumPlanEntry => Boolean(e))
    .sort((a, b) => a.number - b.number);
}

/**
 * Check whether all direct prerequisites for `slug` are completed.
 */
export function arePrerequisitesMet(
  slug: string,
  completedLessons: CompletedInput,
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): boolean {
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) return true;
  const completed = toCompletedSet(completedLessons);
  return entry.prerequisites.every((prereq) => completed.has(prereq));
}

/**
 * Recommend the earliest incomplete lesson whose prerequisites are met.
 * Falls back to the earliest incomplete lesson if needed.
 */
export function getRecommendedNextLesson(
  completedLessons: CompletedInput,
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): CurriculumPlanEntry | undefined {
  const completed = toCompletedSet(completedLessons);
  const sorted = [...entries].sort((a, b) => a.number - b.number);

  const readyNext = sorted.find(
    (entry) =>
      !completed.has(entry.slug) &&
      arePrerequisitesMet(entry.slug, completed, entries)
  );
  if (readyNext) return readyNext;

  return sorted.find((entry) => !completed.has(entry.slug));
}

export interface MasterySummary {
  completed: number;
  total: number;
  percentage: number;
  averageQuizPercentage: number;
  authoredCount: number;
}

function summarizeLessons(
  planEntries: CurriculumPlanEntry[],
  completedLessons: CompletedInput,
  lessonQuizScores: Record<string, LessonQuizScore> = {},
  authoredLessons: Lesson[] = ALL_LESSONS
): MasterySummary {
  const completedSet = toCompletedSet(completedLessons);
  const authoredSlugs = new Set(authoredLessons.map((l) => l.slug));

  const total = planEntries.length;
  const completed = planEntries.filter((e) => completedSet.has(e.slug)).length;
  const authoredCount = planEntries.filter((e) =>
    authoredSlugs.has(e.slug)
  ).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const scored = planEntries
    .map((e) => lessonQuizScores[e.slug]?.bestPercentage)
    .filter((val): val is number => typeof val === "number");

  const averageQuizPercentage =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((sum, val) => sum + val, 0) / scored.length);

  return {
    completed,
    total,
    percentage,
    averageQuizPercentage,
    authoredCount,
  };
}

/**
 * Compute completion & quiz mastery metrics for a single domain.
 */
export function getDomainMastery(
  domainId: DomainId,
  completedLessons: CompletedInput,
  lessonQuizScores: Record<string, LessonQuizScore> = {},
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): MasterySummary {
  const domainEntries = entries.filter((e) => e.domainId === domainId);
  return summarizeLessons(domainEntries, completedLessons, lessonQuizScores);
}

/**
 * Compute completion & quiz mastery metrics for a single track.
 */
export function getTrackMastery(
  trackId: TrackId,
  completedLessons: CompletedInput,
  lessonQuizScores: Record<string, LessonQuizScore> = {},
  entries: CurriculumPlanEntry[] = CURRICULUM_PLAN
): MasterySummary {
  const trackEntries = entries.filter((e) => e.trackId === trackId);
  return summarizeLessons(trackEntries, completedLessons, lessonQuizScores);
}

export interface WeakConceptTag {
  conceptTag: string;
  unresolvedCount: number;
  totalCount: number;
  lessonSlugs: string[];
  latestTimestamp: string;
}

/**
 * Aggregate mistake records by conceptTag, prioritizing unresolved errors.
 */
export function getWeakConceptTags(
  mistakes: MistakeRecord[],
  limit = 10
): WeakConceptTag[] {
  const map = new Map<
    string,
    {
      unresolvedCount: number;
      totalCount: number;
      lessonSlugs: Set<string>;
      latestTimestamp: string;
    }
  >();

  for (const mistake of mistakes) {
    const tag = mistake.conceptTag || "general";
    let record = map.get(tag);
    if (!record) {
      record = {
        unresolvedCount: 0,
        totalCount: 0,
        lessonSlugs: new Set<string>(),
        latestTimestamp: mistake.timestamp,
      };
      map.set(tag, record);
    }
    record.totalCount += 1;
    if (!mistake.resolved) {
      record.unresolvedCount += 1;
    }
    if (mistake.lessonSlug) {
      record.lessonSlugs.add(mistake.lessonSlug);
    }
    if (mistake.timestamp > record.latestTimestamp) {
      record.latestTimestamp = mistake.timestamp;
    }
  }

  return Array.from(map.entries())
    .map(([conceptTag, data]) => ({
      conceptTag,
      unresolvedCount: data.unresolvedCount,
      totalCount: data.totalCount,
      lessonSlugs: Array.from(data.lessonSlugs),
      latestTimestamp: data.latestTimestamp,
    }))
    .sort((a, b) => {
      if (b.unresolvedCount !== a.unresolvedCount) {
        return b.unresolvedCount - a.unresolvedCount;
      }
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return b.latestTimestamp.localeCompare(a.latestTimestamp);
    })
    .slice(0, limit);
}
