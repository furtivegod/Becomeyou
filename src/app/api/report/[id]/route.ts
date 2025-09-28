import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const sessionId = params.id
    
    console.log('Report access requested for session:', sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get the plan data from database
    const { data: planData, error: planError } = await supabase
      .from('plan_outputs')
      .select('plan_json')
      .eq('session_id', sessionId)
      .single()

    if (planError || !planData) {
      console.error('Error fetching plan data:', planError)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Generate HTML report
    const html = `
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
          .download-btn {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${planData.plan_json.title || 'Your Personalized 30-Day Protocol'}</h1>
          <p class="overview">${planData.plan_json.overview || 'Based on your assessment, here\'s your customized transformation plan.'}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">📅 Daily Actions</h2>
          ${(planData.plan_json.daily_actions || []).map((action: any) => `
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
          ${(planData.plan_json.weekly_goals || []).map((goal: any) => `
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
          ${(planData.plan_json.resources || []).map((resource: string) => `
            <div class="resource">• ${resource}</div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">🤔 Reflection Prompts</h2>
          ${(planData.plan_json.reflection_prompts || []).map((prompt: string) => `
            <div class="reflection">${prompt}</div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="javascript:window.print()" class="download-btn">🖨️ Print Report</a>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Report access error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}