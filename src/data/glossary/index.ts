import type { DomainId, GlossaryTerm } from "@/types/curriculum";
import { TRACK_1_GLOSSARY } from "./track1";
import { TRACK_2_GLOSSARY } from "./track2";
import { TRACK_3_GLOSSARY } from "./track3";
import { TRACK_4_GLOSSARY } from "./track4";
import { TRACK_5_6_GLOSSARY } from "./track56";

export const ALL_GLOSSARY_TERMS: GlossaryTerm[] = [
  ...TRACK_1_GLOSSARY,
  ...TRACK_2_GLOSSARY,
  ...TRACK_3_GLOSSARY,
  ...TRACK_4_GLOSSARY,
  ...TRACK_5_6_GLOSSARY,
].sort((a, b) => a.term.localeCompare(b.term));

export function getGlossaryTermById(id: string): GlossaryTerm | undefined {
  return ALL_GLOSSARY_TERMS.find((term) => term.id === id);
}

export function getGlossaryTermsByDomain(domainId: DomainId): GlossaryTerm[] {
  return ALL_GLOSSARY_TERMS.filter((term) => term.domainId === domainId);
}
