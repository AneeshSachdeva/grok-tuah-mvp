import { NextResponse } from 'next/server'
import { UserInputSchema, CurriculumPlannerOutputSchema, LessonPlannerOutputSchema } from '@/lib/schemas'
import { callAI, extractTextFromTags } from '@/lib/ai'
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
    console.log("Curriculum Planner Output:", curriculumPlannerOutput)

    const corePrinciplesJSON = extractTextFromTags(curriculumPlannerOutput, 'core_principles')
    console.log("Extracted Core Principles JSON:", corePrinciplesJSON)

    if (!corePrinciplesJSON) {
      throw new Error("Failed to extract core principles from AI output")
    }

    let corePrinciples
    try {
      corePrinciples = CurriculumPlannerOutputSchema.parse(JSON.parse(corePrinciplesJSON))
    } catch (error) {
      console.error("Error parsing core principles JSON:", error)
      throw new Error("Invalid core principles JSON")
    }

    const lessonPlannerPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'lesson_planner.txt'), 'utf8')
    const renderedLessonPlannerPrompt = lessonPlannerPrompt
      .replace('{{CONCEPT}}', userInput.concept)
      .replace('{{BACKGROUND}}', userInput.background)
      .replace('{{GOALS}}', JSON.stringify(userInput.goals))
      .replace('{{CORE_PRINCIPLES}}', JSON.stringify(corePrinciples))

    const lessonPlannerOutput = await callAI(renderedLessonPlannerPrompt, 1024, 0.3)
    console.log("Lesson Planner Output:", lessonPlannerOutput)

    let lessonPlans
    try {
      lessonPlans = LessonPlannerOutputSchema.parse(JSON.parse(lessonPlannerOutput))
    } catch (error) {
      console.error("Error parsing lesson plans JSON:", error)
      throw new Error("Invalid lesson plans JSON")
    }

    return NextResponse.json({ corePrinciples, lessonPlans })
  } catch (error) {
    console.error('Error in generateGrok:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'An error occurred while generating the Grok.', details: errorMessage }, { status: 500 })
  }
}