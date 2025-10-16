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
      overview: "This assessment revealed a pattern of using exhaustion and sleep as protective mechanisms against the demands of stepping into your vision of becoming a successful businessman, while simultaneously demonstrating that when you're engaged and winning, that exhaustion completely disappears.",
      assessment_overview: "You've been carrying a strategy that once gave you permission to rest, but now keeps you from building what you actually want. Today you've uncovered not just the exhaustion pattern, but why it exists—it protects you from having to give up the freedom to play games and football, and from facing the belief that you 'don't have talent.' The good news? You already have proof you can maintain high engagement and energy when something matters to you. That week of winning at games showed you exactly what your nervous system is capable of when it's genuinely activated.",
      development_profile: "Your nervous system shows remarkable resilience—you can regulate from stress in just a few minutes, which is a genuine strength most people don't have. But you've discovered something about yourself: when the path ahead requires you to become someone who gives up spontaneous freedom (playing football, gaming whenever you want), your body responds with deep exhaustion and you reach for sleep as an escape hatch. You said it yourself: 'I wanna be a success business man, but I don't have talent.' That sentence is doing a lot of work for you—it's giving you permission to stay exactly where you are. But here's what's also true: when you're winning at games, everything changes. Your mental state sharpens, your environment feels different, your exhaustion vanishes. You don't lack capacity. You lack a compelling enough reason to trade your current freedom for disciplined action.",
      bottom_line: "You have the foundation and potential for significant transformation—the key is working with your nervous system rather than against it.",
      sabotage_analysis: {
        protective_pattern: "Reaching for sleep and experiencing deep exhaustion when facing important tasks or decisions, speaking without deep thinking first. This pattern shows up most when you're confronting the gap between who you are and who you'd need to become to build the business success you want. When you notice it starting, you'll likely feel the weight of having to give up your spontaneous freedom first—that's your early warning signal. The faster you catch it, the faster you can choose differently.",
        what_its_protecting_from: "The fear of discovering you might actually lack the talent you need, the loss of freedom to play games and football whenever you want, the vulnerability of fully committing and potentially failing, and the identity shift required to become a disciplined businessman",
        how_it_serves_you: "Sleep and exhaustion give you a socially acceptable reason to avoid the hard work of business building without having to admit you're choosing comfort over growth. The 'I don't have talent' belief lets you off the hook from even trying fully. Your face turning red under pressure creates a visible reason to avoid high-stakes situations. Speaking without thinking keeps interactions surface-level so you don't have to be vulnerable or accountable.",
        go_to_patterns: "Three hours of sleep during the day, playing computer games for extended periods (at least a week-long stretches when winning), playing football, speaking reactively without processing thoughts first",
        success_proof: "That week when you were winning at computer games—you stayed completely engaged, alert, energized. No exhaustion. No need to escape. Your mental state, environment, and support system all aligned and you showed up fully. You already know what full engagement feels like.",
        anchor: "Singing songs—this is your unbreakable habit, the one you show up for even when everything else falls apart"
      },
      goals: {
        business_goal: "Become a successful businessman by leveraging your fast learning abilities and transferring your gaming 'winning state' to business actions",
        relationship_goal: "Build a support system for business growth while learning to navigate conflict directly rather than avoiding it",
        body_goal: "Use your body's early warning signals (face flushing, exhaustion) to interrupt escape patterns and redirect energy toward business learning"
      },
      future_vision: "A Tuesday where you wake up after singing, complete your business learning action, and feel the same 'winning' energy you get from games—but now it's directed toward building your business. You've reduced your escape sleep to 1.5 hours, you catch your exhaustion signals early, and you're accumulating proof that you're a fast learner who can succeed in business.",
      in_the_moment_reset: "When you notice the exhaustion starting to creep in or the pull toward sleep in the middle of the day, pause and take 3 deep breaths—in for 4 counts, hold for 4, out for 6. Then sing one verse of a song (your anchor habit). Then ask yourself: 'If I were winning right now, what would I do next?' It won't stop the exhaustion pattern completely at first, but it creates the gap where choice becomes possible and reconnects you to that winning-mode energy you've already experienced.",
      domain_breakdown: {
        mind: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Quick stress regulation (few minutes recovery time), ability to maintain laser focus and mental sharpness when genuinely engaged (demonstrated during gaming wins), natural self-awareness about your patterns (you recognize the exhaustion and reactive speaking)",
          growth_opportunities: "Building the capacity to think before speaking, developing a compelling vision that rivals the immediate gratification of games, creating systems that protect your focus from impulse decisions, learning to recognize exhaustion as a choice rather than a condition"
        },
        body: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Naturally quick nervous system regulation, visible stress signals (face redness) that give you early warning, ability to sustain energy during high engagement activities, consistent daily movement through singing",
          growth_opportunities: "Understanding why your body generates deep exhaustion as a protective response, building sustainable energy management that doesn't require 3 hours of daytime sleep, developing physical practices beyond singing that anchor you when stress hits, learning to use your visible stress response (face redness) as data rather than something to avoid"
        },
        spirit: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Music as a spiritual practice and emotional outlet (singing songs daily), awareness of what freedom means to you (games, football), natural connection to joy and play, ability to experience flow states when winning",
          growth_opportunities: "Defining what success means beyond external validation, connecting to a purpose bigger than personal achievement, exploring what 'talent' actually means versus the story you're telling yourself, finding spiritual practices that ground you beyond entertainment and escape"
        },
        contribution: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Clear vision of wanting to be a successful businessman, awareness that your current patterns aren't serving your goals, capacity for sustained engagement when motivated, willingness to examine your protective patterns honestly",
          growth_opportunities: "Translating business vision into concrete daily actions, building proof of competence that challenges the 'no talent' belief, creating structure that doesn't feel like prison, developing the discipline to delay gratification while maintaining joy"
        }
      },
      nervous_system_assessment: {
        primary_state: "Your baseline state oscillates between hyperarousal when under pressure (face becoming red, speaking without thinking) and hypoarousal when avoiding important tasks (deep exhaustion, sleeping 3 hours during the day). You can regulate quickly when you choose to, but you're defaulting to shutdown as a protective strategy more often than activation.",
        regulation_capacity: "Natural",
        observable_patterns: "You said: 'My body feels deep exhausting' when avoiding something important, and 'My face becomes red' under stress, but you also shared you can 'calm down in just a few minutes.' Your nervous system has the capacity for healthy regulation—you're just not using it when it matters most. Instead, you're choosing the escape hatch of sleep and distraction, which feels safer than facing the possibility you might fail at becoming that successful businessman.",
        regulation_reality: "Your quick regulation ability is a genuine asset—most people take much longer to return to baseline after stress. But here's the reality: you're using that regulation capacity to return to comfort rather than to reset and engage. When you're winning at games, your nervous system stays in optimal arousal without any exhaustion. This tells us your exhaustion isn't physiological—it's psychological protection. Your body is working exactly as designed; you've just trained it to shut down when facing identity-level challenges."
      },
      thirty_day_protocol: {
        seventy_two_hour_suggestion: "For the next three days, immediately after you sing songs (your anchor habit), speak one business-related thought out loud before you let yourself think about it—just like you do in regular conversation, except this time it's about your business vision. Don't edit it, don't judge it, just say it. This leverages your existing pattern of speaking without deep thinking, but redirects it toward your goal instead of away from it.",
        weekly_recommendation: "Every week, schedule one 2-hour block where you treat business building exactly like you treat gaming—you're going for a 'win.' Define what one clear win looks like for that session (completing a specific task, making progress on one project, learning one new skill), and don't allow yourself to sleep or switch to games until you hit that win. Use your singing as bookends—sing before you start, sing when you finish. This recreates the winning environment you already know how to generate.",
        thirty_day_approach: "Shift your identity narrative from 'I don't have talent' to 'I'm building evidence of my capability.' For 30 days, keep a visible tally of every small business action you complete—not outcomes, just actions. Every time you feel the exhaustion coming or reach for sleep during the day, look at your tally and ask: 'What's one more tally mark worth?' This directly challenges your core protective belief by creating undeniable proof that you can show up consistently, which is the real foundation of business success—not talent.",
        environmental_optimization: "Move your sleeping space away from your primary workspace, or if that's not possible, remove the option to lie down during the day by committing to taking your business work to a public space (coffee shop, library, co-working space) for at least 4 hours daily. Your environment is currently optimized for escape—optimize it for accountability instead. Also, set a visible timer for your gaming sessions and stop when it goes off, even if you're winning, to prove to yourself you can walk away from instant gratification.",
        progress_markers: [
          "You notice the exhaustion coming and sing a song instead of going to sleep, then take one business action",
          "You complete three consecutive days where you speak a business thought out loud after singing",
          "You hit your first weekly 'business win' in a focused 2-hour session without sleep or gaming interruption",
          "Your daytime sleep decreases from 3 hours to under 1 hour",
          "You accumulate 30 tally marks showing consistent business actions over 30 days"
        ],
        daily_actions: [
          "Day 1: After singing today, speak one business idea out loud without thinking about it first. Write it down exactly as you said it.",
          "Day 2: After singing, speak another business thought out loud. Notice if the exhaustion tries to creep in before you do this.",
          "Day 3: After singing, speak a third business thought. Check in—did you feel any differently today than Day 1?",
          "Day 4: Take your business work to a public space for at least 2 hours. Make one tally mark for showing up.",
          "Day 5: In your public workspace, work for 2 hours. Notice when the pull toward sleep or distraction hits. Make a tally mark for staying present.",
          "Day 6: After singing, speak out loud what 'one win' would look like this week for your business. Define it clearly.",
          "Day 7: Review your week. How many tally marks do you have? What does this prove about the 'no talent' story?",
          "Day 8: Set a timer for any gaming session today. When it goes off, stop immediately and make a tally mark for honoring boundaries.",
          "Day 9: After singing, speak out loud one fear you have about becoming a successful businessman. Don't analyze it, just name it.",
          "Day 10: Take business work to a public space. Work until you complete one specific task. Make a tally mark.",
          "Day 11: When exhaustion hits today, sing a song, take 3 deep breaths, then ask 'If I were winning, what would I do next?' Do that thing.",
          "Day 12: After singing, speak out loud what you'd have to give up to become that successful businessman. Notice how that feels.",
          "Day 13: Work in public for 2 hours. Make a tally mark. Notice if it's getting any easier.",
          "Day 14: Review your two weeks. Count your tally marks. Write one sentence about what this evidence means about your capability.",
          "Day 15: After singing, speak out loud one thing you learned about yourself in these first two weeks.",
          "Day 16: Schedule your weekly 'business win' session. Block 2 hours. Decide your one clear win goal.",
          "Day 17: Execute your 2-hour win session. Sing before you start, work until you win, sing when you finish. Make a tally mark.",
          "Day 18: Notice how yesterday's win session felt compared to gaming. What was similar? What was different?",
          "Day 19: Take business work to public space. Work for 2 hours or until exhaustion hits—whichever comes first. Notice the difference from Week 1.",
          "Day 20: After singing, speak out loud one belief about 'talent' that you're starting to question. What's becoming possible?",
          "Day 21: Review three weeks. How has your daytime sleep pattern changed? How many tally marks total?",
          "Day 22: Set a gaming timer. When it goes off, stop and immediately take one business action. Make two tally marks—one for boundary, one for action.",
          "Day 23: After singing, speak out loud what kind of businessman you're actually becoming based on your evidence, not your fear.",
          "Day 24: Work in public for 3 hours (increasing). Make a tally mark. Notice your energy level—is the exhaustion lessening?",
          "Day 25: Schedule next week's 'business win' session. Make the win goal slightly bigger than last time.",
          "Day 26: When stress hits today and your face gets red, sing a song and speak one truth out loud before reacting. Make a tally mark.",
          "Day 27: Execute your second weekly win session. Sing, work, win, sing. Make a tally mark. Celebrate this one—you're proving something.",
          "Day 28: Review almost 30 days. How many total tally marks? What does this number prove about the 'no talent' story you started with?",
          "Day 29: After singing, speak out loud who you're becoming. Use present tense, not future tense. 'I am someone who...'",
          "Day 30: Count final tally marks. Write a short note to yourself describing the businessman you've provided evidence of being over these 30 days. Keep this note visible."
        ],
        weekly_goals: [
          "Week 1: Establish the anchor practice of speaking business thoughts out loud after singing daily. Begin environmental shift by working in public spaces at least twice. Start tally system and accumulate first marks proving you can show up.",
          "Week 2: Execute your first 2-hour 'business win' session using the gaming mindset. Reduce daytime sleep by identifying exhaustion triggers and using the breath-and-sing reset. Accumulate more tally marks and begin questioning the 'no talent' narrative with visible evidence.",
          "Week 3: Increase public workspace time and notice how your exhaustion pattern is shifting. Execute your second 'business win' session with a bigger goal. Practice stopping gaming sessions when timer goes off to prove you can delay gratification. Build undeniable evidence through growing tally marks.",
          "Week 4: Solidify new identity as 'someone who shows up consistently' by reviewing total tally marks and writing your new self-description. Complete final weekly win session. Assess overall energy management improvements and prepare for next phase of business building with your proven system."
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
      message: 'Sample assessment PDF generated successfully! This test validates the complete PDF generation pipeline.',
      pdfUrl: result.pdfUrl,
      sessionId: 'test-session-123',
      testType: 'Sample Data Assessment',
      generatedAt: new Date().toISOString()
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


