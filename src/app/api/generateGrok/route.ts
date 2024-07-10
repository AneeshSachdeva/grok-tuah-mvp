import { NextResponse } from 'next/server'
import { UserInputSchema, CurriculumPlannerOutputSchema, LessonPlannerOutputSchema } from '@/lib/schemas'
import { callAI, extractTextFromTags } from '@/lib/ai'
import { createGrok } from '@/lib/storage'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const userInput = UserInputSchema.parse(await req.json())

    const curriculumPlannerPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'curriculum_planner.txt'), 'utf8')
    const renderedCurriculumPlannerPrompt = curriculumPlannerPrompt
      .replace('{{CONCEPT}}', userInput.concept)
      .replace('{{BACKGROUND}}', userInput.background)
      .replace('{{GOALS}}', JSON.stringify(userInput.goals))

    const curriculumPlannerOutput = await callAI(renderedCurriculumPlannerPrompt, 2048, 0.3)
    
    const introduction = extractTextFromTags(curriculumPlannerOutput, 'introduction')
    const corePrinciplesJSON = extractTextFromTags(curriculumPlannerOutput, 'core_principles')

    const corePrinciples = CurriculumPlannerOutputSchema.parse({
      introduction,
      principles: JSON.parse(corePrinciplesJSON).principles
    })

    const lessonPlannerPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'lesson_planner.txt'), 'utf8')
    const renderedLessonPlannerPrompt = lessonPlannerPrompt
      .replace('{{CONCEPT}}', userInput.concept)
      .replace('{{BACKGROUND}}', userInput.background)
      .replace('{{GOALS}}', JSON.stringify(userInput.goals))
      .replace('{{CORE_PRINCIPLES}}', JSON.stringify(corePrinciples))

    const lessonPlannerOutput = await callAI(renderedLessonPlannerPrompt, 1024, 0.3)
    const lessonPlans = LessonPlannerOutputSchema.parse(JSON.parse(lessonPlannerOutput))

    const grokId = `root_${Date.now()}`
    const newGrok = {
      id: grokId,
      concept: userInput.concept,
      background: userInput.background,
      goals: userInput.goals,
      corePrinciples,
      lessonPlans,
      lessonOutlines: {},
      parentGrokId: null,
    }

    createGrok(newGrok)

    return NextResponse.json({ id: grokId, ...newGrok })
  } catch (error) {
    console.error('Error in generateGrok:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'An error occurred while generating the Grok.', details: errorMessage }, { status: 500 })
  }
}