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
      overview: "This assessment revealed a high-capacity individual with fast learning abilities and natural nervous system regulation, currently trapped in a cycle of escape behaviors (sleep, gaming) that protect against facing the discomfort of building a business without perceived 'talent.'",
      assessment_overview: "You've been carrying a belief that's keeping you small: 'I don't have talent.' But here's what today revealed—you're a fast learner with proven ability to push through challenges when you're winning. Your nervous system regulates in minutes, which most people can't do. The pattern that's kept you stuck isn't lack of talent; it's that speaking without thinking, then escaping into sleep (3 hours daily) and games protects you from having to risk failure as a businessman. The good news? You already have proof you can do this—you push through when you're winning at games. Now we just need to transfer that same state to your business.",
      development_profile: "You process the world quickly—'fast learner' were your exact words—and when decisions matter, you go deep. But there's a split between your capacity and your pattern: you speak without thinking, then your body forces rest through exhaustion and headaches when you've pushed too far. Your face flushing red is your early warning system. What stood out most was your honesty about what staying stuck protects you from: 'play football, or games.' You know the cost. You said your deepest meaning comes from 'desire, hope, work, money'—four powerful drivers. Yet something keeps pulling you toward sleep (3 hours daily) instead of toward building what you want. Your words: 'I wanna be a success business man, but I don't have talent.' That belief is the lock. Your fast learning and quick regulation are the keys.",
      bottom_line: "You have the foundation and potential for significant transformation—the key is working with your nervous system rather than against it.",
      sabotage_analysis: {
        protective_pattern: "Speaking without deep thinking, then escaping into sleep (3 hours daily) and gaming when overwhelm hits. This pattern shows up most when facing the risk of business failure without perceived talent. When you notice it starting, you'll likely feel exhaustion first—that's your early warning signal. The faster you catch it, the faster you can choose differently.",
        what_its_protecting_from: "Fear of failing as a businessman without natural talent; facing the discomfort of not knowing; risking loss of pleasure activities (football, games); experiencing inadequacy publicly",
        how_it_serves_you: "Sleep provides immediate escape from discomfort; gaming gives you the 'winning' feeling you crave without real-world risk; speaking without thinking keeps you from facing deeper truths; avoiding conflict maintains surface-level peace; preserves your self-image by never truly testing yourself",
        go_to_patterns: "Sleep (3 hours daily when avoiding), gaming until winning, reactive speaking, conflict avoidance, oscillating between optimistic decisions and 'bad mode' depending on body state",
        success_proof: "You push through patterns when winning at computer games—mental state, environment, and support all shift differently in those moments. You regulate stress in minutes (unusual capacity). You're a fast learner. You go deep on important decisions despite reactive speaking habits.",
        anchor: "Singing songs—the one thing you do daily no matter what, even when inconvenient"
      },
      goals: {
        business_goal: "Become a successful businessman by leveraging your fast learning abilities and transferring your gaming 'winning state' to business actions",
        relationship_goal: "Build a support system for business growth while learning to navigate conflict directly rather than avoiding it",
        body_goal: "Use your body's early warning signals (face flushing, exhaustion) to interrupt escape patterns and redirect energy toward business learning"
      },
      future_vision: "A Tuesday where you wake up after singing, complete your business learning action, and feel the same 'winning' energy you get from games—but now it's directed toward building your business. You've reduced your escape sleep to 1.5 hours, you catch your exhaustion signals early, and you're accumulating proof that you're a fast learner who can succeed in business.",
      in_the_moment_reset: "When you notice the exhaustion starting or the pull toward sleep, pause and take 3 deep breaths—in for 4 counts, hold for 4, out for 6. Check if your face is flushing (your signal). Then ask yourself: 'If I were winning right now, what's one small action I'd take?' Match that gaming state to business. It won't stop the pattern completely at first, but it creates the gap where choice becomes possible.",
      domain_breakdown: {
        mind: {
          current_level: "Exploration",
          current_phase: "Friction",
          key_strengths: "Fast learner, capable of deep thinking on important decisions, quick nervous system regulation (minutes), natural cognitive processing speed, awareness of your reactive speaking pattern",
          growth_opportunities: "Bridging the gap between reactive speaking and deep thinking capacity; learning to pause before responding; developing consistent decision-making that doesn't oscillate with body state ('optimistic way' vs 'bad mode'); building tolerance for not-knowing without escaping into sleep"
        },
        body: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Clear body signals (face flushing, headaches, exhaustion), quick stress regulation (few minutes), energizing physical environment, intentional relationship with health ('very constructed, very clever')",
          growth_opportunities: "Recognizing exhaustion as avoidance signal rather than just rest need; reducing 3-hour daily escape sleep; integrating body signals earlier (before headaches); stabilizing body state to support consistent decision-making; using physical state awareness to interrupt pattern"
        },
        spirit: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Values honest conversation for connection, clear meaning drivers (desire, hope, work, money), awareness of conflict avoidance pattern, daily anchor practice (singing)",
          growth_opportunities: "Learning to navigate conflict directly rather than avoiding; building tolerance for discomfort in relationships; developing support system for business growth; connecting singing anchor to business action; allowing vulnerability around 'not having talent' belief"
        },
        contribution: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths: "Clear business vision (success businessman), motivated by work and money, awareness that money is primary external obstacle, desire to contribute through business",
          growth_opportunities: "Reframing 'talent' narrative to 'learning' mindset; transferring gaming 'winning state' to business actions; building daily business habits anchored to singing; reducing escape time (3 hours) and redirecting to skill building; taking action despite fear of inadequacy"
        }
      },
      nervous_system_assessment: {
        primary_state: "Alternating between regulated activation (when winning/optimistic) and defensive collapse (exhaustion, sleep escape, bad mode)—your system knows how to regulate quickly but defaults to shutdown when facing perceived inadequacy",
        regulation_capacity: "Natural",
        observable_patterns: "Face flushing red under stress, terrible headaches from overwhelm, deep exhaustion when avoiding, 3-hour sleep escapes, quick return to baseline (few minutes), decision quality oscillates with body state—'sometimes always make decisions in an optimistic way, but otherwise only make decisions in bad mode'",
        regulation_reality: "Your nervous system is actually more flexible than you realize—regulating in minutes is uncommon. The issue isn't regulation capacity; it's that your system has learned to use sleep as primary coping mechanism (3 hours daily). When you're in 'winning state' from games, all three factors shift: mental state, environment, support. You have the hardware; you're just running old software that says escape is safer than attempting business without 'talent.'"
      },
      thirty_day_protocol: {
        seventy_two_hour_suggestion: "Anchor a 15-minute business learning action immediately after singing songs (your unbreakable habit). Before you can escape to sleep, complete one small learning task. Start with researching one successful businessman who wasn't 'talented'—just persistent. Your fast learning capacity handles this easily.",
        weekly_recommendation: "Create a 'winning state log' every Sunday: write down when you felt like you were winning this week (gaming or otherwise), what your mental state was, and what one business action would have matched that energy. Your environment already energizes you; now use it intentionally. Set a weekly 30-minute honest conversation about business progress with one supportive person.",
        thirty_day_approach: "Replace one hour of your 3-hour daily sleep escape with skill-building for business (courses, reading, networking). Keep the other 2 hours as actual rest. Reframe 'I don't have talent' to 'I'm a fast learner proving it daily.' Track face flushing and exhaustion signals, then pause and choose action over escape three times weekly. Build business systems in your optimistic body state, execute them even in bad mode. By day 30, you'll have 30 hours of learning invested and proof talent was never the variable.",
        environmental_optimization: "Since money is your biggest external obstacle and your environment already energizes you, create a zero-cost business learning space using your existing setup. Use free online resources, YouTube, podcasts during activities you already do. Turn gaming time into business strategy game (gamify learning). Remove sleep escape triggers: set phone alarm after 2 hours max rest, no gaming before business learning task completed.",
        progress_markers: [
          "Reducing daily escape sleep from 3 hours to 2 hours by week 2, to 1.5 hours by week 4",
          "Completing business learning action after singing 5 days/week by week 2, 7 days/week by week 4",
          "Catching face flush/exhaustion signal and choosing action over escape 3x in week 1, 6x by week 2, 10x by week 3, daily by week 4",
          "Reframing 'no talent' thought to 'fast learner' evidence at least once daily starting week 1",
          "Making decisions from optimistic state consciously 4x weekly by week 3"
        ],
        daily_actions: [
          "Day 1: After singing, watch one 10-minute video on business fundamentals. Notice if exhaustion hits—breathe instead of sleeping.",
          "Day 2: After singing, list three skills successful businessmen have. You're a fast learner—which one interests you most?",
          "Day 3: When face flushes today, pause and take 3 deep breaths. Then take one small business action before escaping.",
          "Day 4: After singing, research one entrepreneur who wasn't naturally talented. Read their origin story.",
          "Day 5: Set timer for sleep—limit to 2 hours max today. Track how you feel after.",
          "Day 6: After singing, write down: 'What would I do if I were winning at business right now?' Do that thing.",
          "Day 7: After singing, review your week. When did exhaustion signal avoidance vs. real rest? Be honest.",
          "Day 8: After singing, learn one new business concept (marketing, sales, operations). Fast learner—10 minutes is enough.",
          "Day 9: When exhaustion hits today, ask: 'What am I avoiding?' Take opposite action for 5 minutes before resting.",
          "Day 10: After singing, watch one interview with a successful businessman. Notice what they did, not what they had.",
          "Day 11: Practice speaking after thinking today. Pause 3 seconds before responding in any conversation.",
          "Day 12: After singing, write three pieces of evidence you're capable of learning business skills. You have proof.",
          "Day 13: Set timer for sleep—still 2 hours max. Use saved hour for free online business course.",
          "Day 14: After singing, review progress. Are you catching exhaustion earlier? Celebrate that.",
          "Day 15: After singing, identify one business action you've been avoiding. Do it for 10 minutes today.",
          "Day 16: When making a decision today, check your body state. If 'bad mode,' wait until regulated to decide.",
          "Day 17: After singing, connect with one person doing what you want to do. Honest conversation—ask how they started.",
          "Day 18: Notice face flushing today. That's your signal—breathe, then act toward business, not away into games.",
          "Day 19: After singing, list five skills you've learned fast in life. Talent wasn't required then either.",
          "Day 20: Set timer for sleep—reduce to 1.5 hours today. Track energy levels afterward.",
          "Day 21: After singing, review three weeks. How much have you learned? Fast learner proof is accumulating.",
          "Day 22: After singing, take one action that scares you slightly. Small risk, business-related. Breathe through it.",
          "Day 23: Practice catching reactive speaking today. Pause before responding three times minimum.",
          "Day 24: After singing, watch content on turning learning into business systems. You process quickly—take notes.",
          "Day 25: When exhaustion hits, use it as data: 'What risk am I protecting myself from?' Then take tiny action toward it.",
          "Day 26: After singing, write your 30-day post-assessment insights. What's different from day 1?",
          "Day 27: Sleep timer—1.5 hours max. Are you using saved time intentionally? Adjust if needed.",
          "Day 28: After singing, make one business decision from optimistic body state. Execute it regardless of tomorrow's state.",
          "Day 29: Review all progress markers. Which ones improved most? That's your growth edge—keep pressure there.",
          "Day 30: After singing, write: 'I'm a fast learner who has invested 30 hours in business skills this month. Talent was never the issue.' Read daily."
        ],
        weekly_goals: [
          "Week 1: Complete business learning after singing 5+ days, catch exhaustion/escape pattern 3+ times and choose action instead, reduce sleep escape to 2.5 hours daily average, reframe 'no talent' to 'fast learner' evidence once daily",
          "Week 2: Complete business learning after singing 7 days, catch and redirect exhaustion 6+ times, reduce sleep to 2 hours daily average, practice 3-second pause before speaking 5+ times, connect with one person in business you admire",
          "Week 3: Maintain daily business learning, catch and redirect exhaustion 10+ times, reduce sleep to 1.5-2 hours average, make 4+ conscious decisions from optimistic body state, identify and take action on one avoided business task",
          "Week 4: Solidify daily business learning habit, redirect exhaustion into action 12+ times, stabilize sleep at 1.5 hours max, demonstrate consistent decision-making regardless of body state, accumulate 30+ hours total business learning, prepare 6-month business learning roadmap"
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


