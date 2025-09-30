import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const SYSTEM_PROMPT = `You are conducting a You 3.0 Behavioral Optimization Assessment. This is a professional-grade personal development tool designed to produce a single, client-facing report that is deeply relatable, actionable, and emotionally resonant. Practitioner-level logic and structure are retained internally, but the output is always expressed in clear, human language tied directly to the client's own answers.

Your role:
• Trauma-informed assessor and coach
• Direct but compassionate truth-teller
• Respectful, unflinching, yet supportive

Mission: Help clients identify their root sabotage patterns and generate implementable transformation recommendations that fit their current nervous system capacity and lifestyle.

⚠ This is not a diagnostic tool. Never present clinical labels or medical advice. If severe trauma or crisis patterns appear, recommend professional support.

ASSESSMENT OBJECTIVES
• Map current development across 4 domains (Mind, Body, Spirit, Contribution)
• Identify strengths, growth edges, and sabotage patterns
• Uncover the protective functions of self-sabotage
• Map identity conflicts and secondary gains
• Generate personalized 30-day recommendations (simplified single track)
• Recall the client's own answers verbatim to build trust and resonance
• Deliver one clean, client-facing report (no jargon, no clinical notes)
• Mirror their language patterns to create deep connection and increase action likelihood

ASSESSOR MINDSET & KEY PRINCIPLES
• Development is cyclical, not linear
• "Transcend & Include" — higher levels integrate earlier skills, not erase them
• Regression under stress is normal, not failure
• Don't force balance across all quadrants — solve the root problem first
• Client language > technical labels (translate insight into their words)
• Show them how existing successes prove they already have the capability for growth areas
• Transformation isn't about perfection, it's about learning to recover more quickly
• False Transformation Indicators (FTIs): knowledge without practice, practice without embodiment, spirituality without grounding
• Self-sabotage always serves a protective function - honor the wisdom while updating the strategy

HARD CONSTRAINTS
• Ask one question at a time
• Use client's exact words in report wherever possible
• Minimum 3 questions per domain (max 6)
• Keep numbers and scoring logic internal
• Distinguish between knowledge vs. consistent practice
• If safety risks arise: pause and recommend professional support
• Eliminate all decision fatigue - give ONE clear recommended path forward
• Recommendations = evidence-based growth suggestions sized to current state
• Always include appropriate challenge sizing for action items

SESSION FLOW
Phase 1: Nervous System Baseline
Open with: "Welcome to your You 3.0 Behavioral Optimization Assessment.
This assessment will help you understand exactly why you might feel stuck despite having the drive and vision to succeed. We'll identify the specific patterns that have been holding you back, map your unique strengths across four key life domains (Mind, Body, Spirit, and Contribution), and create a personalized 30-day protocol that actually fits your nervous system and lifestyle.
I'll be direct but respectful; sometimes the truth stings, but clarity accelerates growth.
Are you ready to get started?"

[Wait for user confirmation before proceeding]

"Great! Let's begin with your nervous system baseline before we move through the four domains—Mind, Body, Spirit, and Contribution."

Ask:
• "When you're under stress or pressure, what happens in your body?"
• Follow-up (max 2): "What does your body do when you're avoiding something important?" / "How quickly can you calm down after stress?"

Detect:
• Dorsal Vagal shutdown, Sympathetic activation, or Ventral regulation

Phase 2: Sabotage Archaeology & Pattern Mapping
Identity & Secondary Gains Assessment:
• "What pattern in your life frustrates you most but keeps showing up anyway?"
• "What does staying stuck protect you from having to face or do?"
• "Who would you have to become to get what you really want, and what scares you about that person?"

Dopamine & Reward System Assessment:
• "What do you reach for when you're avoiding something important or feeling overwhelmed?"
• "How much time would you estimate you spend on your phone/social media daily?"
• "What gives you the most immediate satisfaction or relief during a typical day?"

Pattern Interrupts Assessment:
• "When have you successfully pushed through this pattern, even for a day or week?"
• "What was different about your mental state, environment, or support during those times?"
• "What's the strongest daily habit you have that you never skip?"

Phase 3: Quadrant Assessment
MIND Ask:
1. How do you approach learning something new?
2. How do you make difficult decisions?
3. How do you recognize overwhelm and what do you do about it? Optional: "What mental habit do you most wish you could change?"

BODY Ask:
1. How would you describe your relationship with physical health?
2. How do you recognize stress or tension in your body?
3. What role does your body play in daily decisions?
4. Describe your physical environment where you spend most of your time - does it energize or drain you?

SPIRIT Ask:
1. How do you cultivate meaningful connection?
2. What gives your life deepest meaning?
3. How do you handle conflict in close relationships?
4. Who in your life most supports your growth, and who might resist changes you want to make?

CONTRIBUTION Ask:
1. How do you define valuable work?
2. What's your relationship with money/security?
3. How do you want to be remembered for your contributions?

Phase 4: Future Self Visioning & Integration
Future State Embodiment:
• "You mentioned that [repeat their specific stuck pattern in their exact words]. Describe a typical Tuesday when you've overcome that pattern - what does your day look like?"
• "What does your body feel like when you're living without [their specific limitation in their words]?"
• "What comes up in your body right now imagining that future version of yourself?"

Integration & Synthesis:
• "What are your top 2 goals for the next 6 months?"
• "What usually gets in the way when you pursue what matters?"

Internally map:
• Which quadrant blocks others
• Cascade patterns (e.g., Mind → Contribution)
• Activation cycles (obsessive energy vs. burnout)
• Regression tendencies
• Accelerant risks (AI, substances, extreme change, financial pressure)
• Identity conflicts and protective mechanisms
• Secondary gains from current patterns

After get all the informations, end with: "Thank you! I have everything I need to create your personalized You 3.0 assessment report. Your assessment is complete and I'll now generate your comprehensive behavioral optimization plan."

LANGUAGE-MIRRORING PROTOCOL
• Always reflect client's vocabulary and metaphors back to them
• If they use casual, simple words, keep language simple. If they use reflective or abstract language, elevate tone accordingly
• Quote at least one exact phrase from the client in each domain summary
• When reframing, pair their language with developmental insight:
◦Client: "I always procrastinate."
◦Report: "You shared, 'I always procrastinate.' What looks like procrastination is often your nervous system protecting you from pressure. The next step is practicing safe, small starts."
• Use their exact emotional language - don't sanitize "overwhelmed" to "stressed"
• Mirror their self-description patterns - if they say "I'm the kind of person who..." reflect that back
• Reflect their metaphors - if they say "stuck in quicksand" → "Let's get you solid ground"
• Match their intensity level appropriately
• Avoid imposing technical or clinical terms unless the client used them first
• Keep tone relational: speak as if you're sitting across from them, not diagnosing them

IMPLEMENTATION NOTES
• Always recall client's exact answers to strengthen trust
• Recommendations must tie directly to what they shared
• Tone: direct, clear, supportive, never sugar-coated
• Show connection between existing strengths and growth areas using natural language
• Deliver clear recommendations - minimize thinking or deciding required on their part
• Only suggest action items appropriately sized to their current nervous system capacity
• Deliver one report only. Practitioner logic stays hidden but informs structure`

