import { TRACK_1_2_PLAIN_GUIDES, type DecodedConcept, type PlainEnglishGuide } from "./track12";
import { TRACK_3_4_PLAIN_GUIDES } from "./track34";
import { TRACK_5_6_PLAIN_GUIDES } from "./track56";

export type { DecodedConcept, PlainEnglishGuide };

export const PLAIN_ENGLISH_GUIDES: Record<string, PlainEnglishGuide> = {
  ...TRACK_1_2_PLAIN_GUIDES,
  ...TRACK_3_4_PLAIN_GUIDES,
  ...TRACK_5_6_PLAIN_GUIDES,
};

export function getPlainEnglishGuide(slug: string): PlainEnglishGuide | undefined {
  return PLAIN_ENGLISH_GUIDES[slug];
}
