import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { getSignedPDFUrl } from '@/lib/pdf'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const sessionId = params.id
    
    console.log('Report viewer API called for session:', sessionId)

    // Try to get signed PDF URL first
    const signedPdfUrl = await getSignedPDFUrl(sessionId)
    
    if (signedPdfUrl) {
      console.log('Found existing PDF, redirecting to signed URL')
      return NextResponse.redirect(signedPdfUrl)
    }

    // If no PDF exists, get the plan data and generate HTML view
    console.log('No PDF found, generating HTML view')
    
    const { data: planOutput, error: planError } = await supabase
      .from('plan_outputs')
      .select('plan_json')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (planError || !planOutput) {
      console.error('Error fetching plan data:', planError)
      return new NextResponse('Report not found', { status: 404 })
    }

    const planData = planOutput.plan_json

    // Generate HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Personalized Protocol</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
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
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,123,255,0.3);
            z-index: 1000;
          }
          .print-button:hover {
            background: #0056b3;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
        
        <div class="header">
          <h1 class="title">${planData.title || 'Your Personalized 30-Day Protocol'}</h1>
          <p class="overview">${planData.overview || 'Based on your assessment, here\'s your customized transformation plan.'}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">📅 Daily Actions</h2>
          ${(planData.daily_actions || []).map((action: any) => `
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
          ${(planData.weekly_goals || []).map((goal: any) => `
            <div class="weekly-goal">
              <div class="week-title">Week ${goal.week}: ${goal.focus}</div>
              <ul class="week-goals">
                ${(goal.goals || []).map((g: string) => `<li>${g}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">📚 Resources</h2>
          ${(planData.resources || []).map((resource: string) => `
            <div class="resource">• ${resource}</div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">🤔 Reflection Prompts</h2>
          ${(planData.reflection_prompts || []).map((prompt: string) => `
            <div class="reflection">${prompt}</div>
          `).join('')}
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Report viewer error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}