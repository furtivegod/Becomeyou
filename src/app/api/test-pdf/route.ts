import { NextRequest, NextResponse } from 'next/server'
import { generatePDF } from '@/lib/pdf'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing PDF generation with sample data...')
    
    // Check if PDFShift API key is available
    if (!process.env.PDFSHIFT_API_KEY) {
      console.error('❌ PDFSHIFT_API_KEY not configured')
      return NextResponse.json({
        success: false,
        error: 'PDFSHIFT_API_KEY not configured',
        message: 'PDF generation service not configured'
      }, { status: 500 })
    }
    
    // Sample plan data for testing
    const samplePlanData = {
      title: "You 3.0 Behavioral Optimization Assessment Report",
      overview: "This is a test assessment to verify PDF generation functionality.",
      assessment_overview: "Based on your responses, you've shown clear patterns of behavior and areas where you're ready for transformation.",
      development_profile: "You demonstrate strong self-awareness and a genuine desire for growth.",
      bottom_line: "You have the capacity for significant growth and transformation.",
      sabotage_analysis: {
        protective_pattern: "You tend to overthink decisions to avoid making mistakes",
        what_its_protecting_from: "Fear of failure and judgment from others",
        how_it_serves_you: "Keeps you safe from potential criticism and disappointment",
        go_to_patterns: "Researching extensively before taking action, seeking multiple opinions",
        success_proof: "You've made good decisions when you trusted your instincts",
        anchor: "Your morning routine of coffee and planning - this is your strongest daily habit"
      },
      in_the_moment_reset: "When you notice the overthinking starting, pause and take 3 deep breaths—in for 4 counts, hold for 4, out for 6. Then ask yourself: 'What's one small thing I can do right now that moves me forward instead of away?'",
      domain_breakdown: {
        mind: {
          current_level: "Foundation level - You have good self-awareness but need to trust your judgment more",
          current_phase: "Friction - You're aware of your patterns but still struggle with overthinking",
          key_strengths: "Strong analytical skills, good self-reflection, and ability to see patterns in your behavior",
          growth_opportunities: "Learning to trust your instincts and make decisions with less analysis"
        },
        body: {
          current_level: "Exploration level - You're beginning to understand your physical needs and responses",
          current_phase: "Experimentation - You're trying new approaches to physical wellness",
          key_strengths: "Good awareness of your body's signals and willingness to try new approaches",
          growth_opportunities: "Building consistent physical practices that support your mental clarity"
        },
        spirit: {
          current_level: "Foundation level - You value relationships but sometimes struggle with boundaries",
          current_phase: "Friction - You know what healthy relationships look like but struggle to implement boundaries",
          key_strengths: "Deep care for others, strong values, and desire for meaningful connections",
          growth_opportunities: "Learning to set boundaries while maintaining connection and authenticity"
        },
        contribution: {
          current_level: "Exploration level - You have skills but need to build confidence in sharing them",
          current_phase: "Experimentation - You're exploring how to share your gifts with the world",
          key_strengths: "Strong skills and knowledge, genuine desire to help others, and good work ethic",
          growth_opportunities: "Building confidence to share your expertise and take on leadership roles"
        }
      },
      nervous_system_assessment: {
        primary_state: "You tend toward overthinking and analysis paralysis, but show good self-regulation when you trust your process",
        regulation_capacity: "Developing - You have the tools but need to practice using them consistently",
        observable_patterns: "Overthinking before decisions, seeking external validation, analysis paralysis on important choices",
        regulation_reality: "You're not broken - you already regulate well in areas where you feel confident. We're expanding where you allow this to happen."
      },
      thirty_day_protocol: {
        seventy_two_hour_suggestion: "Take one small action each day without overthinking it first",
        weekly_recommendation: "Practice making one decision per day based on your first instinct",
        thirty_day_approach: "Build confidence in your decision-making by taking small risks daily",
        environmental_optimization: "Create a decision-making ritual that limits research time to 10 minutes",
        progress_markers: [
          "Notice when you're overthinking and stop yourself",
          "Take action on small decisions without extensive research",
          "Feel more confident in your choices"
        ],
        daily_actions: [
          "Day 1: Make one small decision without researching it first",
          "Day 2: Trust your first instinct on a choice today",
          "Day 3: Notice when you start overthinking and take a breath",
          "Day 4: Make a decision in under 5 minutes",
          "Day 5: Practice saying 'I'll figure it out' instead of researching",
          "Day 6: Take action on something you've been putting off",
          "Day 7: Reflect on decisions you made this week",
          "Day 8: Make a decision that feels slightly uncomfortable",
          "Day 9: Trust your gut on a work-related choice",
          "Day 10: Notice your confidence growing in decision-making",
          "Day 11: Make a decision without asking anyone's opinion",
          "Day 12: Take action on a creative project you've been avoiding",
          "Day 13: Practice making quick decisions throughout the day",
          "Day 14: Reflect on how your decision-making has improved",
          "Day 15: Make a decision that requires you to trust yourself completely"
        ],
        weekly_goals: [
          "Week 1: Make 5 decisions without overthinking them",
          "Week 2: Take action on 3 things you've been avoiding",
          "Week 3: Practice trusting your instincts daily",
          "Week 4: Notice your growing confidence in decision-making"
        ]
      },
      reminder_quote: "Trust yourself - you know more than you think you do",
      development_reminders: [
        "Growth is cyclical; regression is protection, not failure",
        "Integration comes through consistent practice, not more awareness",
        "Your nervous system is the foundation — regulate first, then grow",
        "Your sabotage patterns have wisdom - honor them while updating them",
        "Identity shifts over time with deliberate practice"
      ],
      book_recommendations: [
        "The Confidence Code by Katty Kay and Claire Shipman - Understanding confidence and decision-making",
        "Blink by Malcolm Gladwell - The power of intuitive decision-making",
        "The Paradox of Choice by Barry Schwartz - Why more options don't always mean better decisions"
      ],
      resources: [
        "Daily decision journal to track your choices and outcomes",
        "Timer app to limit research time to 10 minutes per decision",
        "Accountability partner to check in on your progress",
        "Meditation app for practicing mindfulness and reducing overthinking",
        "Decision-making framework template for complex choices"
      ],
      reflection_prompts: [
        "What decision did I make today that I'm proud of?",
        "When did I trust my instincts and it worked out well?",
        "What pattern of overthinking did I notice in myself today?",
        "How did I feel when I made a quick decision?",
        "What would I tell a friend in my situation?"
      ],
      next_assessment: {
        six_month_followup: "6-Month Follow-Up Assessment recommended to track your decision-making confidence and behavioral changes",
        monthly_checkin: "Monthly Check-In Options to track: decision-making confidence, reduced overthinking patterns, increased action-taking, and overall behavioral optimization progress",
        focus_areas: [
          "Building decision-making confidence",
          "Reducing analysis paralysis",
          "Trusting your instincts more",
          "Taking action on delayed projects"
        ],
        stay_connected: "How to Stay Connected: Join our newsletter for ongoing support, access our community forum for peer support, and schedule monthly check-ins to track your progress"
      }
    }

    // Generate PDF with sample data
    console.log('📝 Starting PDF generation...')
    const result = await generatePDF(samplePlanData, 'test-session-123')
    
    console.log('✅ PDF generated successfully!')
    console.log('📄 PDF URL:', result.pdfUrl)
    
    return NextResponse.json({
      success: true,
      message: 'PDF generated successfully with sample data',
      pdfUrl: result.pdfUrl,
      sessionId: 'test-session-123'
    })

  } catch (error) {
    console.error('❌ PDF generation test failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'PDF generation test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}


