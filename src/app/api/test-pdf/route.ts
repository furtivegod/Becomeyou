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
        "This assessment revealed the protective mechanisms that keep you safe from disconnection and judgment, while simultaneously blocking the financial success and visibility you're capable of achieving.",
      disclaimer:
        "This assessment reflects patterns observed in our conversation and is designed to support your growth. It's a starting point for exploration, not a clinical diagnosis. Real change happens through consistent practice and support.",
      client_name: "Client",
      assessment_date: "2025",
      assessment_overview:
        "You've been carrying a protection strategy that's kept you connected but cost you your visibility. Today you've uncovered not just the freeze pattern around money, but why it exists—success once meant disconnection from people who mattered. The good news? You've already proven you can take action despite fear. You catch your nervous system responses in real time now instead of days later. That's massive progress. More importantly, you know staying small isn't actually keeping you safe anymore—it's keeping you stuck.",
      development_profile:
        "You're someone who takes action despite fear and anxiety. That's not common—most people wait until they feel ready. You've also built real nervous system awareness, catching stress responses in real time instead of days later. But you're running a deep protection pattern: staying small keeps you connected. Early on, you learned that success brings criticism and disconnection. People told you don't forget where you come from when you thought you were making them proud. So now, right when it's time to promote your work and earn money, your body hits the shutdown button—chest pressure, confusion, freeze. The pattern is working perfectly to keep you safe from the thing you learned to fear: being visible and alone. But staying stuck isn't keeping you connected anymore. It's just keeping you invisible.",
      smart_roadmap: {
        see_brief:
          "You freeze when it's time to promote your work and earn money. This shows up as confusion, chest pressure, and shutting down right at the moment of visibility. It matters because it's blocking your income and keeping your work hidden.",
        map_brief:
          "Your nervous system runs activated—shoulders tense, focus scatters under stress. You've built capacity to catch it in real time and breathe through it, but the anxiety still runs intense. That's progress from taking days to recover.",
        address_brief:
          "This started when early success brought criticism instead of pride. People said don't forget where you come from, you're not better than anyone. Your nervous system learned: visibility equals disconnection from people you love.",
        rewire_brief:
          "Within 72 hours: After your morning routine (the habit that never breaks), spend 5 minutes writing one authentic post about your work. Don't edit. Don't perfect it. Just write and publish. This trains your nervous system that visibility doesn't equal abandonment.",
        transform_brief:
          "Daily visibility practice—one authentic share about your work before noon. Track when the freeze response starts. Breathe through it. Post anyway. Your nervous system needs repetitions to update the old program.",
      },
      sabotage_analysis: {
        protective_pattern:
          "You freeze at the exact moment you need to promote your work and earn money. This pattern shows up most when visibility and recognition are required. When you notice it starting, you'll likely feel chest pressure and confusion first—that's your early warning signal. The faster you catch it, the faster you can choose differently.",
        what_its_protecting_from:
          "Disconnection from people you care about. Being judged, criticized, or told you're not better than anyone. Having to prove you can sustain success and meet higher expectations.",
        how_it_serves_you:
          "Staying stuck protects you from stepping into a bigger version of yourself. You avoid higher expectations, more responsibility, the pressure to keep showing up. You never have to risk disappointing people or proving you're actually capable. Staying small feels safer than being visible and potentially alone.",
        go_to_patterns:
          "Phone scrolling for quick escape—a couple hours daily without noticing. Watching random videos and checking messages when pressure builds instead of sitting with discomfort.",
        success_proof:
          "You've pushed through this pattern before when you stopped overthinking. You take action despite fear and anxiety—that's full commitment. You've also built the capacity to catch stress in real time and regulate with breath, a massive shift from taking days to recover.",
        anchor: "Morning routine that never breaks",
        support_person: "Not yet identified",
        pattern_exact_words:
          "I freeze at the moment I need to promote my work. I shut down and feel stuck, get confused and can feel pressure build in my chest.",
        pattern_reframe:
          "What I'm hearing: Your nervous system perceives visibility as a threat to connection. When it's time to be seen with your work, your body activates a shutdown response—chest pressure, confusion, freeze. This is dorsal vagal shutdown, your system's way of protecting you from what it learned early on: that being visible and successful means losing the people who matter.",
        what_its_costing:
          "Staying stuck keeps you invisible in work that requires you to be found. It's costing you income, impact, and the chance to prove to yourself that visibility doesn't have to mean disconnection. Every day you freeze at the promotion moment is another day your work stays hidden and your potential stays unrealized.",
        proof_with_context:
          "You've pushed through this freeze pattern before when you stopped overthinking and just acted. You describe yourself as fully committed—someone who takes action despite fear or anxiety. That's not everyone. You've also built massive nervous system capacity, going from taking days to recover from stress to catching it in real time and breathing through it. You already have proof you can do hard things and rewire old patterns.",
        personalized_insight:
          "You're not avoiding success—you're avoiding the disconnection you learned comes with it. This pattern kept you safe when being seen meant being criticized and losing people. But now it's keeping you invisible in work that requires visibility to grow. The protection is outdated. You can be successful and connected—but first your nervous system needs new proof that visibility doesn't equal abandonment.",
      },
      in_the_moment_reset:
        "When you notice the freeze pattern starting—chest pressure, confusion, that shutdown feeling—pause and take 3 deep breaths: in for 4 counts, hold for 4, out for 6. Then ask yourself: What's one small thing I can do right now that moves me toward visibility instead of hiding? It won't stop the pattern completely at first, but it creates the gap where choice becomes possible.",
      domain_breakdown: {
        mind: {
          current_level:
            "Exploration—you have awareness of your patterns and can catch them in real time, but consistent follow-through when it matters most is still developing",
          current_phase:
            "Experimentation—you're testing what works to push through the freeze response, but haven't yet built the consistent practice that makes visibility automatic",
          key_strengths:
            "Strong self-awareness. You catch your stress responses in real time now instead of days later. You're willing to take action despite fear. You can name your patterns clearly.",
          growth_opportunities:
            "Building tolerance for sustained visibility. Training your mind to stay present when the freeze response activates instead of reaching for distraction. Developing a consistent promotion practice that doesn't depend on feeling ready.",
          block:
            "Overthinking at the moment of action. Your mind runs the old story that visibility equals disconnection, triggering confusion and shutdown right when you need to promote your work.",
        },
        body: {
          current_level:
            "Foundation—you've built the capacity to notice body signals and use breath for regulation, but your baseline still runs activated with intense anxiety",
          current_phase:
            "Integration—you're actively using regulation tools like breath work, and you're building the reps needed to lower your baseline activation over time",
          key_strengths:
            "You can catch tension in your shoulders and recognize when focus scatters. You've gone from taking days to recover from stress to regulating in real time with breath. That's significant nervous system progress.",
          growth_opportunities:
            "Deepening your capacity to stay regulated during visibility moments. Building more somatic practices that discharge activation before it builds into shutdown. Learning to recognize the early body signals before the freeze takes over.",
          block:
            "Shutdown response with chest pressure and confusion when things feel too big. Your body hits the brakes hard to protect you from perceived threat, making it difficult to take visible action in those critical moments.",
        },
        relationships_meaning: {
          current_level:
            "Foundation—you're aware of the connection pattern driving your behavior, but you haven't yet built a support system or updated the belief that success equals disconnection",
          current_phase:
            "Friction—the old story that being successful means losing connection is still running your nervous system's response to visibility",
          key_strengths:
            "Deep awareness of how early experiences shaped your relationship to visibility and success. You can clearly name the messages you received and how they still impact you.",
          growth_opportunities:
            "Finding evidence that you can be successful and connected. Building relationships with people who celebrate your visibility instead of criticizing it. Identifying support people who can anchor you when the old story activates.",
          block:
            "The belief that visibility and success mean disconnection from people you care about. Until your nervous system has proof that you can be seen and still belong, it will keep protecting you from promotion moments.",
        },
        contribution: {
          current_level:
            "Foundation—you have work you're proud of, but the freeze pattern around promotion is blocking your ability to share it consistently and earn from it",
          current_phase:
            "Friction—you're stuck between wanting to contribute and share your work, and the nervous system response that shuts you down at the moment of visibility",
          key_strengths:
            "You care about your work quality. You've built something worth promoting. You're capable of taking action despite fear when you stop overthinking.",
          growth_opportunities:
            "Developing a consistent visibility practice that doesn't require you to feel ready. Building evidence that promoting your work doesn't lead to judgment or disconnection. Learning to share imperfectly and often.",
          block:
            "Freezing at the promotion moment. Your nervous system perceives sharing your work as a threat, triggering shutdown right when you need to be visible. This keeps your contribution hidden and blocks your income.",
        },
      },
      nervous_system_assessment: {
        primary_state:
          "Activated baseline with shutdown response under pressure. You run sympathetic activation—tense shoulders, scattered focus—until things feel too big, then your system shifts into dorsal vagal shutdown with chest pressure and confusion.",
        regulation_capacity:
          "Developing—you've built the ability to catch stress in real time and use breath to regulate, which is significant progress from taking days to recover. But your baseline still runs intense anxiety even when you're using regulation tools.",
        observable_patterns:
          "You said: I get tense in the shoulders and lose focus under stress. I shut down and feel stuck, get confused and can feel pressure build in my chest when avoiding something important. I can catch it in real time now and keep my composure, then quickly do a few deep breaths to calm down, but I still feel the anxiety pretty intensely.",
        regulation_reality:
          "Your nervous system has learned to perceive visibility as a threat to connection. When it's time to promote your work, your body activates the shutdown response to protect you from what it learned early on: that being seen means being criticized and losing people. The regulation tools you're using are working—you're catching responses faster—but the pattern is deeply wired. Consistent practice with small doses of visibility will gradually retrain your system to tolerate being seen without triggering shutdown.",
      },
      thirty_day_protocol: {
        seventy_two_hour_suggestion:
          "After your morning routine, spend 5 minutes writing one authentic post about your work. Don't edit. Don't perfect it. Just write and publish.",
        anchor_habit: "Morning routine that never breaks",
        specific_action: "Write and publish one authentic post about your work",
        time_reps: "5 minutes",
        why_this_works:
          "This works because it gives your nervous system small doses of the thing it's been protecting you from—visibility—without the stakes being life or death. Anchoring it to your morning routine means you're acting before overthinking takes over. Publishing without editing trains your system that being seen imperfectly doesn't lead to disconnection.",
        urgency_statement:
          "Staying stuck for another month means another month of your work staying hidden. Another month of blocking your income at the exact moment you need to promote it. Another month of your nervous system running the old story that visibility equals disconnection, while the real cost is staying invisible in work that requires you to be found.",
        immediate_practice:
          "Before your next visibility moment, use the breath regulation you've already built—in for 4, hold for 4, out for 6. Notice the chest pressure and confusion starting. Name it: this is my nervous system trying to protect me. Then take one small visible action anyway.",
        thirty_day_approach:
          "Build a consistent visibility habit that trains your nervous system that being seen doesn't equal disconnection. Start with small, imperfect shares. Track the freeze response but post anyway. Gradually increase the visibility stakes as your system builds tolerance.",
        weekly_recommendation:
          "Daily visibility practice before noon—one authentic share about your work. Track when the freeze response starts. Breathe through it. Post anyway.",
        environmental_optimization:
          "Remove phone scrolling triggers during work hours—put phone in another room or use app blockers during your morning visibility practice time.",
        support_check_in:
          "Identify one person who celebrates your visibility and share your 72-hour goal with them. Ask them to check in with you after you post.",
        progress_markers: [
          "You post about your work without waiting to feel ready",
          "The freeze response still shows up but doesn't stop you from taking action",
          "You notice the chest pressure and confusion starting earlier and can breathe through it before shutdown takes over",
        ],
        week_1_focus:
          "Building awareness of the freeze pattern and catching it earlier",
        week_1_chapters:
          "Foundation chapters on nervous system states and protection patterns",
        week_1_practice:
          "Daily: Notice when the freeze response starts. Name it. Breathe through it. Take one small visible action.",
        week_1_marker:
          "You can identify the freeze response before it leads to full shutdown",
        week_2_focus:
          "Consistent visibility practice anchored to your morning routine",
        week_2_chapters:
          "Chapters on rewiring patterns and building new neural pathways",
        week_2_practice:
          "Daily: After morning routine, write and publish one authentic post about your work without editing",
        week_2_marker:
          "You post at least 5 times this week, even when the freeze response shows up",
        week_3_focus:
          "Increasing visibility stakes while maintaining regulation",
        week_3_chapters:
          "Chapters on building capacity and tolerating discomfort",
        week_3_practice:
          "Daily: Post about your work and include a clear call to action or promotion. Track your nervous system response.",
        week_3_marker:
          "You can promote your work directly without triggering full shutdown",
        week_4_focus: "Integration—visibility becomes part of your identity",
        week_4_practice:
          "Daily visibility plus one bigger promotion action (email list, offer, etc.). Continue tracking and regulating through discomfort.",
        week_4_marker:
          "You've built 30 days of consistent visibility. The freeze response shows up but doesn't stop you. You have proof you can be seen and still belong.",
      },
      bottom_line:
        "You freeze at the moment you need to promote your work and earn money. This isn't a discipline problem or a character flaw. It's your nervous system doing exactly what it learned to do early on: protect you from disconnection. When you succeeded or got recognition as a kid, people criticized you instead of celebrating you. They said don't forget where you come from, you're not better than anyone. You thought you were making them proud, but visibility brought judgment and distance. So your system learned: stay small, stay connected. Be visible, be alone.\n\nThat pattern is costing you income, impact, and the chance to prove to yourself that success doesn't have to mean losing people. Every day you freeze at the promotion moment is another day your work stays hidden and your potential stays unrealized. Staying stuck isn't keeping you safe anymore. It's just keeping you invisible in work that requires visibility to grow. The people who criticized you aren't the people you're serving now. But your nervous system doesn't know that yet—it's still running the old program.\n\nHere's the truth: you're capable of more than this pattern allows. You've already proven it. You take action despite fear. You've built the capacity to catch your stress responses in real time instead of days later. You've pushed through the freeze before when you stopped overthinking. The protection your nervous system is offering is outdated. You can be successful and connected—but first you need to give your system new proof. That means taking visible action before you feel ready. Publishing imperfectly. Promoting your work when the chest pressure and confusion show up. Breathing through it and doing it anyway. You've done hard things before. You can do this. The only question is: are you willing to be uncomfortable long enough for your nervous system to learn a new story?",
      bottom_line_breakdown: {
        pattern_restated:
          "You freeze at the exact moment you need to promote your work and earn money, shutting down with chest pressure and confusion right when visibility is required",
        what_it_protects:
          "This pattern protects you from the disconnection you learned comes with success. Early on, when you succeeded or got recognition, people criticized you instead of celebrating you. They told you don't forget where you come from, you're not better than anyone. You thought you were making them proud, but visibility brought judgment and distance. Your nervous system learned: be visible, be alone. So now it shuts you down to keep you safe from that perceived threat.",
        what_it_costs:
          "Staying stuck keeps you invisible in work that requires you to be found. It's costing you income, impact, and the chance to prove to yourself that visibility doesn't have to mean disconnection. Every day you freeze at the promotion moment is another day your work stays hidden and your potential stays unrealized.",
        the_truth:
          "You're capable of more than this pattern allows. The protection it once offered now limits your potential and keeps your work hidden. You know this already—that's why you're here. The people who criticized you aren't the people you're serving now, but your nervous system doesn't know that yet. It's still running the old program.",
        your_proof:
          "You've pushed through this freeze pattern before when you stopped overthinking and just acted. You take action despite fear and anxiety—that's full commitment, not everyone does that. You've also built massive nervous system capacity, going from taking days to recover from stress to catching it in real time and breathing through it. You already have proof you can do hard things and rewire old patterns.",
        what_happens_next:
          "Change requires you to act before you feel ready. To publish imperfectly and promote your work when the chest pressure and confusion show up. To breathe through it and do it anyway, giving your nervous system small doses of visibility until it learns a new story: you can be seen and still belong. You've done hard things before. You can do this.",
      },
      reminder_quote: "I thought I was making them proud",
      quote_attribution: "From your assessment",
      development_reminders: [
        "Integration comes through consistent practice, not more awareness—you already have the insight about your freeze pattern; now you need the repetitions of posting anyway",
        "Your nervous system is the foundation—regulate first, then promote; breath before action, presence before visibility",
        "Your sabotage pattern has wisdom—it kept you connected when being seen felt dangerous; honor it while updating it with new proof that visibility doesn't equal abandonment",
        "Identity shifts over time with deliberate practice—you're becoming someone who can be visible and successful without losing connection, one regulated post at a time",
      ],
      book_recommendation:
        "The Body Keeps the Score by Bessel van der Kolk. This book will help you understand why your nervous system learned to perceive visibility as a threat and how trauma responses like shutdown operate below conscious awareness. Given that you've already built capacity to catch your responses in real time, this will give you the neuroscience framework to understand what you're working with and why consistent somatic practice—not just cognitive awareness—is what rewires these deep patterns.",
      next_assessment: {
        focus_areas:
          "Next phase will focus on sustaining visibility practice, building support network, deepening regulation capacity, and exploring bigger promotion opportunities as nervous system tolerance increases",
        stay_connected:
          "Join the newsletter for weekly regulation practices and visibility reminders. Consider community support for ongoing accountability as you build this new pattern.",
        monthly_check_in:
          "Monthly Check-In: Brief progress review tracking visibility frequency, regulation capacity, and income changes",
        six_month_follow_up:
          "6-Month Follow-Up Assessment recommended to track nervous system capacity growth and visibility pattern shifts",
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
