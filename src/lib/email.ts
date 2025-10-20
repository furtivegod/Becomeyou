import { Resend } from 'resend'
import jwt from 'jsonwebtoken'

const resend = new Resend(process.env.RESEND_API_KEY)


export async function sendMagicLink(email: string, sessionId: string) {
  console.log('Email service called with:', { email, sessionId })
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL not configured')
  }

  // Extract first name from email
  const firstName = email.split('@')[0].split('.').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')

  try {
    console.log('Sending email via Resend...')
    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: 'Your You 3.0 Assessment Is Ready',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your You 3.0 Assessment Is Ready</title>
            <style>
                @media only screen and (min-width: 600px) {
                    .cta-button:hover {
                        background: #1f3329 !important;
                    }
                }
                
                @media only screen and (max-width: 600px) {
                    .email-container {
                        width: 100% !important;
                    }
                    
                    h1 {
                        font-size: 24px !important;
                    }
                    
                    .cta-button {
                        padding: 14px 32px !important;
                        font-size: 15px !important;
                    }
                    
                    .instruction-text {
                        font-size: 13px !important;
                        padding: 0 30px !important;
                    }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif; background-color: #f5f5f5;">
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        
                        <!-- Main Container -->
                        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container" style="background-color: #FDFCF9; border-radius: 8px; overflow: hidden;">
                            
                            <!-- Spacer -->
                            <tr>
                                <td height="60"></td>
                            </tr>
                            
                            <!-- Icon (Optional - the slash) -->
                            <tr>
                                <td align="center" style="padding: 0 40px;">
                                    <div style="font-size: 32px; color: #F8D794; font-style: italic; font-weight: 200;">/</div>
                                </td>
                            </tr>
                            
                            <!-- Spacer -->
                            <tr>
                                <td height="40"></td>
                            </tr>
                            
                            <!-- Greeting -->
                            <tr>
                                <td align="center" style="padding: 0 40px;">
                                    <h1 style="margin: 0; font-size: 32px; font-weight: 300; color: #111A19; letter-spacing: -0.5px; line-height: 1.2;">
                                        <span style="color: #284138;">${firstName}</span>,
                                    </h1>
                                </td>
                            </tr>
                            
                            <!-- Spacer -->
                            <tr>
                                <td height="20"></td>
                            </tr>
                            
                            <!-- Main Message -->
                            <tr>
                                <td align="center" style="padding: 0 40px;">
                                    <p style="margin: 0; font-size: 18px; font-weight: 300; color: #111A19; line-height: 1.6;">
                                        Your assessment is ready.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Spacer -->
                            <tr>
                                <td height="50"></td>
                            </tr>
                            
                            <!-- CTA Button -->
                            <tr>
                                <td align="center" style="padding: 0 40px;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${jwt.sign({ sessionId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })}" class="cta-button" style="display: inline-block; background: #284138; color: #FFFFFF; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 500; letter-spacing: 0.3px; transition: background 0.2s ease;">
                                        Begin Your Assessment →
                                    </a>
                                </td>
                            </tr>
                            
                            <!-- Spacer -->
                            <tr>
                                <td height="40"></td>
                            </tr>
                            
                            <!-- Instructions -->
                            <tr>
                                <td align="center" class="instruction-text" style="padding: 0 60px;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 300; color: #80907B; line-height: 1.8;">
                                        Takes 15 minutes. No rush.<br>
                                        Find a quiet space where you can be honest.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Spacer -->
                            <tr>
                                <td height="60"></td>
                            </tr>
                            
                        </table>
                        
                        <!-- Footer -->
                        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container">
                            <tr>
                                <td height="30"></td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 0 40px;">
                                    <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.6;">
                                        Questions? Just reply to this email.<br>
                                        We're here to help.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td height="40"></td>
                            </tr>
                        </table>
                        
                    </td>
                </tr>
            </table>
            
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Magic link email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send magic link:', error)
    throw error
  }
}

