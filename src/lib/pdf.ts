import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface PlanData {
  title: string
  overview: string
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

export async function generatePDF(planData: PlanData, sessionId: string): Promise<string> {
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
    
    // Store HTML in Supabase Storage
    const fileName = `protocol-${sessionId}-${Date.now()}.html`
    const filePath = `reports/${fileName}`
    
    console.log('Storing HTML report in Supabase Storage:', filePath)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, htmlContent, {
        contentType: 'text/html',
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error uploading HTML report:', uploadError)
      throw new Error(`Failed to upload HTML report: ${uploadError.message}`)
    }
    
    console.log('HTML report uploaded successfully:', uploadData.path)
    
    // Generate signed URL for the HTML report
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
    
    return signedUrl

  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function generateHTMLReport(planData: PlanData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Your Personalized Protocol</title>
      <style>
        @page {
          margin: 20mm;
          size: A4;
        }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
        }
        .title { 
          color: #007bff; 
          font-size: 32px; 
          margin-bottom: 15px; 
          font-weight: 700;
        }
        .overview { 
          color: #666; 
          font-size: 18px; 
          margin-bottom: 30px; 
          font-style: italic;
        }
        .section { 
          margin-bottom: 40px; 
          page-break-inside: avoid;
        }
        .section-title { 
          color: #007bff; 
          font-size: 24px; 
          margin-bottom: 20px; 
          font-weight: 600;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }
        .daily-action { 
          margin-bottom: 20px; 
          padding: 20px; 
          background: #f8f9fa; 
          border-radius: 10px; 
          border-left: 5px solid #007bff;
          page-break-inside: avoid;
        }
        .day-number { 
          font-weight: bold; 
          color: #007bff; 
          font-size: 20px; 
          margin-bottom: 10px;
        }
        .action-title { 
          font-weight: bold; 
          margin-bottom: 10px; 
          font-size: 18px; 
          color: #333;
        }
        .action-desc { 
          color: #666; 
          margin-bottom: 10px; 
          font-size: 16px;
          line-height: 1.5;
        }
        .action-meta { 
          color: #888; 
          font-size: 14px; 
          font-weight: 500;
        }
        .weekly-goal { 
          margin-bottom: 20px; 
          padding: 15px; 
          background: #e8f4fd; 
          border-radius: 8px; 
          border-left: 4px solid #17a2b8;
        }
        .week-title {
          font-weight: bold;
          font-size: 18px;
          color: #17a2b8;
          margin-bottom: 10px;
        }
        .week-goals {
          margin-left: 20px;
        }
        .week-goals li {
          margin-bottom: 5px;
          font-size: 16px;
        }
        .resource { 
          margin-bottom: 10px; 
          padding: 8px 0; 
          font-size: 16px;
          border-bottom: 1px solid #e9ecef;
        }
        .reflection { 
          font-style: italic; 
          color: #666; 
          margin-bottom: 15px;
          padding: 15px;
          background: #fff3cd;
          border-radius: 8px;
          border-left: 4px solid #ffc107;
          font-size: 16px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #888;
          font-size: 14px;
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
        }
        .print-instructions {
          background: #e8f4fd;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007bff;
        }
        .print-instructions h3 {
          margin: 0 0 10px 0;
          color: #007bff;
        }
        .print-instructions p {
          margin: 5px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="print-instructions">
        <h3>📄 How to Save as PDF</h3>
        <p><strong>Step 1:</strong> Press Ctrl+P (Windows) or Cmd+P (Mac)</p>
        <p><strong>Step 2:</strong> Select "Save as PDF" as destination</p>
        <p><strong>Step 3:</strong> Click "Save" to download your protocol</p>
        <p><strong>Tip:</strong> Use Chrome or Edge for best results</p>
      </div>
      
      <div class="header">
        <h1 class="title">${planData.title || 'Your Personalized 30-Day Protocol'}</h1>
        <p class="overview">${planData.overview || 'Based on your assessment, here\'s your customized transformation plan.'}</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">📅 Daily Actions</h2>
        ${planData.daily_actions.map((action: any) => `
          <div class="daily-action">
            <div class="day-number">Day ${action.day}</div>
            <div class="action-title">${action.title}</div>
            <div class="action-desc">${action.description}</div>
            <div class="action-meta">Duration: ${action.duration} | Category: ${action.category}</div>
          </div>
        `).join('')}
      </div>
      
      ${planData.weekly_goals.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🎯 Weekly Goals</h2>
        ${planData.weekly_goals.map((goal: any) => `
          <div class="weekly-goal">
            <div class="week-title">Week ${goal.week}: ${goal.focus}</div>
            <ul class="week-goals">
              ${(goal.goals || []).map((g: string) => `<li>${g}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${planData.resources.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📚 Resources</h2>
        ${planData.resources.map((resource: string) => `
          <div class="resource">• ${resource}</div>
        `).join('')}
      </div>
      ` : ''}
      
      ${planData.reflection_prompts.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🤔 Reflection Prompts</h2>
        ${planData.reflection_prompts.map((prompt: string) => `
          <div class="reflection">${prompt}</div>
        `).join('')}
      </div>
      ` : ''}
      
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