import { NextResponse } from 'next/server'
import { LessonPlannerInputSchema, LessonPlannerOutputSchema } from '@/lib/schemas'
import { callAI } from '@/lib/ai'
import fs from 'fs'
import path from 'path'

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

export async function POST(req: Request) {
  try {
    const input = LessonPlannerInputSchema.parse(await req.json())
    console.log(input)

    const lessonPlannerPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'lesson_planner.txt'), 'utf8')
    const renderedLessonPlannerPrompt = lessonPlannerPrompt
      .replace('{{CONCEPT}}', input.concept)
      .replace('{{BACKGROUND}}', input.background)
      .replace('{{GOALS}}', JSON.stringify(input.goals))
      .replace('{{CORE_PRINCIPLES}}', JSON.stringify(input.corePrinciples))

    const lessonPlannerOutput = await callAI(renderedLessonPlannerPrompt, 1024, 0.3)
    console.log(lessonPlannerOutput)
    const lessonPlans = LessonPlannerOutputSchema.parse(JSON.parse(lessonPlannerOutput))

    return NextResponse.json(lessonPlans)
  } catch (error) {
    console.error('Error in lessonPlanner:', error)
    return NextResponse.json({ error: 'An error occurred while generating the lesson plans.' }, { status: 500 })
  }
}