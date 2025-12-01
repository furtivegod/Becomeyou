import { supabaseAdmin as supabase } from "@/lib/supabase";

// Function to break text into paragraphs after every 2 sentences and bold quoted text
function formatTextWithParagraphBreaks(text: string | undefined): string {
  if (!text) return "";

  // Bold any quoted text using double quotes only (Claude now uses double quotes for client quotes)
  // This avoids conflicts with contractions that use single quotes
  let formattedText = text.replace(/(")([^"]+)\1/g, "<strong>$1$2$1</strong>");

  // Split by sentences (ending with . ! or ?)
  const sentences = formattedText
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim());

  // Group sentences into paragraphs of 2
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const paragraphSentences = sentences.slice(i, i + 3);
    paragraphs.push(paragraphSentences.join(" "));
  }

  // Return as HTML paragraphs
  return paragraphs.map((paragraph) => `<p>${paragraph.trim()}</p>`).join("");
}

export interface PlanData {
  title: string;
  overview: string;
  assessment_overview?: string;
  development_profile?: string;
  bottom_line?: string;
  assessment_date?: string;
  disclaimer?: string;
  sabotage_analysis?: {
    protective_pattern?: string;
    what_its_protecting_from?: string;
    how_it_serves_you?: string;
    go_to_patterns?: string;
    success_proof?: string;
    anchor?: string;
    support_person?: string;
    // V3.0 fields
    pattern_exact_words?: string; // Client's exact words describing their sabotage behavior
    pattern_reframe?: string; // Reframe in nervous system language ("What I'm hearing")
    what_its_costing?: string; // Their actual answer to "What would it cost you to stay exactly where you are for another year?"
    proof_with_context?: string; // Specific past success with context
    personalized_insight?: string; // 2-3 sentences connecting pattern → protection → cost → possibility
  };
  in_the_moment_reset?: string;
  domain_breakdown?: {
    mind?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
      // V3.0 fields
      block?: string; // Primary mental obstacle
    };
    body?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
      // V3.0 fields
      block?: string; // Primary physical/regulation obstacle
    };
    relationships_meaning?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
      // V3.0 fields
      block?: string; // Primary connection obstacle
    };
    contribution?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
      // V3.0 fields
      block?: string; // Primary impact obstacle
    };
  };
  nervous_system_assessment?: {
    primary_state?: string;
    regulation_capacity?: string;
    observable_patterns?: string;
    regulation_reality?: string;
  };
  thirty_day_protocol?: {
    seventy_two_hour_suggestion?: string;
    weekly_recommendation?: string;
    thirty_day_approach?: string;
    environmental_optimization?: string;
    support_check_in?: string;
    progress_markers?: string[];
    daily_actions?: string[];
    weekly_goals?: string[];
    // V3.0 fields
    anchor_habit?: string; // Anchor habit for 72-hour action
    specific_action?: string; // Specific action to take
    time_reps?: string; // Time/reps for action
    why_this_works?: string; // Brief explanation tied to their pattern
    urgency_statement?: string; // Cost of waiting another month
    week_1_focus?: string;
    week_1_chapters?: string;
    week_1_practice?: string;
    week_1_marker?: string;
    week_2_focus?: string;
    week_2_chapters?: string;
    week_2_practice?: string;
    week_2_marker?: string;
    week_3_focus?: string;
    week_3_chapters?: string;
    week_3_practice?: string;
    week_3_marker?: string;
    week_4_focus?: string;
    week_4_practice?: string;
    week_4_marker?: string;
    immediate_practice?: string; // Practice from book applied to their specific life
  };
  reminder_quote?: string;
  development_reminders?: string[];
  book_recommendation?: string;
  resources?: string[];
  reflection_prompts?: string[];
  next_assessment?: {
    stay_connected?: string;
  };
  // V3.0 fields
  smart_roadmap?: {
    see_brief?: string; // S - SEE THE PATTERN brief
    map_brief?: string; // M - MAP THE NERVOUS SYSTEM brief
    address_brief?: string; // A - ADDRESS THE ROOT CAUSE brief
    rewire_brief?: string; // R - REWIRE THE RESPONSE (72-Hour Action) brief
    transform_brief?: string; // T - TRANSFORM BEHAVIOR (30-Day Focus) brief
  };
  bottom_line_breakdown?: {
    pattern_restated?: string;
    what_it_protects?: string;
    what_it_costs?: string;
    the_truth?: string;
    your_proof?: string;
    what_happens_next?: string;
  };
  pull_quote?: string; // Direct quote from client's assessment
  quote_attribution?: string; // Quote attribution text
}