export async function sendReportEmail(email: string, userName: string, pdfUrl: string, pdfBuffer?: Buffer, planData?: any) {
  console.log('Sending report email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    console.log('Sending email via Resend...')
    
    // Use the provided user name, fallback to email extraction if not provided
    const displayName = userName || email.split('@')[0].split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ')
    
    // Generate personalized P.S. based on assessment data
    let personalizedPS = ''
    if (planData) {
      const sabotageAnalysis = planData.sabotage_analysis
      const domainBreakdown = planData.domain_breakdown
      
      if (sabotageAnalysis?.protective_pattern) {
        personalizedPS = `You mentioned "${sabotageAnalysis.protective_pattern.substring(0, 50)}...". If you want help designing the environment and structure that makes change automatic instead of exhausting, <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">book a call</a>.`
      } else if (planData.thirty_day_protocol?.thirty_day_approach) {
        personalizedPS = `You're building toward your transformation goals. If you want to map out how your patterns are affecting your momentum, <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">book a call</a>.`
      } else if (domainBreakdown?.spirit) {
        personalizedPS = `You shared insights about your spiritual connection. If you want to understand how your protective patterns show up in your closest relationships, <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">book a call</a>.`
      } else if (domainBreakdown?.body) {
        personalizedPS = `You described your relationship with your body. If you want to rebuild that connection without force or punishment, <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">book a call</a>.`
      } else {
        personalizedPS = `Your assessment revealed important patterns. If you want to understand how these patterns are affecting your progress, <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">book a call</a>.`
      }
    }
    
    const emailData: any = {
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: 'Your You 3.0 roadmap is ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body>
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0e29d;">
          <!-- Header Section -->
          <div style="background-color: white; padding: 40px 20px 30px 20px; text-align: center;">
            <!-- Logo -->
            <div style="margin-bottom: 40px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 100px; width: auto;" />
            </div>
            <!-- Green Line -->
            <div style="height: 3px; background-color: #4A5D23; width: 200px; margin: 0 auto;"></div>
          </div>
          
          <!-- Body Section -->
          <div style="background-color: #f0e29d; padding: 40px 20px;">
            <!-- Main Content -->
            <p style="font-size: 18px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>${displayName},</strong><br><br>
              Your complete assessment is attached.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Before you read it, know this: Everything in that report—every pattern, every protective 
              mechanism, every stuck point—made perfect sense at the time it formed. Your nervous system 
              has been doing exactly what it was designed to do: keep you safe.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              The question now is: Are those same strategies still serving you, or is it time to update them?
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Read it when you're ready. Then take the 72-hour action.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Your Teammate,<br>
              <strong style="color: #4A5D23;">Matthew</strong>
            </p>
            
            ${personalizedPS ? `
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 30px 0; font-family: 'Inter', sans-serif;">
                <strong>P.S.</strong> ${personalizedPS}
              </p>
            ` : ''}
            
            <!-- PDF Attachment Notice -->
            <div style="text-align: center; margin: 40px 0;">
              <p style="color: #4A5D23; font-size: 18px; font-weight: bold; margin: 0; font-family: 'Inter', sans-serif;">
                Your personalized protocol is attached as a PDF file
                </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f0e29d; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Inter', sans-serif;">
              Need support? Contact us at <a href="mailto:support@becomeyou.ai" style="color: #4A5D23; text-decoration: underline;">support@becomeyou.ai</a>
            </p>
          </div>
        </div>
        </body>
        </html>
      `
    }

    // Add PDF attachment if buffer is provided
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: 'your-personalized-protocol.pdf',
          content: pdfBuffer.toString('base64'),
          type: 'application/pdf'
        }
      ]
    }

    const { data, error } = await resend.emails.send(emailData)
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Report email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send report email:', error)
    throw error
  }
}

// Email 2: Pattern Recognition (48 hours)
export async function sendPatternRecognitionEmail(email: string, userName: string, planData?: any) {
  console.log('Sending pattern recognition email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    // Generate personalized P.S. based on nervous system pattern
    let personalizedPS = ''
    if (planData) {
      const nervousSystemAssessment = planData.nervous_system_assessment
      if (nervousSystemAssessment?.primary_state) {
        const pattern = nervousSystemAssessment.primary_state.toLowerCase()
        if (pattern.includes('sympathetic') || pattern.includes('stress') || pattern.includes('overthinking')) {
          personalizedPS = "In a Discovery Call, we map the exact moments your nervous system shifts into protection mode—and build specific interrupts that work with your wiring. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a> when you're ready."
        } else if (pattern.includes('dorsal') || pattern.includes('avoidance') || pattern.includes('numbing')) {
          personalizedPS = "In a Discovery Call, we identify what safety looks like for your nervous system—so action doesn't require forcing yourself through shutdown. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a> when you're ready."
        } else if (pattern.includes('ventral') || pattern.includes('regulation')) {
          personalizedPS = "In a Discovery Call, we design practices that help you stay regulated under pressure—not just when life is calm. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a> when you're ready."
        } else {
          personalizedPS = "In a Discovery Call, we design pattern interrupts tailored to your nervous system. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a> when you're ready to build new responses."
        }
      } else {
        personalizedPS = "In a Discovery Call, we design pattern interrupts tailored to your nervous system. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a> when you're ready to build new responses."
      }
    }

    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: 'You probably already noticed it',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body>
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0e29d;">
          <div style="background-color: white; padding: 40px 20px 30px 20px; text-align: center;">
            <div style="margin-bottom: 40px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 100px; width: auto;" />
            </div>
            <div style="height: 3px; background-color: #4A5D23; width: 200px; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f0e29d; padding: 40px 20px;">
            <p style="font-size: 18px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>${userName},</strong><br><br>
              I'm curious—since reading your assessment, have you caught yourself doing exactly the thing it described?
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Maybe you had clarity about your next move, then immediately started researching "the right way" to do it instead of just starting.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Or you felt motivated to ${planData?.sabotage_analysis?.protective_pattern || '[their specific pattern]'}, then reached for ${planData?.sabotage_analysis?.escape_behavior || '[their escape behavior]'} instead.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              That's not failure. That's your nervous system doing what it's been trained to do.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              The difference now? <strong>You see it happening in real time.</strong>
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              And that awareness gap—the space between the trigger and your automatic response—is where all change begins.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Your Teammate,<br>
              <strong style="color: #4A5D23;">Matthew</strong>
            </p>
            
            ${personalizedPS ? `
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 30px 0; font-family: 'Inter', sans-serif;">
                <strong>P.S.</strong> ${personalizedPS}
              </p>
            ` : ''}
          </div>
          
          <div style="background-color: #f0e29d; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Inter', sans-serif;">
              Need support? Contact us at <a href="mailto:support@becomeyou.ai" style="color: #4A5D23; text-decoration: underline;">support@becomeyou.ai</a>
            </p>
          </div>
        </div>
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Pattern recognition email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send pattern recognition email:', error)
    throw error
  }
}

// Email 3: Evidence 7-Day (7 days)
export async function sendEvidence7DayEmail(email: string, userName: string, planData?: any) {
  console.log('Sending evidence 7-day email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    // Generate personalized P.S. based on primary sabotage pattern
    let personalizedPS = ''
    if (planData) {
      const sabotageAnalysis = planData.sabotage_analysis
      if (sabotageAnalysis?.protective_pattern) {
        const pattern = sabotageAnalysis.protective_pattern.toLowerCase()
        if (pattern.includes('perfectionism') || pattern.includes('overthinking')) {
          personalizedPS = `You mentioned ${sabotageAnalysis.protective_pattern.substring(0, 50)}. In a Discovery Call, we identify what 'good enough' actually looks like for your nervous system—so you can ship without the spiral. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
        } else if (pattern.includes('avoidance') || pattern.includes('procrastination')) {
          personalizedPS = `You shared that ${sabotageAnalysis.protective_pattern.substring(0, 50)}. In a Discovery Call, we build momentum systems that work with your energy cycles instead of fighting them. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
        } else if (pattern.includes('people-pleasing') || pattern.includes('conflict')) {
          personalizedPS = `You described ${sabotageAnalysis.protective_pattern.substring(0, 50)}. In a Discovery Call, we practice saying what's true without triggering your abandonment alarm. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
        } else {
          personalizedPS = "The assessment mapped the patterns. A Discovery Call helps you see progress you're missing and builds momentum structures. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a>."
        }
      } else {
        personalizedPS = "The assessment mapped the patterns. A Discovery Call helps you see progress you're missing and builds momentum structures. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a>."
      }
    }
    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: 'The shift you might not be noticing',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body>
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0e29d;">
          <div style="background-color: white; padding: 40px 20px 30px 20px; text-align: center;">
            <div style="margin-bottom: 40px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 100px; width: auto;" />
            </div>
            <div style="height: 3px; background-color: #4A5D23; width: 200px; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f0e29d; padding: 40px 20px;">
            <p style="font-size: 18px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>${userName},</strong><br><br>
              Most people wait for transformation to feel like a lightning bolt.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              It doesn't.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              It shows up as:
            </p>
            
            <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 20px 0; padding-left: 20px; font-family: 'Inter', sans-serif;">
              <li style="margin-bottom: 8px;">One conversation you didn't avoid</li>
              <li style="margin-bottom: 8px;">One evening you chose ${planData?.sabotage_analysis?.positive_behavior || '[their positive behavior]'} over ${planData?.sabotage_analysis?.escape_behavior || '[their escape behavior]'}</li>
              <li style="margin-bottom: 8px;">One moment you caught the spiral before it hijacked your whole day</li>
            </ul>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              These aren't "small" wins.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              They're <strong>proof your nervous system is recalibrating.</strong>
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              So here's your assignment: What's one thing you've done in the last week that your former self—the one who took this assessment—would have avoided or numbed out from?
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              That's the evidence that you're already changing.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Your Teammate,<br>
              <strong style="color: #4A5D23;">Matthew</strong>
            </p>
            
            ${personalizedPS ? `
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 30px 0; font-family: 'Inter', sans-serif;">
                <strong>P.S.</strong> ${personalizedPS}
              </p>
            ` : ''}
          </div>
          
          <div style="background-color: #f0e29d; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Inter', sans-serif;">
              Need support? Contact us at <a href="mailto:support@becomeyou.ai" style="color: #4A5D23; text-decoration: underline;">support@becomeyou.ai</a>
            </p>
          </div>
        </div>
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Evidence 7-day email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send evidence 7-day email:', error)
    throw error
  }
}

