import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function callAI(prompt: string, maxTokens: number = 1024, temperature: number = 0.7): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: maxTokens,
    temperature: temperature,
    messages: [{ role: "user", content: prompt }],
  })
  return response.content[0].text
}

export function extractTextFromTags(content: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}