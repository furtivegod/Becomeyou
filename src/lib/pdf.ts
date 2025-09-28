import { chromium } from 'playwright'
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
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Your Personalized Protocol</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { color: #333; font-size: 28px; margin-bottom: 10px; }
        .overview { color: #666; font-size: 16px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #007bff; font-size: 20px; margin-bottom: 15px; }
        .daily-action { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .day-number { font-weight: bold; color: #007bff; }
        .action-title { font-weight: bold; margin-bottom: 5px; }
        .action-desc { color: #666; }
        .weekly-goal { margin-bottom: 10px; }
        .resource { margin-bottom: 5px; }
        .reflection { font-style: italic; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${planData.title}</h1>
        <p class="overview">${planData.overview}</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Daily Actions</h2>
        ${planData.daily_actions.map((action) => `
          <div class="daily-action">
            <div class="day-number">Day ${action.day}</div>
            <div class="action-title">${action.title}</div>
            <div class="action-desc">${action.description}</div>
            <div style="color: #666; font-size: 14px;">Duration: ${action.duration} | Category: ${action.category}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h2 class="section-title">Weekly Goals</h2>
        ${planData.weekly_goals.map((goal) => `
          <div class="weekly-goal">
            <strong>Week ${goal.week}: ${goal.focus}</strong>
            <ul>
              ${goal.goals.map((g) => `<li>${g}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h2 class="section-title">Resources</h2>
        ${planData.resources.map((resource) => `
          <div class="resource">• ${resource}</div>
        `).join('')}
      </div>
      
      <div class="section">
        <h2 class="section-title">Reflection Prompts</h2>
        ${planData.reflection_prompts.map((prompt) => `
          <div class="reflection">${prompt}</div>
        `).join('')}
      </div>
    </body>
    </html>
  `

  await page.setContent(html)
  const pdfBuffer = await page.pdf({ 
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  })
  
  await browser.close()
  
  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from('reports')
    .upload(`${sessionId}/protocol.pdf`, pdfBuffer, {
      contentType: 'application/pdf'
    })

  if (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('reports')
    .getPublicUrl(`${sessionId}/protocol.pdf`)

  return urlData.publicUrl
}