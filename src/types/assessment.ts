import type { SimulatorId } from "./simulator";

export type AssessmentQuestionType =
  | "mcq"
  | "multi-select"
  | "true-false"
  | "fill-blank"
  | "ordering"
  | "matching"
  | "predict-output"
  | "debugging"
  | "math"
  | "simulation-challenge";

export interface AssessmentOption {
  id: string;
  text: string;
  explanation: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  difficulty: "foundational" | "intermediate" | "rigorous";
  prompt: string;
  codeSnippet?: string;
  codeLanguage?: string;
  latex?: string;
  options?: AssessmentOption[];
  correctAnswer: string | string[] | boolean | number | Record<string, string>;
  acceptableAnswers?: string[];
  numericTolerance?: number;
  orderingItems?: string[];
  matchingPairs?: MatchingPair[];
  simulatorId?: SimulatorId;
  challengeGoal?: string;
  hints: string[];
  explanation: string;
  conceptTag: string;
}
