import { NextResponse } from 'next/server'
import { ContentCreatorInputSchema, LessonOutlineSchema } from '@/lib/schemas'
import { callAI, extractTextFromTags } from '@/lib/ai'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const input = ContentCreatorInputSchema.parse(await req.json())

    const lessonOutlinerPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'lesson_outliner.txt'), 'utf8')
    const renderedLessonOutlinerPrompt = lessonOutlinerPrompt
      .replace('{{CONCEPT}}', input.concept)
      .replace('{{BACKGROUND}}', input.background)
      .replace('{{GOALS}}', JSON.stringify(input.goals))
      .replace('{{CORE_PRINCIPLES}}', JSON.stringify(input.core_principles))
      .replace('{{LESSON_PLAN}}', JSON.stringify(input.lesson_plan))

    const lessonOutlinerOutput = await callAI(renderedLessonOutlinerPrompt)
    const lessonOutlineJSON = extractTextFromTags(lessonOutlinerOutput, 'outline')
    const lessonOutline = LessonOutlineSchema.parse(JSON.parse(lessonOutlineJSON))

    return NextResponse.json(lessonOutline)
  } catch (error) {
    console.error('Error in generateLessonOutline:', error)
    return NextResponse.json({ error: 'An error occurred while generating the lesson outline.' }, { status: 500 })
  }
}