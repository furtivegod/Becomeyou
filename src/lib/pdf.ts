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
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 1.1em;
            }
            .section {
                background: white;
                margin: 20px 0;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .section h2 {
                color: #667eea;
                border-bottom: 3px solid #667eea;
                padding-bottom: 10px;
                margin-bottom: 20px;
                font-size: 1.8em;
            }
            .section h3 {
                color: #555;
                margin-top: 25px;
                margin-bottom: 15px;
                font-size: 1.3em;
            }
            .action-item {
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #667eea;
                border-radius: 5px;
            }
            .action-item strong {
                color: #667eea;
            }
            .goal-item {
                background: #e8f4f8;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #17a2b8;
                border-radius: 5px;
            }
            .goal-item strong {
                color: #17a2b8;
            }
            .resource-item {
                background: #f0f8e8;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #28a745;
                border-radius: 5px;
            }
            .resource-item strong {
                color: #28a745;
            }
            .prompt-item {
                background: #fff8e1;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #ffc107;
                border-radius: 5px;
            }
            .prompt-item strong {
                color: #ffc107;
            }
            .overview {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            .overview h2 {
                color: white;
                border-bottom: 2px solid rgba(255,255,255,0.3);
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                color: #666;
            }
      </style>
    </head>
    <body>
      <div class="header">
            <h1>${planData.title || 'You 3.0 Assessment Report'}</h1>
            <p>Your personalized transformation protocol</p>
        </div>

        <div class="overview">
            <h2>Assessment Overview</h2>
            <p>${planData.assessment_overview || 'Your personalized assessment has been completed. This report provides insights into your behavioral patterns and recommendations for growth.'}</p>
        </div>

        <div class="section">
            <h2>🧠 Your Development Profile</h2>
            <p>${planData.development_profile || 'Based on your responses, you\'ve shown clear patterns of behavior and areas where you\'re ready for transformation.'}</p>
      </div>
      
      <div class="section">
            <h2>📋 Daily Actions</h2>
            <p>Follow these daily actions to build momentum and create lasting change:</p>
            ${safeDailyActions.map((action, index) => `
                <div class="action-item">
                    <strong>${action}</strong>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
            <h2>🎯 Weekly Goals</h2>
            <p>Focus on these weekly objectives to maintain progress:</p>
            ${safeWeeklyGoals.map((goal, index) => `
                <div class="goal-item">
                    <strong>${goal}</strong>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
            <h2>📚 Resources</h2>
            <p>Utilize these resources to support your journey:</p>
            ${safeResources.map((resource, index) => `
                <div class="resource-item">
                    <strong>${resource}</strong>
                </div>
        `).join('')}
      </div>
      
      <div class="section">
            <h2>🤔 Reflection Prompts</h2>
            <p>Use these questions for deeper self-awareness:</p>
            ${safeReflectionPrompts.map((prompt, index) => `
                <div class="prompt-item">
                    <strong>${prompt}</strong>
                </div>
        `).join('')}
      </div>

        <div class="section">
            <h2>💡 Bottom Line</h2>
            <p>${planData.bottom_line || 'You have the capacity for growth and transformation. The key is to start with what\'s already working and build from there.'}</p>
        </div>

        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | Your personalized transformation protocol</p>
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