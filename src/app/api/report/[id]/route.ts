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
      
      // If no plan data exists, trigger report generation
      console.log('No plan data found, triggering report generation')
      try {
        const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/report/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })
        
        if (generateResponse.ok) {
          const generateResult = await generateResponse.json()
          console.log('Report generation triggered successfully')
          
          // Add a check to prevent multiple generations
          const { data: existingPlan } = await supabase
            .from('plan_outputs')
            .select('id')
            .eq('session_id', sessionId)
            .limit(1)
            .single()

          if (existingPlan) {
            console.log('Plan already exists, skipping generation')
            // Get the existing plan data instead of generating new one
            const { data: planOutput } = await supabase
              .from('plan_outputs')
              .select('plan_json')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            
            if (planOutput) {
              return generateHTMLReport(planOutput.plan_json, sessionId)
            }
          }
        }
      } catch (generateError) {
        console.error('Error triggering report generation:', generateError)
      }
      
      // If all else fails, show a fallback message
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Report Not Ready</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8f9fa;
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
              background: #e3f2fd;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            h1 { color: #1976d2; margin-bottom: 1rem; }
            p { color: #666; line-height: 1.6; }
            .retry-btn {
              background: #1976d2;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 1rem;
            }
            .retry-btn:hover { background: #1565c0; }
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
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const planData = planOutput.plan_json
    return generateHTMLReport(planData, sessionId)

  } catch (error) {
    console.error('Report viewer error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function generateHTMLReport(planData: any, sessionId: string) {
  return new NextResponse(`
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
        .download-button {
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
        .download-button:hover {
          background: #0056b3;
        }
        @media print {
          .download-button { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="download-button" onclick="window.print()">📥 Download PDF</button>
      
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
      
      ${(planData.weekly_goals || []).length > 0 ? `
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
      ` : ''}
      
      ${(planData.resources || []).length > 0 ? `
      <div class="section">
        <h2 class="section-title">📚 Resources</h2>
        ${(planData.resources || []).map((resource: string) => `
          <div class="resource">• ${resource}</div>
        `).join('')}
      </div>
      ` : ''}
      
      ${(planData.reflection_prompts || []).length > 0 ? `
      <div class="section">
        <h2 class="section-title">🤔 Reflection Prompts</h2>
        ${(planData.reflection_prompts || []).map((prompt: string) => `
          <div class="reflection">${prompt}</div>
        `).join('')}
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Your personalized transformation protocol</p>
        <p style="color: #007bff; font-weight: bold; margin-top: 10px;">
          📧 A PDF version has been sent to your email with the complete protocol!
        </p>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}