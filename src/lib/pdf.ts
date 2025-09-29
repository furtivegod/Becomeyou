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

// Remove inline styles and scripts from HTML
function generateHTMLReport(planData: PlanData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Your Personalized Protocol</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
    </head>
    <body class="bg-gray-50 p-8">
      <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8 border-b-2 border-blue-500 pb-4">
          <h1 class="text-3xl font-bold text-blue-600 mb-2">${planData.title || 'Your Personalized 30-Day Protocol'}</h1>
          <p class="text-gray-600 text-lg italic">${planData.overview || 'Based on your assessment, here\'s your customized transformation plan.'}</p>
        </div>
        
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">📅 Daily Actions</h2>
          <div class="space-y-4">
            ${(planData.daily_actions || []).map((action: any) => `
              <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <div class="font-bold text-blue-600 text-lg mb-2">Day ${action.day}</div>
                <div class="font-semibold text-gray-800 text-lg mb-2">${action.title}</div>
                <div class="text-gray-600 mb-2">${action.description}</div>
                <div class="text-sm text-gray-500">Duration: ${action.duration} | Category: ${action.category}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${(planData.weekly_goals || []).length > 0 ? `
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">🎯 Weekly Goals</h2>
          <div class="space-y-4">
            ${(planData.weekly_goals || []).map((goal: any) => `
              <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div class="font-bold text-blue-600 text-lg mb-2">Week ${goal.week}: ${goal.focus}</div>
                <ul class="list-disc list-inside space-y-1">
                  ${(goal.goals || []).map((g: string) => `<li class="text-gray-700">${g}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${(planData.resources || []).length > 0 ? `
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">📚 Resources</h2>
          <div class="space-y-2">
            ${(planData.resources || []).map((resource: string) => `
              <div class="text-gray-700 border-b border-gray-200 pb-2">• ${resource}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${(planData.reflection_prompts || []).length > 0 ? `
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-blue-600 mb-4 border-b border-gray-200 pb-2">🤔 Reflection Prompts</h2>
          <div class="space-y-3">
            ${(planData.reflection_prompts || []).map((prompt: string) => `
              <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 italic text-gray-700">${prompt}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="text-center text-gray-500 text-sm border-t border-gray-200 pt-4">
          <p>Generated on ${new Date().toLocaleDateString()} | Your personalized transformation protocol</p>
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