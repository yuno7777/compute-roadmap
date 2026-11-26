import { describe, expect, it } from "vitest";
import { SIMULATOR_REGISTRY } from "@/components/simulators/registry";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS } from "@/data/domains";
import { ALL_TRACK_EXAMS } from "@/data/exams";
import { ALL_GLOSSARY_TERMS } from "@/data/glossary";
import { ALL_LESSONS } from "@/data/lessons";
import { PLAIN_ENGLISH_GUIDES } from "@/data/plainEnglish";
import { SIMULATOR_CATALOG } from "@/data/simulators";
import type { AssessmentQuestion } from "@/types/assessment";
import type { Lesson } from "@/types/curriculum";
import type { SimulatorId } from "@/types/simulator";

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\bTODO\b/,
  /\bTBD\b/,
  /lorem\s+ipsum/i,
  /coming\s+soon/i,
];

function findPlaceholderMatches(value: unknown, path: string): string[] {
  const hits: string[] = [];
  if (typeof value === "string") {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(value)) {
        hits.push(`${path} matched ${pattern.toString()}`);
      }
    }
    return hits;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      hits.push(...findPlaceholderMatches(item, `${path}[${index}]`));
    });
    return hits;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      hits.push(...findPlaceholderMatches(entry, `${path}.${key}`));
    }
  }
  return hits;
}

function validateAssessmentQuestion(
  q: AssessmentQuestion,
  context: string,
  validSimIds: Set<SimulatorId>
): string[] {
  const errors: string[] = [];

  if (!q.id?.trim()) errors.push(`${context}: missing question id`);
  if (!q.prompt?.trim()) errors.push(`${context} (${q.id}): empty prompt`);
  if (!q.explanation?.trim()) {
    errors.push(`${context} (${q.id}): empty explanation`);
  }
  if (!q.conceptTag?.trim()) {
    errors.push(`${context} (${q.id}): empty conceptTag`);
  }

  switch (q.type) {
    case "mcq": {
      const options = q.options ?? [];
      if (options.length < 2) {
        errors.push(`${context} (${q.id}): mcq needs >= 2 options`);
      }
      const optionIds = new Set(options.map((o) => o.id));
      if (
        typeof q.correctAnswer !== "string" ||
        !optionIds.has(q.correctAnswer)
      ) {
        errors.push(
          `${context} (${q.id}): mcq correctAnswer "${String(q.correctAnswer)}" not in options [${[...optionIds].join(", ")}]`
        );
      }
      break;
    }

    case "multi-select": {
      const options = q.options ?? [];
      if (options.length < 2) {
        errors.push(`${context} (${q.id}): multi-select needs >= 2 options`);
      }
      const optionIds = new Set(options.map((o) => o.id));
      const expected = Array.isArray(q.correctAnswer)
        ? q.correctAnswer
        : typeof q.correctAnswer === "string"
          ? [q.correctAnswer]
          : [];
      if (expected.length === 0) {
        errors.push(`${context} (${q.id}): multi-select empty correctAnswer`);
      }
      for (const id of expected) {
        if (!optionIds.has(id)) {
          errors.push(
            `${context} (${q.id}): multi-select answer "${id}" not in options`
          );
        }
      }
      break;
    }

    case "true-false": {
      const isValidBool =
        typeof q.correctAnswer === "boolean" ||
        q.correctAnswer === "true" ||
        q.correctAnswer === "false";
      if (!isValidBool) {
        errors.push(
          `${context} (${q.id}): true-false invalid correctAnswer "${String(q.correctAnswer)}"`
        );
      }
      break;
    }

    case "fill-blank": {
      if (
        typeof q.correctAnswer !== "string" ||
        q.correctAnswer.trim().length === 0
      ) {
        errors.push(`${context} (${q.id}): fill-blank empty correctAnswer`);
      }
      break;
    }

    case "predict-output":
    case "debugging": {
      if (q.options && q.options.length > 0) {
        const optionIds = new Set(q.options.map((o) => o.id));
        if (
          typeof q.correctAnswer !== "string" ||
          !optionIds.has(q.correctAnswer)
        ) {
          errors.push(
            `${context} (${q.id}): ${q.type} correctAnswer "${String(q.correctAnswer)}" not in options`
          );
        }
      } else if (String(q.correctAnswer ?? "").trim().length === 0) {
        errors.push(`${context} (${q.id}): ${q.type} empty correctAnswer`);
      }
      break;
    }

    case "math": {
      if (typeof q.correctAnswer === "number") {
        if (!Number.isFinite(q.correctAnswer)) {
          errors.push(`${context} (${q.id}): math correctAnswer is non-finite`);
        }
      } else if (String(q.correctAnswer ?? "").trim().length === 0) {
        errors.push(`${context} (${q.id}): math empty correctAnswer`);
      }
      break;
    }

    case "ordering": {
      const items = q.orderingItems ?? [];
      const expected = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
      if (items.length < 2) {
        errors.push(`${context} (${q.id}): ordering needs >= 2 orderingItems`);
      }
      if (expected.length !== items.length) {
        errors.push(
          `${context} (${q.id}): ordering correctAnswer length (${expected.length}) !== orderingItems length (${items.length})`
        );
      } else {
        const sortedItems = [...items].sort();
        const sortedExpected = [...expected].sort();
        const mismatch = sortedItems.some(
          (val, idx) => val !== sortedExpected[idx]
        );
        if (mismatch) {
          errors.push(
            `${context} (${q.id}): ordering correctAnswer items do not match orderingItems`
          );
        }
      }
      break;
    }

    case "matching": {
      const pairs = q.matchingPairs ?? [];
      if (pairs.length < 2) {
        errors.push(`${context} (${q.id}): matching needs >= 2 matchingPairs`);
      }
      if (
        typeof q.correctAnswer !== "object" ||
        q.correctAnswer === null ||
        Array.isArray(q.correctAnswer)
      ) {
        errors.push(
          `${context} (${q.id}): matching correctAnswer must be an object map`
        );
      } else {
        const expectedMap = q.correctAnswer as Record<string, string>;
        for (const pair of pairs) {
          const resolved = expectedMap[pair.id] ?? expectedMap[pair.left];
          if (resolved !== undefined && resolved !== pair.right) {
            errors.push(
              `${context} (${q.id}): matching key "${pair.id}" maps to "${resolved}" instead of "${pair.right}"`
            );
          }
        }
      }
      break;
    }

    case "simulation-challenge": {
      if (!q.simulatorId || !validSimIds.has(q.simulatorId)) {
        errors.push(
          `${context} (${q.id}): simulation-challenge references invalid simulatorId "${String(q.simulatorId)}"`
        );
      }
      break;
    }
  }

  return errors;
}

