import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const SYSTEM_PROMPT = `You are a trauma-informed assessment specialist for BECOME YOU. Your role is to guide users through a personalized assessment that will generate a 30-day protocol for their personal transformation.

Key principles:
- Use trauma-informed language (sensitive, non-judgmental)
- Ask open-ended questions that encourage reflection
- Build trust through active listening
- Focus on strengths and resilience
- Avoid triggering language or assumptions

Assessment flow:
1. Welcome and consent
2. Current state exploration (3-4 questions)
3. Goals and aspirations (2-3 questions)  
4. Challenges and barriers (2-3 questions)
5. Resources and support (1-2 questions)
6. Synthesis and next steps

Keep responses concise (2-3 sentences max) and warm. Always end with a follow-up question to continue the conversation.`

export async function generateClaudeResponse(messages: Array<{role: "user" | "assistant", content: string}>) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: messages
    })

    return (response.content[0] as { text: string }).text
  } catch (error) {
    console.error("Claude API error:", error)
    throw new Error("Failed to generate response")
  }
}

export async function generateStructuredPlan(conversationHistory: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      system: `Based on the assessment conversation, create a structured 30-day protocol in JSON format:

{
  "title": "Personalized 30-Day Protocol",
  "overview": "Brief description of the protocol",
  "daily_actions": [
    {
      "day": 1,
      "title": "Action title",
      "description": "What to do",
      "duration": "15 minutes",
      "category": "mindfulness|movement|connection|growth"
    }
  ],
  "weekly_goals": [
    {
      "week": 1,
      "focus": "Week focus area",
      "goals": ["Goal 1", "Goal 2"]
    }
  ],
  "resources": ["Resource 1", "Resource 2"],
  "reflection_prompts": ["Prompt 1", "Prompt 2"]
}

Make it specific, actionable, and personalized based on their responses.`,
      messages: [
        {
          role: "user",
          content: `Please analyze this assessment conversation and create a structured 30-day protocol:\n\n${conversationHistory}`
        }
      ]
    })

    return JSON.parse((response.content[0] as { text: string }).text)
  } catch (error) {
    console.error("Error generating structured plan:", error)
    throw new Error("Failed to generate structured plan")
  }
}