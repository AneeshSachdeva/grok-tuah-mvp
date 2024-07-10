export type Principle = {
  sequence_number: number;
  principle: string;
  brief_explanation: string;
  learning_objectives: string[];
}

export type CorePrinciples = {
  introduction: string;
  principles: Principle[];
}

export type LessonPlan = {
  lesson_number: number;
  lesson_name: string;
  principles_covered: number[];
  lesson_objectives: string;
}

export type LessonPlans = {
  lesson_plans: LessonPlan[];
}

export type Artifact = {
  type: string;
  name: string;
  figure_number: number;
  version: number;
  description: string;
  learning_outcomes: string[];
}

export type LessonOutline = {
  lesson_number: number;
  lesson_name: string;
  content: string;
  artifacts: Artifact[];
}

export type Grok = {
  id: string;
  concept: string;
  background: string;
  goals: string[];
  corePrinciples: CorePrinciples | null;
  lessonPlans: LessonPlans | null;
  lessonOutlines: Record<number, LessonOutline | null>;
  parentGrokId: string | null;
}