import { z } from 'zod'

export const UserInputSchema = z.object({
  concept: z.string().min(1, "Concept is required"),
  background: z.string().min(1, "Background is required"),
  goals: z.array(z.string()).min(1, "At least one goal is required")
})

export const CorePrincipleSchema = z.object({
  sequence_number: z.number().int().positive(),
  principle: z.string(),
  brief_explanation: z.string(),
  learning_objectives: z.array(z.string())
})

export const CurriculumPlannerOutputSchema = z.object({
  introduction: z.string(),
  principles: z.array(CorePrincipleSchema)
})

export const LessonPlannerInputSchema = z.object({
  concept: z.string(),
  background: z.string(),
  goals: z.array(z.string()),
  corePrinciples: CurriculumPlannerOutputSchema
})

export const LessonPlanSchema = z.object({
  lesson_number: z.number().int().positive(),
  lesson_name: z.string(),
  principles_covered: z.array(z.number().int().positive()),
  lesson_objectives: z.string()
})

export const LessonPlannerOutputSchema = z.object({
  lesson_plans: z.array(LessonPlanSchema)
})

export const ArtifactSchema = z.object({
  type: z.string(),
  name: z.string(),
  figure_number: z.number().int().positive(),
  version: z.number().int().positive(),
  description: z.string(),
  learning_outcomes: z.array(z.string())
})

export const LessonOutlineSchema = z.object({
  lesson_number: z.number().int().positive(),
  lesson_name: z.string(),
  content: z.string(),
  artifacts: z.array(ArtifactSchema)
})

export const ContentCreatorInputSchema = z.object({
  concept: z.string(),
  background: z.string(),
  goals: z.array(z.string()),
  core_principles: CurriculumPlannerOutputSchema,
  lesson_plan: LessonPlanSchema,
  lesson_outline: LessonOutlineSchema,
  artifact_name: z.string()
})

export const ContentCreatorOutputSchema = z.object({
  content: z.string()
})