export async function generatePDF(
  planData: PlanData,
  sessionId: string
): Promise<{ pdfUrl: string; pdfBuffer: Buffer }> {
  try {
    console.log("Generating PDF for session:", sessionId);
    console.log("Plan data received:", {
      title: planData.title,
      overview: planData.overview,
      daily_actions_count:
        planData.thirty_day_protocol?.daily_actions?.length || 0,
      weekly_goals_count:
        planData.thirty_day_protocol?.weekly_goals?.length || 0,
      resources_count: planData.resources?.length || 0,
      reflection_prompts_count: planData.reflection_prompts?.length || 0,
    });

    // Check for PDFShift API key
    if (!process.env.PDFSHIFT_API_KEY) {
      console.error("PDFSHIFT_API_KEY not configured");
      throw new Error("PDF generation service not configured");
    }

    // Get user information for client name
    console.log("Fetching user information for client name");
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    let clientName = "Client";
    if (!sessionError && sessionData) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email, user_name")
        .eq("id", sessionData.user_id)
        .single();

      if (!userError && userData) {
        // Use user_name if available, otherwise extract from email
        if (userData.user_name) {
          clientName = userData.user_name;
        } else {
          // Extract name from email if no name is provided
          const emailName = userData.email.split("@")[0];
          clientName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        console.log("Client name determined:", clientName);
      }
    }

    // Validate data
    if (
      !planData.thirty_day_protocol?.daily_actions ||
      !Array.isArray(planData.thirty_day_protocol.daily_actions)
    ) {
      if (!planData.thirty_day_protocol) planData.thirty_day_protocol = {};
      planData.thirty_day_protocol.daily_actions = [];
    }
    if (
      !planData.thirty_day_protocol?.weekly_goals ||
      !Array.isArray(planData.thirty_day_protocol.weekly_goals)
    ) {
      if (!planData.thirty_day_protocol) planData.thirty_day_protocol = {};
      planData.thirty_day_protocol.weekly_goals = [];
    }
    if (!planData.resources || !Array.isArray(planData.resources)) {
      planData.resources = [];
    }
    if (
      !planData.reflection_prompts ||
      !Array.isArray(planData.reflection_prompts)
    ) {
      planData.reflection_prompts = [];
    }

    // Generate HTML content with client name
    const htmlContent = generateHTMLReport(planData, clientName);

    // Convert HTML to PDF using PDFShift
    console.log("Converting HTML to PDF using PDFShift...");
    const pdfBuffer = await convertHTMLToPDF(htmlContent, clientName);

    // Store PDF in Supabase Storage
    const fileName = `protocol-${sessionId}-${Date.now()}.pdf`;
    const filePath = `reports/${fileName}`;

    console.log("Storing PDF in Supabase Storage:", filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log("PDF uploaded successfully:", uploadData.path);

    // Generate signed URL for the PDF
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("reports")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    const signedUrl = signedUrlData.signedUrl;
    console.log("Signed URL generated successfully");

    // Store PDF metadata in database
    const { error: dbError } = await supabase.from("pdf_jobs").insert({
      session_id: sessionId,
      status: "completed",
      pdf_url: signedUrl,
      file_path: filePath,
    });

    if (dbError) {
      console.error("Error storing PDF metadata:", dbError);
    }

    return { pdfUrl: signedUrl, pdfBuffer };
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function convertHTMLToPDF(
  htmlContent: string,
  clientName: string = "Client"
): Promise<Buffer> {
  try {
    // Create footer HTML with PDFShift variables - matching template design
    const footerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 20px; border-top: 1px solid #3D4D2E; border-bottom: 1px solid #3D4D2E; font-size: 11px; color: #666; background: #F5F3ED; font-family: 'Inter', Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;"><div>${clientName}</div><div>S.M.A.R.T.</div></div>`;

    const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: htmlContent,
        format: "A4",
        margin: "15mm",
        footer: {
          source: footerHTML,
          height: "40px", // Space between content and footer
          start_at: 1, // Start footer from page 1
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PDFShift API error:", response.status, errorText);
      throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log("PDF generated successfully via PDFShift");
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDFShift conversion error:", error);
    throw new Error(
      `Failed to convert HTML to PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Smart content splitting based on estimated height
function splitContentByHeight(
  items: string[],
  maxItemsPerPage: number = 15
): string[][] {
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentItemCount = 0;

  items.forEach((item, index) => {
    // Estimate item height based on content length
    const estimatedHeight = Math.ceil(item.length / 80) * 1.6; // Rough line estimation
    const maxHeightPerPage = 20; // Estimated max lines per page

    // If adding this item would exceed page capacity, start new page
    if (
      currentItemCount >= maxItemsPerPage ||
      (currentPage.length > 0 && estimatedHeight > maxHeightPerPage)
    ) {
      pages.push([...currentPage]);
      currentPage = [];
      currentItemCount = 0;
    }

    currentPage.push(item);
    currentItemCount++;
  });

  // Add remaining items
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function generateHTMLReport(
  planData: PlanData,
  clientName: string = "Client"
): string {
  // Extract the real data from the assessment
  const assessmentDate =
    planData.assessment_date ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const disclaimer =
    planData.disclaimer ||
    "This assessment is a tool for personal development and self-awareness. It is not a diagnostic tool and does not replace professional mental health support. If you are experiencing a mental health crisis, please contact a qualified professional or crisis support service.";
  const assessmentOverview =
    planData.assessment_overview ||
    "Your personalized assessment has been completed. This report provides insights into your behavioral patterns and recommendations for growth.";
  const developmentProfile =
    planData.development_profile ||
    "Based on your responses, you've shown clear patterns of behavior and areas where you're ready for transformation.";
  const bottomLine =
    planData.bottom_line ||
    "You have the capacity for growth and transformation. The key is to start with what's already working and build from there.";
  const reminderQuote =
    planData.reminder_quote || "Remember: progress, not perfection.";

  // Extract sabotage analysis (V3.0 compatible)
  const sabotageAnalysis = planData.sabotage_analysis || {};
  const protectivePattern =
    sabotageAnalysis.protective_pattern ||
    "Based on your responses, you have protective patterns that serve important functions in your life.";
  const whatItsProtectingFrom =
    sabotageAnalysis.what_its_protecting_from ||
    "These patterns protect you from experiences you find challenging.";
  const howItServesYou =
    sabotageAnalysis.how_it_serves_you ||
    "These patterns provide you with safety and comfort in difficult situations.";
  const goToPatterns =
    sabotageAnalysis.go_to_patterns ||
    "Your current patterns help you navigate daily life and challenges.";
  const successProof =
    sabotageAnalysis.success_proof ||
    "You've demonstrated the ability to overcome challenges in the past.";
  const anchor =
    sabotageAnalysis.anchor ||
    "You have existing habits that provide stability and can be leveraged for growth.";
  const supportPerson =
    sabotageAnalysis.support_person ||
    "Identify someone in your life who would support your change.";

  // V3.0 specific fields
  const patternExactWords =
    sabotageAnalysis.pattern_exact_words || protectivePattern;
  const patternReframe = sabotageAnalysis.pattern_reframe || protectivePattern;
  const whatItsCosting =
    sabotageAnalysis.what_its_costing ||
    "The cost of staying stuck is real, even if you haven't quantified it yet.";
  const proofWithContext = sabotageAnalysis.proof_with_context || successProof;
  const personalizedInsight =
    sabotageAnalysis.personalized_insight || developmentProfile;

  // Extract in-the-moment reset
  const inTheMomentReset =
    planData.in_the_moment_reset ||
    'When you notice the pattern starting, pause and take 3 deep breaths—in for 4 counts, hold for 4, out for 6. Then ask yourself: "What\'s one small thing I can do right now that moves me forward instead of away?"';

  // Extract domain breakdown with new nested structure
  const domainBreakdown = planData.domain_breakdown || {};
  const mindDomain = domainBreakdown.mind || {
    current_level:
      "Your mental approach shows both strengths and areas for development.",
    current_phase: "Your current phase of development.",
    key_strengths: "Your key mental strengths and capabilities.",
    growth_opportunities: "Areas where you can grow and develop further.",
  };
  const bodyDomain = domainBreakdown.body || {
    current_level:
      "Your relationship with your physical self has both supportive and challenging aspects.",
    current_phase: "Your current phase of physical development.",
    key_strengths: "Your key physical strengths and capabilities.",
    growth_opportunities: "Areas where you can grow and develop further.",
  };
  const relationshipsMeaningDomain = domainBreakdown.relationships_meaning || {
    current_level:
      "Your relationships and meaning provide both support and growth opportunities.",
    current_phase: "Your current phase of relational and meaning development.",
    key_strengths:
      "Your key relational and meaning strengths and capabilities.",
    growth_opportunities: "Areas where you can grow and develop further.",
  };
  const contributionDomain = domainBreakdown.contribution || {
    current_level:
      "Your approach to work and contribution shows both current capabilities and potential for expansion.",
    current_phase: "Your current phase of contribution development.",
    key_strengths: "Your key contribution strengths and capabilities.",
    growth_opportunities: "Areas where you can grow and develop further.",
  };

  // Extract nervous system assessment with new structure
  const nervousSystemAssessment = planData.nervous_system_assessment || {
    primary_state:
      "Your nervous system shows patterns of both activation and regulation that we can work with.",
    regulation_capacity: "Your capacity for regulation and self-regulation.",
    observable_patterns:
      "Patterns you can observe in your nervous system responses.",
    regulation_reality:
      "The reality of your nervous system regulation capabilities.",
  };

  // Extract 30-day protocol (V3.0 compatible)
  const thirtyDayProtocol = planData.thirty_day_protocol || {};
  const seventyTwoHourSuggestion =
    thirtyDayProtocol.seventy_two_hour_suggestion ||
    "Start with one small, manageable action that builds on your existing strengths.";
  const weeklyRecommendation =
    thirtyDayProtocol.weekly_recommendation ||
    "Implement one consistent practice that supports your growth goals.";
  const supportCheckIn =
    thirtyDayProtocol.support_check_in ||
    "Share your progress with someone who supports your change.";
  const thirtyDayApproach =
    thirtyDayProtocol.thirty_day_approach ||
    "Focus on one key area of development that will have the most impact.";
  const environmentalOptimization =
    thirtyDayProtocol.environmental_optimization ||
    "Make one environmental change that supports your goals.";

  // V3.0 specific protocol fields
  const anchorHabit = thirtyDayProtocol.anchor_habit || anchor;
  const specificAction =
    thirtyDayProtocol.specific_action || seventyTwoHourSuggestion;
  const timeReps = thirtyDayProtocol.time_reps || "";
  const whyThisWorks = thirtyDayProtocol.why_this_works || "";
  const urgencyStatement = thirtyDayProtocol.urgency_statement || "";
  const immediatePractice = thirtyDayProtocol.immediate_practice || "";

  // V3.0 weekly breakdown
  const week1Focus = thirtyDayProtocol.week_1_focus || "";
  const week1Chapters = thirtyDayProtocol.week_1_chapters || "";
  const week1Practice = thirtyDayProtocol.week_1_practice || "";
  const week1Marker = thirtyDayProtocol.week_1_marker || "";
  const week2Focus = thirtyDayProtocol.week_2_focus || "";
  const week2Chapters = thirtyDayProtocol.week_2_chapters || "";
  const week2Practice = thirtyDayProtocol.week_2_practice || "";
  const week2Marker = thirtyDayProtocol.week_2_marker || "";
  const week3Focus = thirtyDayProtocol.week_3_focus || "";
  const week3Chapters = thirtyDayProtocol.week_3_chapters || "";
  const week3Practice = thirtyDayProtocol.week_3_practice || "";
  const week3Marker = thirtyDayProtocol.week_3_marker || "";
  const week4Focus = thirtyDayProtocol.week_4_focus || "";
  const week4Practice = thirtyDayProtocol.week_4_practice || "";
  const week4Marker = thirtyDayProtocol.week_4_marker || "";

  // Ensure arrays are properly validated
  const progressMarkers = Array.isArray(
    planData.thirty_day_protocol?.progress_markers
  )
    ? planData.thirty_day_protocol.progress_markers
    : [
        "Notice changes in your daily patterns",
        "Observe shifts in your stress response",
        "Track improvements in your target area",
      ];

  // This variable is no longer used - we use bookRecommendationText and selectedBooks instead
  // Keeping for reference but it's replaced by the logic below

  const dailyActions = Array.isArray(
    planData.thirty_day_protocol?.daily_actions
  )
    ? planData.thirty_day_protocol.daily_actions
    : [
        "Day 1: Start with 5 minutes of morning reflection on your goals",
        "Day 2: Practice one small action that moves you toward your main objective",
        "Day 3: Notice one pattern that serves you and one that doesn't",
      ];

  const weeklyGoals = Array.isArray(planData.thirty_day_protocol?.weekly_goals)
    ? planData.thirty_day_protocol.weekly_goals
    : [
        "Week 1: Establish a daily routine that supports your goals",
        "Week 2: Practice one new skill or habit consistently",
      ];

  const resources = Array.isArray(planData.resources)
    ? planData.resources
    : [
        "Daily journal for tracking progress and insights",
        "Accountability partner or support group",
      ];

  // Handle book recommendation - use provided string or select 1 book from list
  const allBooks = [
    {
      id: "body_keeps_score",
      title: "The Body Keeps the Score",
      author: "Bessel van der Kolk",
      url: "https://amzn.to/4hJB9wT",
      why: "The definitive text on trauma and nervous system. Directly addresses the core issue for most users stuck in sabotage patterns.",
      tags: [
        "trauma",
        "nervous system",
        "shutdown",
        "dorsal",
        "anxiety",
        "somatic",
        "regulation",
      ],
    },
    {
      id: "reclaim_nervous_system",
      title: "Reclaim Your Nervous System",
      author: "Mastin Kipp",
      url: "https://amzn.to/47xBpua",
      why: "Practical, accessible nervous system regulation. Bridges theory to action. Perfect for immediate implementation.",
      tags: [
        "regulation",
        "nervous system",
        "somatic",
        "anxiety",
        "shutdown",
        "freeze",
      ],
    },
    {
      id: "atomic_habits",
      title: "Atomic Habits",
      author: "James Clear",
      url: "https://amzn.to/431fR7V",
      why: "The behavior change bible. Supports building evidence through small actions.",
      tags: [
        "habits",
        "behavior",
        "consistency",
        "routine",
        "evidence",
        "practice",
      ],
    },
    {
      id: "how_to_do_the_work",
      title: "How to Do the Work",
      author: "Dr. Nicole LePera",
      url: "https://amzn.to/43y2mNa",
      why: "Combines shadow work, nervous system, and daily practices. Holistic approach.",
      tags: [
        "shadow",
        "trauma",
        "nervous system",
        "inner child",
        "therapy",
        "regulation",
      ],
    },
    {
      id: "atlas_of_the_heart",
      title: "Atlas of the Heart",
      author: "Brené Brown",
      url: "https://amzn.to/3JjyTjf",
      why: "Emotional literacy is foundational—users can't regulate what they can't name.",
      tags: [
        "emotion",
        "feelings",
        "language",
        "shame",
        "naming",
        "vocabulary",
      ],
    },
    {
      id: "future_self",
      title: "Be Your Future Self Now",
      author: "Dr. Benjamin Hardy",
      url: "https://amzn.to/4p3Rwaf",
      why: "Addresses identity transformation (Become). Practical framework for stepping into new identity.",
      tags: ["identity", "future self", "become", "vision", "self-concept"],
    },
    {
      id: "first_rule_of_mastery",
      title: "The First Rule of Mastery",
      author: "Dr. Michael Gervais",
      url: "https://amzn.to/4hx7Ld3",
      why: "Performance psychology for overthinkers and high performers.",
      tags: ["performance", "mind", "fear", "overthinking", "mastery"],
    },
    {
      id: "crucial_conversations",
      title: "Crucial Conversations",
      author: "Kerry Patterson",
      url: "https://amzn.to/49sdXkC",
      why: "Most relationship/career problems stem from poor communication.",
      tags: [
        "communication",
        "relationship",
        "conflict",
        "conversation",
        "boundaries",
      ],
    },
    {
      id: "deep_work",
      title: "Deep Work",
      author: "Cal Newport",
      url: "https://amzn.to/48UeonB",
      why: "Combats distraction and cheap dopamine. Teaches focus.",
      tags: [
        "focus",
        "distraction",
        "work",
        "attention",
        "dopamine",
        "productivity",
      ],
    },
    {
      id: "gifts_of_imperfection",
      title: "The Gifts of Imperfection",
      author: "Brené Brown",
      url: "https://amzn.to/3X35Svi",
      why: "Addresses perfectionism and shame—big sabotage drivers.",
      tags: ["perfectionism", "shame", "worthiness", "belonging"],
    },
    {
      id: "breath",
      title: "Breath: The New Science of a Lost Art",
      author: "James Nestor",
      url: "https://amzn.to/4ntDahQ",
      why: "Simple, science-backed practice with immediate nervous system benefits.",
      tags: ["breath", "breathing", "anxiety", "body", "calm"],
    },
    {
      id: "dose_effect",
      title: "The DOSE Effect",
      author: "TJ Power",
      url: "https://amzn.to/4oPrA1X",
      why: "Directly addresses dopamine and cheap dopamine loops.",
      tags: [
        "dopamine",
        "addiction",
        "phone",
        "scroll",
        "porn",
        "games",
        "Garden Scapes",
      ],
    },
    {
      id: "war_of_art",
      title: "The War of Art",
      author: "Steven Pressfield",
      url: "https://amzn.to/4ogrhgI",
      why: "Short, punchy, confrontational—great for breaking resistance and procrastination.",
      tags: [
        "resistance",
        "procrastination",
        "creative",
        "promotion",
        "visibility",
        "freeze",
      ],
    },
    {
      id: "polyvagal_therapy",
      title: "Polyvagal Theory in Therapy",
      author: "Deb Dana",
      url: "https://amzn.to/3Jt9gwr",
      why: "For dorsal shutdown or severe regulation issues.",
      tags: ["polyvagal", "shutdown", "dorsal", "therap*", "nervous system"],
    },
    {
      id: "mindset",
      title: "Mindset: The New Psychology of Success",
      author: "Carol Dweck",
      url: "https://amzn.to/47Lmb66",
      why: "Fixed vs. growth mindset foundational to development.",
      tags: ["mindset", "fixed", "growth", "beliefs"],
    },
  ];

  function getAssessmentText(pd: any): string {
    try {
      const parts = [
        pd?.assessment_overview,
        pd?.development_profile,
        pd?.bottom_line,
        pd?.sabotage_analysis?.anchor,
        pd?.sabotage_analysis?.success_proof,
        pd?.sabotage_analysis?.go_to_patterns,
        pd?.sabotage_analysis?.escape_behavior,
        pd?.sabotage_analysis?.positive_behavior,
        pd?.sabotage_analysis?.protective_pattern,
        pd?.sabotage_analysis?.what_its_protecting_from,
        pd?.nervous_system_assessment?.primary_state,
        pd?.nervous_system_assessment?.regulation_reality,
        pd?.nervous_system_assessment?.observable_patterns,
        Array.isArray(pd?.thirty_day_protocol?.weekly_goals)
          ? pd.thirty_day_protocol.weekly_goals.join(" ")
          : pd?.thirty_day_protocol?.weekly_goals,
        Array.isArray(pd?.thirty_day_protocol?.daily_actions)
          ? pd.thirty_day_protocol.daily_actions.join(" ")
          : pd?.thirty_day_protocol?.daily_actions,
      ].filter(Boolean);
      return String(parts.join(" \n ")).toLowerCase();
    } catch {
      return "";
    }
  }

  function selectTopOneBook(pd: any) {
    const text = getAssessmentText(pd);
    const scored = allBooks.map((b) => {
      const score = b.tags.reduce(
        (acc: number, tag: string) =>
          acc + (text.includes(tag.toLowerCase()) ? 1 : 0),
        0
      );
      // small boosts for common patterns
      const boosts =
        (text.includes("freeze") ||
        text.includes("resistance") ||
        text.includes("promotion")
          ? b.id === "war_of_art" || b.id === "deep_work"
            ? 1
            : 0
          : 0) +
        (text.includes("porn") ||
        text.includes("scroll") ||
        text.includes("garden scapes")
          ? b.id === "dose_effect"
            ? 1
            : 0
          : 0) +
        (text.includes("nervous system") ||
        text.includes("shutdown") ||
        text.includes("dorsal") ||
        text.includes("anxiety")
          ? b.id === "body_keeps_score" || b.id === "reclaim_nervous_system"
            ? 1
            : 0
          : 0) +
        (text.includes("identity") ||
        text.includes("become") ||
        text.includes("future self")
          ? b.id === "future_self"
            ? 1
            : 0
          : 0);
      return { book: b, score: score + boosts };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored
      .filter((s) => s.score > 0)
      .slice(0, 1)
      .map((s) => s.book);
    if (top.length < 1) {
      // sensible default
      const defaults = allBooks
        .filter((b) => ["atomic_habits"].includes(b.id))
        .slice(0, 1);
      return defaults;
    }
    return top;
  }

  // Use provided book_recommendation string if available, otherwise select 1 book
  const bookRecommendationText = planData.book_recommendation;
  // Always select a book so we have the URL for the hyperlink, even if bookRecommendationText is provided
  const selectedBooks = selectTopOneBook(planData);

  const reflectionPrompts = Array.isArray(planData.reflection_prompts)
    ? planData.reflection_prompts
    : [
        "What was one moment today where I felt truly aligned with my values?",
        "What pattern did I notice in myself today, and how did I respond?",
      ];

  const developmentReminders = Array.isArray(planData.development_reminders)
    ? planData.development_reminders
    : [
        "Integration comes through consistent practice, not more awareness—you already have the insight; now you need the repetitions",
        "Your nervous system is the foundation—regulate first, then grow; breath before action, presence before expansion",
        "Your sabotage patterns have wisdom—honor them while updating them; they kept you safe when safety was scarce",
        "Identity shifts over time with deliberate practice—you're becoming someone who can hold bigger energies responsibly, one regulated moment at a time",
      ];

  // V3.0 S.M.A.R.T. Roadmap
  const smartRoadmap = planData.smart_roadmap || {};
  const seeBrief =
    smartRoadmap.see_brief || "What you do, when, why it matters";
  const mapBrief =
    smartRoadmap.map_brief || "Your baseline state, regulation capacity";
  const addressBrief =
    smartRoadmap.address_brief || "Where this started, what it protected";
  const rewireBrief =
    smartRoadmap.rewire_brief || "One specific action to take in 72 hours";
  const transformBrief =
    smartRoadmap.transform_brief ||
    "The sustained practice that changes everything";

  // V3.0 Bottom Line Breakdown
  const bottomLineBreakdown = planData.bottom_line_breakdown || {};
  const patternRestated =
    bottomLineBreakdown.pattern_restated || protectivePattern;
  const whatItProtects =
    bottomLineBreakdown.what_it_protects || whatItsProtectingFrom;
  const whatItCosts = bottomLineBreakdown.what_it_costs || whatItsCosting;
  const theTruth = bottomLineBreakdown.the_truth || bottomLine;
  const yourProof = bottomLineBreakdown.your_proof || proofWithContext;
  const whatHappensNext =
    bottomLineBreakdown.what_happens_next ||
    "Change requires you to act before you feel ready. To follow through when it's uncomfortable. To trust the process when your nervous system screams at you to stop. You've done hard things before. You can do this.";

  // V3.0 Pull Quote - prioritize empowering quotes from success_proof, proof_with_context, or personalized_insight
  const pullQuote =
    planData.pull_quote ||
    proofWithContext ||
    successProof ||
    personalizedInsight ||
    reminderQuote;
  const quoteAttribution = planData.quote_attribution || "From your assessment";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${planData.title || "S.M.A.R.T. Assessment Report"}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --cream: #F5F3ED;
          --warm-white: #FFFFFF;
          --deep-charcoal: #1A1A1A;
          --soft-gold: #C9A875;
          --dark-olive: #3D4D2E;
          --lime-green: #7ED321;
        }
        
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11pt;
          font-weight: 400;
          line-height: 1.8;
          color: var(--deep-charcoal);
          overflow-x: hidden;
        }
        
        .page {
          min-height: 100vh;
          padding: 40px 30px;
          background: var(--warm-white);
          margin-bottom: 2px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          position: relative;
          page-break-after: always;
        }

        .page-content {
          max-width: 650px;
          margin: 0 auto;
          width: 100%;
        }

        /* COVER PAGE */
        .cover {
          background: linear-gradient(180deg, var(--warm-white) 0%, var(--cream) 100%);
          text-align: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        .cover::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(201, 169, 110, 0.03) 1px, rgba(201, 169, 110, 0.03) 2px),
            repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(201, 169, 110, 0.03) 1px, rgba(201, 169, 110, 0.03) 2px);
          background-size: 60px 60px;
          opacity: 0.5;
        }

        .cover-content {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .logo-mark {
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--soft-gold);
          margin: 0 0 80px 0;
          font-weight: 500;
          text-align: center;
        }

        h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 56px;
          font-weight: 700;
          color: var(--dark-olive);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 0 40px 0;
          text-align: center;
        }

        h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--dark-olive);
          line-height: 1.2;
          margin-bottom: 30px;
        }

        .client-name {
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.1em;
          color: #666;
          margin-bottom: 120px;
        }

        .cover-tagline {
          font-family: 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 500;
          color: var(--deep-charcoal);
          margin: 80px 0 0 0;
          line-height: 1.6;
          text-align: center;
        }

        /* SECTION HEADERS */
        .section-header {
          margin-bottom: 25px;
          text-align: center;
        }

        .section-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--soft-gold);
          margin-bottom: 20px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: var(--dark-olive);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        
        /* CONTENT BLOCKS */
        .content-block {
          margin: 25px 0;
        }

        .content-block:first-child {
          margin-top: 0;
        }

        .content-block:last-child {
          margin-bottom: 0;
        }

        .block-title {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--soft-gold);
          font-weight: 500;
          margin-bottom: 15px;
        }

        .block-content {
          font-size: 13px;
          line-height: 1.8;
          font-weight: 400;
        }

        .block-content p {
          margin-bottom: 16px;
          text-align: justify;
          line-height: 1.6;
        }

        .block-content p:last-child {
          margin-bottom: 0;
        }

        /* DOMAIN HERO */
        .domain-hero {
          font-size: 72px;
          font-weight: 700;
          color: var(--dark-olive);
          text-align: center;
          margin-bottom: 50px;
          letter-spacing: -0.03em;
          font-family: 'Playfair Display', serif;
        }

        /* METRICS */
        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: 20px 0;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }

        .metric-row:first-of-type {
          border-top: 1px solid rgba(0,0,0,0.08);
        }

        .metric-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--soft-gold);
          font-weight: 400;
        }

        .metric-value {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 400;
          margin-left: 60px;
        }

        /* PULL QUOTE */
        .pull-quote {
          margin: 40px 0;
          padding: 30px 0;
          border-top: 1px solid rgba(201, 169, 110, 0.3);
          border-bottom: 1px solid rgba(201, 169, 110, 0.3);
          text-align: center;
        }
        
        .pull-quote-text {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-style: italic;
          font-weight: 400;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        /* REMINDER BOX PAGE */
        .reminder-box-page {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* BOTTOM LINE */
        .bottom-line-page {
          background: var(--deep-charcoal);
          color: var(--warm-white);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bottom-line-page h2 {
          color: var(--warm-white);
        }

        .bottom-line-page p {
          font-size: 15px;
          line-height: 2;
          color: rgba(255,255,255,0.85);
        }


        .divider {
          width: 60px;
          height: 1px;
          background: var(--soft-gold);
          margin: 80px auto;
        }

        /* V3.0 ROADMAP FLOW */
        .roadmap-flow {
          margin: 40px 0;
        }

        .roadmap-step {
          margin: 30px 0;
          padding-left: 40px;
          position: relative;
        }

        .roadmap-step::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: -30px;
          width: 2px;
          background: var(--soft-gold);
        }

        .roadmap-step:last-child::before {
          display: none;
        }

        .roadmap-letter {
          position: absolute;
          left: -15px;
          top: 0;
          width: 30px;
          height: 30px;
          background: var(--dark-olive);
          color: var(--warm-white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
        }

        .roadmap-arrow {
          position: absolute;
          left: 2px;
          top: 30px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--soft-gold);
        }

        .roadmap-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--soft-gold);
          font-weight: 500;
          margin-bottom: 8px;
        }

        .roadmap-brief {
          font-size: 13px;
          line-height: 1.6;
          color: var(--deep-charcoal);
        }

        /* V3.0 DOMAIN GRID */
        .domain-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          margin: 20px 0;
        }

        .domain-card {
          border: 1px solid rgba(201, 169, 110, 0.3);
          padding: 15px;
          background: var(--cream);
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .domain-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--dark-olive);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(201, 169, 110, 0.3);
        }

        .domain-card-row {
          margin: 8px 0;
          padding: 6px 0;
          border-bottom: 1px solid rgba(201, 169, 110, 0.15);
        }

        .domain-card-row:last-child {
          border-bottom: none;
        }

        .domain-card-label {
          font-size: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--soft-gold);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .domain-card-value {
          font-size: 11px;
          line-height: 1.5;
          color: var(--deep-charcoal);
          font-weight: 400;
        }

        p {
          margin-bottom: 18px;
          line-height: 1.6;
        }

        /* PROTOCOL */
        .protocol-item {
          margin: 30px 0;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }

        .protocol-timeline {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--soft-gold);
          font-weight: 500;
          margin-bottom: 10px;
        }

        .protocol-action {
          font-size: 14px;
          line-height: 1.6;
          font-weight: 400;
        }

        .protocol-goals {
          margin-top: 20px;
          padding-left: 20px;
        }

        .goal-item {
          padding: 8px 0;
          font-size: 12px;
          line-height: 1.5;
          color: #666;
          border-left: 2px solid var(--soft-gold);
          padding-left: 15px;
          margin-bottom: 8px;
        }

        /* REMINDERS */
        .reminder-item {
          padding: 15px 0;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          font-size: 12px;
          line-height: 1.7;
          font-weight: 400;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        /* DEVELOPMENT PROFILE */
        .development-profile-content {
          margin-top: 40px;
        }

        .profile-text {
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 50px;
          text-align: left;
        }

        .your-words-section {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid rgba(201, 169, 110, 0.3);
        }

        .your-words-quote {
          font-size: 16px;
          font-style: italic;
          line-height: 1.6;
          color: var(--deep-charcoal);
          font-family: 'Playfair Display', serif;
          text-align: center;
          padding: 20px 0;
        }

        /* SABOTAGE PATTERN ANALYSIS */
        .sabotage-content {
          margin-top: 40px;
        }

        .sabotage-section {
          margin-bottom: 30px;
        }

        .sabotage-section:last-child {
          margin-bottom: 0;
        }

        .sabotage-text {
          font-size: 14px;
          line-height: 1.8;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <!-- PAGE 1: COVER (V3.0) -->
      <div class="page cover">
        <div class="cover-content">
          <div class="logo-mark">THE S.M.A.R.T. METHOD</div>
          <h1>S.M.A.R.T. METHOD<br>BEHAVIORAL<br>ASSESSMENT</h1>
          <div class="client-name">${clientName}</div>
          <div style="font-size: 12px; color: #666; margin-top: 20px; font-family: 'Inter', sans-serif;">${assessmentDate}</div>
          <div class="cover-tagline">Your transformation begins here</div>
          <div style="font-size: 10px; color: #999; margin-top: 40px; font-style: italic; max-width: 500px; line-height: 1.6; font-family: 'Inter', sans-serif;">${disclaimer}</div>
        </div>
      </div>
        
      <!-- PAGE 2: YOUR S.M.A.R.T. SUMMARY (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Your Summary</div>
            <div class="section-title">Your S.M.A.R.T.<br>Summary</div>
          </div>
          
          <div class="sabotage-content">
            <div class="sabotage-section">
              <div class="block-title">YOUR PATTERN</div>
              <div class="sabotage-text">${formatTextWithParagraphBreaks(patternExactWords)}</div>
            </div>
            
            <div class="sabotage-section">
              <div class="block-title">WHAT I'M HEARING</div>
              <div class="sabotage-text">${formatTextWithParagraphBreaks(patternReframe)}</div>
            </div>
            
            <div class="sabotage-section">
              <div class="block-title">WHAT IT'S PROTECTING YOU FROM</div>
              <div class="sabotage-text">${formatTextWithParagraphBreaks(whatItsProtectingFrom)}</div>
            </div>
            
            <div class="sabotage-section">
              <div class="block-title">WHAT IT'S COSTING YOU</div>
              <div class="sabotage-text">${formatTextWithParagraphBreaks(whatItsCosting)}</div>
            </div>
            
            <div class="sabotage-section">
              <div class="block-title">YOUR PROOF YOU CAN CHANGE</div>
              <div class="sabotage-text">${formatTextWithParagraphBreaks(proofWithContext)}</div>
            </div>
            
            <div class="sabotage-section" style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(201, 169, 110, 0.3);">
              <div class="sabotage-text">${formatTextWithParagraphBreaks(personalizedInsight)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- PAGE 3: YOUR ROADMAP / S.M.A.R.T. SUMMARY (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Your Roadmap</div>
            <div class="section-title">Your S.M.A.R.T.<br>Summary</div>
          </div>
          
          <div class="roadmap-flow">
            <div class="roadmap-step">
              <div class="roadmap-letter">S</div>
              <div class="roadmap-arrow"></div>
              <div class="roadmap-label">SEE THE PATTERN</div>
              <div class="roadmap-brief">${seeBrief}</div>
            </div>
            
            <div class="roadmap-step">
              <div class="roadmap-letter">M</div>
              <div class="roadmap-arrow"></div>
              <div class="roadmap-label">MAP THE NERVOUS SYSTEM</div>
              <div class="roadmap-brief">${mapBrief}</div>
            </div>
            
            <div class="roadmap-step">
              <div class="roadmap-letter">A</div>
              <div class="roadmap-arrow"></div>
              <div class="roadmap-label">ADDRESS THE ROOT CAUSE</div>
              <div class="roadmap-brief">${addressBrief}</div>
            </div>
            
            <div class="roadmap-step">
              <div class="roadmap-letter">R</div>
              <div class="roadmap-arrow"></div>
              <div class="roadmap-label">REWIRE THE RESPONSE (72-Hour Action)</div>
              <div class="roadmap-brief">${rewireBrief}</div>
            </div>
            
            <div class="roadmap-step">
              <div class="roadmap-letter">T</div>
              <div class="roadmap-label">TRANSFORM BEHAVIOR (30-Day Focus)</div>
              <div class="roadmap-brief">${transformBrief}</div>
            </div>
          </div>
        </div>
      </div>
        
      <!-- PAGE 4: DEVELOPMENT DASHBOARD - PART 1 (MIND & BODY) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Where You Are Now</div>
            <div class="section-title">Development<br>Dashboard</div>
          </div>
          
          <div class="domain-grid">
            <div class="domain-card">
              <div class="domain-card-title">MIND</div>
              <div class="domain-card-row">
                <div class="domain-card-label">Level</div>
                <div class="domain-card-value">${mindDomain.current_level || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Block</div>
                <div class="domain-card-value">${mindDomain.block || mindDomain.growth_opportunities || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Opportunity</div>
                <div class="domain-card-value">${mindDomain.growth_opportunities || "Not specified"}</div>
              </div>
            </div>
            
            <div class="domain-card">
              <div class="domain-card-title">BODY</div>
              <div class="domain-card-row">
                <div class="domain-card-label">Level</div>
                <div class="domain-card-value">${bodyDomain.current_level || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Block</div>
                <div class="domain-card-value">${bodyDomain.block || bodyDomain.growth_opportunities || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Opportunity</div>
                <div class="domain-card-value">${bodyDomain.growth_opportunities || "Not specified"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <!-- PAGE 4B: DEVELOPMENT DASHBOARD - PART 2 (RELATIONSHIPS & MEANING & CONTRIBUTION) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="domain-grid" style="margin-top: 0;">
            <div class="domain-card">
              <div class="domain-card-title">RELATIONSHIPS & MEANING</div>
              <div class="domain-card-row">
                <div class="domain-card-label">Level</div>
                <div class="domain-card-value">${relationshipsMeaningDomain.current_level || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Block</div>
                <div class="domain-card-value">${relationshipsMeaningDomain.block || relationshipsMeaningDomain.growth_opportunities || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Opportunity</div>
                <div class="domain-card-value">${relationshipsMeaningDomain.growth_opportunities || "Not specified"}</div>
              </div>
            </div>
            
            <div class="domain-card">
              <div class="domain-card-title">CONTRIBUTION</div>
              <div class="domain-card-row">
                <div class="domain-card-label">Level</div>
                <div class="domain-card-value">${contributionDomain.current_level || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Block</div>
                <div class="domain-card-value">${contributionDomain.block || contributionDomain.growth_opportunities || "Not specified"}</div>
              </div>
              <div class="domain-card-row">
                <div class="domain-card-label">Opportunity</div>
                <div class="domain-card-value">${contributionDomain.growth_opportunities || "Not specified"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <!-- PAGE 5: NERVOUS SYSTEM ASSESSMENT (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Foundation</div>
            <div class="section-title">Nervous System<br>Assessment</div>
          </div>
          
          <div class="metric-row">
            <div class="metric-label">Primary State</div>
            <div class="metric-value">${nervousSystemAssessment.primary_state}</div>
          </div>
          
          <div class="metric-row">
            <div class="metric-label">Regulation Capacity</div>
            <div class="metric-value">${nervousSystemAssessment.regulation_capacity}</div>
          </div>
          
          <div class="content-block">
            <div class="block-title">Observable Patterns</div>
            <div class="block-content">${formatTextWithParagraphBreaks(nervousSystemAssessment.observable_patterns)}</div>
          </div>
          
          <div class="content-block">
            <div class="block-title">The Regulation Reality</div>
            <div class="block-content">${formatTextWithParagraphBreaks(nervousSystemAssessment.regulation_reality)}</div>
          </div>
        </div>
      </div>
        
      <!-- PAGE 6: YOUR S.M.A.R.T. PROTOCOL (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Start Now</div>
            <div class="section-title">Your S.M.A.R.T.<br>Protocol</div>
          </div>
          
          ${urgencyStatement ? `<div style="font-size: 14px; line-height: 1.8; margin-bottom: 40px; font-style: italic; color: var(--deep-charcoal);">${urgencyStatement}</div>` : ""}
          
          <div class="protocol-item">
            <div class="protocol-timeline">STEP 1: 72-HOUR ACTION</div>
            <div class="protocol-action">
              ${anchorHabit && specificAction ? `After ${anchorHabit}, ${specificAction}${timeReps ? ` for ${timeReps}` : ""}` : formatTextWithParagraphBreaks(seventyTwoHourSuggestion)}
            </div>
            ${whyThisWorks ? `<div style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">Why this works: ${whyThisWorks}</div>` : ""}
          </div>
          
          <div class="protocol-item">
            <div class="protocol-timeline">STEP 2: READ THIS NOW</div>
            <div class="protocol-action">
              ${
                selectedBooks && selectedBooks.length > 0
                  ? `<div style="margin-bottom: 15px;">
                      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; font-family: 'Playfair Display', serif;"><a href="${selectedBooks[0].url}" style="color: var(--dark-olive); text-decoration: none;">${selectedBooks[0].title}</a></div>
                      <div style="font-size: 14px; color: #666; margin-bottom: 20px;">By ${selectedBooks[0].author}</div>
                      <div style="font-size: 13px; line-height: 1.7; margin-bottom: 15px;"><strong>Why this book, why now:</strong> ${bookRecommendationText || selectedBooks[0].why}</div>
                    </div>`
                  : bookRecommendationText
                    ? `<div style="font-size:15px; line-height:1.7; color:#222;">${bookRecommendationText}</div>`
                    : `<div style="font-size:15px; line-height:1.7; color:#222;">The Body Keeps the Score by Bessel van der Kolk - Understanding trauma and healing. This book directly addresses the core issue for most users stuck in sabotage patterns.</div>`
              }
            </div>
          </div>
          
          ${
            immediatePractice
              ? `<div class="protocol-item">
            <div class="protocol-timeline">STEP 3: IMPLEMENT IMMEDIATELY</div>
            <div class="protocol-action">${formatTextWithParagraphBreaks(immediatePractice)}</div>
          </div>`
              : ""
          }
          
          <div class="protocol-item" style="margin-top: 50px;">
            <div class="protocol-timeline">YOUR FIRST 30 DAYS</div>
            ${
              week1Focus
                ? `<div style="margin: 20px 0;">
              <div style="font-weight: 600; margin-bottom: 8px;">WEEK 1: ${week1Focus}</div>
              ${week1Practice ? `<div style="font-size: 12px; color: #666; margin-bottom: 5px;">🎯 Practice: ${week1Practice}</div>` : ""}
              ${week1Marker ? `<div style="font-size: 12px; color: #666;">✓ Marker: ${week1Marker}</div>` : ""}
            </div>`
                : ""
            }
            ${
              week2Focus
                ? `<div style="margin: 20px 0;">
              <div style="font-weight: 600; margin-bottom: 8px;">WEEK 2: ${week2Focus}</div>
              ${week2Practice ? `<div style="font-size: 12px; color: #666; margin-bottom: 5px;">🎯 Practice: ${week2Practice}</div>` : ""}
              ${week2Marker ? `<div style="font-size: 12px; color: #666;">✓ Marker: ${week2Marker}</div>` : ""}
            </div>`
                : ""
            }
            ${
              week3Focus
                ? `<div style="margin: 20px 0;">
              <div style="font-weight: 600; margin-bottom: 8px;">WEEK 3: ${week3Focus}</div>
              ${week3Practice ? `<div style="font-size: 12px; color: #666; margin-bottom: 5px;">🎯 Practice: ${week3Practice}</div>` : ""}
              ${week3Marker ? `<div style="font-size: 12px; color: #666;">✓ Marker: ${week3Marker}</div>` : ""}
            </div>`
                : ""
            }
            ${
              week4Focus
                ? `<div style="margin: 20px 0;">
              <div style="font-weight: 600; margin-bottom: 8px;">WEEK 4: ${week4Focus}</div>
              ${week4Practice ? `<div style="font-size: 12px; color: #666; margin-bottom: 5px;">🎯 Practice: ${week4Practice}</div>` : ""}
              ${week4Marker ? `<div style="font-size: 12px; color: #666;">✓ Marker: ${week4Marker}</div>` : ""}
            </div>`
                : ""
            }
          </div>
          
          <div style="margin-top: 40px; padding: 20px; background: var(--cream); border-left: 3px solid var(--soft-gold);">
            <div style="font-size: 13px; line-height: 1.8; font-style: italic;">
              Start tonight. This book explains why every strategy you've tried hasn't worked—and what will.
            </div>
          </div>
        </div>
      </div>
        
      <!-- PAGE 7: BOTTOM LINE (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Remember</div>
            <div class="section-title">Bottom Line</div>
          </div>
          
          <div style="margin: 40px 0;">
            ${formatTextWithParagraphBreaks(bottomLine)}
          </div>
        </div>
      </div>
      
      <!-- PAGE 7B: CLIENT'S WORDS (PULL QUOTE) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content" style="display: flex; align-items: center; justify-content: center; min-height: 100%;">
          <div class="pull-quote" style="text-align: center; width: 100%;">
            <div class="pull-quote-text"><strong>"${pullQuote}"</strong></div>
            <div style="font-size: 11px; letter-spacing: 0.1em; color: #999; margin-top: 20px;">${quoteAttribution}</div>
          </div>
        </div>
      </div>
            
      <!-- PAGE 8: WHAT'S NEXT (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Moving Forward</div>
            <div class="section-title">You Have Everything<br>You Need</div>
          </div>
          
          <div style="margin: 40px 0;">
            <div style="font-size: 14px; line-height: 2; margin-bottom: 30px;">
              <div style="margin: 10px 0;">✓ Your pattern mapped</div>
              <div style="margin: 10px 0;">✓ Your nervous system understood</div>
              <div style="margin: 10px 0;">✓ Your 72-hour action identified</div>
              <div style="margin: 10px 0;">✓ Your reading list queued</div>
              <div style="margin: 10px 0;">✓ Your 30-day protocol ready</div>
            </div>
            
            <div style="font-size: 16px; font-weight: 600; margin: 40px 0; text-align: center; color: var(--dark-olive);">
              The Only Thing Left:<br>Take action.
            </div>
          </div>
          
          <div class="content-block" style="margin-top: 60px;">
            <div class="block-title">RECOMMENDED NEXT STEPS</div>
            <div class="block-content">
              <p style="margin: 0 0 25px 0; line-height: 1.8;"><strong>Join The S.M.A.R.T. Method Community:</strong> Connect with other solopreneurs who are building six-figure businesses without chasing trends or burning out on content. Get live weekly coaching, access to proven frameworks, and strategic support as you implement your protocol.</p>
              <p style="margin: 0 0 25px 0; line-height: 1.8;"><a href="https://www.skool.com/become-u-4484/about?ref=ade2178e19214f7983f06d6cabed88eb" style="color: var(--lime-green); text-decoration: none; font-weight: 600;">→ Join the Community</a></p>
              <p style="margin: 0 0 20px 0; line-height: 1.8;"><strong>Monthly Check-Ins:</strong> Track progress, troubleshoot blocks, adjust protocol. (Coming soon)</p>
              <p style="margin: 0 0 20px 0; line-height: 1.8;"><strong>Contact:</strong> Questions? Email <a href="mailto:info@thesmartmethod.co" style="color: var(--lime-green); text-decoration: none;">info@thesmartmethod.co</a></p>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 9: DEVELOPMENT REMINDERS (V3.0) -->
      <div class="page" style="page-break-before: always;">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Remember</div>
            <div class="section-title">Development<br>Reminders</div>
          </div>
      
          ${developmentReminders.map((reminder) => `<div class="reminder-item">→ ${reminder}</div>`).join("")}
          
          <div style="background: var(--cream); padding: 60px; text-align: center; max-width: 600px; border-left: 2px solid var(--soft-gold); margin-top: 180px;">
            <p style="font-size: 13px; line-height: 2.2; font-style: italic;">
              This assessment was built with care, respect, and the belief that you already have everything you need to become the person you described. The only thing left to do is <em>take action</em>.
            </p>
          </div>
        </div>
      </div>

    </body>
    </html>
  `;
}

// Function to get signed URL for existing PDF
export async function getSignedPDFUrl(
  sessionId: string
): Promise<string | null> {
  try {
    console.log("Getting signed URL for session:", sessionId);

    // Get the latest PDF job for this session
    const { data: pdfJob, error: jobError } = await supabase
      .from("pdf_jobs")
      .select("file_path, status")
      .eq("session_id", sessionId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (jobError || !pdfJob) {
      console.log("No completed PDF found for session:", sessionId);
      return null;
    }

    // Generate new signed URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("reports")
        .createSignedUrl(pdfJob.file_path, 60 * 60 * 24 * 7); // 7 days expiry

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return null;
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error("Error getting signed PDF URL:", error);
    return null;
  }
}
