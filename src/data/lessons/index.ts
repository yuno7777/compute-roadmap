import type { DomainId, Lesson, TrackId } from "@/types/curriculum";
import { TRACK_1_LESSONS } from "./track1";
import { TRACK_2_LESSONS } from "./track2";
import { TRACK_3_LESSONS } from "./track3";
import { TRACK_4_LESSONS } from "./track4";
import { TRACK_5_6_LESSONS } from "./track56";

export const ALL_LESSONS: Lesson[] = [
  ...TRACK_1_LESSONS,
  ...TRACK_2_LESSONS,
  ...TRACK_3_LESSONS,
  ...TRACK_4_LESSONS,
  ...TRACK_5_6_LESSONS,
].sort((a, b) => a.number - b.number);

export function getLessonBySlug(slug: string): Lesson | undefined {
  return ALL_LESSONS.find((lesson) => lesson.slug === slug);
}

export function getLessonsByDomain(domainId: DomainId): Lesson[] {
  return ALL_LESSONS.filter((lesson) => lesson.domainId === domainId).sort(
    (a, b) => a.number - b.number
  );
}

export function getLessonsByTrack(trackId: TrackId): Lesson[] {
  return ALL_LESSONS.filter((lesson) => lesson.trackId === trackId).sort(
    (a, b) => a.number - b.number
  );
}
