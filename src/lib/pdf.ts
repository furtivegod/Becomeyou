import { supabaseAdmin as supabase } from '@/lib/supabase'

interface PlanData {
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
      title: planData?.title,
      overview: planData?.overview,
      daily_actions_count: planData?.daily_actions?.length || 0,
      weekly_goals_count: planData?.weekly_goals?.length || 0,
      resources_count: planData?.resources?.length || 0,
      reflection_prompts_count: planData?.reflection_prompts?.length || 0
    })
    
    // Validate data structure
    if (!planData) {
      throw new Error('Plan data is undefined')
    }
    
    if (!planData.daily_actions || !Array.isArray(planData.daily_actions)) {
      console.warn('Daily actions is not an array, using empty array')
      planData.daily_actions = []
    }
    
    if (!planData.weekly_goals || !Array.isArray(planData.weekly_goals)) {
      console.warn('Weekly goals is not an array, using empty array')
      planData.weekly_goals = []
    }
    
    if (!planData.resources || !Array.isArray(planData.resources)) {
      console.warn('Resources is not an array, using empty array')
      planData.resources = []
    }
    
    if (!planData.reflection_prompts || !Array.isArray(planData.reflection_prompts)) {
      console.warn('Reflection prompts is not an array, using empty array')
      planData.reflection_prompts = []
    }
    
    // Generate HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Personalized Protocol</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header { text-align: center; margin-bottom: 40px; }
          .title { color: #333; font-size: 28px; margin-bottom: 10px; }
          .overview { color: #666; font-size: 16px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section-title { color: #007bff; font-size: 20px; margin-bottom: 15px; }
          .daily-action { 
            margin-bottom: 15px; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            border-left: 4px solid #007bff;
          }
          .day-number { font-weight: bold; color: #007bff; font-size: 18px; }
          .action-title { font-weight: bold; margin-bottom: 8px; font-size: 16px; }
          .action-desc { color: #666; margin-bottom: 5px; }
          .action-meta { color: #888; font-size: 14px; }
          .weekly-goal { margin-bottom: 15px; padding: 10px; background: #e8f4fd; border-radius: 5px; }
          .resource { margin-bottom: 8px; padding: 5px 0; }
          .reflection { 
            font-style: italic; 
            color: #666; 
            margin-bottom: 10px;
            padding: 10px;
            background: #fff3cd;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
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
        
        <div class="section">
          <h2 class="section-title">🎯 Weekly Goals</h2>
          ${planData.weekly_goals.map((goal: any) => `
            <div class="weekly-goal">
              <strong>Week ${goal.week}: ${goal.focus}</strong>
              <ul>
                ${(goal.goals || []).map((g: string) => `<li>${g}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">📚 Resources</h2>
          ${planData.resources.map((resource: string) => `
            <div class="resource">• ${resource}</div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">🤔 Reflection Prompts</h2>
          ${planData.reflection_prompts.map((prompt: string) => `
            <div class="reflection">${prompt}</div>
          `).join('')}
        </div>
      </body>
      </html>
    `

    // For now, just return a placeholder URL
    // In production, you'd generate an actual PDF and upload it
    const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/report/${sessionId}`
    
    console.log('PDF generation completed (placeholder):', pdfUrl)
    return pdfUrl

  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}