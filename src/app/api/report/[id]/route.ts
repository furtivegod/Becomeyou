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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        h1 { color: #1976d2; margin-bottom: 0.5rem; }
        .subtitle { color: #666; font-style: italic; }
        .section {
          margin-bottom: 2rem;
          padding: 1rem;
          border-left: 4px solid #1976d2;
          background: #f8f9fa;
        }
        .section h2 {
          color: #1976d2;
          margin-top: 0;
          border-bottom: 1px solid #ddd;
          padding-bottom: 0.5rem;
        }
        .pdf-button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin: 1rem 0;
        }
        .pdf-button:hover { background: #1565c0; }
        .pdf-button:disabled { 
          background: #ccc; 
          cursor: not-allowed; 
        }
        .footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #ddd;
          color: #666;
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
              <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 6px;">
                <strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong><br>
                ${value}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${planData.domain_breakdown ? `
          <div class="section">
            <h2>Domain Breakdown</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
              ${Object.entries(planData.domain_breakdown).map(([domain, data]: [string, any]) => `
                <div style="padding: 1rem; background: #e3f2fd; border-radius: 6px;">
                  <strong>${domain.toUpperCase()}:</strong><br>
                  ${data}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${planData.nervous_system_assessment ? `
          <div class="section">
            <h2>Nervous System Assessment</h2>
            <div style="padding: 1rem; background: #fff3cd; border-radius: 6px;">
              ${planData.nervous_system_assessment}
            </div>
          </div>
        ` : ''}

        ${planData.thirty_day_protocol ? `
          <div class="section">
            <h2>30-Day Recommended Protocol</h2>
            ${Object.entries(planData.thirty_day_protocol).map(([key, value]: [string, any]) => `
              <div style="margin: 1rem 0; padding: 1rem; background: #d4edda; border-radius: 6px;">
                <strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong><br>
                ${value}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${planData.bottom_line ? `
          <div class="section">
            <h2>Bottom Line</h2>
            <div style="padding: 1rem; background: #f8d7da; border-radius: 6px; font-weight: bold;">
              ${planData.bottom_line}
            </div>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 2rem 0;">
          <button 
            class="pdf-button" 
            onclick="downloadPDF()"
            ${!signedPdfUrl ? 'disabled' : ''}
          >
            ${signedPdfUrl ? 'Download PDF Report' : 'PDF Generating...'}
          </button>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} | Your You 3.0 Behavioral Optimization Assessment</p>
          <p style="color: #1976d2; font-weight: bold;">📧 A downloadable PDF has been sent to your email!</p>
        </div>
      </div>

      <script>
        function downloadPDF() {
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