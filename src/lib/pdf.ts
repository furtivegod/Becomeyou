import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface PlanData {
  title: string
  overview: string
  assessment_overview?: string
  development_profile?: string
  bottom_line?: string
  daily_actions: Array<{
    day: number
    title: string
    description: string
    duration: string
    category: string
  }>
  weekly_goals: Array<{
    week: number
    focus: string
    goals: string[]
  }>
  resources: string[]
  reflection_prompts: string[]
}

export async function generatePDF(planData: PlanData, sessionId: string): Promise<{ pdfUrl: string, pdfBuffer: Buffer }> {
  try {
    console.log('Generating PDF for session:', sessionId)
    console.log('Plan data received:', {
      title: planData.title,
      overview: planData.overview,
      daily_actions_count: planData.daily_actions?.length || 0,
      weekly_goals_count: planData.weekly_goals?.length || 0,
      resources_count: planData.resources?.length || 0,
      reflection_prompts_count: planData.reflection_prompts?.length || 0
    })

    // Check for PDFShift API key
    if (!process.env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured')
      throw new Error('PDF generation service not configured')
    }

    // Validate data
    if (!planData.daily_actions || !Array.isArray(planData.daily_actions)) {
      planData.daily_actions = []
    }
    if (!planData.weekly_goals || !Array.isArray(planData.weekly_goals)) {
      planData.weekly_goals = []
    }
    if (!planData.resources || !Array.isArray(planData.resources)) {
      planData.resources = []
    }
    if (!planData.reflection_prompts || !Array.isArray(planData.reflection_prompts)) {
      planData.reflection_prompts = []
    }

    // Generate HTML content
    const htmlContent = generateHTMLReport(planData)
    
    // Convert HTML to PDF using PDFShift
    console.log('Converting HTML to PDF using PDFShift...')
    const pdfBuffer = await convertHTMLToPDF(htmlContent)
    
    // Store PDF in Supabase Storage
    const fileName = `protocol-${sessionId}-${Date.now()}.pdf`
    const filePath = `reports/${fileName}`
    
    console.log('Storing PDF in Supabase Storage:', filePath)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }
    
    console.log('PDF uploaded successfully:', uploadData.path)
    
    // Generate signed URL for the PDF
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 days expiry
    
    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`)
    }
    
    const signedUrl = signedUrlData.signedUrl
    console.log('Signed URL generated successfully')
    
    // Store PDF metadata in database
    const { error: dbError } = await supabase
      .from('pdf_jobs')
      .insert({
        session_id: sessionId,
        status: 'completed',
        pdf_url: signedUrl,
        file_path: filePath
      })
    
    if (dbError) {
      console.error('Error storing PDF metadata:', dbError)
    }
    
    return { pdfUrl: signedUrl, pdfBuffer }

  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function convertHTMLToPDF(htmlContent: string): Promise<Buffer> {
  try {
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: htmlContent,
        format: 'A4',
        margin: '20mm',
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PDFShift API error:', response.status, errorText)
      throw new Error(`PDFShift API error: ${response.status} - ${errorText}`)
    }

    const pdfBuffer = await response.arrayBuffer()
    console.log('PDF generated successfully via PDFShift')
    return Buffer.from(pdfBuffer)

  } catch (error) {
    console.error('PDFShift conversion error:', error)
    throw new Error(`Failed to convert HTML to PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function generateHTMLReport(planData: PlanData): string {
  // Ensure all arrays exist and have content
  const dailyActions = planData.daily_actions || []
  const weeklyGoals = planData.weekly_goals || []
  const resources = planData.resources || []
  const reflectionPrompts = planData.reflection_prompts || []
  
  // Ensure we have at least some content for each section
  const safeDailyActions = dailyActions.length > 0 ? dailyActions : [
    "Day 1: Start with 5 minutes of morning reflection on your goals",
    "Day 2: Practice one small action that moves you toward your main objective",
    "Day 3: Notice one pattern that serves you and one that doesn't"
  ]
  
  const safeWeeklyGoals = weeklyGoals.length > 0 ? weeklyGoals : [
    "Week 1: Establish a daily routine that supports your goals",
    "Week 2: Practice one new skill or habit consistently"
  ]
  
  const safeResources = resources.length > 0 ? resources : [
    "Daily journal for tracking progress and insights",
    "Accountability partner or support group"
  ]
  
  const safeReflectionPrompts = reflectionPrompts.length > 0 ? reflectionPrompts : [
    "What was one moment today where I felt truly aligned with my values?",
    "What pattern did I notice in myself today, and how did I respond?"
  ]

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${planData.title || 'You 3.0 Assessment Report'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          background: white;
          font-size: 14px;
        }
        
        .page {
          width: 100%;
          min-height: 100vh;
          padding: 40px;
          position: relative;
        }
        
        .header-banner {
          background: #f5f3f0;
          padding: 30px;
          margin-bottom: 40px;
          text-align: center;
          border-radius: 8px;
        }
        
        .header-banner h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        
        .header-banner .subtitle {
          font-size: 1.1em;
          color: #7f8c8d;
          font-weight: 300;
        }
        
        .section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.8em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 25px;
          text-align: center;
          background: #f5f3f0;
          padding: 20px;
          border-radius: 8px;
          letter-spacing: 0.5px;
        }
        
        .content {
          font-size: 14px;
          line-height: 1.7;
          color: #34495e;
          margin-bottom: 20px;
        }
        
        .highlight-box {
          background: #fff8e1;
          border-left: 4px solid #f39c12;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        
        .highlight-box p {
          font-style: italic;
          color: #8b4513;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .domain-section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .domain-title {
          font-size: 1.4em;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .domain-item {
          margin-bottom: 15px;
        }
        
        .domain-item strong {
          color: #2c3e50;
          font-weight: 600;
        }
        
        .protocol-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin: 30px 0;
        }
        
        .protocol-item {
          margin-bottom: 15px;
          padding-left: 20px;
          position: relative;
        }
        
        .protocol-item::before {
          content: "•";
          color: #3498db;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .reminder-box {
          background: #fff8e1;
          border: 2px solid #f39c12;
          padding: 25px;
          margin: 30px 0;
          border-radius: 8px;
          text-align: center;
        }
        
        .reminder-box h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.3em;
          color: #8b4513;
          margin-bottom: 15px;
        }
        
        .reminder-box p {
          font-style: italic;
          color: #8b4513;
          font-size: 16px;
        }
        
        .footer {
          position: absolute;
          bottom: 20px;
          left: 40px;
          right: 40px;
          border-top: 1px solid #bdc3c7;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .footer .client-name {
          color: #7f8c8d;
          font-size: 12px;
        }
        
        .footer .version {
          color: #7f8c8d;
          font-size: 12px;
          font-weight: 600;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .quote {
          font-style: italic;
          color: #7f8c8d;
          border-left: 3px solid #bdc3c7;
          padding-left: 20px;
          margin: 20px 0;
        }
        
        .assessment-overview {
          background: #ecf0f1;
          padding: 25px;
          border-radius: 8px;
          margin: 30px 0;
        }
        
        .assessment-overview h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5em;
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .nervous-system {
          background: #e8f4f8;
          padding: 25px;
          border-radius: 8px;
          margin: 30px 0;
        }
        
        .nervous-system h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5em;
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .bottom-line {
          background: #2c3e50;
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin: 30px 0;
          text-align: center;
        }
        
        .bottom-line h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5em;
          margin-bottom: 15px;
        }
        
        .bottom-line p {
          font-size: 16px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="page">
        <div class="header-banner">
          <h1>YOU 3.0 PERSONAL DEVELOPMENT ASSESSMENT</h1>
          <div class="subtitle">BEHAVIORAL OPTIMIZATION</div>
        </div>
        
        <div class="assessment-overview">
          <h2>Assessment Overview</h2>
          <p>${planData.assessment_overview || 'Your personalized assessment has been completed. This report provides insights into your behavioral patterns and recommendations for growth.'}</p>
        </div>
        
        <div class="highlight-box">
          <p>This assessment was built with care, respect, and the belief that you already have everything you need to become the person you described. The only thing left to do is <em>take action</em>.</p>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Development Profile Page -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Your Development Profile</div>
          <div class="content">
            <p>${planData.development_profile || 'Based on your responses, you\'ve shown clear patterns of behavior and areas where you\'re ready for transformation.'}</p>
          </div>
          <div class="quote">
            <p>Your words: "[PULL_QUOTE_FROM_CLIENT]"</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Sabotage Pattern Analysis -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Sabotage Pattern Analysis</div>
          
          <div class="domain-item">
            <strong>Your Protective Pattern:</strong> [CLIENT_PATTERN_IN_THEIR_WORDS]
          </div>
          
          <div class="domain-item">
            <strong>What It's Protecting You From:</strong> [ANALYSIS_PARAGRAPH]
          </div>
          
          <div class="domain-item">
            <strong>How It Serves You:</strong> [SECONDARY_GAINS_PARAGRAPH]
          </div>
          
          <div class="domain-item">
            <strong>Your Go-To Patterns:</strong> [DOPAMINE_PATTERNS_LIST]
          </div>
          
          <div class="domain-item">
            <strong>Your Success Proof:</strong> [TIMES_THEY'VE_OVERCOME_IT]
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Domain Breakdown - Mind -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Domain Breakdown</div>
          <div class="domain-title">MIND</div>
          
          <div class="domain-item">
            <strong>Current Level:</strong> [Foundation / Exploration / Mastery]
          </div>
          
          <div class="domain-item">
            <strong>Current Phase:</strong> [Friction / Experimentation / Integration]
          </div>
          
          <div class="domain-item">
            <strong>Key Strengths:</strong> [PARAGRAPH_WITH_SPECIFIC_EXAMPLES]
          </div>
          
          <div class="domain-item">
            <strong>Here's what you're already proving works:</strong> [CONNECTION_TO_OTHER_AREAS]
          </div>
          
          <div class="domain-item">
            <strong>Growth Opportunities:</strong> [PARAGRAPH_FRAMED_AS_WHATS_IN_REACH]
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Domain Breakdown - Body -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Domain Breakdown</div>
          <div class="domain-title">BODY</div>
          
          <div class="domain-item">
            <strong>Current Level:</strong> [Foundation / Exploration / Mastery]
          </div>
          
          <div class="domain-item">
            <strong>Current Phase:</strong> [Friction / Experimentation / Integration]
          </div>
          
          <div class="domain-item">
            <strong>Key Strengths:</strong> [PARAGRAPH_WITH_SPECIFIC_EXAMPLES]
          </div>
          
          <div class="domain-item">
            <strong>Here's what you're already proving works:</strong> [CONNECTION_TO_OTHER_AREAS]
          </div>
          
          <div class="domain-item">
            <strong>Growth Opportunities:</strong> [PARAGRAPH_FRAMED_AS_WHATS_IN_REACH]
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Domain Breakdown - Spirit -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Domain Breakdown</div>
          <div class="domain-title">SPIRIT & RELATIONSHIPS</div>
          
          <div class="domain-item">
            <strong>Current Level:</strong> [Foundation / Exploration / Mastery]
          </div>
          
          <div class="domain-item">
            <strong>Current Phase:</strong> [Friction / Experimentation / Integration]
          </div>
          
          <div class="domain-item">
            <strong>Key Strengths:</strong> [PARAGRAPH_WITH_SPECIFIC_EXAMPLES]
          </div>
          
          <div class="domain-item">
            <strong>Here's what you're already proving works:</strong> [CONNECTION_TO_OTHER_AREAS]
          </div>
          
          <div class="domain-item">
            <strong>Growth Opportunities:</strong> [PARAGRAPH_FRAMED_AS_WHATS_IN_REACH]
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Domain Breakdown - Contribution -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Domain Breakdown</div>
          <div class="domain-title">CONTRIBUTION</div>
          
          <div class="domain-item">
            <strong>Current Level:</strong> [Foundation / Exploration / Mastery]
          </div>
          
          <div class="domain-item">
            <strong>Current Phase:</strong> [Friction / Experimentation / Integration]
          </div>
          
          <div class="domain-item">
            <strong>Key Strengths:</strong> [PARAGRAPH_WITH_SPECIFIC_EXAMPLES]
          </div>
          
          <div class="domain-item">
            <strong>Here's what you're already proving works:</strong> [CONNECTION_TO_OTHER_AREAS]
          </div>
          
          <div class="domain-item">
            <strong>Growth Opportunities:</strong> [PARAGRAPH_FRAMED_AS_WHATS_IN_REACH]
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Nervous System Assessment -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Nervous System Assessment</div>
          
          <div class="nervous-system">
            <h2>Primary State:</h2>
            <p>[PLAIN_LANGUAGE_DESCRIPTION]</p>
            
            <h2>Regulation Capacity:</h2>
            <p>[Natural / Developing / Needs Support]</p>
            
            <h2>Observable Patterns:</h2>
            <ul>
              <li>[CLIENT_QUOTE_1]</li>
              <li>[CLIENT_QUOTE_2]</li>
              <li>[CLIENT_QUOTE_3]</li>
              <li>[CLIENT_QUOTE_4]</li>
              <li>[CLIENT_QUOTE_5]</li>
              <li>[CLIENT_QUOTE_6]</li>
            </ul>
            
            <h2>Your Regulation Snapshot:</h2>
            <p>[PARAGRAPH_EXPLAINING_THEIR_CAPACITY]</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- 30-Day Protocol -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">30-Day Recommend Growth Protocol</div>
          
          <div class="protocol-section">
            <p><strong>Your recommended approach based on:</strong> [LIST_THEIR_SPECIFIC_PATTERNS]</p>
            
            <div class="protocol-item">
              <strong>72-Hour Suggestion:</strong> [ONE_SPECIFIC_ACTION_ANCHORED_TO_STRONGEST_HABIT]
            </div>
            
            <div class="protocol-item">
              <strong>Weekly Recommendation:</strong> [ONE_RECURRING_PRACTICE]
            </div>
            
            <div class="protocol-item">
              <strong>30-Day Approach:</strong> [ONE_SYSTEM_SHIFT_WITH_SPECIFIC_STEPS]
            </div>
            
            <div class="protocol-item">
              <strong>Environmental Optimization:</strong> [ONE_ENVIRONMENTAL_CHANGE]
            </div>
            
            <div class="protocol-item">
              <strong>Suggested Progress Markers (observe these, don't force them):</strong>
              <ol>
                <li>[BEHAVIORAL_MARKER_1]</li>
                <li>[BEHAVIORAL_MARKER_2]</li>
                <li>[BEHAVIORAL_MARKER_3]</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Development Reminders -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Development Reminders</div>
          
          <div class="content">
            <ul>
              <li>Growth is cyclical; regression is protection, not failure</li>
              <li>Integration comes through consistent practice, not more awareness</li>
              <li>Your nervous system is the foundation—regulate first, then grow</li>
              <li>Your sabotage patterns have wisdom; honor them while updating them</li>
              <li>Identity shifts over time with deliberate practice</li>
              <li>You're not broken—you're context-dependent. Build better contexts.</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Reminder Box -->
      <div class="page page-break">
        <div class="section">
          <div class="reminder-box">
            <h3>Reminder Box</h3>
            <p>"[DIRECT_CLIENT_QUOTE]"</p>
            <p>"[RESPONSE_TO_QUOTE]"</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Bottom Line -->
      <div class="page page-break">
        <div class="section">
          <div class="bottom-line">
            <h2>Bottom Line</h2>
            <p>[PERSONALIZED_WAKE_UP_PARAGRAPH - addresses protective function AND cost of keeping pattern]</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Book Recommendations -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Book Recommendations</div>
          
          <div class="content">
            <ol>
              <li><strong>[BOOK_TITLE_1]</strong> by [AUTHOR_1]</li>
              <p>[WHY_THIS_BOOK_FITS_THEIR_JOURNEY]</p>
              
              <li><strong>[BOOK_TITLE_2]</strong> by [AUTHOR_2]</li>
              <p>[WHY_THIS_BOOK_FITS_THEIR_JOURNEY]</p>
            </ol>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
      
      <!-- Next Steps -->
      <div class="page page-break">
        <div class="section">
          <div class="section-title">Next Steps</div>
          
          <div class="content">
            <p><strong>6-Month Follow-Up Assessment Recommended:</strong> [PERSONALIZED_TIMELINE_AND_EXPECTED_PROGRESS]</p>
            
            <p><strong>Monthly Check-In Options:</strong> Brief progress reviews (15-20 min) to track:</p>
            <ul>
              <li>Nervous system regulation progress</li>
              <li>Business execution vs. avoidance patterns</li>
              <li>Body care consistency</li>
              <li>Relationship dynamics as you grow</li>
            </ul>
            
            <p><strong>Focus Areas for Next Phase:</strong></p>
            <ul>
              <li>[FOCUS_AREA_1]</li>
              <li>[FOCUS_AREA_2]</li>
              <li>[FOCUS_AREA_3]</li>
              <li>[FOCUS_AREA_4]</li>
            </ul>
            
            <p><strong>How to Stay Connected:</strong> [YOUR_NEWSLETTER_SIGNUP_COMMUNITY_LINKS]</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="client-name">[CLIENT NAME]</div>
          <div class="version">YOU 3.0</div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Function to get signed URL for existing PDF
export async function getSignedPDFUrl(sessionId: string): Promise<string | null> {
  try {
    console.log('Getting signed URL for session:', sessionId)
    
    // Get the latest PDF job for this session
    const { data: pdfJob, error: jobError } = await supabase
      .from('pdf_jobs')
      .select('file_path, status')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (jobError || !pdfJob) {
      console.log('No completed PDF found for session:', sessionId)
      return null
    }
    
    // Generate new signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('reports')
      .createSignedUrl(pdfJob.file_path, 60 * 60 * 24 * 7) // 7 days expiry

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return null
    }

    return signedUrlData.signedUrl

  } catch (error) {
    console.error('Error getting signed PDF URL:', error)
    return null
  }
}