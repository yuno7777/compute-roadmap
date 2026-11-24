import type { TrackExam, TrackId } from "@/types/curriculum";
import { TRACK_1_EXAM } from "./track1";
import { TRACK_2_EXAM } from "./track2";
import { TRACK_3_EXAM } from "./track3";
import { TRACK_4_EXAM } from "./track4";
import { TRACK_5_EXAM, TRACK_6_EXAM } from "./track56";

export const ALL_TRACK_EXAMS: TrackExam[] = [
  TRACK_1_EXAM,
  TRACK_2_EXAM,
  TRACK_3_EXAM,
  TRACK_4_EXAM,
  TRACK_5_EXAM,
  TRACK_6_EXAM,
];

export function getTrackExamByTrackId(trackId: TrackId): TrackExam | undefined {
  return ALL_TRACK_EXAMS.find((exam) => exam.trackId === trackId);
}
