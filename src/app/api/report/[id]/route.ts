import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.id;

    console.log("Report viewer API called for session:", sessionId);

    // Try to get signed PDF URL first
    const signedPdfUrl = await getSignedPDFUrl(sessionId);
    console.log("PDF URL found:", signedPdfUrl ? "Yes" : "No");
    console.log("PDF URL:", signedPdfUrl);

    // Always show HTML page, don't redirect to PDF
    console.log("Generating HTML view for session:", sessionId);

    const { data: planOutput, error: planError } = await supabase
      .from("plan_outputs")
      .select("plan_json")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (planError || !planOutput) {
      console.error("Error fetching plan data:", planError);

      // If all else fails, show a fallback message
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Report Not Ready</title>
          <style>
            body { 
              font-family: 'Georgia', 'Times New Roman', serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #F5F1E8;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 2rem;
              background: white;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 1rem;
              background: #FFF3CD;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #D4AF37;
            }
            h1 { color: #3D4D2E; margin-bottom: 1rem; font-family: 'Playfair Display', Georgia, serif; font-weight: 700; }
            p { color: #1A1A1A; line-height: 1.6; }
            .retry-btn {
              background: #7ED321;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 1rem;
              transition: opacity 0.2s;
            }
            .retry-btn:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⏳</div>
            <h1>Report Not Ready Yet</h1>
            <p>Your personalized protocol is still being generated. This usually takes just a few moments.</p>
            <p>Please check back in a minute or check your email for the completed report.</p>
            <button class="retry-btn" onclick="window.location.reload()">Refresh Page</button>
          </div>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const planData = planOutput.plan_json;

    // Get user data and session date to display the correct name and date
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id, started_at")
      .eq("id", sessionId)
      .single();

    let userName = "Client"; // Default fallback
    let sessionDate: Date | null = null;
    if (!sessionError && sessionData) {
      // Get session date
      if (sessionData.started_at) {
        sessionDate = new Date(sessionData.started_at);
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_name")
        .eq("id", sessionData.user_id)
        .single();

      if (!userError && userData?.user_name) {
        userName = userData.user_name;
      }
    }

    return generateHTMLReport(
      planData,
      sessionId,
      signedPdfUrl,
      userName,
      sessionDate
    );
  } catch (error) {
    console.error("Report viewer error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function getSignedPDFUrl(sessionId: string): Promise<string | null> {
  try {
    const { data: pdfJob, error } = await supabase
      .from("pdf_jobs")
      .select("pdf_url, status")
      .eq("session_id", sessionId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !pdfJob) {
      console.log("No completed PDF found for session:", sessionId);
      return null;
    }

    return pdfJob.pdf_url;
  } catch (error) {
    console.error("Error getting signed PDF URL:", error);
    return null;
  }
}

function generateHTMLReport(
  planData: any,
  sessionId: string,
  signedPdfUrl?: string | null,
  userName?: string,
  sessionDate?: Date | null
) {
  const clientName = userName || "Client";

  // Get session date for accurate assessment date
  const assessmentDate = sessionDate
    ? sessionDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : planData.assessment_date ||
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const disclaimer =
    planData.disclaimer ||
    "This assessment is a tool for personal development and self-awareness. It is not a diagnostic tool and does not replace professional mental health support. If you are experiencing a mental health crisis, please contact a qualified professional or crisis support service.";

  // Extract data similar to PDF generation
  const sabotageAnalysis = planData.sabotage_analysis || {};
  const patternExactWords =
    sabotageAnalysis.pattern_exact_words ||
    sabotageAnalysis.protective_pattern ||
    "";
  let patternReframe = sabotageAnalysis.pattern_reframe || "";
  // Remove redundant "What I'm hearing:" prefix if present
  if (patternReframe.toLowerCase().startsWith("what i'm hearing:")) {
    patternReframe = patternReframe
      .substring(patternReframe.indexOf(":") + 1)
      .trim();
  }
  const whatItsProtectingFrom = sabotageAnalysis.what_its_protecting_from || "";
  const whatItsCosting = sabotageAnalysis.what_its_costing || "";
  const proofWithContext =
    sabotageAnalysis.proof_with_context || sabotageAnalysis.success_proof || "";
  const personalizedInsight = sabotageAnalysis.personalized_insight || "";

  // Extract smart roadmap
  const smartRoadmap = planData.smart_roadmap || {};
  const seeBrief = smartRoadmap.see_brief || "";
  const mapBrief = smartRoadmap.map_brief || "";
  const addressBrief = smartRoadmap.address_brief || "";
  const rewireBrief = smartRoadmap.rewire_brief || "";
  const transformBrief = smartRoadmap.transform_brief || "";

  // Extract domain breakdown
  const domainBreakdown = planData.domain_breakdown || {};
  const mindDomain = domainBreakdown.mind || {};
  const bodyDomain = domainBreakdown.body || {};
  const relationshipsMeaningDomain =
    domainBreakdown.relationships_meaning || {};
  const contributionDomain = domainBreakdown.contribution || {};

  // Extract nervous system assessment
  const nervousSystemAssessment = planData.nervous_system_assessment || {};

  // Extract protocol data
  const thirtyDayProtocol = planData.thirty_day_protocol || {};
  const urgencyStatement = thirtyDayProtocol.urgency_statement || "";
  const anchorHabit = thirtyDayProtocol.anchor_habit || "";
  const specificAction = thirtyDayProtocol.specific_action || "";
  const timeReps = thirtyDayProtocol.time_reps || "";
  const whyThisWorks = thirtyDayProtocol.why_this_works || "";
  const seventyTwoHourSuggestion =
    thirtyDayProtocol.seventy_two_hour_suggestion || "";
  const immediatePractice = thirtyDayProtocol.immediate_practice || "";
  const week1Focus = thirtyDayProtocol.week_1_focus || "";
  const week1Practice = thirtyDayProtocol.week_1_practice || "";
  const week1Marker = thirtyDayProtocol.week_1_marker || "";
  const week2Focus = thirtyDayProtocol.week_2_focus || "";
  const week2Practice = thirtyDayProtocol.week_2_practice || "";
  const week2Marker = thirtyDayProtocol.week_2_marker || "";
  const week3Focus = thirtyDayProtocol.week_3_focus || "";
  const week3Practice = thirtyDayProtocol.week_3_practice || "";
  const week3Marker = thirtyDayProtocol.week_3_marker || "";
  const week4Focus = thirtyDayProtocol.week_4_focus || "";
  const week4Practice = thirtyDayProtocol.week_4_practice || "";
  const week4Marker = thirtyDayProtocol.week_4_marker || "";
  const dailyActions = Array.isArray(thirtyDayProtocol.daily_actions)
    ? thirtyDayProtocol.daily_actions
    : [];
  const thirtyDayApproach = thirtyDayProtocol.thirty_day_approach || "";

  // Extract book recommendation
  const bookRecommendationText = planData.book_recommendation;

  // Extract bottom line and pull quote
  const bottomLine = planData.bottom_line || "";
  const pullQuote = planData.pull_quote || planData.reminder_quote || "";
  const quoteAttribution = planData.quote_attribution || "From your assessment";

  // Extract development reminders
  const developmentReminders = Array.isArray(planData.development_reminders)
    ? planData.development_reminders
    : [
        "Integration comes through consistent practice, not more awareness—you already have the insight; now you need the repetitions",
        "Your nervous system is the foundation—regulate first, then grow; breath before action, presence before expansion",
        "Your sabotage patterns have wisdom—honor them while updating them; they kept you safe when safety was scarce",
        "Identity shifts over time with deliberate practice—you're becoming someone who can hold bigger energies responsibly, one regulated moment at a time",
      ];

  // Helper function to format text with paragraph breaks
  function formatTextWithParagraphBreaks(text: string | undefined): string {
    if (!text) return "";
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const paragraphSentences = sentences.slice(i, i + 2);
      paragraphs.push(paragraphSentences.join(" "));
    }
    return paragraphs.map((paragraph) => `<p>${paragraph.trim()}</p>`).join("");
  }

  // Book selection logic - match PDF structure
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
  let selectedBooks = selectTopOneBook(planData);

  // If bookRecommendationText mentions a specific book, try to match it to ensure title matches description
  if (bookRecommendationText && selectedBooks && selectedBooks.length > 0) {
    // Try to find a book mentioned in the bookRecommendationText by checking against allBooks
    const textLower = bookRecommendationText.toLowerCase();
    const matchedBook = allBooks.find((book) => {
      const titleLower = book.title.toLowerCase();
      const authorLower = book.author.toLowerCase();
      // Check if the text mentions the book title or author
      return textLower.includes(titleLower) || textLower.includes(authorLower);
    });

    // If we found a match, use that book instead of the algorithm-selected one
    if (matchedBook) {
      selectedBooks = [matchedBook];
    }
  }

  // allBooks is already defined above, removing duplicate

  // selectedBooks is already set above with selectTopOneBook logic

  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>S.M.A.R.T. Assessment - ${clientName}</title>
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
                background: #f5f5f5;
                overflow-x: hidden;
            }

            .page {
                min-height: 100vh;
                padding: 80px 60px;
                background: var(--warm-white);
                margin-bottom: 2px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
            }

            .page-content {
                max-width: 720px;
                margin: 0 auto;
                width: 100%;
            }

            /* COVER PAGE */
            .cover {
                background: linear-gradient(180deg, var(--warm-white) 0%, var(--cream) 100%);
                text-align: center;
                position: relative;
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
            }

            .logo-mark {
                font-size: 10px;
                letter-spacing: 0.3em;
                color: var(--soft-gold);
                margin-bottom: 80px;
                font-weight: 500;
            }

            h1 {
                font-family: 'Playfair Display', Georgia, serif;
                font-weight: 700;
                color: var(--dark-olive);
                font-size: 72px;
                line-height: 1.1;
                letter-spacing: -0.02em;
                margin-bottom: 60px;
            }

            h2 {
                font-family: 'Playfair Display', Georgia, serif;
                font-weight: 700;
                color: var(--dark-olive);
                font-size: 42px;
                line-height: 1.2;
                margin-bottom: 40px;
            }

            .client-name {
                font-size: 14px;
                font-weight: 300;
                letter-spacing: 0.1em;
                color: #666;
                margin-bottom: 120px;
            }

            .cover-tagline {
                font-family: 'Inter', sans-serif;
                font-size: 20px;
                font-weight: 500;
                color: var(--deep-charcoal);
                margin-top: 80px;
                line-height: 1.6;
            }

            /* SECTION HEADERS */
            .section-header {
                margin-bottom: 80px;
                text-align: center;
            }

            .section-label {
                font-size: 10px;
                font-weight: 500;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: var(--soft-gold);
                margin-bottom: 30px;
            }

            .section-title {
                font-family: 'Playfair Display', serif;
                font-size: 48px;
                font-weight: 700;
                color: var(--dark-olive);
                letter-spacing: -0.01em;
                line-height: 1.2;
            }

            /* CONTENT BLOCKS */
            .content-block {
                margin: 60px 0;
            }

            .block-title {
                font-size: 10px;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: var(--soft-gold);
                font-weight: 500;
                margin-bottom: 20px;
            }

            .block-content {
                font-size: 13px;
                line-height: 2;
                font-weight: 400;
            }

            /* DOMAIN HERO */
            .domain-hero {
                font-size: 96px;
                font-weight: 700;
                color: var(--dark-olive);
                text-align: center;
                margin-bottom: 80px;
                letter-spacing: -0.03em;
                font-family: 'Playfair Display', serif;
            }

            /* METRICS */
            .metric-row {
                display: flex;
                justify-content: space-between;
                padding: 30px 0;
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
                font-family: 'Inter', sans-serif;
                font-size: 18px;
                font-weight: 500;
            }

            /* PULL QUOTE */
            .pull-quote {
                margin: 100px 0;
                padding: 60px 0;
                border-top: 1px solid rgba(201, 169, 110, 0.3);
                border-bottom: 1px solid rgba(201, 169, 110, 0.3);
          text-align: center;
            }

            .pull-quote-text {
                font-family: 'Inter', sans-serif;
                font-size: 28px;
                font-weight: 500;
                color: var(--dark-olive);
                line-height: 1.6;
                margin-bottom: 30px;
            }

            /* BOTTOM LINE */
            .bottom-line-page {
                background: var(--deep-charcoal);
                color: var(--warm-white);
            }

            .bottom-line-page h2 {
                color: var(--warm-white);
            }

            .bottom-line-page p {
                font-size: 15px;
                line-height: 2;
                color: rgba(255,255,255,0.85);
            }

            /* PAGE NUMBER */
            .page-number {
                position: absolute;
                bottom: 40px;
                right: 60px;
                font-size: 9px;
                letter-spacing: 0.1em;
                color: #999;
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
                gap: 70px;
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

            p {
                margin-bottom: 28px;
                line-height: 1.9;
            }

            /* PROTOCOL */
            .protocol-item {
                margin: 50px 0;
                padding-bottom: 50px;
                border-bottom: 1px solid rgba(0,0,0,0.06);
            }

            .protocol-timeline {
                font-size: 10px;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: var(--soft-gold);
                font-weight: 500;
                margin-bottom: 15px;
            }

            .protocol-action {
                font-size: 15px;
                line-height: 1.8;
                font-weight: 300;
            }

            .protocol-goals {
                margin-top: 20px;
            }

            .goal-item {
                font-size: 13px;
                line-height: 1.8;
                font-weight: 300;
                margin: 8px 0;
                padding-left: 20px;
                position: relative;
            }

            .goal-item::before {
                content: '•';
                color: var(--soft-gold);
                font-weight: bold;
                position: absolute;
                left: 0;
            }

            /* REMINDERS */
            .reminder-item {
                padding: 25px 0;
                border-bottom: 1px solid rgba(0,0,0,0.06);
                font-size: 13px;
                line-height: 1.9;
                font-weight: 300;
            }

            /* PDF BUTTON */
        .pdf-button {
                background: var(--soft-gold);
                color: var(--deep-charcoal);
          border: none;
                padding: 15px 30px;
                border-radius: 0;
          cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                margin: 40px 0;
                transition: all 0.3s ease;
            }

            .pdf-button:hover { 
                background: var(--deep-charcoal);
                color: var(--warm-white);
            }

        .pdf-button:disabled { 
          background: #ccc; 
          cursor: not-allowed; 
        }

            @media (max-width: 768px) {
                .page {
                    padding: 60px 30px;
                }
                h1 {
                    font-size: 48px;
                }
                .domain-hero {
                    font-size: 56px;
                }
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
        <div class="page">
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
        <div class="page">
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
        <div class="page">
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
        <div class="page">
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
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Foundation</div>
                    <div class="section-title">Nervous System<br>Assessment</div>
                </div>
                
                <div class="metric-row">
                    <div class="metric-label">Primary State</div>
                    <div class="metric-value">${nervousSystemAssessment.primary_state || "Not specified"}</div>
                </div>
                
                <div class="metric-row">
                    <div class="metric-label">Regulation Capacity</div>
                    <div class="metric-value">${nervousSystemAssessment.regulation_capacity || "Not specified"}</div>
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
        <div class="page">
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
                    ${
                      dailyActions && dailyActions.length > 0
                        ? `<div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(201, 169, 110, 0.3);">
                        <div style="font-weight: 600; margin-bottom: 15px; color: var(--dark-olive);">DAILY ACTIONS</div>
                        ${dailyActions.map((action, index) => `<div style="font-size: 12px; color: #666; margin-bottom: 8px; line-height: 1.6;">${action}</div>`).join("")}
                    </div>`
                        : ""
                    }
                    ${
                      thirtyDayApproach
                        ? `<div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(201, 169, 110, 0.3);">
                        <div style="font-weight: 600; margin-bottom: 15px; color: var(--dark-olive);">30-DAY APPROACH</div>
                        <div style="font-size: 13px; line-height: 1.7; color: var(--deep-charcoal);">${formatTextWithParagraphBreaks(thirtyDayApproach)}</div>
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


        <!-- PAGE 7: BOTTOM LINE + REMINDER (V3.0) -->
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
        <div class="page" style="page-break-before: always; display: flex; align-items: center; justify-content: center;">
            <div class="page-content" style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">
                <div class="pull-quote" style="text-align: center; width: 100%; margin: 0;">
                    <div class="pull-quote-text"><strong>"${pullQuote}"</strong></div>
                    <div style="font-size: 11px; letter-spacing: 0.1em; color: #999; margin-top: 20px;">${quoteAttribution}</div>
                </div>
            </div>
        </div>

        <!-- PAGE 8: WHAT'S NEXT (V3.0) -->
        <div class="page">
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
                        <p style="margin: 0 0 20px 0; line-height: 1.8;"><strong>Contact:</strong> Questions? Email <a href="mailto:info@thesmartmethod.co" style="color: var(--lime-green); text-decoration: none;">info@thesmartmethod.co</a></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- PAGE 9: DEVELOPMENT REMINDERS (V3.0) -->
        <div class="page">
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

        <!-- FINAL PAGE -->
        <div class="page" style="display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--cream); padding: 60px; text-align: center; max-width: 600px; border-left: 2px solid var(--soft-gold);">
                <p style="font-size: 13px; line-height: 2.2; font-style: italic;">
                    This assessment was built with care, respect, and the belief that you already have everything you need to become the person you described. The only thing left to do is <em>take action</em>.
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
          <button 
            class="pdf-button" 
            onclick="showPDF()"
                        ${!signedPdfUrl ? "disabled" : ""}
          >
                        ${signedPdfUrl ? "View PDF Report" : "PDF Still Generating..."}
          </button>
        </div>
            </div>
      </div>

      <script>
        function showPDF() {
          ${
            signedPdfUrl
              ? `
            const link = document.createElement('a');
            link.href = '${signedPdfUrl}';
            link.download = 'your-protocol.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          `
              : `
            alert('PDF is still being generated. Please wait a moment and refresh the page.');
          `
          }
        }
      </script>
    </body>
    </html>
  `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}
