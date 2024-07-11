import { NextResponse } from 'next/server'
import { LessonOutlineSchema, ArtifactSchema } from '@/lib/schemas'
import { callAI, extractTextFromTags } from '@/lib/ai'
import fs from 'fs'
import path from 'path'

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

function extractArtifacts(content: string) {
  console.log("Attempting to extract artifacts from content");

  const artifactRegex = /<artifact>([\s\S]*?)<\/artifact>/g;
  const matches = content.matchAll(artifactRegex);

  const artifacts = [];

  let match;
  while ((match = artifactRegex.exec(content)) !== null) {
    const artifactContent = match[1];
    try {
      const artifact = JSON.parse(artifactContent);
      const validatedArtifact = ArtifactSchema.parse(artifact);
      artifacts.push(validatedArtifact);
    } catch (error) {
      console.error('Error parsing artifact:', error);
    }
  }

  console.log(`Successfully extracted ${artifacts.length} artifacts`);
  return artifacts;
}

export async function POST(req: Request) {
  try {
    const input = await req.json();

    const lessonOutlinerPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'lesson_outliner.txt'), 'utf8')
    const renderedLessonOutlinerPrompt = lessonOutlinerPrompt
      .replace('{{CONCEPT}}', input.concept)
      .replace('{{BACKGROUND}}', input.background)
      .replace('{{GOALS}}', JSON.stringify(input.goals))
      .replace('{{CORE_PRINCIPLES}}', JSON.stringify(input.core_principles))
      .replace('{{LESSON_PLAN}}', JSON.stringify(input.lesson_plan))

    const lessonOutlinerOutput = await callAI(renderedLessonOutlinerPrompt, 4000, 0.3)
    let content = extractTextFromTags(lessonOutlinerOutput, 'outline')
    if (content.startsWith('```') && content.endsWith('```')) {
      const lines = content.split('\n');
      content = lines.slice(1, -1).join('\n');
    }

    console.log("Extracted content:", content);

    // Extract artifacts from the content
    const artifacts = extractArtifacts(content);

    console.log("Extracted artifacts:", JSON.stringify(artifacts, null, 2));

    // Generate content for interactive text artifacts
    const interactiveTextArtifacts = artifacts.filter(artifact => 
      ['markdown_explanation', 'guided_walkthrough', 'conceptual_qa'].includes(artifact.type)
    );

    const contentCreatorPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', 'content_creators', 'interactive_text.txt'), 'utf8')
  
    const artifactContents = [];
    for (const artifact of interactiveTextArtifacts) {
      console.log(`Rendering artifact:\n${JSON.stringify(artifact, null, 2)}`);
      const renderedPrompt = contentCreatorPrompt
        .replace('{{CONCEPT}}', input.concept)
        .replace('{{BACKGROUND}}', input.background)
        .replace('{{GOALS}}', JSON.stringify(input.goals))
        .replace('{{CORE_PRINCIPLES}}', JSON.stringify(input.core_principles))
        .replace('{{LESSON_PLAN}}', JSON.stringify(input.lesson_plan))
        .replace('{{LESSON_OUTLINE}}', content)
        .replace('{{ARTIFACT}}', JSON.stringify(artifact))

      const artifactContent = await callAI(renderedPrompt, 4000, 0.3)
      artifactContents.push({ name: artifact.name, content: extractTextFromTags(artifactContent, 'content') });
    }

    // Replace artifact placeholders with generated content
    artifactContents.forEach(({ name, content: artifactContent }) => {
      const artifactRegex = new RegExp(`<artifact>[\\s\\S]*?"name"\\s*:\\s*"${name}"[\\s\\S]*?<\\/artifact>`, 'g')
      content = content.replace(artifactRegex, artifactContent)
    })

    // Construct the lesson outline object
    const lessonOutline = LessonOutlineSchema.parse({
      lesson_number: input.lesson_plan.lesson_number,
      lesson_name: input.lesson_plan.lesson_name,
      content: content,
      artifacts: artifacts
    });

    return NextResponse.json(lessonOutline)
  } catch (error) {
    console.error('Error in generateLesson:', error)
    return NextResponse.json({ error: 'An error occurred while generating the lesson outline.' }, { status: 500 })
  }
}