// Email 4: Integration Threshold (14 days)
export async function sendIntegrationThresholdEmail(email: string, userName: string, planData?: any) {
  console.log('Sending integration threshold email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    // Generate personalized P.S. based on stated goals
    let personalizedPS = ''
    if (planData) {
      const goals = planData.goals
      if (goals?.business_goal || goals?.financial_goal) {
        const businessGoal = goals.business_goal || goals.financial_goal
        personalizedPS = `You're building toward ${businessGoal}. In a Discovery Call, we map how your nervous system patterns are affecting your business momentum—and what to shift first. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
      } else if (goals?.relationship_goal) {
        personalizedPS = `You want ${goals.relationship_goal}. In a Discovery Call, we identify how your protective patterns show up in intimacy—and practice new responses. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
      } else if (goals?.body_goal || goals?.health_goal) {
        const bodyGoal = goals.body_goal || goals.health_goal
        personalizedPS = `You described wanting ${bodyGoal}. In a Discovery Call, we rebuild your relationship with your body without punishment or force. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
      } else {
        personalizedPS = "A Discovery Call clarifies whether you're ready for implementation or still gathering insights. Both are valid—but knowing saves months. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a>."
      }
    }
    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: "You're at the make-or-break point",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body>
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0e29d;">
          <div style="background-color: white; padding: 40px 20px 30px 20px; text-align: center;">
            <div style="margin-bottom: 40px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 100px; width: auto;" />
            </div>
            <div style="height: 3px; background-color: #4A5D23; width: 200px; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f0e29d; padding: 40px 20px;">
            <p style="font-size: 18px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>${userName},</strong><br><br>
              Two weeks is when most people quit.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Not because they failed. Not because the assessment was wrong.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              But because <strong>awareness without structure = temporary inspiration.</strong>
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              You've done the hardest part—you've seen the pattern clearly. You understand why you've been stuck.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              But understanding doesn't rewire your nervous system. Consistent, appropriately-sized practice does.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Here's what shifts people from knowing to embodying:
            </p>
            
            <ol style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 20px 0; padding-left: 20px; font-family: 'Inter', sans-serif;">
              <li style="margin-bottom: 8px;"><strong>Daily micro-practices</strong> that build new neural pathways (not willpower marathons)</li>
              <li style="margin-bottom: 8px;"><strong>Environmental design</strong> that removes friction (not forcing yourself to "be disciplined")</li>
              <li style="margin-bottom: 8px;"><strong>Accountability structure</strong> that prevents regression when life gets hard</li>
            </ol>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              You've proven you can do hard things—you built ${planData?.sabotage_analysis?.success_proof || planData?.sabotage_analysis?.anchor || 'something meaningful in your life'}. The question is: Are you ready to apply that same capability to your own nervous system?
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Your Teammate,<br>
              <strong style="color: #4A5D23;">Matthew</strong>
            </p>
            
            ${personalizedPS ? `
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 30px 0; font-family: 'Inter', sans-serif;">
                <strong>P.S.</strong> ${personalizedPS}
              </p>
            ` : ''}
          </div>
          
          <div style="background-color: #f0e29d; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Inter', sans-serif;">
              Need support? Contact us at <a href="mailto:support@becomeyou.ai" style="color: #4A5D23; text-decoration: underline;">support@becomeyou.ai</a>
            </p>
          </div>
        </div>
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Integration threshold email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send integration threshold email:', error)
    throw error
  }
}

// Email 5: Compound Effect (21 days)
export async function sendCompoundEffectEmail(email: string, userName: string, planData?: any) {
  console.log('Sending compound effect email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    // Generate personalized P.S. based on 30-day protocol
    let personalizedPS = ''
    if (planData) {
      const protocol = planData.thirty_day_protocol
      if (protocol?.specific_action) {
        personalizedPS = `You committed to ${protocol.specific_action}. Whether you did it once or daily, that's data. In a Discovery Call, we use that data to design what's actually sustainable for your nervous system. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
      } else if (protocol?.environmental_change) {
        personalizedPS = `You identified ${protocol.environmental_change}. In a Discovery Call, we refine your environment so the default choice is the right choice—no willpower required. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
      } else if (protocol?.weekly_practice) {
        personalizedPS = `You planned ${protocol.weekly_practice}. In a Discovery Call, we figure out why it stuck or why it didn't—and adjust from there. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a>.`
      } else {
        personalizedPS = "Three weeks of data is enough to see your patterns clearly. In a Discovery Call, we turn that data into a sustainable system. <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a>."
      }
    }
    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: "Three weeks in—this is where it gets real",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body>
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0e29d;">
          <div style="background-color: white; padding: 40px 20px 30px 20px; text-align: center;">
            <div style="margin-bottom: 40px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 100px; width: auto;" />
            </div>
            <div style="height: 3px; background-color: #4A5D23; width: 200px; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f0e29d; padding: 40px 20px;">
            <p style="font-size: 18px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>${userName},</strong><br><br>
              Three weeks is the threshold where temporary motivation either becomes sustainable practice or fades completely.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Here's what I've noticed working with 680+ people:
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>The ones who transform don't feel dramatically different at 21 days.</strong>
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              They just notice they're recovering faster:
            </p>
            
            <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 20px 0; padding-left: 20px; font-family: 'Inter', sans-serif;">
              <li style="margin-bottom: 8px;">The spiral still shows up, but it doesn't hijack their whole week</li>
              <li style="margin-bottom: 8px;">The escape pattern still tempts them, but they catch it before autopilot takes over</li>
              <li style="margin-bottom: 8px;">The old story still plays, but they recognize it as a story instead of truth</li>
            </ul>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              That's not small progress. That's your nervous system learning a new default.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
               But here's the catch: <strong>This is exactly when most people quit.</strong>
            </p>

            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
                Not because nothing's working—but because the initial insight has worn off and the daily practice feels boring. Unsexy. Repetitive.
            </p>

            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
                Which is exactly what rewiring your nervous system requires.
            </p>

            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              You've already proven you can do this—you showed up for the assessment, you read the report, you've been noticing your patterns. The question is: Are you willing to keep going through the unsexy middle where nothing feels dramatic but everything is shifting?
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Your Teammate,<br>
              <strong style="color: #4A5D23;">Matthew</strong>
            </p>
            
            ${personalizedPS ? `
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 30px 0; font-family: 'Inter', sans-serif;">
                <strong>P.S.</strong> ${personalizedPS}
              </p>
            ` : ''}
          </div>
          
          <div style="background-color: #f0e29d; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Inter', sans-serif;">
              Need support? Contact us at <a href="mailto:support@becomeyou.ai" style="color: #4A5D23; text-decoration: underline;">support@becomeyou.ai</a>
            </p>
          </div>
        </div>
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Compound effect email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send compound effect email:', error)
    throw error
  }
}