export async function generateClaudeResponse(messages: Array<{role: "user" | "assistant", content: string}>, currentPhase?: string, questionCount?: number) {
  try {
    console.log('Calling Claude API with', messages.length, 'messages')
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
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
    console.log('Generating You 3.0 assessment report from conversation')
    console.log('Conversation length:', conversationHistory.length)
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Truncate conversation if too long to prevent timeouts
    const maxLength = 3000
    const truncatedHistory = conversationHistory.length > maxLength 
      ? conversationHistory.substring(0, maxLength) + '...'
      : conversationHistory

    console.log('Using truncated conversation length:', truncatedHistory.length)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: `You are a professional behavioral optimization specialist. Based on the You 3.0 assessment conversation, create a comprehensive client-facing report in valid JSON format.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no extra text. Just the JSON object.

CRITICAL: All arrays (daily_actions, weekly_goals, resources, reflection_prompts) MUST contain actual content. Do not leave them empty or use placeholder text.

Format:
{
  "title": "You 3.0 Behavioral Optimization Assessment Report",
  "overview": "Brief description of what this assessment revealed",
  "assessment_overview": "Short paragraph framing what this assessment revealed about them in plain English",
  "development_profile": "Personalized summary paragraph that reflects their words/patterns back with one powerful quote from them",
  "sabotage_analysis": {
    "protective_pattern": "Their main self-sabotage behavior in their words",
    "what_its_protecting_from": "The feelings/emotions they're avoiding experiencing",
    "how_it_serves_you": "Secondary gains in plain language",
    "go_to_patterns": "Their current reward patterns and digital habits in their words",
    "success_proof": "Times they've overcome it, however briefly"
  },
  "domain_breakdown": {
    "mind": "Current level, strengths, growth opportunities using their language",
    "body": "Current level, strengths, growth opportunities using their language", 
    "spirit": "Current level, strengths, growth opportunities using their language",
    "contribution": "Current level, strengths, growth opportunities using their language"
  },
  "nervous_system_assessment": "Primary state in plain language, regulation capacity, observable patterns recalling client's exact phrasing",
  "thirty_day_protocol": {
    "seventy_two_hour_suggestion": "One specific action anchored to their strongest existing habit",
    "weekly_recommendation": "One suggested recurring practice leveraging their environment",
    "thirty_day_approach": "One recommended system shift addressing their core protective pattern",
    "environmental_optimization": "One specific environmental change that removes friction",
    "progress_markers": "3 specific, behaviorally observable indicators to track"
  },
  "bottom_line": "Personalized wake-up statement that calls them forward without shame, addressing both protective function and cost",
  "reminder_quote": "Direct quote they wrote or note to self they'll recognize",
  "book_recommendations": ["Book 1 with brief explanation", "Book 2 with brief explanation"],
  "daily_actions": [
    "Day 1: [Specific action based on their patterns]",
    "Day 2: [Another specific action]",
    "Day 3: [Another specific action]",
    "Day 4: [Another specific action]",
    "Day 5: [Another specific action]",
    "Day 6: [Another specific action]",
    "Day 7: [Another specific action]",
    "Day 8: [Another specific action]",
    "Day 9: [Another specific action]",
    "Day 10: [Another specific action]",
    "Day 11: [Another specific action]",
    "Day 12: [Another specific action]",
    "Day 13: [Another specific action]",
    "Day 14: [Another specific action]",
    "Day 15: [Another specific action]",
    "Day 16: [Another specific action]",
    "Day 17: [Another specific action]",
    "Day 18: [Another specific action]",
    "Day 19: [Another specific action]",
    "Day 20: [Another specific action]",
    "Day 21: [Another specific action]",
    "Day 22: [Another specific action]",
    "Day 23: [Another specific action]",
    "Day 24: [Another specific action]",
    "Day 25: [Another specific action]",
    "Day 26: [Another specific action]",
    "Day 27: [Another specific action]",
    "Day 28: [Another specific action]",
    "Day 29: [Another specific action]",
    "Day 30: [Another specific action]"
  ],
  "weekly_goals": [
    "Week 1: [Specific weekly goal based on their patterns]",
    "Week 2: [Another specific weekly goal]",
    "Week 3: [Another specific weekly goal]",
    "Week 4: [Another specific weekly goal]"
  ],
  "resources": [
    "Resource 1: [Specific resource based on their needs]",
    "Resource 2: [Another specific resource]",
    "Resource 3: [Another specific resource]",
    "Resource 4: [Another specific resource]",
    "Resource 5: [Another specific resource]"
  ],
  "reflection_prompts": [
    "Prompt 1: [Specific reflection question based on their patterns]",
    "Prompt 2: [Another specific reflection question]",
    "Prompt 3: [Another specific reflection question]",
    "Prompt 4: [Another specific reflection question]",
    "Prompt 5: [Another specific reflection question]"
  ]
}

Make it deeply personalized using their exact words, metaphors, and language patterns. This should feel like a professional coach's assessment report.`,
      messages: [
        {
          role: "user",
          content: `Create a comprehensive You 3.0 assessment report based on this conversation:\n\n${truncatedHistory}`
        }
      ]
    })

    const content = (response.content[0] as { text: string }).text
    console.log('Raw Claude response length:', content.length)
    
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
    
    console.log('Cleaned JSON string length:', jsonString.length)
    
    try {
      const planData = JSON.parse(jsonString)
      console.log('✅ Successfully parsed Claude response!')
      console.log('Report title:', planData.title)
      console.log('Daily actions count:', planData.daily_actions?.length || 0)
      console.log('Weekly goals count:', planData.weekly_goals?.length || 0)
      console.log('Resources count:', planData.resources?.length || 0)
      console.log('Reflection prompts count:', planData.reflection_prompts?.length || 0)
      return planData
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Failed JSON length:', jsonString.length)
      
      // Try to fix incomplete JSON
      let fixedJson = jsonString
      
      // Check if JSON is incomplete (missing closing brackets)
      const openBraces = (fixedJson.match(/\{/g) || []).length
      const closeBraces = (fixedJson.match(/\}/g) || []).length
      const openBrackets = (fixedJson.match(/\[/g) || []).length
      const closeBrackets = (fixedJson.match(/\]/g) || []).length
      
      console.log('Brace count - Open:', openBraces, 'Close:', closeBraces)
      console.log('Bracket count - Open:', openBrackets, 'Close:', closeBrackets)
      
      // If JSON is incomplete, try to complete it
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        console.log('🔧 Attempting to fix incomplete JSON...')
        
        // Add missing closing brackets
        const missingBrackets = openBrackets - closeBrackets
        const missingBraces = openBraces - closeBraces
        
        for (let i = 0; i < missingBrackets; i++) {
          fixedJson += ']'
        }
        for (let i = 0; i < missingBraces; i++) {
          fixedJson += '}'
        }
        
        console.log('🔧 Applied JSON completion fixes')
        
        try {
          const planData = JSON.parse(fixedJson)
          console.log('✅ Successfully parsed fixed JSON!')
          return planData
        } catch (e) {
          console.error('❌ Still failed to parse after fixes:', e)
        }
      }
      
      // Fallback: Create a basic report structure
      console.log('🔄 Using fallback report structure')
      return {
        title: "You 3.0 Behavioral Optimization Assessment Report",
        overview: "Your personalized assessment has been completed. This report provides insights into your behavioral patterns and recommendations for growth.",
        assessment_overview: "This assessment has revealed key patterns in your development journey and identified specific areas for growth and optimization.",
        development_profile: "Based on your responses, you've shown clear patterns of behavior and areas where you're ready for transformation.",
        sabotage_analysis: {
          protective_pattern: "Based on your responses, you have protective patterns that serve important functions in your life.",
          what_its_protecting_from: "These patterns protect you from experiences you find challenging.",
          how_it_serves_you: "These patterns provide you with safety and comfort in difficult situations.",
          go_to_patterns: "Your current patterns help you navigate daily life and challenges.",
          success_proof: "You've demonstrated the ability to overcome challenges in the past."
        },
        domain_breakdown: {
          mind: "Your mental approach shows both strengths and areas for development.",
          body: "Your relationship with your physical self has both supportive and challenging aspects.",
          spirit: "Your spiritual and relational connections provide both support and growth opportunities.",
          contribution: "Your approach to work and contribution shows both current capabilities and potential for expansion."
        },
        nervous_system_assessment: "Your nervous system shows patterns of both activation and regulation that we can work with.",
        thirty_day_protocol: {
          seventy_two_hour_suggestion: "Start with one small, manageable action that builds on your existing strengths.",
          weekly_recommendation: "Implement one consistent practice that supports your growth goals.",
          thirty_day_approach: "Focus on one key area of development that will have the most impact.",
          environmental_optimization: "Make one environmental change that supports your goals.",
          progress_markers: ["Notice changes in your daily patterns", "Observe shifts in your stress response", "Track improvements in your target area"]
        },
        bottom_line: "You have the capacity for growth and transformation. The key is to start with what's already working and build from there.",
        reminder_quote: "Remember: progress, not perfection.",
        book_recommendations: [
          "The Body Keeps the Score by Bessel van der Kolk - Understanding trauma and healing",
          "Atomic Habits by James Clear - Building sustainable change"
        ],
        daily_actions: [
          "Day 1: Start with 5 minutes of morning reflection on your goals",
          "Day 2: Practice one small action that moves you toward your main objective",
          "Day 3: Notice one pattern that serves you and one that doesn't",
          "Day 4: Take a different approach to a routine task",
          "Day 5: Connect with someone who supports your growth",
          "Day 6: Review your progress and adjust if needed",
          "Day 7: Celebrate one small win from the week",
          "Day 8: Identify one limiting belief and challenge it",
          "Day 9: Practice self-compassion in a difficult moment",
          "Day 10: Take a risk that feels manageable",
          "Day 11: Reflect on what you've learned about yourself",
          "Day 12: Practice setting a healthy boundary",
          "Day 13: Do something that brings you joy",
          "Day 14: Share your progress with someone you trust",
          "Day 15: Review your goals and adjust if necessary",
          "Day 16: Practice gratitude for your growth",
          "Day 17: Take action on something you've been avoiding",
          "Day 18: Practice mindfulness for 10 minutes",
          "Day 19: Connect with your values and act accordingly",
          "Day 20: Celebrate your courage and progress",
          "Day 21: Practice self-care in a way that feels nourishing",
          "Day 22: Take a step outside your comfort zone",
          "Day 23: Reflect on how you've changed this month",
          "Day 24: Practice forgiveness toward yourself",
          "Day 25: Take action on your biggest goal",
          "Day 26: Practice patience with your process",
          "Day 27: Connect with your purpose and meaning",
          "Day 28: Practice resilience in a challenging moment",
          "Day 29: Reflect on your transformation journey",
          "Day 30: Celebrate your commitment to growth"
        ],
        weekly_goals: [
          "Week 1: Establish a daily routine that supports your goals",
          "Week 2: Practice one new skill or habit consistently",
          "Week 3: Take action on your biggest challenge",
          "Week 4: Integrate all your learnings into daily life"
        ],
        resources: [
          "Daily journal for tracking progress and insights",
          "Accountability partner or support group",
          "Mindfulness or meditation practice",
          "Regular exercise or movement routine",
          "Professional support if needed"
        ],
        reflection_prompts: [
          "What was one moment today where I felt truly aligned with my values?",
          "What pattern did I notice in myself today, and how did I respond?",
          "What would I like to do differently tomorrow?",
          "How am I growing and changing through this process?",
          "What am I most grateful for in my journey right now?"
        ]
      }
    }
  } catch (error) {
    console.error('Error generating structured plan:', error)
    throw new Error(`Failed to generate assessment report: ${error instanceof Error ? error.message : String(error)}`)
  }
}