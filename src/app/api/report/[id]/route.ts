import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    console.log('PDF URL found:', signedPdfUrl ? 'Yes' : 'No')
    console.log('PDF URL:', signedPdfUrl)
    
    // Always show HTML page, don't redirect to PDF
    console.log('Generating HTML view for session:', sessionId)
    
    const { data: planOutput, error: planError } = await supabase
      .from('plan_outputs')
      .select('plan_json')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (planError || !planOutput) {
      console.error('Error fetching plan data:', planError)
      
      // If all else fails, show a fallback message
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Report Not Ready</title>
          <style>
            body { 
              font-family: 'Georgia', 'Times New Roman', serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #F5F1E8;
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
              background: #FFF3CD;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #D4AF37;
            }
            h1 { color: #4A5D23; margin-bottom: 1rem; font-family: 'Georgia', 'Times New Roman', serif; }
            p { color: #1A1A1A; line-height: 1.6; }
            .retry-btn {
              background: #4A5D23;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 1rem;
              transition: opacity 0.2s;
            }
            .retry-btn:hover { opacity: 0.9; }
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
    return generateHTMLReport(planData, sessionId, signedPdfUrl)

  } catch (error) {
    console.error('Report viewer error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

async function getSignedPDFUrl(sessionId: string): Promise<string | null> {
  try {
    const { data: pdfJob, error } = await supabase
      .from('pdf_jobs')
      .select('pdf_url, status')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !pdfJob) {
      console.log('No completed PDF found for session:', sessionId)
      return null
    }

    return pdfJob.pdf_url
  } catch (error) {
    console.error('Error getting signed PDF URL:', error)
    return null
  }
}

function generateHTMLReport(planData: any, sessionId: string, signedPdfUrl?: string | null) {
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Your You 3.0 Assessment Report</title>
      <style>
        body { 
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.6;
          color: #1A1A1A;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #F5F1E8;
        }
        .container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4A5D23;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        h1 { 
          color: #4A5D23; 
          margin-bottom: 0.5rem; 
          font-family: 'Georgia', 'Times New Roman', serif;
        }
        .subtitle { color: #666; font-style: italic; }
        .section {
          margin-bottom: 2rem;
          padding: 1rem;
          border-left: 4px solid #4A5D23;
          background: #F5F1E8;
        }
        .section h2 {
          color: #4A5D23;
          margin-top: 0;
          border-bottom: 1px solid #D4AF37;
          padding-bottom: 0.5rem;
          font-family: 'Georgia', 'Times New Roman', serif;
        }
        .pdf-button {
          background: #4A5D23;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin: 1rem 0;
          transition: opacity 0.2s;
        }
        .pdf-button:hover { opacity: 0.9; }
        .pdf-button:disabled { 
          background: #ccc; 
          cursor: not-allowed; 
        }
        .footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #4A5D23;
          color: #666;
          background: #F5F1E8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${planData.title || 'Your You 3.0 Assessment Report'}</h1>
          <p class="subtitle">${planData.overview || 'Your personalized behavioral optimization assessment is complete.'}</p>
        </div>

        ${planData.assessment_overview ? `
          <div class="section">
            <h2>Assessment Overview</h2>
            <p>${planData.assessment_overview}</p>
          </div>
        ` : ''}

        ${planData.development_profile ? `
          <div class="section">
            <h2>Your Development Profile</h2>
            <p>${planData.development_profile}</p>
          </div>
        ` : ''}

        ${planData.sabotage_analysis ? `
          <div class="section">
            <h2>Sabotage Pattern Analysis</h2>
            ${Object.entries(planData.sabotage_analysis).map(([key, value]: [string, any]) => `
              <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 6px; border-left: 3px solid #4A5D23;">
                <strong style="color: #4A5D23;">${key.replace(/_/g, ' ').toUpperCase()}:</strong><br>
                <span style="color: #1A1A1A;">${value}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${planData.domain_breakdown ? `
          <div class="section">
            <h2>Domain Breakdown</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
              ${Object.entries(planData.domain_breakdown).map(([domain, data]: [string, any]) => `
                <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37;">
                  <strong style="color: #4A5D23;">${domain.toUpperCase()}:</strong><br>
                  ${typeof data === 'object' && data !== null ? `
                    <div style="margin-top: 0.5rem;">
                      ${data.current_level ? `<div style="margin: 0.5rem 0;"><strong>Current Level:</strong> ${data.current_level}</div>` : ''}
                      ${data.current_phase ? `<div style="margin: 0.5rem 0;"><strong>Current Phase:</strong> ${data.current_phase}</div>` : ''}
                      ${data.key_strengths ? `<div style="margin: 0.5rem 0;"><strong>Key Strengths:</strong> ${data.key_strengths}</div>` : ''}
                      ${data.growth_opportunities ? `<div style="margin: 0.5rem 0;"><strong>Growth Opportunities:</strong> ${data.growth_opportunities}</div>` : ''}
                    </div>
                  ` : `<span style="color: #1A1A1A;">${data}</span>`}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${planData.nervous_system_assessment ? `
          <div class="section">
            <h2>Nervous System Assessment</h2>
            <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37; color: #1A1A1A;">
              ${typeof planData.nervous_system_assessment === 'object' && planData.nervous_system_assessment !== null ? `
                <div>
                  ${planData.nervous_system_assessment.primary_state ? `<div style="margin: 0.5rem 0;"><strong>Primary State:</strong> ${planData.nervous_system_assessment.primary_state}</div>` : ''}
                  ${planData.nervous_system_assessment.regulation_capacity ? `<div style="margin: 0.5rem 0;"><strong>Regulation Capacity:</strong> ${planData.nervous_system_assessment.regulation_capacity}</div>` : ''}
                  ${planData.nervous_system_assessment.observable_patterns ? `<div style="margin: 0.5rem 0;"><strong>Observable Patterns:</strong> ${planData.nervous_system_assessment.observable_patterns}</div>` : ''}
                  ${planData.nervous_system_assessment.regulation_reality ? `<div style="margin: 0.5rem 0;"><strong>Regulation Reality:</strong> ${planData.nervous_system_assessment.regulation_reality}</div>` : ''}
                </div>
              ` : planData.nervous_system_assessment}
            </div>
          </div>
        ` : ''}

        ${planData.thirty_day_protocol ? `
          <div class="section">
            <h2>30-Day Recommended Protocol</h2>
            ${Object.entries(planData.thirty_day_protocol).map(([key, value]: [string, any]) => `
              <div style="margin: 1rem 0; padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37;">
                <strong style="color: #4A5D23;">${key.replace(/_/g, ' ').toUpperCase()}:</strong><br>
                ${Array.isArray(value) ? `
                  <ul style="margin: 0.5rem 0; padding-left: 1.5rem; color: #1A1A1A;">
                    ${value.map((item: any) => `<li style="margin: 0.25rem 0;">${item}</li>`).join('')}
                  </ul>
                ` : `
                  <span style="color: #1A1A1A;">${value}</span>
                `}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${planData.development_reminders ? `
          <div class="section">
            <h2>Development Reminders</h2>
            <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37;">
              ${Array.isArray(planData.development_reminders) ? `
                <ul style="margin: 0; padding-left: 1.5rem; color: #1A1A1A;">
                  ${planData.development_reminders.map((reminder: string) => `<li style="margin: 0.5rem 0;">${reminder}</li>`).join('')}
                </ul>
              ` : `<span style="color: #1A1A1A;">${planData.development_reminders}</span>`}
            </div>
          </div>
        ` : ''}

        ${planData.book_recommendations ? `
          <div class="section">
            <h2>Book Recommendations</h2>
            <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37;">
              ${Array.isArray(planData.book_recommendations) ? `
                <ul style="margin: 0; padding-left: 1.5rem; color: #1A1A1A;">
                  ${planData.book_recommendations.map((book: string) => `<li style="margin: 0.5rem 0;">${book}</li>`).join('')}
                </ul>
              ` : `<span style="color: #1A1A1A;">${planData.book_recommendations}</span>`}
            </div>
          </div>
        ` : ''}

        ${planData.resources ? `
          <div class="section">
            <h2>Resources</h2>
            <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37;">
              ${Array.isArray(planData.resources) ? `
                <ul style="margin: 0; padding-left: 1.5rem; color: #1A1A1A;">
                  ${planData.resources.map((resource: string) => `<li style="margin: 0.5rem 0;">${resource}</li>`).join('')}
                </ul>
              ` : `<span style="color: #1A1A1A;">${planData.resources}</span>`}
            </div>
          </div>
        ` : ''}

        ${planData.reflection_prompts ? `
          <div class="section">
            <h2>Reflection Prompts</h2>
            <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37;">
              ${Array.isArray(planData.reflection_prompts) ? `
                <ul style="margin: 0; padding-left: 1.5rem; color: #1A1A1A;">
                  ${planData.reflection_prompts.map((prompt: string) => `<li style="margin: 0.5rem 0;">${prompt}</li>`).join('')}
                </ul>
              ` : `<span style="color: #1A1A1A;">${planData.reflection_prompts}</span>`}
            </div>
          </div>
        ` : ''}

        ${planData.bottom_line ? `
          <div class="section">
            <h2>Bottom Line</h2>
            <div style="padding: 1rem; background: #FFF3CD; border-radius: 6px; border: 1px solid #D4AF37; font-weight: bold; color: #1A1A1A;">
              ${planData.bottom_line}
            </div>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 2rem 0;">
          <button 
            class="pdf-button" 
            onclick="showPDF()"
            ${!signedPdfUrl ? 'disabled' : ''}
          >
            ${signedPdfUrl ? 'View PDF Report' : 'Open PDF in this tab...'}
          </button>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} | Your You 3.0 Behavioral Optimization Assessment</p>
          <p style="color: #4A5D23; font-weight: bold;">📧 A downloadable PDF has been sent to your email!</p>
        </div>
      </div>

      <script>
        function showPDF() {
          ${signedPdfUrl ? `
            const link = document.createElement('a');
            link.href = '${signedPdfUrl}';
            link.download = 'your-protocol.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          ` : `
            alert('PDF is still being generated. Please wait a moment and refresh the page.');
          `}
        }
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}