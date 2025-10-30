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
            h1 { color: #4A5D23; margin-bottom: 1rem; font-family: 'Georgia', 'Times New Roman', serif; }
            p { color: #1A1A1A; line-height: 1.6; }
            .retry-btn {
              background: #4A5D23;
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

    // Get user data to display the correct name
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    let userName = "Client"; // Default fallback
    if (!sessionError && sessionData) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_name")
        .eq("id", sessionData.user_id)
        .single();

      if (!userError && userData?.user_name) {
        userName = userData.user_name;
      }
    }

    return generateHTMLReport(planData, sessionId, signedPdfUrl, userName);
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
  userName?: string
) {
  const clientName = userName || "Client";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Select top 2 book recommendations based on assessment content (to mirror PDF)
  const allBooks = [
    {
      id: "body_keeps_score",
      title: "The Body Keeps the Score",
      author: "Bessel van der Kolk",
      url: "https://amzn.to/4hJB9wT",
      why: "The definitive text on trauma and nervous system.",
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
      why: "Practical, accessible nervous system regulation.",
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
      why: "Build evidence through small actions.",
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
      why: "Holistic approach: shadow work + regulation.",
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
      why: "Emotional literacy foundation.",
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
      why: "Identity transformation framework.",
      tags: ["identity", "future self", "become", "vision", "self-concept"],
    },
    {
      id: "first_rule_of_mastery",
      title: "The First Rule of Mastery",
      author: "Dr. Michael Gervais",
      url: "https://amzn.to/4hx7Ld3",
      why: "Performance psychology for overthinkers.",
      tags: ["performance", "mind", "fear", "overthinking", "mastery"],
    },
    {
      id: "crucial_conversations",
      title: "Crucial Conversations",
      author: "Kerry Patterson",
      url: "https://amzn.to/49sdXkC",
      why: "High ROI communication skills.",
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
      why: "Focus and anti-distraction.",
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
      why: "Perfectionism and shame.",
      tags: ["perfectionism", "shame", "worthiness", "belonging"],
    },
    {
      id: "breath",
      title: "Breath: The New Science of a Lost Art",
      author: "James Nestor",
      url: "https://amzn.to/4ntDahQ",
      why: "Immediate nervous system benefits.",
      tags: ["breath", "breathing", "anxiety", "body", "calm"],
    },
    {
      id: "dose_effect",
      title: "The DOSE Effect",
      author: "TJ Power",
      url: "https://amzn.to/4oPrA1X",
      why: "Dopamine and cheap dopamine loops.",
      tags: [
        "dopamine",
        "addiction",
        "phone",
        "scroll",
        "porn",
        "games",
        "garden scapes",
        "garden-scapes",
        "gardenscapes",
      ],
    },
    {
      id: "war_of_art",
      title: "The War of Art",
      author: "Steven Pressfield",
      url: "https://amzn.to/4ogrhgI",
      why: "Break resistance and procrastination.",
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
      why: "For dorsal shutdown cases.",
      tags: ["polyvagal", "shutdown", "dorsal", "therap", "nervous system"],
    },
    {
      id: "mindset",
      title: "Mindset: The New Psychology of Success",
      author: "Carol Dweck",
      url: "https://amzn.to/47Lmb66",
      why: "Shift from fixed to growth.",
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
      const boosts =
        (text.includes("freeze") ||
        text.includes("resistance") ||
        text.includes("promotion") ||
        text.includes("visibility")
          ? b.id === "war_of_art" || b.id === "deep_work"
            ? 1
            : 0
          : 0) +
        (text.includes("porn") ||
        text.includes("scroll") ||
        text.includes("garden scapes") ||
        text.includes("gardenscapes")
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
      return allBooks
        .filter((b) => ["atomic_habits", "body_keeps_score"].includes(b.id))
        .slice(0, 2);
    }
    return top;
  }

  const selectedBooks = selectTopTwoBooks(planData);

  return new NextResponse(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>YOU 3.0 Assessment - ${clientName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            :root {
                --cream: #F9F6F1;
                --warm-white: #FEFDFB;
                --deep-charcoal: #2A2A2A;
                --soft-gold: #C9A96E;
            }

        body { 
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 11pt;
                font-weight: 300;
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
                font-family: 'Cormorant Garamond', Georgia, serif;
                font-size: 72px;
                font-weight: 300;
                color: var(--deep-charcoal);
                line-height: 1.1;
                letter-spacing: -0.02em;
                margin-bottom: 60px;
            }

            h2 {
                font-family: 'Cormorant Garamond', Georgia, serif;
                font-size: 42px;
                font-weight: 300;
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
                font-family: 'Cormorant Garamond', serif;
                font-size: 20px;
                font-style: italic;
                font-weight: 300;
                color: #666;
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
                font-family: 'Cormorant Garamond', serif;
                font-size: 48px;
                font-weight: 300;
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
                font-weight: 300;
            }

            /* DOMAIN HERO */
            .domain-hero {
                font-size: 96px;
                font-weight: 300;
                text-align: center;
                margin-bottom: 80px;
                letter-spacing: -0.03em;
                font-family: 'Cormorant Garamond', serif;
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
                font-family: 'Cormorant Garamond', serif;
                font-size: 18px;
                font-weight: 400;
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
                font-family: 'Cormorant Garamond', serif;
                font-size: 28px;
                font-style: italic;
                font-weight: 300;
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

        <!-- PAGE 1: COVER -->
        <div class="page cover">
            <div class="cover-content">
                <div class="logo-mark">BECOME YOU</div>
                <h1>YOUR FULL<br>YOU 3.0<br>SUMMARY</h1>
                <div class="cover-tagline">This is where<br>transformation begins</div>
            </div>
        </div>

        <!-- PAGE 2: TITLE -->
        <div class="page">
            <div class="page-content" style="text-align: center;">
                <div style="margin-bottom: 80px; font-size: 14px; letter-spacing: 8px; color: var(--soft-gold); font-weight: 300;">
                    become / you
                </div>
                
                <h2 style="margin-bottom: 60px;">YOU 3.0 PERSONAL<br>DEVELOPMENT ASSESSMENT</h2>
                
                <div style="font-size: 12px; line-height: 2.5; color: #666;">
                    <p style="margin: 20px 0;"><span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; color: var(--soft-gold);">Client</span><br>${clientName}</p>
                    <p style="margin: 20px 0;"><span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; color: var(--soft-gold);">Date</span><br>${currentDate}</p>
                    <p style="margin: 20px 0;"><span style="letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; color: var(--soft-gold);">Type</span><br>Behavioral Optimization</p>
          </div>
                
                <div class="divider"></div>
                
                <p style="font-size: 11px; font-style: italic; color: #999; max-width: 500px; margin: 0 auto;">
                    This assessment is not a diagnostic tool and does not replace professional mental health support. If you are experiencing crisis-level distress, please seek immediate professional care.
                </p>
            </div>
            <div class="page-number">02</div>
        </div>

        <!-- PAGE 3: ASSESSMENT OVERVIEW -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Overview</div>
                    <div class="section-title">Assessment Overview</div>
          </div>
                
                <p style="font-size: 15px; line-height: 2;">${planData.assessment_overview || "Your personalized behavioral optimization assessment reveals the patterns that have been keeping you stuck and provides a clear path forward."}</p>
            </div>
            <div class="page-number">03</div>
              </div>

        <!-- PAGE 4: DEVELOPMENT PROFILE -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Your Profile</div>
                    <div class="section-title">Your Development<br>Profile</div>
          </div>
                
                <p style="font-size: 15px; line-height: 2;">${planData.development_profile || "Your core development pattern and how it shows up in your daily life."}</p>
                
                ${
                  planData.client_quote
                    ? `
                <div class="content-block">
                    <div class="block-title">Your Words</div>
                    <div class="block-content" style="font-style: italic;">
                        "${planData.client_quote}"
                    </div>
                </div>
                `
                    : ""
                }
            </div>
            <div class="page-number">04</div>
        </div>

        <!-- PAGE 5: SABOTAGE PATTERN -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Pattern Analysis</div>
                    <div class="section-title">Sabotage Pattern<br>Analysis</div>
                </div>
                
                ${
                  planData.sabotage_analysis
                    ? `
                <div class="content-block">
                    <div class="block-title">Your Protective Pattern</div>
                    <div class="block-content">${planData.sabotage_analysis.protective_pattern || "Your specific protective pattern"}</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">What It's Protecting You From</div>
                    <div class="block-content">${planData.sabotage_analysis.what_its_protecting_from || "The underlying fear driving your patterns"}</div>
          </div>
                
                <div class="content-block">
                    <div class="block-title">Your Success Proof</div>
                    <div class="block-content">${planData.sabotage_analysis.success_proof || "Evidence that you can overcome this pattern"}</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">Your Anchor</div>
                    <div class="block-content">${planData.sabotage_analysis.anchor || "Your daily anchor practice"}</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">Go To Patterns</div>
                    <div class="block-content">${planData.sabotage_analysis.go_to_patterns || "Your automatic response patterns"}</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">Escape Behavior</div>
                    <div class="block-content">${planData.sabotage_analysis.escape_behavior || "Your primary escape mechanism"}</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">How It Serves You</div>
                    <div class="block-content">${planData.sabotage_analysis.how_it_serves_you || "The function this pattern serves"}</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">Positive Behavior</div>
                    <div class="block-content">${planData.sabotage_analysis.positive_behavior || "The behavior you want to develop"}</div>
                </div>
                `
                    : ""
                }
            </div>
            <div class="page-number">05</div>
        </div>

        <!-- IN THE MOMENT RESET PAGE -->
        ${
          planData.in_the_moment_reset
            ? `
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Reset Strategy</div>
                    <div class="section-title">In The Moment<br>Reset</div>
                </div>
                
                <div class="content-block">
                    <div class="block-content">
                        <p>${planData.in_the_moment_reset}</p>
                    </div>
                </div>
            </div>
            <div class="page-number">06</div>
        </div>
        `
            : ""
        }

        <!-- PAGE 7: DOMAIN DIVIDER -->
        <div class="page" style="display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
                <div class="section-label">The Four Domains</div>
                <h2 style="font-size: 52px; margin-top: 40px;">Domain Breakdown</h2>
            </div>
            <div class="page-number">07</div>
        </div>

        ${
          planData.domain_breakdown
            ? Object.entries(planData.domain_breakdown)
                .map(
                  ([domain, data]: [string, any], index: number) => `
        <!-- PAGE ${8 + index}: ${domain.toUpperCase()} -->
        <div class="page">
            <div class="page-content">
                <h1 class="domain-hero">${domain.toUpperCase()}</h1>
                
                ${
                  data.current_level
                    ? `
                <div class="metric-row">
                    <div class="metric-label">Current Level</div>
                    <div class="metric-value">${data.current_level}</div>
          </div>
        `
                    : ""
                }

                ${
                  data.current_phase
                    ? `
                <div class="metric-row">
                    <div class="metric-label">Current Phase</div>
                    <div class="metric-value">${data.current_phase}</div>
              </div>
                `
                    : ""
                }
                
                ${
                  data.key_strengths
                    ? `
                <div class="content-block">
                    <div class="block-title">Key Strengths</div>
                    <div class="block-content">${data.key_strengths}</div>
          </div>
        `
                    : ""
                }

                ${
                  data.growth_opportunities
                    ? `
                <div class="content-block">
                    <div class="block-title">Growth Opportunities</div>
                    <div class="block-content">${data.growth_opportunities}</div>
                </div>
                `
                    : ""
                }
            </div>
            <div class="page-number">${8 + index}</div>
        </div>
        `
                )
                .join("")
            : ""
        }

        <!-- NERVOUS SYSTEM PAGE -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Foundation</div>
                    <div class="section-title">Nervous System<br>Assessment</div>
                </div>
                
                ${
                  planData.nervous_system_assessment
                    ? `
                ${
                  planData.nervous_system_assessment.primary_state
                    ? `
                <div class="content-block">
                    <div class="block-title">Primary State</div>
                    <div class="block-content">${planData.nervous_system_assessment.primary_state}</div>
                </div>
                
                <div class="divider"></div>
                
                `
                    : ""
                }
                
                ${
                  planData.nervous_system_assessment.regulation_capacity
                    ? `
                <div class="content-block">
                    <div class="block-title">Regulation Capacity</div>
                    <div class="block-content">${planData.nervous_system_assessment.regulation_capacity}</div>
          </div>
                `
                    : ""
                }

                ${
                  planData.nervous_system_assessment.regulation_reality
                    ? `
                <div class="content-block">
                    <div class="block-title">Regulation Reality</div>
                    <div class="block-content">${planData.nervous_system_assessment.regulation_reality}</div>
          </div>
        `
                    : ""
                }

                ${
                  planData.nervous_system_assessment.observable_patterns
                    ? `
                <div class="content-block">
                    <div class="block-title">Observable Patterns</div>
                    <div class="block-content">
                        ${
                          Array.isArray(
                            planData.nervous_system_assessment
                              .observable_patterns
                          )
                            ? planData.nervous_system_assessment.observable_patterns
                                .map((pattern: string) => `<p>${pattern}</p>`)
                                .join("")
                            : `<p>${planData.nervous_system_assessment.observable_patterns}</p>`
                        }
            </div>
          </div>
        `
                    : ""
                }
                `
                    : ""
                }
            </div>
            <div class="page-number">${8 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>

        <!-- 30-DAY PROTOCOL PAGE -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Your Protocol</div>
                    <div class="section-title">30-Day Growth<br>Protocol</div>
                </div>
                
                ${
                  planData.thirty_day_protocol
                    ? `
                ${
                  planData.thirty_day_protocol.seventy_two_hour_suggestion
                    ? `
                <div class="protocol-item">
                    <div class="protocol-timeline">72-Hour Suggestion</div>
                    <div class="protocol-action">${planData.thirty_day_protocol.seventy_two_hour_suggestion}</div>
          </div>
        `
                    : ""
                }

                ${
                  planData.thirty_day_protocol.weekly_recommendation
                    ? `
                <div class="protocol-item">
                    <div class="protocol-timeline">Weekly Recommendation</div>
                    <div class="protocol-action">${planData.thirty_day_protocol.weekly_recommendation}</div>
                    ${
                      planData.thirty_day_protocol.weekly_goals
                        ? `
                    <div class="protocol-goals">
                        ${
                          Array.isArray(
                            planData.thirty_day_protocol.weekly_goals
                          )
                            ? planData.thirty_day_protocol.weekly_goals
                                .map(
                                  (goal: string) =>
                                    `<div class="goal-item">${goal}</div>`
                                )
                                .join("")
                            : `<div class="goal-item">${planData.thirty_day_protocol.weekly_goals}</div>`
                        }
          </div>
                    `
                        : ""
                    }
                </div>
                `
                    : ""
                }

                ${
                  planData.thirty_day_protocol.environmental_optimization
                    ? `
                <div class="protocol-item">
                    <div class="protocol-timeline">Environmental Optimization</div>
                    <div class="protocol-action">${planData.thirty_day_protocol.environmental_optimization}</div>
          </div>
        `
                    : ""
                }

                ${
                  planData.thirty_day_protocol.thirty_day_approach
                    ? `
                <div class="protocol-item">
                    <div class="protocol-timeline">30-Day Approach</div>
                    <div class="protocol-action">${planData.thirty_day_protocol.thirty_day_approach}</div>
                    ${
                      planData.thirty_day_protocol.daily_actions
                        ? `
                    <div class="protocol-goals">
                        ${
                          Array.isArray(
                            planData.thirty_day_protocol.daily_actions
                          )
                            ? planData.thirty_day_protocol.daily_actions
                                .map(
                                  (action: string) =>
                                    `<div class="goal-item">${action}</div>`
                                )
                                .join("")
                            : `<div class="goal-item">${planData.thirty_day_protocol.daily_actions}</div>`
                        }
                </div>
                    `
                        : ""
                    }
            </div>
                `
                    : ""
                }

                ${
                  planData.thirty_day_protocol.progress_markers
                    ? `
                <div class="content-block">
                    <div class="block-title">Suggested Progress Markers</div>
                    <div class="block-content">
                        ${
                          Array.isArray(
                            planData.thirty_day_protocol.progress_markers
                          )
                            ? planData.thirty_day_protocol.progress_markers
                                .map(
                                  (marker: string) =>
                                    `<div class="reminder-item">${marker}</div>`
                                )
                                .join("")
                            : `<div class="reminder-item">${planData.thirty_day_protocol.progress_markers}</div>`
                        }
        </div>
                </div>
                `
                    : ""
                }

                `
                    : ""
                }
            </div>
            <div class="page-number">${9 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>


        <!-- REMINDER QUOTE PAGE -->
        ${
          planData.reminder_quote
            ? `
        <div class="page" style="display: flex; align-items: center; justify-content: center;">
            <div class="page-content" style="text-align: center; max-width: 700px;">
                <div class="pull-quote">
                    <div class="pull-quote-text">"${planData.reminder_quote}"</div>
                </div>
            </div>
            <div class="page-number">${10 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>
        `
            : ""
        }

        <!-- BOTTOM LINE PAGE -->
        <div class="page bottom-line-page">
            <div class="page-content" style="text-align: center; max-width: 700px;">
            <h2>Bottom Line</h2>
                <p>${planData.bottom_line || "Your personalized bottom line insight based on your assessment."}</p>
            </div>
          </div>

        <!-- DEVELOPMENT REMINDERS PAGE -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Reminders</div>
                    <div class="section-title">Development<br>Reminders</div>
                </div>
                
                ${
                  planData.development_reminders
                    ? `
                ${
                  Array.isArray(planData.development_reminders)
                    ? planData.development_reminders
                        .map(
                          (reminder: string) => `
                <div class="reminder-item">${reminder}</div>
                `
                        )
                        .join("")
                    : `
                <div class="reminder-item">${planData.development_reminders}</div>
                `
                }
                `
                    : `
                <div class="reminder-item">Growth is cyclical; regression is protection, not failure</div>
                <div class="reminder-item">Integration comes through consistent practice, not more awareness</div>
                <div class="reminder-item">Your nervous system is the foundation—regulate first, then grow</div>
                <div class="reminder-item">Your sabotage patterns have wisdom; honor them while updating them</div>
                <div class="reminder-item">Identity shifts over time with deliberate practice</div>
                <div class="reminder-item">You're not broken—you're context-dependent. Build better contexts</div>
                `
                }
            </div>
            <div class="page-number">${11 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>

        <!-- BOOK RECOMMENDATIONS PAGE (Top 2 Personalized) -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Resources</div>
                    <div class="section-title">Book<br>Recommendations</div>
                </div>

                <div class="content-block">
                  <div class="block-title">Your Top 2, Personalized</div>
                  <ol style="margin:0 0 14px 20px; padding:0; font-size:15px;">
                    ${selectedBooks
                      .map(
                        (b: any) => `
                      <li style="margin-bottom:10px;">
                        <span style="font-style:italic;"><a href="${b.url}" style="color: #1a73e8; text-decoration: underline; font-size:15px;" target="_blank">"${b.title}"</a></span>
                        by <span style="color: #1a73e8; font-size:15px;">${b.author}</span><br>
                        <strong>Why:</strong> <span style="color:#222; font-size:13px;">${b.why}</span>
                      </li>
                    `
                      )
                      .join("")}
                  </ol>
                </div>
                <div class="content-block" style="margin-top: 10px;">
                  <div style="font-size:13px; color:#777; font-style:italic; line-height:1.7; text-align:left; border-top: 1px solid #eee; padding-top:10px; max-width:650px;">
                    These books support—but do not replace—professional mental health care. If you're experiencing trauma symptoms, severe anxiety, depression, or psychological distress, please consult a licensed therapist.
                  </div>
                </div>
            </div>
            <div class="page-number">${12 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>

        <!-- RESOURCES PAGE -->
        ${
          planData.resources
            ? `
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Resources</div>
                    <div class="section-title">Additional<br>Resources</div>
                </div>
                
                ${
                  Array.isArray(planData.resources)
                    ? planData.resources
                        .map(
                          (resource: string) => `
                <div class="reminder-item">${resource}</div>
                `
                        )
                        .join("")
                    : `
                <div class="reminder-item">${planData.resources}</div>
                `
                }
            </div>
            <div class="page-number">${13 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>
        `
            : ""
        }

        <!-- REFLECTION PROMPTS PAGE -->
        ${
          planData.reflection_prompts
            ? `
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Reflection</div>
                    <div class="section-title">Reflection<br>Prompts</div>
                </div>
                
                ${
                  Array.isArray(planData.reflection_prompts)
                    ? planData.reflection_prompts
                        .map(
                          (prompt: string) => `
                <div class="reminder-item">${prompt}</div>
                `
                        )
                        .join("")
                    : `
                <div class="reminder-item">${planData.reflection_prompts}</div>
                `
                }
            </div>
            <div class="page-number">${14 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
        </div>
        `
            : ""
        }

        <!-- NEXT STEPS PAGE -->
        <div class="page">
            <div class="page-content">
                <div class="section-header">
                    <div class="section-label">Moving Forward</div>
                    <div class="section-title">Next Steps</div>
                </div>
                
                <div class="content-block">
                    <div class="block-title">How to Stay Connected</div>
                    <div class="block-content">
                        Your assessment is just the beginning.<br>
                        Over the coming weeks, you'll receive weekly insights in your inbox—real case studies of people who've broken through the exact patterns you're facing, practical protocols you can implement immediately, and advanced strategies that build on your personalized roadmap.<br>
                        Each email is designed to meet you exactly where you are in your transformation journey, delivering the precise guidance you need, when you need it most.<br>
                        These aren't generic newsletters—they're the ongoing support system that turns your 30-day protocol into a sustainable lifestyle.
                    </div>
                </div>
            </div>
            <div class="page-number">${15 + (planData.domain_breakdown ? Object.keys(planData.domain_breakdown).length : 0)}</div>
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
