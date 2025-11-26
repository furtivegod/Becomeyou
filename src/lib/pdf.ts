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
  for (let i = 0; i < sentences.length; i += 2) {
    const paragraphSentences = sentences.slice(i, i + 2);
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
  sabotage_analysis?: {
    protective_pattern?: string;
    what_its_protecting_from?: string;
    how_it_serves_you?: string;
    go_to_patterns?: string;
    success_proof?: string;
    anchor?: string;
  };
  in_the_moment_reset?: string;
  domain_breakdown?: {
    mind?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
    };
    body?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
    };
    relationships_meaning?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
    };
    contribution?: {
      current_level?: string;
      current_phase?: string;
      key_strengths?: string;
      growth_opportunities?: string;
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
    progress_markers?: string[];
    daily_actions?: string[];
    weekly_goals?: string[];
  };
  reminder_quote?: string;
  development_reminders?: string[];
  book_recommendations?: string[];
  resources?: string[];
  reflection_prompts?: string[];
  next_assessment?: {
    stay_connected?: string;
  };
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

  // Extract sabotage analysis
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
    key_strengths: "Your key relational and meaning strengths and capabilities.",
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

  // Extract 30-day protocol
  const thirtyDayProtocol = planData.thirty_day_protocol || {};
  const seventyTwoHourSuggestion =
    thirtyDayProtocol.seventy_two_hour_suggestion ||
    "Start with one small, manageable action that builds on your existing strengths.";
  const weeklyRecommendation =
    thirtyDayProtocol.weekly_recommendation ||
    "Implement one consistent practice that supports your growth goals.";
  const thirtyDayApproach =
    thirtyDayProtocol.thirty_day_approach ||
    "Focus on one key area of development that will have the most impact.";
  const environmentalOptimization =
    thirtyDayProtocol.environmental_optimization ||
    "Make one environmental change that supports your goals.";

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

  const bookRecommendations = Array.isArray(planData.book_recommendations)
    ? planData.book_recommendations
    : [
        "The Body Keeps the Score by Bessel van der Kolk - Understanding trauma and healing",
        "Atomic Habits by James Clear - Building sustainable change",
      ];

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

  // Select top 2 book recommendations based on assessment content
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

  function selectTopTwoBooks(pd: any) {
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
      .slice(0, 2)
      .map((s) => s.book);
    if (top.length < 2) {
      // sensible defaults
      const defaults = allBooks
        .filter((b) => ["atomic_habits", "body_keeps_score"].includes(b.id))
        .slice(0, 2);
      return defaults;
    }
    return top;
  }

  const selectedBooks = selectTopTwoBooks(planData);

  const reflectionPrompts = Array.isArray(planData.reflection_prompts)
    ? planData.reflection_prompts
    : [
        "What was one moment today where I felt truly aligned with my values?",
        "What pattern did I notice in myself today, and how did I respond?",
      ];

  const developmentReminders = Array.isArray(planData.development_reminders)
    ? planData.development_reminders
    : [
        "Growth is cyclical; regression is protection, not failure",
        "Integration comes through consistent practice, not more awareness",
        "Your nervous system is the foundation — regulate first, then grow",
        "Your sabotage patterns have wisdom - honor them while updating them",
        "Identity shifts over time with deliberate practice",
      ];

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
          margin-bottom: 40px;
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
          font-weight: 500;
        }

        .metric-value {
          font-family: 'Playfair Display', serif;
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
      <!-- PAGE 1: COVER -->
      <div class="page cover">
        <div class="cover-content">
          <div class="logo-mark">THE S.M.A.R.T. METHOD</div>
          <h1>YOUR<br>S.M.A.R.T.<br>SUMMARY</h1>
          <div class="cover-tagline">This is where<br>transformation begins</div>
          </div>
        </div>
        
      <!-- PAGE 2: TITLE -->
      <div class="page" style="display: flex; align-items: center; justify-content: center;">
        <div class="page-content" style="text-align: center;">
          <div style="margin-bottom: 80px; font-size: 14px; letter-spacing: 8px; color: var(--soft-gold); font-weight: 400; text-transform: uppercase; font-family: 'Inter', sans-serif;">
            THE S.M.A.R.T. METHOD
        </div>
        
          <h2 style="margin-bottom: 60px;">THE S.M.A.R.T.<br>ASSESSMENT</h2>
          
          <div style="font-size: 12px; line-height: 2.5; color: var(--deep-charcoal); font-family: 'Inter', sans-serif; font-weight: 400;">
            <p style="margin: 20px 0;"><span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; color: var(--soft-gold);">Client</span><br>${clientName}</p>
            <p style="margin: 20px 0;"><span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; color: var(--soft-gold);">Date</span><br>${new Date().toLocaleDateString()}</p>
            <p style="margin: 20px 0;"><span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; color: var(--soft-gold);">Type</span><br>Behavioral Optimization</p>
        </div>
        
          <div class="divider"></div>
          
          <p style="font-size: 11px; font-style: italic; color: #999; max-width: 500px; margin: 0 auto;">
            This assessment is not a diagnostic tool and does not replace professional mental health support. If you are experiencing crisis-level distress, please seek immediate professional care.
          </p>
        </div>
      </div>
      
      <!-- PAGE 3: ASSESSMENT OVERVIEW -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Overview</div>
            <div class="section-title">Assessment Overview</div>
          </div>
        
          <p style="font-size: 15px; line-height: 2;">${formatTextWithParagraphBreaks(assessmentOverview)}</p>
            </div>
          </div>
        
      <!-- PAGE 4: DEVELOPMENT PROFILE -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Your Profile</div>
            <div class="section-title">Your Development<br>Profile</div>
      </div>
      
          <div class="development-profile-content">
            <div class="profile-text">
              ${formatTextWithParagraphBreaks(developmentProfile)}
            </div>
            
            <div class="your-words-section">
              <div class="block-title">YOUR WORDS</div>
              <div class="your-words-quote"><strong>"${reminderQuote}"</strong></div>
            </div>
            </div>
            </div>
            </div>
            
      <!-- PAGE 5: SABOTAGE PATTERN ANALYSIS -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Pattern Analysis</div>
            <div class="section-title">Sabotage Pattern<br>Analysis</div>
            </div>
            
          <div class="sabotage-content">
            <div class="sabotage-section">
              <div class="block-title">YOUR PROTECTIVE PATTERN</div>
              <div class="sabotage-text">
                ${formatTextWithParagraphBreaks(protectivePattern)}
            </div>
          </div>
          
            <div class="sabotage-section">
              <div class="block-title">WHAT IT'S PROTECTING YOU FROM</div>
              <div class="sabotage-text">
                ${formatTextWithParagraphBreaks(whatItsProtectingFrom)}
            </div>
          </div>
        
            <div class="sabotage-section">
              <div class="block-title">HOW IT SERVES YOU</div>
              <div class="sabotage-text">
                ${formatTextWithParagraphBreaks(howItServesYou)}
      </div>
            </div>
            
            <div class="sabotage-section">
              <div class="block-title">YOUR SUCCESS PROOF</div>
              <div class="sabotage-text">
                ${formatTextWithParagraphBreaks(successProof)}
            </div>
            </div>
            
            <div class="sabotage-section">
              <div class="block-title">GO TO PATTERNS</div>
              <div class="sabotage-text">
                ${formatTextWithParagraphBreaks(goToPatterns)}
            </div>
          </div>
        
            <div class="sabotage-section">
              <div class="block-title">YOUR ANCHOR</div>
              <div class="sabotage-text">
                ${formatTextWithParagraphBreaks(anchor)}
      </div>
            </div>
          </div>
            </div>
            </div>
            
      <!-- PAGE 6: IN THE MOMENT RESET -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Reset Strategy</div>
            <div class="section-title">In The Moment<br>Reset</div>
            </div>
            
          <div class="content-block">
            <div class="block-content">
              ${formatTextWithParagraphBreaks(inTheMomentReset)}
            </div>
          </div>
            </div>
          </div>
        
      <!-- PAGE 7: DOMAIN DIVIDER -->
      <div class="page" style="display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div class="section-label">The Four Domains</div>
          <h2 style="font-size: 52px; margin-top: 40px;">Domain Breakdown</h2>
        </div>
      </div>
      
      <!-- PAGE 8: MIND -->
      <div class="page">
        <div class="page-content">
          <h1 class="domain-hero">MIND</h1>
          
          <div class="metric-row">
            <div class="metric-label">Current Level</div>
            <div class="metric-value">${mindDomain.current_level}</div>
            </div>
            
          <div class="metric-row">
            <div class="metric-label">Current Phase</div>
            <div class="metric-value">${mindDomain.current_phase}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Key Strengths</div>
            <div class="block-content">${formatTextWithParagraphBreaks(mindDomain.key_strengths)}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Growth Opportunities</div>
            <div class="block-content">${formatTextWithParagraphBreaks(mindDomain.growth_opportunities)}</div>
            </div>
          </div>
      </div>
      
      <!-- PAGE 9: BODY -->
      <div class="page">
        <div class="page-content">
          <h1 class="domain-hero">BODY</h1>
          
          <div class="metric-row">
            <div class="metric-label">Current Level</div>
            <div class="metric-value">${bodyDomain.current_level}</div>
            </div>
            
          <div class="metric-row">
            <div class="metric-label">Current Phase</div>
            <div class="metric-value">${bodyDomain.current_phase}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Key Strengths</div>
            <div class="block-content">${formatTextWithParagraphBreaks(bodyDomain.key_strengths)}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Growth Opportunities</div>
            <div class="block-content">${formatTextWithParagraphBreaks(bodyDomain.growth_opportunities)}</div>
            </div>
          </div>
      </div>
      
      <!-- PAGE 10: RELATIONSHIPS & MEANING -->
      <div class="page">
        <div class="page-content">
          <h1 class="domain-hero">RELATIONSHIPS &<br>MEANING</h1>
          
          <div class="metric-row">
            <div class="metric-label">Current Level</div>
            <div class="metric-value">${relationshipsMeaningDomain.current_level}</div>
            </div>
            
          <div class="metric-row">
            <div class="metric-label">Current Phase</div>
            <div class="metric-value">${relationshipsMeaningDomain.current_phase}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Key Strengths</div>
            <div class="block-content">${formatTextWithParagraphBreaks(relationshipsMeaningDomain.key_strengths)}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Growth Opportunities</div>
            <div class="block-content">${formatTextWithParagraphBreaks(relationshipsMeaningDomain.growth_opportunities)}</div>
            </div>
          </div>
      </div>
      
      <!-- PAGE 11: CONTRIBUTION -->
      <div class="page">
        <div class="page-content">
          <h1 class="domain-hero">CONTRIBUTION</h1>
          
          <div class="metric-row">
            <div class="metric-label">Current Level</div>
            <div class="metric-value">${contributionDomain.current_level}</div>
            </div>
            
          <div class="metric-row">
            <div class="metric-label">Current Phase</div>
            <div class="metric-value">${contributionDomain.current_phase}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Key Strengths</div>
            <div class="block-content">${formatTextWithParagraphBreaks(contributionDomain.key_strengths)}</div>
            </div>
            
          <div class="content-block">
            <div class="block-title">Growth Opportunities</div>
            <div class="block-content">${formatTextWithParagraphBreaks(contributionDomain.growth_opportunities)}</div>
            </div>
          </div>
            </div>
            
      <!-- PAGE 12: NERVOUS SYSTEM -->
      <div class="page">
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
            <div class="block-title">Regulation Reality</div>
            <div class="block-content">${formatTextWithParagraphBreaks(nervousSystemAssessment.regulation_reality)}</div>
              </div>
            </div>
          </div>
        
      <!-- PAGE 13: 30-DAY PROTOCOL -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Your Protocol</div>
            <div class="section-title">30-Day Growth<br>Protocol</div>
      </div>
      
          <div class="protocol-item">
            <div class="protocol-timeline">72-Hour Suggestion</div>
            <div class="protocol-action">${formatTextWithParagraphBreaks(seventyTwoHourSuggestion)}</div>
          </div>
        
          <div class="protocol-item">
            <div class="protocol-timeline">Weekly Recommendation</div>
            <div class="protocol-action">${formatTextWithParagraphBreaks(weeklyRecommendation)}</div>
            <div class="protocol-goals">
              ${weeklyGoals.map((goal) => `<div class="goal-item">${goal}</div>`).join("")}
              </div>
      </div>
      
          <div class="protocol-item">
            <div class="protocol-timeline">30-Day Approach</div>
            <div class="protocol-action">${formatTextWithParagraphBreaks(thirtyDayApproach)}</div>
            <div class="protocol-goals">
              ${dailyActions.map((action) => `<div class="goal-item">${action}</div>`).join("")}
            </div>
          </div>
        
          <div class="protocol-item">
            <div class="protocol-timeline">Environmental Optimization</div>
            <div class="protocol-action">${formatTextWithParagraphBreaks(environmentalOptimization)}</div>
      </div>
      
          <div class="content-block">
            <div class="block-title">Suggested Progress Markers</div>
            <div class="block-content">
              ${progressMarkers.map((marker) => `<div class="reminder-item">${marker}</div>`).join("")}
            </div>
          </div>
        
            
            </div>
          </div>
        
      <!-- PAGE 14: BOTTOM LINE -->
      <div class="page bottom-line-page">
        <div class="page-content" style="text-align: center; max-width: 700px;">
          <h2>Bottom Line</h2>
              ${formatTextWithParagraphBreaks(bottomLine)}
            </div>
      </div>
      
      <!-- PAGE 15: REMINDER BOX -->
      <div class="page reminder-box-page">
        <div class="page-content">
          <div class="pull-quote">
            <div class="pull-quote-text"><strong>"${reminderQuote}"</strong></div>
            <div style="font-size: 11px; letter-spacing: 0.1em; color: #999;">Your truth, the only truth that matters</div>
      </div>
            </div>
          </div>
        
      <!-- PAGE 16: DEVELOPMENT REMINDERS -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Reminders</div>
            <div class="section-title">Development<br>Reminders</div>
      </div>
      
          ${developmentReminders.map((reminder) => `<div class="reminder-item">${reminder}</div>`).join("")}
            </div>
            </div>
            
      <!-- PAGE 17: BOOK RECOMMENDATIONS (Top 2 Personalized) -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Recommended Reading</div>
            <div class="section-title">Book<br>Recommendations</div>
          </div>

          <div class="content-block">
            <div class="block-title" style="font-size: 18px; font-weight: 600; margin-bottom: 6px;"></div>
            <ol style="margin:0 0 14px 20px; padding:0; font-size:15px;">
              ${selectedBooks
                .map(
                  (b) => `
              <li style="margin-bottom:10px;">
                <span style="font-style:italic;">
                  <a href="${b.url}" style="color: #1a73e8; text-decoration: underline; font-size:15px;" target="_blank">"${b.title}"</a>
                </span>
                by <span style="color: #1a73e8; font-size:15px;">${b.author}</span><br>
                <strong>Why:</strong> <span style="color:#222; font-size:13px;">${b.why}</span>
              </li>`
                )
                .join("")}
            </ol>
          </div>

          <div class="content-block" style="margin-top: 24px;">
            <div style="font-size:13px; color:#777; font-style:italic; line-height:1.7; text-align:left; border-top: 1px solid #eee; padding-top:14px; max-width:650px;">
              These books support—but do not replace—professional mental health care. If you're experiencing trauma symptoms, severe anxiety, depression, or psychological distress, please consult a licensed therapist.<br> Amazon Associate Disclosure: I earn from qualifying purchases.
            </div>
          </div>
        </div>
      </div>
            
      <!-- PAGE 18: NEXT STEPS -->
      <div class="page">
        <div class="page-content">
          <div class="section-header">
            <div class="section-label">Moving Forward</div>
            <div class="section-title">Next Steps</div>
          </div>
        
            
          <div class="content-block">
            <div class="block-title">How to Stay Connected</div>
            <div class="block-content">
              <p style="margin: 0 0 20px 0;">Your assessment is just the beginning.</p>
              <p style="margin: 0 0 20px 0;">Over the coming weeks, you'll receive weekly insights in your inbox—real case studies of people who've broken through the exact patterns you're facing, practical protocols you can implement immediately, and advanced strategies that build on your personalized roadmap.</p>
              <p style="margin: 0 0 20px 0;">Each email is designed to meet you exactly where you are in your transformation journey, delivering the precise guidance you need, when you need it most.</p>
              <p style="margin: 0;">These aren't generic newsletters—they're the ongoing support system that turns your 30-day protocol into a sustainable lifestyle.</p>
            </div>
          </div>
        
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