describe("Curriculum Integrity & Completeness", () => {
  const lessonBySlug = new Map<string, Lesson>(
    ALL_LESSONS.map((lesson) => [lesson.slug, lesson])
  );
  const glossaryIds = new Set(ALL_GLOSSARY_TERMS.map((t) => t.id));
  const validSimIds = new Set<SimulatorId>(
    Object.keys(SIMULATOR_REGISTRY) as SimulatorId[]
  );

  it("covers all 24 DomainIds in DOMAINS with >= 1 complete lesson each", () => {
    expect(DOMAINS).toHaveLength(24);
    expect(TRACKS).toHaveLength(6);

    const missingDomains: string[] = [];
    for (const domain of DOMAINS) {
      const completeInDomain = ALL_LESSONS.filter(
        (lesson) =>
          lesson.domainId === domain.id && lesson.status === "complete"
      );
      if (completeInDomain.length === 0) {
        missingDomains.push(domain.id);
      }
    }

    expect(missingDomains).toEqual([]);
  });

  it("has all 58 canonical CURRICULUM_PLAN slugs complete, unique, and numbered 1..58", () => {
    expect(CURRICULUM_PLAN).toHaveLength(58);
    expect(ALL_LESSONS).toHaveLength(58);

    const slugs = new Set<string>();
    const ids = new Set<string>();
    const numbers: number[] = [];
    const mismatches: string[] = [];

    for (const planEntry of CURRICULUM_PLAN) {
      const lesson = lessonBySlug.get(planEntry.slug);
      if (!lesson) {
        mismatches.push(`Missing lesson for canonical slug "${planEntry.slug}"`);
        continue;
      }
      if (lesson.status !== "complete") {
        mismatches.push(
          `Lesson "${planEntry.slug}" has status "${lesson.status}" (expected "complete")`
        );
      }
      if (lesson.number !== planEntry.number) {
        mismatches.push(
          `Lesson "${planEntry.slug}" number ${lesson.number} !== plan ${planEntry.number}`
        );
      }
      if (lesson.trackId !== planEntry.trackId) {
        mismatches.push(
          `Lesson "${planEntry.slug}" trackId ${lesson.trackId} !== plan ${planEntry.trackId}`
        );
      }
      if (lesson.domainId !== planEntry.domainId) {
        mismatches.push(
          `Lesson "${planEntry.slug}" domainId ${lesson.domainId} !== plan ${planEntry.domainId}`
        );
      }
    }

    for (const lesson of ALL_LESSONS) {
      if (slugs.has(lesson.slug)) {
        mismatches.push(`Duplicate slug "${lesson.slug}"`);
      }
      slugs.add(lesson.slug);

      if (ids.has(lesson.id)) {
        mismatches.push(`Duplicate id "${lesson.id}"`);
      }
      ids.add(lesson.id);

      numbers.push(lesson.number);
    }

    numbers.sort((a, b) => a - b);
    const expectedNumbers = Array.from({ length: 58 }, (_, i) => i + 1);
    expect(mismatches).toEqual([]);
    expect(numbers).toEqual(expectedNumbers);
  });

  it("has a valid acyclic prerequisite DAG with 0 missing slugs (Kahn's topological sort)", () => {
    const missingPrereqs: string[] = [];
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const lesson of ALL_LESSONS) {
      inDegree.set(lesson.slug, 0);
      dependents.set(lesson.slug, []);
    }

    for (const lesson of ALL_LESSONS) {
      for (const prereq of lesson.prerequisites) {
        if (!lessonBySlug.has(prereq)) {
          missingPrereqs.push(`${lesson.slug} -> missing prereq "${prereq}"`);
          continue;
        }
        if (prereq === lesson.slug) {
          missingPrereqs.push(`${lesson.slug} -> self-dependency`);
          continue;
        }
        inDegree.set(lesson.slug, (inDegree.get(lesson.slug) ?? 0) + 1);
        dependents.get(prereq)?.push(lesson.slug);
      }
    }

    expect(missingPrereqs).toEqual([]);

    const queue: string[] = [];
    for (const [slug, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(slug);
    }

    let visited = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      visited++;
      for (const next of dependents.get(current) ?? []) {
        const nextDeg = (inDegree.get(next) ?? 0) - 1;
        inDegree.set(next, nextDeg);
        if (nextDeg === 0) {
          queue.push(next);
        }
      }
    }

    expect(visited).toBe(ALL_LESSONS.length);
  });

  it("enforces structural depth, valid references, glossary/connection links, assessments, and 0 placeholders on every lesson", () => {
    const violations: string[] = [];

    for (const lesson of ALL_LESSONS) {
      const tag = `[#${lesson.number} ${lesson.slug}]`;

      if (
        !lesson.objectives ||
        lesson.objectives.length < 3 ||
        lesson.objectives.some((o) => !o.trim())
      ) {
        violations.push(`${tag}: needs >= 3 non-empty objectives`);
      }

      const b = lesson.depthExplanations?.beginner?.trim() ?? "";
      const m = lesson.depthExplanations?.intermediate?.trim() ?? "";
      const a = lesson.depthExplanations?.advanced?.trim() ?? "";
      if (!b || !m || !a) {
        violations.push(`${tag}: empty depthExplanations field`);
      } else if (b === m || m === a || b === a) {
        violations.push(`${tag}: depthExplanations must be 3 distinct strings`);
      }

      if (!lesson.intuition?.trim()) {
        violations.push(`${tag}: empty intuition`);
      }
      if (!lesson.technicalTheory?.trim()) {
        violations.push(`${tag}: empty technicalTheory`);
      }

      if (!lesson.mechanisms || lesson.mechanisms.length < 4) {
        violations.push(
          `${tag}: needs >= 4 mechanisms (has ${lesson.mechanisms?.length ?? 0})`
        );
      }

      if (!lesson.codeExamples || lesson.codeExamples.length < 1) {
        violations.push(`${tag}: needs >= 1 codeExamples`);
      }

      if (
        !lesson.realWorldApplications ||
        lesson.realWorldApplications.length < 2
      ) {
        violations.push(`${tag}: needs >= 2 realWorldApplications`);
      }

      if (!lesson.misconceptions || lesson.misconceptions.length < 2) {
        violations.push(`${tag}: needs >= 2 misconceptions`);
      }

      if (
        !lesson.revisionNotes ||
        lesson.revisionNotes.length < 4 ||
        lesson.revisionNotes.some((n) => !n.trim())
      ) {
        violations.push(`${tag}: needs >= 4 non-empty revisionNotes`);
      }

      if (!lesson.references || lesson.references.length < 2) {
        violations.push(`${tag}: needs >= 2 references`);
      } else {
        for (const ref of lesson.references) {
          if (!ref.url.startsWith("https://")) {
            violations.push(`${tag}: non-https reference URL "${ref.url}"`);
          }
          try {
            new URL(ref.url);
          } catch {
            violations.push(`${tag}: malformed reference URL "${ref.url}"`);
          }
        }
      }

      if (!lesson.assessments || lesson.assessments.length < 3) {
        violations.push(`${tag}: needs >= 3 assessments`);
      } else {
        for (const q of lesson.assessments) {
          violations.push(...validateAssessmentQuestion(q, tag, validSimIds));
        }
      }

      for (const termId of lesson.glossaryTermIds) {
        if (!glossaryIds.has(termId)) {
          violations.push(`${tag}: broken glossaryTermId "${termId}"`);
        }
      }

      for (const conn of lesson.connections) {
        if (!lessonBySlug.has(conn.lessonSlug)) {
          violations.push(`${tag}: broken connection slug "${conn.lessonSlug}"`);
        }
      }

      violations.push(...findPlaceholderMatches(lesson, tag));
    }

    expect(violations).toEqual([]);
  });

  it("ensures every simulatorId in lessons and SIMULATOR_CATALOG resolves to a real component in SIMULATOR_REGISTRY", () => {
    expect(SIMULATOR_CATALOG).toHaveLength(27);
    expect(Object.keys(SIMULATOR_REGISTRY)).toHaveLength(27);

    const errors: string[] = [];

    for (const sim of SIMULATOR_CATALOG) {
      const comp = SIMULATOR_REGISTRY[sim.id];
      if (typeof comp !== "function") {
        errors.push(
          `SIMULATOR_CATALOG entry "${sim.id}" missing component in SIMULATOR_REGISTRY`
        );
      } else {
        const src = comp.toString();
        if (
          src.length < 200 ||
          /placeholder|stub/i.test(comp.name) ||
          /coming\s+soon|under\s+construction|not\s+yet\s+implemented|\bTODO\b|\bTBD\b/i.test(
            src
          )
        ) {
          errors.push(`Simulator component "${sim.id}" looks like a placeholder`);
        }
      }
      for (const slug of sim.lessonSlugs) {
        if (!lessonBySlug.has(slug)) {
          errors.push(
            `SIMULATOR_CATALOG "${sim.id}" references unknown lessonSlug "${slug}"`
          );
        }
      }
    }

    for (const lesson of ALL_LESSONS) {
      if (lesson.simulatorId) {
        const comp = SIMULATOR_REGISTRY[lesson.simulatorId];
        if (typeof comp !== "function") {
          errors.push(
            `Lesson "${lesson.slug}" references unknown simulatorId "${lesson.simulatorId}"`
          );
        }
      }
    }

    expect(errors).toEqual([]);
  });

  it("provides a TrackExam with >= 10 valid questions for every one of the 6 tracks", () => {
    expect(ALL_TRACK_EXAMS).toHaveLength(6);

    const errors: string[] = [];
    for (const track of TRACKS) {
      const exam = ALL_TRACK_EXAMS.find((e) => e.trackId === track.id);
      if (!exam) {
        errors.push(`Missing TrackExam for ${track.id}`);
        continue;
      }
      if (exam.questions.length < 10) {
        errors.push(
          `TrackExam "${exam.id}" has ${exam.questions.length} questions (expected >= 10)`
        );
      }
      for (const q of exam.questions) {
        errors.push(
          ...validateAssessmentQuestion(q, `TrackExam(${exam.id})`, validSimIds)
        );
      }
      errors.push(...findPlaceholderMatches(exam, `TrackExam(${exam.id})`));
    }

    expect(errors).toEqual([]);
  });

  it("provides a Plain-English guide, system interactions, and >= 3 decoded symbols/terms for every lesson", () => {
    const violations: string[] = [];

    for (const lesson of ALL_LESSONS) {
      const guide = PLAIN_ENGLISH_GUIDES[lesson.slug];
      if (!guide) {
        violations.push(`Missing PlainEnglishGuide for "${lesson.slug}"`);
        continue;
      }
      if (!guide.bigPicture?.trim() || guide.bigPicture.trim().length < 80) {
        violations.push(`Short/empty bigPicture for "${lesson.slug}"`);
      }
      if (
        !guide.howItInteracts?.trim() ||
        guide.howItInteracts.trim().length < 60
      ) {
        violations.push(`Short/empty howItInteracts for "${lesson.slug}"`);
      }
      if (!guide.symbolDecoder || guide.symbolDecoder.length < 3) {
        violations.push(
          `PlainEnglishGuide for "${lesson.slug}" needs >= 3 decoded concepts/symbols`
        );
      }
      violations.push(
        ...findPlaceholderMatches(guide, `PlainEnglishGuide(${lesson.slug})`)
      );
    }

    expect(violations).toEqual([]);
  });
});
