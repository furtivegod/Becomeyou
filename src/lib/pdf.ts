import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface PlanData {
  title: string
  overview: string
  assessment_overview?: string
  development_profile?: string
  bottom_line?: string
  sabotage_analysis?: {
    protective_pattern?: string
    what_its_protecting_from?: string
    how_it_serves_you?: string
    go_to_patterns?: string
    success_proof?: string
    anchor?: string
  }
  in_the_moment_reset?: string
  domain_breakdown?: {
    mind?: {
      current_level?: string
      current_phase?: string
      key_strengths?: string
      growth_opportunities?: string
    }
    body?: {
      current_level?: string
      current_phase?: string
      key_strengths?: string
      growth_opportunities?: string
    }
    spirit?: {
      current_level?: string
      current_phase?: string
      key_strengths?: string
      growth_opportunities?: string
    }
    contribution?: {
      current_level?: string
      current_phase?: string
      key_strengths?: string
      growth_opportunities?: string
    }
  }
  nervous_system_assessment?: {
    primary_state?: string
    regulation_capacity?: string
    observable_patterns?: string
    regulation_reality?: string
  }
  thirty_day_protocol?: {
    seventy_two_hour_suggestion?: string
    weekly_recommendation?: string
    thirty_day_approach?: string
    environmental_optimization?: string
    progress_markers?: string[]
    daily_actions?: string[]
    weekly_goals?: string[]
  }
  reminder_quote?: string
  development_reminders?: string[]
  book_recommendations?: string[]
  resources?: string[]
  reflection_prompts?: string[]
  next_assessment?: {
    six_month_followup?: string
    monthly_checkin?: string
    focus_areas?: string[]
    stay_connected?: string
  }
}

