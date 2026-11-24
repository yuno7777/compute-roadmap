import type { AssessmentQuestion } from "./assessment";
import type { SimulatorId } from "./simulator";

export type TrackId =
  | "track-1"
  | "track-2"
  | "track-3"
  | "track-4"
  | "track-5"
  | "track-6";

export type DomainId =
  | "math-foundations"
  | "physics-electricity"
  | "semiconductors"
  | "digital-electronics"
  | "information-representation"
  | "computer-architecture"
  | "assembly-machine-code"
  | "memory-storage"
  | "modern-cpu"
  | "operating-systems"
  | "programming-languages"
  | "compilers-interpreters"
  | "data-structures-algorithms"
  | "computer-networking"
  | "databases"
  | "concurrent-distributed"
  | "computer-security"
  | "computer-graphics"
  | "gpu-parallel"
  | "machine-learning"
  | "deep-learning"
  | "modern-ai"
  | "ai-training-inference"
  | "computing-frontiers";

export interface TrackMeta {
  id: TrackId;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  domainIds: DomainId[];
}

export interface DomainMeta {
  id: DomainId;
  order: number;
  title: string;
  description: string;
  trackId: TrackId;
  justInTimeRationale: string;
}

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type LessonStatus = "complete" | "partial" | "planned";

export interface LessonDiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  tone?: "neutral" | "accent" | "emerald" | "amber";
}

export interface LessonDiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface LessonDiagramSpec {
  title: string;
  caption: string;
  nodes: LessonDiagramNode[];
  edges: LessonDiagramEdge[];
}

export interface LessonCodeExample {
  title: string;
  language: string;
  code: string;
  explanation: string;
  output?: string;
}

export interface LessonMisconception {
  myth: string;
  reality: string;
}

export interface LessonReference {
  title: string;
  author: string;
  url: string;
  type: "course" | "book" | "paper" | "spec" | "video" | "docs";
  note: string;
}

export interface LessonMechanismStep {
  step: number;
  title: string;
  detail: string;
  stateNote?: string;
}

export interface LessonMathNote {
  title: string;
  latex: string;
  explanation: string;
}

export interface LessonApplication {
  title: string;
  simplifiedVsReal: string;
  modernExample: string;
}

export interface LessonConnection {
  lessonSlug: string;
  relationship: string;
}

export interface Lesson {
  id: string;
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  trackId: TrackId;
  domainId: DomainId;
  moduleTitle: string;
  chapterTitle: string;
  estimatedMinutes: number;
  difficulty: DifficultyLevel;
  status: LessonStatus;
  prerequisites: string[];
  objectives: string[];
  depthExplanations: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  intuition: string;
  technicalTheory: string;
  mechanisms: LessonMechanismStep[];
  mathNotes?: LessonMathNote[];
  simulatorId?: SimulatorId;
  simulatorPrompt?: string;
  diagram?: LessonDiagramSpec;
  codeExamples: LessonCodeExample[];
  connections: LessonConnection[];
  realWorldApplications: LessonApplication[];
  misconceptions: LessonMisconception[];
  deepDive?: {
    title: string;
    content: string;
  };
  revisionNotes: string[];
  glossaryTermIds: string[];
  references: LessonReference[];
  assessments: AssessmentQuestion[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  domainId: DomainId;
  shortDefinition: string;
  detailedExplanation: string;
  formulaLatex?: string;
  relatedLessonSlugs: string[];
}

export interface TrackExam {
  id: string;
  trackId: TrackId;
  title: string;
  description: string;
  passingScore: number;
  questions: AssessmentQuestion[];
}

export interface CurriculumPlanEntry {
  number: number;
  slug: string;
  title: string;
  trackId: TrackId;
  domainId: DomainId;
  moduleTitle: string;
  chapterTitle: string;
  prerequisites: string[];
  simulatorId?: SimulatorId;
}
