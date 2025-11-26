import { NextRequest, NextResponse } from "next/server";
import { generatePDF } from "@/lib/pdf";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing PDF generation with sample data...");
    console.log(
      "⚠️  WARNING: This route uses HARDCODED SAMPLE DATA - NOT REAL USER DATA"
    );

    // Check if PDFShift API key is available
    if (!process.env.PDFSHIFT_API_KEY) {
      console.error("❌ PDFSHIFT_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: "PDFSHIFT_API_KEY not configured",
          message: "PDF generation service not configured",
        },
        { status: 500 }
      );
    }

    // ⚠️ FAKE SAMPLE DATA FOR TESTING ONLY - DO NOT USE IN PRODUCTION
    // This contains fabricated quotes and responses that don't belong to any real user
    const samplePlanData = {
      title: "You 3.0 Behavioral Optimization Assessment Report",
      overview:
        "This assessment revealed the protective mechanisms that keep you safe from rejection and overwhelm, while simultaneously blocking the financial success and recognition you're capable of achieving.",
      assessment_overview:
        "You've been carrying strategies that once kept you safe from the painful reality that success equals rejection from people you love, but now those same strategies keep you stuck at the threshold of earning what you're worth. Today you've uncovered not just the freeze pattern at the money moment, but why it exists and how it's been protecting you from having to face that everything changes when you fully commit. The good news? Change is possible because now you can see the whole picture clearly. More importantly, you already have proof you can do this - you stay in action and avoid the spiral completely when you're working for others.",
      development_profile:
        "You've built real regulation skills - going from days of stress recovery to catching it in real time shows serious growth. But here's the pattern: you freeze the moment promotion and money enter the picture, not because you can't do the work, but because your system learned early that success means losing connection with the people who matter. You described it perfectly: \"when I succeed or get recognition people treat me different. They talk shit or put me down saying things like don't forget where you come from or you're not better than anyone meanwhile I thought I was making them proud.\" That bind - achieving what you thought would make them proud actually created distance and criticism - taught your nervous system that visibility equals rejection. So now, at the exact moment you need to promote your work and earn, your body hits the brakes: shoulders tense, focus scatters, chest pressure builds, and the shutdown response kicks in. Then comes the escape - Garden Scapes for the hour-long dopamine drip, or porn for the crash that derails your entire day. But here's what matters: when you're working for others, not at home, not isolated, you stay completely connected to the work. The pattern disappears. You already know how to do this. You just need to build the bridge between serving others and serving yourself.",
      bottom_line:
        "Your work is good enough. You know it, and I know it. The problem isn't your skill or your worth - it's that your nervous system still believes that being seen and paid well means losing the people you care about. That belief made sense when you were younger and people actually did treat you differently for succeeding. But it's costing you everything now: your financial freedom, your full potential, your ability to serve the people who actually need your work. You already have proof you can stay in action when you're working for others. The next 30 days are about learning to treat yourself with that same commitment. The freeze response at the money moment isn't weakness - it's a protection pattern that's outlived its usefulness. You can update it. You have to, or five years from now you'll still be stuck at this same threshold, wondering why your talent never translated to the life you know you're capable of building.",
      sabotage_analysis: {
        protective_pattern:
          "Resistance to earning money manifesting as freeze response at the moment of promotion or visibility. This pattern shows up most when you need to put yourself forward for financial recognition or promote your work. When you notice it starting, you'll likely feel the shoulder tension and scattered focus first, followed by the chest pressure and shutdown response - that's your early warning signal. The faster you catch it, the faster you can choose differently.",
        what_its_protecting_from:
          "The fear that success and recognition will destroy your relationships and connection with the people you care about, forcing you to choose between achievement and belonging",
        how_it_serves_you:
          "Staying stuck keeps you connected to your original community and prevents the painful experience of being treated differently, criticized, or rejected for succeeding. It also protects you from the overwhelming reality that fully committing means everything changes - your identity, your relationships, your entire life structure.",
        go_to_patterns:
          "Garden Scapes for hour-long dopamine regulation when foggy brain hits, porn for immediate escape that creates motivational crash and derails the entire day, isolation at home where the pattern intensifies",
        success_proof:
          "When working for others, not at home, and around people, you stay completely connected to the work and the entire pattern disappears - no routine isolation that leads to porn, no freeze response, sustained action and focus",
        anchor:
          "Cold showers and morning coffee - non-negotiables that never break even when inconvenient, proving you already have the capacity to do hard things consistently",
      },
      in_the_moment_reset:
        "When you notice the shoulder tension and scattered focus starting - before the chest pressure builds - pause and take 3 deep breaths: in for 4 counts, hold for 4, out for 6. Then ask yourself: What's one small thing I can do right now that moves me forward instead of into escape? It won't stop the pattern completely at first, but it creates the gap where choice becomes possible. If you're at home alone, this is your signal to get out or get around people - you already know your nervous system works differently in those environments.",
      domain_breakdown: {
        mind: {
          current_level: "Exploration",
          current_phase: "Experimentation",
          key_strengths:
            "All-in learning capacity when genuinely interested - podcasts, books, TED talks, educational content. Real-time awareness of stress patterns showing significant regulation growth from days to immediate recognition. Clear insight into protective patterns and their function.",
          growth_opportunities:
            "Decision avoidance pattern where circumstances become unavoidable before action happens. Building capacity to engage mentally with necessary tasks even when not intrinsically interesting. Developing skills to move from awareness into action before the foggy brain escape urge takes over.",
        },
        body: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths:
            "Consistent cold shower practice proving capacity for physical discomfort and discipline. Clear body awareness of stress signals - shoulder tension, scattered focus, chest pressure, shutdown response. Honest recognition of what needs to change.",
          growth_opportunities:
            "Relationship with physical health characterized by resistance despite knowledge - diet and exercise changes avoided like a defiant toddler to prevent withdrawal symptoms and stress that current eating patterns solve. Building tolerance for the discomfort of positive change instead of using food for regulation.",
        },
        relationships_meaning: {
          current_level: "Foundation",
          current_phase: "Friction",
          key_strengths:
            "Deep awareness of the core bind between achievement and belonging. Recognition that full commitment requires identity transformation. Honest acknowledgment of what staying stuck protects against.",
          growth_opportunities:
            "Reconciling the fear that everything changes with full commitment. Building new identity that can hold both success and connection. Developing capacity to be visible and recognized without triggering the rejection protection pattern.",
        },
        contribution: {
          current_level: "Exploration",
          current_phase: "Experimentation",
          key_strengths:
            "High-quality work capacity that you recognize. Complete pattern dissolution when working in service to others - staying connected to work, avoiding isolation spiral, sustained motivation and action. Natural regulation through connection and structure.",
          growth_opportunities:
            "Bridging the gap between serving others and serving yourself - learning to treat your own promotion and financial success with the same commitment you bring to client work. Developing capacity to be visible and promote your work without triggering the freeze response at the money moment.",
        },
      },
      nervous_system_assessment: {
        primary_state:
          "Hypervigilant with dorsal vagal shutdown patterns - your system monitors for threats to connection and belonging, then hits the brakes hard when success or visibility threatens those relationships",
        regulation_capacity: "Developing",
        observable_patterns:
          "Significant progress from days of stress recovery to real-time awareness with deep breathing for composure, but anxiety still feels intense even when managed well. Shoulders tense and focus scatters under pressure. Chest pressure and shutdown response when avoiding important tasks. Foggy brain and escape urge signaling overwhelm. Complete pattern shift when around people or outside home environment.",
        regulation_reality:
          "You've built real skills going from days to real-time stress awareness, but your nervous system still runs a protection program at the money and visibility threshold. The intensity of anxiety even when you're managing well tells us the underlying threat perception hasn't fully updated yet - your system still believes success equals rejection. The good news: you already have proof your nervous system can stay regulated when you're in service to others and in community, which means the capacity exists and just needs deliberate practice in the self-promotion context.",
      },
      thirty_day_protocol: {
        seventy_two_hour_suggestion:
          "Right after your cold shower and coffee tomorrow morning, spend 5 minutes on one small promotion task for your work before you do anything else - draft one social post, reach out to one potential client, update one piece of your portfolio. Do this outside your home if possible, or with your phone in another room. The cold shower already proves you can do hard things first thing; we're just adding one more.",
        weekly_recommendation:
          "Schedule one 2-hour work session per week at a coffee shop, coworking space, or library where you focus exclusively on your own business promotion and money-generating activities. Your nervous system already knows how to stay in action when you're not at home and around people - we're leveraging that existing pattern for your own work instead of just client work.",
        thirty_day_approach:
          "Reframe all self-promotion and business-building activities as service to future clients who need your work, not as self-serving visibility that threatens your relationships. When the freeze response starts at the money moment, immediately shift the frame from I'm promoting myself to I'm connecting my work with people who need it. This addresses the core protective pattern by satisfying both the achievement drive and the connection need simultaneously.",
        environmental_optimization:
          "Remove Garden Scapes from your phone for 30 days and establish a no-porn-at-home rule by committing to leave the house when you notice the foggy brain and escape urge building. Your own data shows the pattern disappears when you're not isolated at home, so we're removing the environment where the spiral lives instead of fighting willpower battles.",
        progress_markers: [
          "Completing the morning promotion task 5 days per week without the freeze response triggering escape behavior",
          "One full week where you leave the house or connect with someone instead of using porn when the escape urge hits",
          "Successfully pitching your work or discussing money with a potential client without the chest pressure shutdown response taking over",
        ],
        daily_actions: [
          "Day 1: After cold shower and coffee, draft one social media post about your work (5 minutes, phone in another room)",
          "Day 2: After cold shower and coffee, send one outreach email to a potential client or referral partner (5 minutes, outside home if possible)",
          "Day 3: After cold shower and coffee, update one piece of your portfolio or website (5 minutes)",
          "Day 4: After cold shower and coffee, research one potential client or opportunity (5 minutes)",
          "Day 5: After cold shower and coffee, practice your pitch out loud as if you're serving someone who needs your work (5 minutes)",
          "Day 6: Notice when foggy brain hits today and immediately take a walk outside instead of reaching for phone",
          "Day 7: Review the week - which promotion task felt easiest? That's your anchor for next week",
          "Day 8: After cold shower and coffee, do your easiest promotion task from last week again (5 minutes)",
          "Day 9: After cold shower and coffee, reach out to one person in your network just to reconnect, no agenda (5 minutes)",
          "Day 10: After cold shower and coffee, write down one success story or positive client outcome (5 minutes)",
          "Day 11: After cold shower and coffee, share that success story on one platform (5 minutes)",
          "Day 12: After cold shower and coffee, identify one person who needs to hear about your work and draft a message (5 minutes)",
          "Day 13: When you notice shoulder tension today, pause for 3 deep breaths before choosing your next action",
          "Day 14: Go to coffee shop or library for 2-hour work session focused on your business promotion and money activities",
          "Day 15: After cold shower and coffee, follow up with someone you reached out to previously (5 minutes)",
          "Day 16: After cold shower and coffee, update your pricing or service offerings (5 minutes)",
          "Day 17: After cold shower and coffee, research one new platform or opportunity for visibility (5 minutes)",
          "Day 18: After cold shower and coffee, engage with someone else's content in your field authentically (5 minutes)",
          "Day 19: After cold shower and coffee, document one thing you learned this week about your work (5 minutes)",
          "Day 20: Notice when escape urge builds today and text one friend or leave the house instead of isolating",
          "Day 21: Review weeks 2-3 - what felt like progress? What still triggers the freeze? Adjust next week accordingly",
          "Day 22: After cold shower and coffee, do the promotion task that's felt most natural so far (5 minutes)",
          "Day 23: After cold shower and coffee, practice discussing your pricing with confidence in the mirror (5 minutes)",
          "Day 24: After cold shower and coffee, reach out to one person about a paid opportunity (5 minutes)",
          "Day 25: After cold shower and coffee, update one piece of marketing material (5 minutes)",
          "Day 26: After cold shower and coffee, engage in one visibility activity that previously triggered freeze (5 minutes)",
          "Day 27: When chest pressure builds today, remind yourself that serving others with your work doesn't threaten your relationships",
          "Day 28: Go to coffee shop or library for 2-hour work session focused on your business promotion and money activities",
          "Day 29: After cold shower and coffee, reflect on what changed this month - where did the freeze response ease up?",
          "Day 30: After cold shower and coffee, plan your next 30 days using what you learned about your patterns and capacity",
        ],
        weekly_goals: [
          "Week 1: Complete 5 morning promotion tasks and leave house or connect with someone at least once when escape urge hits instead of using porn",
          "Week 2: Complete 5 morning promotion tasks, attend first 2-hour external work session, practice the in-the-moment reset when shoulder tension appears",
          "Week 3: Complete 5 morning promotion tasks focused on money conversations or visibility, notice the reframe from self-promotion to service when freeze starts",
          "Week 4: Complete 5 morning promotion tasks with at least one direct pitch or pricing conversation, attend second 2-hour external work session, identify your strongest new pattern",
        ],
      },
      reminder_quote:
        "When I'm working for others, not myself, when I have a job to do for other people I stay connected to the work and it keeps me from my routine and isolation that leads to porn.",
      development_reminders: [
        "Growth is cyclical; regression is protection, not failure - expect the freeze response to show up even as you practice moving through it",
        "Integration comes through consistent practice, not more awareness - you already understand the pattern, now you need repetition in new environments",
        "Your nervous system is the foundation - regulate first by getting around people or leaving the house, then tackle the promotion work",
        "Your sabotage patterns have wisdom - the freeze at the money moment has been protecting you from rejection; honor that while updating it",
        "Identity shifts over time with deliberate practice - becoming someone who fully commits and promotes their work happens through repeated small actions, not one big decision",
      ],
      book_recommendation:
        "The Body Keeps the Score by Bessel van der Kolk - will help you understand why your chest pressure and shutdown response are protective mechanisms that can be updated through somatic practice",
      resources: [
        "Resource 1: Daily somatic tracking journal to document the shoulder tension and chest pressure patterns alongside what actions you took or avoided - building data about your nervous system responses",
        "Resource 2: Accountability partner or coach who checks in on your morning promotion tasks and helps you reframe self-promotion as service when the freeze starts",
        "Resource 3: Coworking space day pass or favorite coffee shop for your weekly 2-hour external work sessions focused on your own business building",
        "Resource 4: Cold exposure community or practice group to leverage your existing cold shower discipline and connect with others doing hard things consistently",
        "Resource 5: Somatic experiencing practitioner or body-based therapist to work specifically with the freeze response and update the nervous system's threat perception around success and visibility",
      ],
      reflection_prompts: [
        "Prompt 1: When you notice the freeze response starting at a money or promotion moment, what specifically are you afraid will happen to your relationships if you move forward anyway?",
        "Prompt 2: Think about the times you successfully worked for others without the pattern showing up - what internal narrative were you running that allowed you to stay in action?",
        "Prompt 3: If you treated promoting your own work with the same commitment you bring to client work, what would change in your daily routine and decision-making?",
        "Prompt 4: What would it mean to build success in a way that actually deepens connection instead of threatening it? What would that look like practically?",
        "Prompt 5: Who in your life would genuinely celebrate your financial success without the criticism or put-downs? How can you increase connection with those people during this 30-day protocol?",
      ],
      next_assessment: {
        stay_connected:
          "Schedule your 60-day follow-up assessment to track pattern shifts and nervous system regulation progress. Join the You 3.0 community for ongoing support, accountability, and access to somatic practices specifically designed for entrepreneurs navigating visibility and money blocks. Sign up for the weekly newsletter with regulation tools and real-talk about building businesses when your nervous system has other ideas.",
      },
    };

    // Generate PDF with sample data
    console.log("📝 Starting PDF generation...");
    const result = await generatePDF(samplePlanData, "test-session-123");

    console.log("✅ PDF generated successfully!");
    console.log("📄 PDF URL:", result.pdfUrl);

    return NextResponse.json({
      success: true,
      message:
        "Sample assessment PDF generated successfully! This test validates the complete PDF generation pipeline.",
      pdfUrl: result.pdfUrl,
      sessionId: "test-session-123",
      testType: "Sample Data Assessment",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ PDF generation test failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "PDF generation test failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