export async function generatePDF(planData: PlanData, sessionId: string): Promise<{ pdfUrl: string, pdfBuffer: Buffer }> {
  try {
    console.log('Generating PDF for session:', sessionId)
    console.log('Plan data received:', {
      title: planData.title,
      overview: planData.overview,
      daily_actions_count: planData.thirty_day_protocol?.daily_actions?.length || 0,
      weekly_goals_count: planData.thirty_day_protocol?.weekly_goals?.length || 0,
      resources_count: planData.resources?.length || 0,
      reflection_prompts_count: planData.reflection_prompts?.length || 0
    })

    // Check for PDFShift API key
    if (!process.env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured')
      throw new Error('PDF generation service not configured')
    }

    // Get user information for client name
    console.log('Fetching user information for client name')
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    let clientName = 'Client'
    if (!sessionError && sessionData) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, user_name')
        .eq('id', sessionData.user_id)
        .single()

      if (!userError && userData) {
        // Use user_name if available, otherwise extract from email
        if (userData.user_name) {
          clientName = userData.user_name
        } else {
          // Extract name from email if no name is provided
          const emailName = userData.email.split('@')[0]
          clientName = emailName.charAt(0).toUpperCase() + emailName.slice(1)
        }
        console.log('Client name determined:', clientName)
      }
    }

    // Validate data
    if (!planData.thirty_day_protocol?.daily_actions || !Array.isArray(planData.thirty_day_protocol.daily_actions)) {
      if (!planData.thirty_day_protocol) planData.thirty_day_protocol = {}
      planData.thirty_day_protocol.daily_actions = []
    }
    if (!planData.thirty_day_protocol?.weekly_goals || !Array.isArray(planData.thirty_day_protocol.weekly_goals)) {
      if (!planData.thirty_day_protocol) planData.thirty_day_protocol = {}
      planData.thirty_day_protocol.weekly_goals = []
    }
    if (!planData.resources || !Array.isArray(planData.resources)) {
      planData.resources = []
    }
    if (!planData.reflection_prompts || !Array.isArray(planData.reflection_prompts)) {
      planData.reflection_prompts = []
    }

    // Generate HTML content with client name
    const htmlContent = generateHTMLReport(planData, clientName)
    
          // Convert HTML to PDF using PDFShift
          console.log('Converting HTML to PDF using PDFShift...')
          const pdfBuffer = await convertHTMLToPDF(htmlContent, clientName)
    
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

async function convertHTMLToPDF(htmlContent: string, clientName: string = 'Client'): Promise<Buffer> {
  try {
    // Create footer HTML with PDFShift variables - matching template design
    const footerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 20px; border-top: 1px solid #4A5D23; border-bottom: 1px solid #4A5D23; font-size: 11px; color: #666; background: #F5F1E8; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;"><div>${clientName}</div><div>YOU 3.0</div></div>`;

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
        footer: {
          source: footerHTML,
          height: '40px', // Space between content and footer
          start_at: 1 // Start footer from page 1
        }
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

// Smart content splitting based on estimated height
function splitContentByHeight(items: string[], maxItemsPerPage: number = 15): string[][] {
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentItemCount = 0;
  
  items.forEach((item, index) => {
    // Estimate item height based on content length
    const estimatedHeight = Math.ceil(item.length / 80) * 1.6; // Rough line estimation
    const maxHeightPerPage = 20; // Estimated max lines per page
    
    // If adding this item would exceed page capacity, start new page
    if (currentItemCount >= maxItemsPerPage || 
        (currentPage.length > 0 && estimatedHeight > maxHeightPerPage)) {
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

function generateHTMLReport(planData: PlanData, clientName: string = 'Client'): string {
  // Extract the real data from the assessment
  const assessmentOverview = planData.assessment_overview || 'Your personalized assessment has been completed. This report provides insights into your behavioral patterns and recommendations for growth.'
  const developmentProfile = planData.development_profile || 'Based on your responses, you\'ve shown clear patterns of behavior and areas where you\'re ready for transformation.'
  const bottomLine = planData.bottom_line || 'You have the capacity for growth and transformation. The key is to start with what\'s already working and build from there.'
  const reminderQuote = planData.reminder_quote || 'Remember: progress, not perfection.'
  
  // Extract sabotage analysis
  const sabotageAnalysis = planData.sabotage_analysis || {}
  const protectivePattern = sabotageAnalysis.protective_pattern || 'Based on your responses, you have protective patterns that serve important functions in your life.'
  const whatItsProtectingFrom = sabotageAnalysis.what_its_protecting_from || 'These patterns protect you from experiences you find challenging.'
  const howItServesYou = sabotageAnalysis.how_it_serves_you || 'These patterns provide you with safety and comfort in difficult situations.'
  const goToPatterns = sabotageAnalysis.go_to_patterns || 'Your current patterns help you navigate daily life and challenges.'
  const successProof = sabotageAnalysis.success_proof || 'You\'ve demonstrated the ability to overcome challenges in the past.'
  const anchor = sabotageAnalysis.anchor || 'You have existing habits that provide stability and can be leveraged for growth.'
  
  // Extract in-the-moment reset
  const inTheMomentReset = planData.in_the_moment_reset || 'When you notice the pattern starting, pause and take 3 deep breaths—in for 4 counts, hold for 4, out for 6. Then ask yourself: "What\'s one small thing I can do right now that moves me forward instead of away?"'
  
  // Extract domain breakdown with new nested structure
  const domainBreakdown = planData.domain_breakdown || {}
  const mindDomain = domainBreakdown.mind || {
    current_level: 'Your mental approach shows both strengths and areas for development.',
    current_phase: 'Your current phase of development.',
    key_strengths: 'Your key mental strengths and capabilities.',
    growth_opportunities: 'Areas where you can grow and develop further.'
  }
  const bodyDomain = domainBreakdown.body || {
    current_level: 'Your relationship with your physical self has both supportive and challenging aspects.',
    current_phase: 'Your current phase of physical development.',
    key_strengths: 'Your key physical strengths and capabilities.',
    growth_opportunities: 'Areas where you can grow and develop further.'
  }
  const spiritDomain = domainBreakdown.spirit || {
    current_level: 'Your spiritual and relational connections provide both support and growth opportunities.',
    current_phase: 'Your current phase of spiritual development.',
    key_strengths: 'Your key spiritual strengths and capabilities.',
    growth_opportunities: 'Areas where you can grow and develop further.'
  }
  const contributionDomain = domainBreakdown.contribution || {
    current_level: 'Your approach to work and contribution shows both current capabilities and potential for expansion.',
    current_phase: 'Your current phase of contribution development.',
    key_strengths: 'Your key contribution strengths and capabilities.',
    growth_opportunities: 'Areas where you can grow and develop further.'
  }
  
  // Extract nervous system assessment with new structure
  const nervousSystemAssessment = planData.nervous_system_assessment || {
    primary_state: 'Your nervous system shows patterns of both activation and regulation that we can work with.',
    regulation_capacity: 'Your capacity for regulation and self-regulation.',
    observable_patterns: 'Patterns you can observe in your nervous system responses.',
    regulation_reality: 'The reality of your nervous system regulation capabilities.'
  }
  
  // Extract 30-day protocol
  const thirtyDayProtocol = planData.thirty_day_protocol || {}
  const seventyTwoHourSuggestion = thirtyDayProtocol.seventy_two_hour_suggestion || 'Start with one small, manageable action that builds on your existing strengths.'
  const weeklyRecommendation = thirtyDayProtocol.weekly_recommendation || 'Implement one consistent practice that supports your growth goals.'
  const thirtyDayApproach = thirtyDayProtocol.thirty_day_approach || 'Focus on one key area of development that will have the most impact.'
  const environmentalOptimization = thirtyDayProtocol.environmental_optimization || 'Make one environmental change that supports your goals.'
  
  // Ensure arrays are properly validated
  const progressMarkers = Array.isArray(planData.thirty_day_protocol?.progress_markers) 
    ? planData.thirty_day_protocol.progress_markers 
    : ['Notice changes in your daily patterns', 'Observe shifts in your stress response', 'Track improvements in your target area']
  
  const bookRecommendations = Array.isArray(planData.book_recommendations) 
    ? planData.book_recommendations 
    : ['The Body Keeps the Score by Bessel van der Kolk - Understanding trauma and healing', 'Atomic Habits by James Clear - Building sustainable change']
  
  const dailyActions = Array.isArray(planData.thirty_day_protocol?.daily_actions) 
    ? planData.thirty_day_protocol.daily_actions 
    : ['Day 1: Start with 5 minutes of morning reflection on your goals', 'Day 2: Practice one small action that moves you toward your main objective', 'Day 3: Notice one pattern that serves you and one that doesn\'t']
  
  const weeklyGoals = Array.isArray(planData.thirty_day_protocol?.weekly_goals) 
    ? planData.thirty_day_protocol.weekly_goals 
    : ['Week 1: Establish a daily routine that supports your goals', 'Week 2: Practice one new skill or habit consistently']
  
  const resources = Array.isArray(planData.resources) 
    ? planData.resources 
    : ['Daily journal for tracking progress and insights', 'Accountability partner or support group']
  
  const reflectionPrompts = Array.isArray(planData.reflection_prompts) 
    ? planData.reflection_prompts 
    : ['What was one moment today where I felt truly aligned with my values?', 'What pattern did I notice in myself today, and how did I respond?']
  
  const developmentReminders = Array.isArray(planData.development_reminders) 
    ? planData.development_reminders 
    : [
        'Growth is cyclical; regression is protection, not failure',
        'Integration comes through consistent practice, not more awareness',
        'Your nervous system is the foundation — regulate first, then grow',
        'Your sabotage patterns have wisdom - honor them while updating them',
        'Identity shifts over time with deliberate practice'
      ]

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${planData.title || 'You 3.0 Assessment Report'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          color: #1A1A1A;
          background: #F5F1E8;
          font-size: 14px;
        }
        
        .page {
          width: 100%;
          min-height: 100vh;
          padding: 40px;
          position: relative;
          background: white;
          margin-bottom: 20px;
        }
        
        /* Cover Page Styles */
        .brand-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .brand-line {
          height: 2px;
          background-color: #4A5D23;
          margin: 20px 0;
          width: 200px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .brand-logo {
          text-align: center;
          margin: 20px 0;
        }
        
        .brand-logo img {
          max-width: 300px;
          height: auto;
        }
        
        .brand-text {
          color: #1A1A1A;
        }
        
        .brand-slash {
          color: #D4AF37;
          margin: 0 5px;
        }
        
        .brand-tagline {
          font-family: 'Inter', sans-serif;
          font-size: 1.1em;
          font-weight: 300;
          color: #666;
          letter-spacing: 3px;
          margin: 15px 0;
        }
        
        .assessment-title {
          text-align: center;
          margin: 60px 0;
        }
        
        .assessment-title h1 {
          font-family: 'Crimson Text', serif;
          font-size: 2.2em;
          font-weight: 700;
          color: #4A5D23;
          margin: 0;
          line-height: 1.2;
        }
        
        .client-info {
          margin: 40px 0;
        }
        
        .client-line {
          font-family: 'Crimson Text', serif;
          font-size: 1.6em;
          font-weight: 400;
          color: #1A1A1A;
          margin: 20px 0;
          text-transform: uppercase;
        }
        
        .disclaimer-box {
          background: #FFF3CD;
          padding: 25px;
          margin: 80px 0 60px 0;
          border-radius: 8px;
          border: 1px solid #D4AF37;
          text-align: center;
        }
        
        .disclaimer-box p {
          font-family: 'Crimson Text', serif;
          font-style: normal;
          font-size: 1.2em;
          color: #856404;
          line-height: 1.5;
          margin: 0;
        }
        
        .section {
          margin-bottom: 50px;
          page-break-inside: avoid;
          flex: 1; /* Take up available space */
        }
        
        /* Content wrapper no longer needed - PDFShift handles footer */
        
        .section-title {
          font-family: 'Crimson Text', serif;
          font-size: 3.2em;
          font-weight: 700;
          color: #4A5D23;
          margin-bottom: 80px;
          text-align: center;
          background: #FFF3CD;
          padding: 40px;
          border-radius: 8px;
          letter-spacing: 1px;
        }
        
        .content {
          font-size: 16px;
          line-height: 1.8;
          color: #1A1A1A;
          margin-bottom: 30px;
        }
        
        .content ol, .content ul {
          page-break-inside: auto; /* Allow page breaks within lists */
        }
        
        .content li {
          page-break-inside: avoid; /* Keep individual list items together */
          margin-bottom: 8px;
          max-height: 200px; /* Prevent single items from being too tall */
          overflow: hidden;
        }
        
        /* Page break detection handled by PDFShift */
        
        .content p {
          font-size: 16px;
          line-height: 1.6;
          color: #1A1A1A;
          margin: 0;
        }
        
        .domain-title {
          font-size: 2.4em;
          font-weight: 700;
          color: #4A5D23;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-align: center;
        }
        
        .domain-breakdown-content {
          margin: 10px 0;
        }
        
        .domain-breakdown-item {
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .domain-breakdown-item strong {
          color: #4A5D23;
          font-weight: 600;
          font-size: 16px;
          display: block;
          margin-bottom: 5px;
        }
        
        .domain-breakdown-item {
          color: #1A1A1A;
          font-size: 15px;
        }
        
        .domain-item {
          margin-bottom: 15px;
        }
        
        .domain-item strong {
          color: #4A5D23;
          font-weight: 600;
        }
        
        /* Consistent green sub-section styling for all sections */
        .sub-section-green {
          color: #4A5D23;
          font-weight: 600;
          font-size: 16px;
          display: block;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }
        
        .sub-section-content {
          color: #1A1A1A;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 15px;
          font-family: 'Inter', sans-serif;
        }
        
        
        
        /* Footer is now handled by PDFShift natively - no CSS needed */
        
        .page-break {
          page-break-before: always;
        }
        
        .quote {
          font-style: italic;
          color: #666;
          border-left: 3px solid #bdc3c7;
          padding-left: 20px;
          margin: 20px 0;
        }
        
        
        
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="page">
        <!-- Brand Header -->
        <div class="brand-header">
          <div class="brand-line"></div>
          <div class="brand-logo">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" />
          </div>
          <div class="brand-line"></div>
        </div>
        
        <!-- Assessment Title -->
        <div class="assessment-title">
          <h1>YOU 3.0 PERSONAL DEVELOPMENT</h1>
          <h1>ASSESSMENT</h1>
        </div>
        
        <!-- Client Information -->
        <div class="client-info">
          <div class="client-line">CLIENT NAME: ${clientName}</div>
          <div class="client-line">DATE: ${new Date().toLocaleDateString()}</div>
          <div class="client-line">ASSESSMENT TYPE: BEHAVIORAL OPTIMIZATION</div>
        </div>
        
        <!-- Disclaimer Box -->
        <div class="disclaimer-box">
          <p>This assessment is not a diagnostic tool and does not replace professional mental health support. If you are experiencing crisis-level distress, please seek immediate professional care.</p>
        </div>
      </div>
      
      <!-- Assessment Overview Page -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Assessment Overview</div>
            <div class="content">
              <p>${assessmentOverview}</p>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Your Development Profile Page -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Your Development Profile</div>
            <div class="content">
              <p>${developmentProfile}</p>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Sabotage Pattern Analysis -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Sabotage Pattern Analysis</div>
            
            <div class="domain-item">
              <div class="sub-section-green">Your Protective Pattern:</div>
              <div class="sub-section-content">${protectivePattern}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">What It's Protecting You From:</div>
              <div class="sub-section-content">${whatItsProtectingFrom}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">How It Serves You:</div>
              <div class="sub-section-content">${howItServesYou}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Your Go-To Patterns:</div>
              <div class="sub-section-content">${goToPatterns}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Your Success Proof:</div>
              <div class="sub-section-content">${successProof}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Your Anchor:</div>
              <div class="sub-section-content">${anchor}</div>
            </div>
          </div>
          
          <!-- In-the-Moment Reset -->
          <div class="section">
            <div class="section-title">Your In-the-Moment Reset</div>
            <div class="sub-section-content">
              ${inTheMomentReset}
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Domain Breakdown - Mind -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Domain Breakdown</div>
            <div class="domain-title">MIND</div>
            
            <div class="main-section">
              <div class="main-section-title">Current Level</div>
              <div class="content-enhanced">
                ${mindDomain.current_level}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Current Phase</div>
              <div class="content-enhanced">
                ${mindDomain.current_phase}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Key Strengths</div>
              <div class="content-enhanced">
                ${mindDomain.key_strengths}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Growth Opportunities</div>
              <div class="content-enhanced">
                ${mindDomain.growth_opportunities}
              </div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Domain Breakdown - Body -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Domain Breakdown</div>
            <div class="domain-title">BODY</div>
            
            <div class="main-section">
              <div class="main-section-title">Current Level</div>
              <div class="content-enhanced">
                ${bodyDomain.current_level}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Current Phase</div>
              <div class="content-enhanced">
                ${bodyDomain.current_phase}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Key Strengths</div>
              <div class="content-enhanced">
                ${bodyDomain.key_strengths}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Growth Opportunities</div>
              <div class="content-enhanced">
                ${bodyDomain.growth_opportunities}
              </div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Domain Breakdown - Spirit -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Domain Breakdown</div>
            <div class="domain-title">SPIRIT & RELATIONSHIPS</div>
            
            <div class="main-section">
              <div class="main-section-title">Current Level</div>
              <div class="content-enhanced">
                ${spiritDomain.current_level}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Current Phase</div>
              <div class="content-enhanced">
                ${spiritDomain.current_phase}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Key Strengths</div>
              <div class="content-enhanced">
                ${spiritDomain.key_strengths}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Growth Opportunities</div>
              <div class="content-enhanced">
                ${spiritDomain.growth_opportunities}
              </div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Domain Breakdown - Contribution -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Domain Breakdown</div>
            <div class="domain-title">CONTRIBUTION</div>
            
            <div class="main-section">
              <div class="main-section-title">Current Level</div>
              <div class="content-enhanced">
                ${contributionDomain.current_level}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Current Phase</div>
              <div class="content-enhanced">
                ${contributionDomain.current_phase}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Key Strengths</div>
              <div class="content-enhanced">
                ${contributionDomain.key_strengths}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Growth Opportunities</div>
              <div class="content-enhanced">
                ${contributionDomain.growth_opportunities}
              </div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      
      
      <!-- Nervous System Assessment -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Nervous System Assessment</div>
            
            <div class="main-section">
              <div class="main-section-title">Primary State</div>
              <div class="content-enhanced">
                ${nervousSystemAssessment.primary_state}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Regulation Capacity</div>
              <div class="content-enhanced">
                ${nervousSystemAssessment.regulation_capacity}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Observable Patterns</div>
              <div class="content-enhanced">
                ${nervousSystemAssessment.observable_patterns}
              </div>
            </div>
            
            <div class="main-section">
              <div class="main-section-title">Your Regulation Reality</div>
              <div class="content-enhanced">
                ${nervousSystemAssessment.regulation_reality}
              </div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- 30-Day Protocol -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">30-Day Recommended Growth Protocol</div>
            
            <div class="domain-item">
              <div class="sub-section-green">72-Hour Suggestion:</div>
              <div class="sub-section-content">${seventyTwoHourSuggestion}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Weekly Recommendation:</div>
              <div class="sub-section-content">${weeklyRecommendation}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">30-Day Approach:</div>
              <div class="sub-section-content">${thirtyDayApproach}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Environmental Optimization:</div>
              <div class="sub-section-content">${environmentalOptimization}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Suggested Progress Markers:</div>
              <div class="sub-section-content">
                <ul class="bullet-list">
                  ${progressMarkers.map(marker => `<li>${marker}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Daily Actions:</div>
              <div class="sub-section-content">
                <ul class="bullet-list">
                  ${dailyActions.map(action => `<li>${action}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Weekly Goals:</div>
              <div class="sub-section-content">
                <ul class="bullet-list">
                  ${weeklyGoals.map(goal => `<li>${goal}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Reminder Box -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Reminder Box</div>
            <div class="sub-section-content">
              <p>"${reminderQuote}"</p>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Bottom Line -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Bottom Line</div>
            <div class="sub-section-content">
              <p>${bottomLine}</p>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Development Reminders -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Development Reminders</div>
            
            <div class="content-enhanced">
              <ul class="bullet-list">
                ${developmentReminders.map(reminder => `<li>${reminder}</li>`).join('')}
              </ul>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      <!-- Book Recommendations -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Book Recommendations</div>
            
            <div class="content-enhanced">
              <ul class="bullet-list">
                ${bookRecommendations.map(book => `<li><strong>${book}</strong></li>`).join('')}
              </ul>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
      </div>
      
      
      <!-- Resources - Split into multiple pages if needed -->
      ${(() => {
        const itemsPerPage = 10; // Limit items per page for resources
        const totalPages = Math.ceil(resources.length / itemsPerPage);
        let html = '';
        
        for (let page = 0; page < totalPages; page++) {
          const startIndex = page * itemsPerPage;
          const endIndex = Math.min(startIndex + itemsPerPage, resources.length);
          const pageResources = resources.slice(startIndex, endIndex);
          
          html += `
            <div class="page ${page > 0 ? 'page-break' : ''}">
              <div class="content-wrapper">
                <div class="section">
                  <div class="section-title">Resources ${totalPages > 1 ? `(Part ${page + 1} of ${totalPages})` : ''}</div>
                  
                  <div class="content-enhanced">
                    <ul class="bullet-list">
                      ${pageResources.map(resource => `<li>${resource}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        
        return html;
      })()}
      
      <!-- Reflection Prompts - Split into multiple pages if needed -->
      ${(() => {
        const itemsPerPage = 8; // Limit items per page for reflection prompts
        const totalPages = Math.ceil(reflectionPrompts.length / itemsPerPage);
        let html = '';
        
        for (let page = 0; page < totalPages; page++) {
          const startIndex = page * itemsPerPage;
          const endIndex = Math.min(startIndex + itemsPerPage, reflectionPrompts.length);
          const pagePrompts = reflectionPrompts.slice(startIndex, endIndex);
          
          html += `
            <div class="page ${page > 0 ? 'page-break' : ''}">
              <div class="content-wrapper">
                <div class="section">
                  <div class="section-title">Reflection Prompts ${totalPages > 1 ? `(Part ${page + 1} of ${totalPages})` : ''}</div>
                  
                  <div class="content-enhanced">
                    <ul class="bullet-list">
                      ${pagePrompts.map(prompt => `<li>${prompt}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        
        return html;
      })()}
      
      <!-- Next Steps -->
      <div class="page page-break">
        <div class="section">
            <div class="section-title">Next Steps</div>
            
            <div class="domain-item">
              <div class="sub-section-green">6-Month Follow-Up Assessment Recommended:</div>
              <div class="sub-section-content">${planData.next_assessment?.six_month_followup || 'Personalized timeline and expected progress tracking'}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Monthly Check-In Options:</div>
              <div class="sub-section-content">${planData.next_assessment?.monthly_checkin || 'Brief progress reviews to track your development'}</div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">Focus Areas for Next Phase:</div>
              <div class="sub-section-content">
                <ul class="bullet-list">
                  ${(planData.next_assessment?.focus_areas || ['Focus Area 1', 'Focus Area 2', 'Focus Area 3', 'Focus Area 4']).map(area => `<li>${area}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            <div class="domain-item">
              <div class="sub-section-green">How to Stay Connected:</div>
              <div class="sub-section-content">${planData.next_assessment?.stay_connected || 'Newsletter signup, community links, and ongoing support resources'}</div>
            </div>
          </div>
        
        <!-- Footer handled by PDFShift natively -->
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