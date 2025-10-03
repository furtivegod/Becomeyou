import { NextRequest, NextResponse } from 'next/server'
import { generatePDF } from '@/lib/pdf'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    
    console.log('📄 Generating PDF for session:', sessionId)
    
    // Get session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        users!inner(user_name, email)
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Not Found</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .error-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #2d3748; margin-bottom: 10px; font-size: 28px; }
            .message { color: #4a5568; margin-bottom: 30px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">🔍</div>
            <h1>Session Not Found</h1>
            <p class="message">No session found with ID: ${sessionId}</p>
          </div>
        </body>
        </html>
      `
      return new NextResponse(errorHtml, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Get plan data for this session
    const { data: planData, error: planError } = await supabase
      .from('plan_outputs')
      .select('plan_data')
      .eq('session_id', sessionId)
      .single()

    if (planError || !planData) {
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Plan Data Not Found</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .error-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #2d3748; margin-bottom: 10px; font-size: 28px; }
            .message { color: #4a5568; margin-bottom: 30px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">📋</div>
            <h1>Plan Data Not Found</h1>
            <p class="message">No plan data found for session: ${sessionId}</p>
          </div>
        </body>
        </html>
      `
      return new NextResponse(errorHtml, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Determine client name
    const userData = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users
    const clientName = userData?.user_name || 
                      userData?.email?.split('@')[0] || 
                      'Client'

    console.log('📊 Found session data:', {
      sessionId,
      clientName,
      hasPlanData: !!planData.plan_data
    })

    // Generate PDF
    const result = await generatePDF(planData.plan_data, sessionId)
    
    console.log('✅ PDF generated successfully!')
    console.log('📄 PDF URL:', result.pdfUrl)
    
    // Return HTML page with PDF viewer
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Generated Successfully</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .message {
            color: #4a5568;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .pdf-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s, box-shadow 0.2s;
            margin: 10px;
          }
          .pdf-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          }
          .info {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            text-align: left;
          }
          .info-item {
            margin-bottom: 10px;
            color: #4a5568;
          }
          .info-label {
            font-weight: 600;
            color: #2d3748;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">📄</div>
          <h1>PDF Generated Successfully!</h1>
          <p class="message">Your assessment report is ready to view.</p>
          
          <a href="${result.pdfUrl}" target="_blank" class="pdf-button">
            📖 View PDF Report
          </a>
          
          <a href="${result.pdfUrl}" download class="pdf-button" style="background: #48bb78;">
            💾 Download PDF
          </a>
          
          <div class="info">
            <div class="info-item">
              <span class="info-label">Session ID:</span> ${sessionId}
            </div>
            <div class="info-item">
              <span class="info-label">Client:</span> ${clientName}
            </div>
            <div class="info-item">
              <span class="info-label">Generated:</span> ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    
    // Return HTML error page
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Generation Failed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .message {
            color: #4a5568;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .error-details {
            background: #fed7d7;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            text-align: left;
          }
          .error-text {
            color: #c53030;
            font-family: monospace;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">❌</div>
          <h1>PDF Generation Failed</h1>
          <p class="message">There was an error generating your PDF report.</p>
          
          <div class="error-details">
            <strong>Error Details:</strong>
            <div class="error-text">${error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      </body>
      </html>
    `
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
