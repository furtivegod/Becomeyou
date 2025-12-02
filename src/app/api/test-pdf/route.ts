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
      title: "S.M.A.R.T. METHOD BEHAVIORAL ASSESSMENT",
      overview:
        "You've been protecting yourself from visibility and the weight of expectation by letting momentum drop halfway through. It's not laziness or lack of capability—it's a nervous system strategy that once kept you safe from judgment and pressure. But now it's keeping you from the sustained success you're capable of. The good news? You already have proof you can push through when someone's counting on you. You just need to rewire the system so you can count on yourself the same way.",
      disclaimer:
        "This assessment reflects patterns observed during our conversation and is designed to support your growth, not diagnose or replace professional mental health care. Use what resonates, adjust what doesn't, and trust your own wisdom about what you need next.",
      bottom_line:
        "You've been protecting yourself from the weight of sustained expectation by letting momentum drop halfway through. It's not laziness, lack of discipline, or a character flaw—it's a nervous system strategy that once kept you safe from judgment and the pressure of being watched. Staying in the dip kept the spotlight dimmer, the stakes lower, and the responsibility manageable. It worked when you needed it to. But here's the truth: that pattern is now costing you more than it's protecting you. Every time you lose momentum halfway through, you're reinforcing the belief that you can't sustain what you start. That belief compounds faster than any external success can undo it. It affects how you see yourself, how others see you, and what opportunities you're willing to pursue. The real cost isn't just unfinished projects—it's the identity of someone who starts but doesn't finish becoming your default. And you already know this. That's why you're here. The good news is you have proof you can change. When you've had a clear deadline and someone counting on you, you've locked in and pushed through. External accountability gave you the structure to finish strong—which means the capability is there. You just need to build the internal version of that accountability so you're not dependent on external pressure to follow through. Change requires you to act before you feel ready. To finish when it's uncomfortable. To trust the process when your nervous system screams at you to stop. You've done hard things before. You can do this. The next 30 days aren't about perfection—they're about proving to yourself that you can cross the finish line when it matters. One task at a time. One completed project at a time. Until finishing strong becomes who you are, not just what you do when someone's watching.",
      client_name: "Client",
      smart_roadmap: {
        map_brief:
          "Your nervous system shifts between wired alertness under pressure and foggy shutdown when avoiding—but you recover quickly, which is a real strength.",
        see_brief:
          "You start strong but lose momentum halfway through to avoid the pressure of being fully seen and expected to perform consistently.",
        rewire_brief:
          "Anchor one meaningful task completion to your morning water and plan check—finish something small within 72 hours that proves you can cross the finish line.",
        address_brief:
          "This pattern started as protection from judgment and the weight of others watching—staying in the dip kept responsibility and expectations manageable.",
        transform_brief:
          "Build external accountability into your weekly rhythm—share one goal with your close friend every Sunday and report progress by Friday.",
      },
      reminder_quote:
        "I keep starting strong on things, then losing momentum halfway through. That dip frustrates me every time.",
      assessment_date: "2025",
      next_assessment: {
        focus_areas:
          "Focus Areas for Next Phase: Building internal accountability, sustaining energy through larger projects, deepening nervous system regulation capacity",
        stay_connected:
          "Stay connected through the newsletter for ongoing nervous system insights, join the community for accountability support, and reach out when you're ready for the next level of this work",
        monthly_check_in:
          "Monthly Check-In Options: brief progress reviews to track momentum dip awareness and completion consistency",
        six_month_follow_up:
          "6-Month Follow-Up Assessment recommended to track identity shifts and sustained completion patterns",
      },
      domain_breakdown: {
        body: {
          block:
            "The automatic shutdown response when tasks require sustained visibility or pressure",
          current_level:
            "Foundation—you recognize your body's signals under stress and can regulate quickly once pressure eases",
          current_phase:
            "Integration—you're aware of the wired-to-shutdown shift and learning to work with it",
          key_strengths:
            "Quick recovery time after stress—you can settle back down in minutes, which is a real regulatory advantage",
          growth_opportunities:
            "Learning to catch the energy drop before it becomes full shutdown—using breath and movement to bridge the momentum dip",
        },
        mind: {
          block:
            "The belief that finishing strong every time creates unsustainable pressure from yourself and others",
          current_level:
            "Exploration—you're actively learning by doing and refining your approach through action",
          current_phase:
            "Experimentation—you trust discovery over preparation and adjust in real time",
          key_strengths:
            "You weigh facts fast, trust your gut, and decide without overthinking—clarity and action are natural strengths",
          growth_opportunities:
            "Building sustained focus through the momentum dip—learning to maintain energy when visibility increases",
        },
        contribution: {
          block:
            "The belief that sustained success creates pressure and expectation you're not ready to carry long-term",
          current_level:
            "Foundation—you're pushing your work forward consistently, even on low-energy days",
          current_phase:
            "Friction—the momentum dip keeps you from finishing strong, which limits your impact and reinforces self-doubt",
          key_strengths:
            "You show up even when energy is low—that consistency is proof of commitment, not capability gaps",
          growth_opportunities:
            "Completing projects fully so your impact matches your effort—building the identity of someone who finishes what they start",
        },
        relationships_meaning: {
          block:
            "The fear that being consistently visible means others will watch and judge your ability to sustain what you start",
          current_level:
            "Foundation—you have a solid support person but don't consistently leverage external accountability",
          current_phase:
            "Friction—external pressure is the only thing that consistently gets you across the finish line, which creates dependency",
          key_strengths:
            "You're honest about what you need and have someone in your corner who pushes you without judgment",
          growth_opportunities:
            "Building internal accountability that matches the external kind—learning to count on yourself the way you count on deadlines",
        },
      },
      quote_attribution: "From your assessment",
      sabotage_analysis: {
        anchor:
          "Drinking water first thing in the morning and checking your plan for the day—these two habits never slip, even when nothing else feels solid",
        success_proof:
          "When you've had a clear deadline and someone counting on you, you lock in and push through—external accountability becomes the bridge across that momentum dip",
        go_to_patterns:
          "Quick scroll on your phone—an hour or two scattered in small chunks when you need a mental break or escape",
        support_person:
          "Your close friend—someone solid who pushes you in the right direction without judgment",
        pattern_reframe:
          "What I'm hearing: Your nervous system perceives sustained visibility as a threat—so it creates an energy drop halfway through to reduce exposure and manage the perceived danger of being consistently seen as capable.",
        what_its_costing:
          "You didn't specify a direct cost when asked about staying exactly where you are for another year, but the pattern itself tells the story—every time you lose momentum halfway through, you reinforce the belief that you can't sustain what you start. That belief compounds. It affects how you see yourself, how others see you, and what opportunities you're willing to pursue. The real cost isn't just unfinished projects—it's the identity of someone who starts but doesn't finish becoming your default.",
        how_it_serves_you:
          "Staying in the dip keeps the spotlight dimmer, the stakes lower, and the judgment at bay—it lets you stay functional without carrying the full weight of what you're capable of",
        proof_with_context:
          "When you've had a clear deadline and someone counting on you, you've locked in and pushed through the momentum dip. External accountability gave you the structure to finish strong—which means the capability is there. You just need to build the internal version of that accountability so you're not dependent on external pressure to follow through.",
        protective_pattern:
          "You start strong on things but lose momentum halfway through. This pattern shows up most when the stakes feel higher or when visibility increases—when finishing means people will expect you to sustain that level consistently. When you notice it starting, you'll likely feel the weight of expectation or the pressure of being watched first—that's your early warning signal. The faster you catch it, the faster you can choose differently.",
        pattern_exact_words:
          "I keep starting strong on things, then losing momentum halfway through. That dip frustrates me every time.",
        personalized_insight:
          "You're not avoiding success—you're avoiding the sustained pressure that comes with it. This pattern kept you safe when being watched meant heavier judgment and expectations you weren't ready to carry. But now it's keeping you from building the identity of someone who finishes what they start. The capability is there. The proof is there. What's missing is the willingness to be seen consistently—and that's what the next 30 days are designed to build.",
        what_its_protecting_from:
          "The pressure of being fully seen, the weight of sustained expectation, and the responsibility that comes with proving you can finish strong every time",
      },
      assessment_overview:
        "You've been protecting yourself from visibility and the weight of expectation by letting momentum drop halfway through. It's not laziness or lack of capability—it's a nervous system strategy that once kept you safe from judgment and pressure. But now it's keeping you from the sustained success you're capable of. The good news? You already have proof you can push through when someone's counting on you. You just need to rewire the system so you can count on yourself the same way.",
      book_recommendation:
        "Atomic Habits by James Clear—because you're someone who learns by doing and trusts action over preparation. This book will give you the framework to build the identity of someone who finishes what they start by focusing on systems and small wins, not willpower and motivation. It fits your current phase because you're in Experimentation—you're ready to test what works through real-world application, and this book gives you the exact structure to do that.",
      development_profile:
        "You're someone who trusts action over preparation, moves through decisions with clarity, and has the capacity to regulate quickly when stress passes. Your energy is mobilized and functional under pressure—shoulders tight, breathing shallow, mind running fast—but you know how to settle back down. The challenge isn't your capability or your commitment. It's that halfway through, your nervous system hits the brakes. Energy drops, fog rolls in, and easier tasks suddenly look more appealing. You said it yourself: staying in the dip protects you from being fully seen and from the pressure of others watching to see if you can keep it up. And that's the real pattern—not lack of discipline, but a protection mechanism that's outlived its usefulness.",
      in_the_moment_reset:
        "When you notice the momentum starting to drop—energy fading, fog rolling in, easier tasks looking more appealing—pause and take 3 deep breaths: in for 4 counts, hold for 4, out for 6. Then ask yourself: What's one small thing I can finish right now that proves I can cross the finish line? It won't stop the pattern completely at first, but it creates the gap where choice becomes possible.",
      thirty_day_protocol: {
        time_reps: "One complete task within 72 hours",
        anchor_habit:
          "Drinking water first thing in the morning and checking your plan for the day",
        week_1_focus:
          "Building awareness—notice when the momentum dip starts without trying to fix it yet",
        week_2_focus:
          "Creating micro-finishes—complete one small thing fully every day, no matter how insignificant it feels",
        week_3_focus:
          "Building sustained energy—push through the momentum dip on one larger task this week",
        week_4_focus:
          "Integration—become someone who finishes what they start without external pressure",
        daily_actions: [
          "Day 1: Right after your morning water and plan check, finish one small task completely before moving on—no switching halfway through",
          "Day 2: Notice when the momentum dip starts today—pause, take 3 breaths, and name the emotion that shows up right before it",
          "Day 3: Text your close friend and tell him you're working on finishing strong—ask him to check in on you this week",
          "Day 4: Remove your phone from your workspace during one focused work block—create distance between momentum dip and quick escape",
          "Day 5: Finish something meaningful today without an external deadline—just because you said you would",
          "Day 6: Use the 4-4-6 breath pattern before tackling your most important task—regulate your nervous system before the dip hits",
          "Day 7: Track your completions for the week—write down what you finished fully, not just what you worked on",
          "Day 8: Choose one project that has a momentum dip halfway through—commit to pushing through it this week",
          "Day 9: When energy drops today, choose one small action to push through instead of switching to easier tasks",
          "Day 10: Notice your body's signals before the shutdown response—tight shoulders, shallow breath, fast mind—and use movement to shift it",
          "Day 11: Share your progress with your close friend—report what you've finished so far this week",
          "Day 12: Finish one task that requires sustained focus today—no partial completion, no momentum dip escape",
          "Day 13: Use breath or movement to bridge the momentum dip on one task today—stay present through the discomfort",
          "Day 14: Track your completions for the week—notice if finishing is starting to feel more natural than stopping halfway",
          "Day 15: Identify the exact moment today when your nervous system wants to shut down—name it, breathe through it, keep going",
          "Day 16: Finish something today that you would normally let drop halfway through—prove to yourself you can push through",
          "Day 17: Remove one distraction from your environment that makes the momentum dip easier to escape into",
          "Day 18: Text your close friend mid-week—tell him what you're working on finishing and ask him to hold you accountable",
          "Day 19: Notice when easier tasks start looking more appealing—pause, breathe, and choose the meaningful task instead",
          "Day 20: Finish one larger project this week that required pushing through the momentum dip—celebrate the completion",
          "Day 21: Track your completions for the week—write down what you finished fully and notice the belief shift that's happening",
          "Day 22: Choose one task today that feels heavy or visible—finish it anyway and notice how your nervous system responds",
          "Day 23: Use the 4-4-6 breath pattern before every important task today—regulate proactively instead of reactively",
          "Day 24: Notice if the momentum dip feels less automatic today—if finishing is starting to feel like a choice instead of a threat",
          "Day 25: Share your progress with your close friend—report what you've finished this week and what you're working on next",
          "Day 26: Finish something meaningful today without external pressure—just because you're becoming someone who follows through",
          "Day 27: Track your daily completions this week—notice if the identity of someone who finishes what they start is starting to feel real",
          "Day 28: Reflect on the past 4 weeks—write down what shifted, what you finished, and what you're capable of when you push through",
          "Day 29: Choose one larger goal for next month—anchor it to your morning routine and share it with your close friend",
          "Day 30: Celebrate 30 days of intentional completion—you've proven you can finish what you start when you work with your nervous system instead of against it",
        ],
        week_1_marker:
          "You can name the exact moment the momentum dip starts and what emotion shows up right before it",
        week_2_marker:
          "You've completed 7 consecutive days of finishing one thing fully without skipping or switching halfway through",
        week_3_marker:
          "You finish something meaningful that required pushing through the dip—and you notice the belief shift that comes with it",
        week_4_marker:
          "You've finished 4 consecutive weeks of intentional completion—and the identity of someone who follows through is starting to feel real",
        why_this_works:
          "You already never skip your morning water and plan check—anchoring completion to that existing habit removes the willpower requirement and proves you can finish without external pressure",
        specific_action:
          "Right after checking your plan tomorrow morning, choose one task that matters and commit to finishing it fully—no partial completion, no switching halfway through",
        week_1_chapters: "Chapters 1-3",
        week_1_practice:
          "Every time you feel energy drop or fog roll in, pause and take 3 deep breaths—just notice the pattern without judgment",
        week_2_chapters: "Chapters 4-6",
        week_2_practice:
          "Anchor one daily completion to your morning water and plan check—finish something before you move on to the rest of your day",
        week_3_chapters: "Chapters 7-9",
        week_3_practice:
          "Choose one project that has a momentum dip halfway through—use breath, movement, or external accountability to finish it strong",
        week_4_practice:
          "Track completion, not just effort—at the end of each day, write down what you finished fully, not just what you worked on",
        progress_markers: [
          "You notice the momentum dip starting but choose one small action to push through instead of switching to easier tasks",
          "You finish something meaningful without external pressure or a hard deadline—just because you said you would",
          "You can name the exact moment your nervous system wants to shut down and use breath or movement to stay present through it",
        ],
        support_check_in:
          "Text your close friend this week and tell him you're working on finishing strong—ask him to check in on you when things get hard",
        urgency_statement:
          "If you stay in this pattern for another month, you'll have more proof that you can't sustain what you start—and that belief will compound into your identity faster than any external success can undo it",
        immediate_practice:
          "Before you tackle your next meaningful task, use the 4-4-6 breath pattern from the book—in for 4 counts, hold for 4, out for 6—to regulate your nervous system before the momentum dip hits",
        thirty_day_approach:
          "Build the identity of someone who finishes what they start by tracking completion, not just effort—every time you push through the momentum dip, you're rewiring the belief that sustained visibility is dangerous",
        weekly_recommendation:
          "Every Sunday, share one specific goal with your close friend—then report progress by Friday, creating the external accountability loop that already works for you",
        environmental_optimization:
          "Remove the phone from your workspace during deep work blocks—reduce the friction between momentum dip and quick escape by creating distance from your go-to distraction",
        seventy_two_hour_suggestion:
          "Anchor one meaningful task completion to your morning water and plan check—within 72 hours, finish one thing that matters and proves you can cross the finish line",
      },
      bottom_line_breakdown: {
        the_truth:
          "You're capable of more than this pattern allows. The protection it once offered—keeping you safe from judgment and pressure—now limits your potential. You already know this. That's why you're here. The capability is there. The proof is there. What's missing is the willingness to be seen consistently—and that's what the next 30 days are designed to build.",
        your_proof:
          "When you've had a clear deadline and someone counting on you, you've locked in and pushed through the momentum dip. External accountability gave you the structure to finish strong—which means the capability is already there. You just need to build the internal version of that accountability so you're not dependent on external pressure to follow through.",
        what_it_costs:
          "You didn't name a specific cost when asked, but the pattern itself tells the story—every time you lose momentum halfway through, you reinforce the belief that you can't sustain what you start. That belief compounds. It affects how you see yourself, how others see you, and what opportunities you're willing to pursue. The real cost isn't just unfinished projects—it's the identity of someone who starts but doesn't finish becoming your default.",
        pattern_restated:
          "You start strong on things but lose momentum halfway through—energy drops, fog rolls in, and easier tasks suddenly look more appealing",
        what_it_protects:
          "This pattern protects you from the pressure of being fully seen and the weight of sustained expectation. When you finish strong consistently, people expect it every time—and so do you. Staying in the dip keeps the spotlight dimmer, the stakes lower, and the judgment at bay. It lets you stay functional without carrying the full weight of what you're capable of.",
        what_happens_next:
          "Change requires you to act before you feel ready. To finish when it's uncomfortable. To trust the process when your nervous system screams at you to stop. You've done hard things before—you've shown up consistently even on low-energy days. You can do this. The next 30 days aren't about perfection—they're about proving to yourself that you can cross the finish line when it matters. One task at a time. One completed project at a time. Until finishing strong becomes who you are, not just what you do when someone's watching.",
      },
      development_reminders: [
        "Integration comes through consistent practice, not more awareness—you already have the insight; now you need the repetitions of finishing what you start",
        "Your nervous system is the foundation—regulate first, then grow; breath before action, presence before expansion, completion before more projects",
        "Your sabotage patterns have wisdom—this momentum dip kept you safe from judgment and pressure when you needed protection; honor it while updating it",
        "Identity shifts over time with deliberate practice—you're becoming someone who finishes strong consistently, one completed task at a time, one regulated moment at a time",
      ],
      nervous_system_assessment: {
        primary_state:
          "Mobilized alert—your system defaults to wired, functional stress with tight shoulders, shallow breathing, and a fast-running mind",
        regulation_reality:
          "Your nervous system has two distinct strategies—mobilized alert when pressure is external, shutdown when the threat feels internal or sustained. The good news is you recover quickly, which means your window of tolerance is functional. The challenge is learning to stay present through the momentum dip without triggering the shutdown response.",
        observable_patterns:
          "Under stress: tight and alert, shoulders tense, breathing shallow, mind running fast. When avoiding: energy drops, fog rolls in, easier tasks become more appealing. You said your body kind of hits the brakes—that's dorsal vagal shutdown kicking in to reduce perceived threat.",
        regulation_capacity:
          "Developing—you recover quickly once pressure eases, but the wired-to-shutdown shift happens automatically when avoidance kicks in",
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