// Email 6: Direct Invitation (30 days)
export async function sendDirectInvitationEmail(email: string, userName: string, planData?: any) {
  console.log('Sending direct invitation email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    // Generate personalized P.S. based on future vision
    let personalizedPS = ''
    if (planData) {
      const futureVision = planData.future_vision || planData.goals?.future_state
      if (futureVision) {
        personalizedPS = `You described a Tuesday where ${futureVision}. That version of you exists—you just need the path to get there. <a href="https://calendly.com/matthewpaetz/discovery-call" style="color: #4A5D23; text-decoration: underline;">Book here</a> to map it out together.`
      } else {
        personalizedPS = "You've had the map for 30 days. Ready to build the path? <a href=\"https://calendly.com/matthewpaetz/discovery-call\" style=\"color: #4A5D23; text-decoration: underline;\">Book here</a>."
      }
    }
    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: "30 days later—what's actually different?",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body>
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0e29d;">
          <div style="background-color: white; padding: 40px 20px 30px 20px; text-align: center;">
            <div style="margin-bottom: 40px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 100px; width: auto;" />
            </div>
            <div style="height: 3px; background-color: #4A5D23; width: 200px; margin: 0 auto;"></div>
          </div>
          
          <div style="background-color: #f0e29d; padding: 40px 20px;">
            <p style="font-size: 18px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>${userName},</strong><br><br>
              It's been a month since you took your You 3.0 Assessment.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              I'm not going to ask if you "implemented everything" or if you're "where you want to be." That's not how transformation works.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Instead, I'm asking: <strong>What's one thing that's different—even slightly—compared to 30 days ago?</strong>
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Maybe you:
            </p>
            
            <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 20px 0; padding-left: 20px; font-family: 'Inter', sans-serif;">
              <li style="margin-bottom: 8px;">Caught yourself mid-spiral and interrupted it (even once)</li>
              <li style="margin-bottom: 8px;">Had a hard conversation you would have avoided before</li>
              <li style="margin-bottom: 8px;">Chose ${planData?.sabotage_analysis?.positive_behavior || '[positive behavior]'} when you normally would have reached for ${planData?.sabotage_analysis?.escape_behavior || '[escape behavior]'}</li>
            </ul>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              If you can name even one shift, that's proof the assessment was accurate and you're capable of change.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              If nothing's different? That's also useful information—it means you're in the "knowing" phase but haven't moved to the "doing" phase yet.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Either way, here's what I know after working with 680+ people:
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              <strong>Awareness + Structure + Accountability = Lasting Change</strong>
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              You have the awareness. The assessment gave you that.
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              The question is: Do you want to keep trying to build structure and accountability on your own, or do you want help designing a system that actually fits your nervous system?
            </p>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              If you want help, book a Discovery Call. We'll get clear on:
            </p>
            
            <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 20px 0; padding-left: 20px; font-family: 'Inter', sans-serif;">
              <li style="margin-bottom: 8px;">Where you actually are (not where you "should" be)</li>
              <li style="margin-bottom: 8px;">What's realistically possible in the next 90 days given your current capacity</li>
              <li style="margin-bottom: 8px;">Whether working together 1:1 makes sense or if you need something else first</li>
            </ul>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 20px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              If you're not ready yet, that's completely fine. Keep the assessment. Come back to it when the gap between who you are and who you want to be gets uncomfortable enough to act on.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://calendly.com/matthewpaetz/discovery-call" style="background-color: #4A5D23; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block; font-family: 'Inter', sans-serif;">
                Book Your Discovery Call
              </a>
            </div>
            
            <p style="font-size: 16px; color: #1A1A1A; margin: 30px 0; line-height: 1.6; font-family: 'Inter', sans-serif;">
              Your Teammate,<br>
              <strong style="color: #4A5D23;">Matthew</strong>
            </p>
            
            ${personalizedPS ? `
            <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 30px 0; font-family: 'Inter', sans-serif;">
                <strong>P.S.</strong> ${personalizedPS}
              </p>
            ` : ''}
          </div>
          
          <div style="background-color: #f0e29d; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: 'Inter', sans-serif;">
              Need support? Contact us at <a href="mailto:support@becomeyou.ai" style="color: #4A5D23; text-decoration: underline;">support@becomeyou.ai</a>
            </p>
          </div>
        </div>
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Direct invitation email sent successfully:', data?.id)
    
  } catch (error) {
    console.error('Failed to send direct invitation email:', error)
    throw error
  }
}