import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const SYSTEM_PROMPT = `You are a trauma-informed assessment specialist for BECOME YOU. Your role is to guide users through a quick, focused assessment that will generate a 30-day protocol.

Key principles:
- Keep responses to exactly 3 sentences maximum
- Ask only 1 short, direct question per response
- Use warm, supportive language
- Focus on key insights only

Assessment flow (5 questions total):
1. Welcome: "Welcome! I'm here to help you create your personalized 30-day transformation plan. What's one area of your life you'd most like to improve right now?"
2. Current state: Ask about their current situation (1 question)
3. Goals: Ask about their main goal (1 question)  
4. Challenges: Ask about their biggest obstacle (1 question)
5. Resources: Ask about their support system (1 question)
6. Completion: "Thank you! I have everything I need to create your personalized 30-day protocol. Your assessment is complete and I'll now generate your customized plan."

After the 5th question, always end with the completion message above. Keep everything brief and focused.`

export async function generateClaudeResponse(messages: Array<{role: "user" | "assistant", content: string}>) {
  try {
    console.log('Calling Claude API with', messages.length, 'messages')
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: messages
    })

    const content = (response.content[0] as { text: string }).text
    console.log('Claude response received:', content.substring(0, 100) + '...')
    return content
  } catch (error) {
    console.error("Claude API error:", error)
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function generateStructuredPlan(conversationHistory: string) {
  try {
    console.log('Generating structured plan from conversation')
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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

    const content = (response.content[0] as { text: string }).text
    console.log('Structured plan generated')
    return JSON.parse(content)
  } catch (error) {
    console.error("Error generating structured plan:", error)
    throw new Error(`Failed to generate structured plan: ${error instanceof Error ? error.message : String(error)}`)
  }
}