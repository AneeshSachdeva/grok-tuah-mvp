import { NextResponse } from 'next/server'
import { UserInputSchema, CurriculumPlannerOutputSchema } from '@/lib/schemas'
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
    
    const introduction = extractTextFromTags(curriculumPlannerOutput, 'introduction')
    const corePrinciplesJSON = extractTextFromTags(curriculumPlannerOutput, 'core_principles')

    const corePrinciples = CurriculumPlannerOutputSchema.parse({
      introduction,
      principles: JSON.parse(corePrinciplesJSON).principles
    })

    return NextResponse.json(corePrinciples)
  } catch (error) {
    console.error('Error in curriculumPlanner:', error)
    return NextResponse.json({ error: 'An error occurred while generating the curriculum.' }, { status: 500 })
  }
}