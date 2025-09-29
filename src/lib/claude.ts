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
      max_tokens: 100,
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
    console.log('Conversation length:', conversationHistory.length)
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Truncate conversation if too long to prevent timeouts
    const maxLength = 2000
    const truncatedHistory = conversationHistory.length > maxLength 
      ? conversationHistory.substring(0, maxLength) + '...'
      : conversationHistory

    console.log('Using truncated conversation length:', truncatedHistory.length)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a personal development expert. Based on the assessment conversation, create a structured 30-day protocol in valid JSON format.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no extra text. Just the JSON object.

Format:
{
  "title": "Personalized 30-Day Protocol Title",
  "overview": "Brief description of the protocol",
  "daily_actions": [
    {
      "day": 1,
      "title": "Action title",
      "description": "What to do",
      "duration": "15 minutes",
      "category": "mindfulness"
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

Make it specific and personalized based on their responses.`,
      messages: [
        {
          role: "user",
          content: `Create a personalized 30-day protocol based on this assessment conversation:\n\n${truncatedHistory}`
        }
      ]
    })

    const content = (response.content[0] as { text: string }).text
    console.log('Raw Claude response:', content)
    
    // Clean the response to extract JSON
    let jsonString = content.trim()
    
    // Remove any markdown code blocks
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    // Try to find the JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }
    
    console.log('Cleaned JSON string:', jsonString.substring(0, 200) + '...')
    
    try {
      const planData = JSON.parse(jsonString)
      console.log('✅ Successfully parsed Claude response!')
      console.log('Plan title:', planData.title)
      console.log('Daily actions count:', planData.daily_actions?.length || 0)
      return planData
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Failed JSON:', jsonString)
      
      // Try to fix common JSON issues
      let fixedJson = jsonString
      
      // Fix trailing commas
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1')
      
      // Fix missing quotes around keys
      fixedJson = fixedJson.replace(/(\w+):/g, '"$1":')
      
      // Try parsing the fixed version
      try {
        const planData = JSON.parse(fixedJson)
        console.log('✅ Successfully parsed fixed JSON!')
        return planData
      } catch (secondError) {
        console.error('❌ Still failed after fixes:', secondError)
        
        // Return a personalized fallback based on conversation content
        const hasEnglish = conversationHistory.toLowerCase().includes('english')
        const hasConfidence = conversationHistory.toLowerCase().includes('confidence') || conversationHistory.toLowerCase().includes('shy')
        const hasWork = conversationHistory.toLowerCase().includes('work') || conversationHistory.toLowerCase().includes('career')
        
        let personalizedTitle = "Your Personalized 30-Day Protocol"
        let personalizedOverview = "Based on your assessment, here's your customized transformation plan."
        let dailyActions = [
          {
            day: 1,
            title: "Morning Reflection",
            description: "Start your day with 5 minutes of mindful breathing and intention setting.",
            duration: "5 minutes",
            category: "mindfulness"
          }
        ]
        
        if (hasEnglish) {
          personalizedTitle = "30-Day English Confidence Builder"
          personalizedOverview = "A structured program to build your English conversation skills and overcome shyness."
          dailyActions = [
            {
              day: 1,
              title: "Daily English Practice",
              description: "Spend 15 minutes practicing English conversation with online resources.",
              duration: "15 minutes",
              category: "growth"
            },
            {
              day: 2,
              title: "Vocabulary Building",
              description: "Learn 5 new English words and use them in sentences.",
              duration: "10 minutes",
              category: "growth"
            }
          ]
        } else if (hasWork) {
          personalizedTitle = "30-Day Career Development Plan"
          personalizedOverview = "A focused approach to advancing your career and professional skills."
          dailyActions = [
            {
              day: 1,
              title: "Skill Development",
              description: "Spend 20 minutes learning a new professional skill.",
              duration: "20 minutes",
              category: "growth"
            }
          ]
        }
        
        return {
          title: personalizedTitle,
          overview: personalizedOverview,
          daily_actions: dailyActions,
          weekly_goals: [
            {
              week: 1,
              focus: "Foundation Building",
              goals: ["Establish daily routine", "Practice consistency"]
            }
          ],
          resources: ["Daily journal", "Meditation app", "Support group"],
          reflection_prompts: ["What went well today?", "What can I improve tomorrow?"]
        }
      }
    }
  } catch (error) {
    console.error("Error generating structured plan:", error)
    throw new Error(`Failed to generate structured plan: ${error instanceof Error ? error.message : String(error)}`)
  }
}