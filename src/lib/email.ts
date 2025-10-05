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

  try {
    console.log('Sending email via Resend...')
    const { data, error } = await resend.emails.send({
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: 'Your You 3.0 Assessment Link – Ready to Begin',
      html: `
        <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background-color: #F5F1E8;">
          <!-- Header Section -->
          <div style="background-color: white; padding: 40px 20px 20px 20px; text-align: center;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Become You Logo" style="height: 60px; width: auto;" />
            </div>
            <!-- Green Line -->
            <div style="height: 2px; background-color: #4A5D23; width: 100px; margin: 0 auto;"></div>
          </div>
          
          <!-- Body Section -->
          <div style="background-color: #F5F1E8; padding: 40px 20px;">
            <!-- Main Headline -->
            <h1 style="color: #4A5D23; text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 30px; font-family: 'Georgia', 'Times New Roman', serif;">
              You Just Made the Right Decision.
            </h1>
            
            <!-- Main Content -->
            <p style="font-size: 18px; color: #1A1A1A; text-align: center; margin: 30px 0; line-height: 1.6; font-family: Arial, sans-serif;">
              Your personalized You 3.0 assessment is ready. Over the next few minutes, you're going to 
              uncover the exact patterns that have been keeping you stuck—and get a protocol built 
              specifically for how your brain works.
            </p>
            
            <!-- Before You Begin -->
            <div style="background-color: #FFF3CD; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h2 style="color: #4A5D23; font-size: 20px; margin-bottom: 15px; font-family: 'Georgia', 'Times New Roman', serif;">Before You Begin:</h2>
              <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px; font-family: Arial, sans-serif;">
                <li style="margin-bottom: 8px;">✓ Find a quiet space where you can be honest and reflective</li>
                <li style="margin-bottom: 8px;">✓ Set aside 20-35 uninterrupted minutes (there's no time limit—you can take breaks)</li>
                <li style="margin-bottom: 8px;">✓ Answer honestly – the more specific you are, the more precise your protocol will be</li>
              </ul>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${jwt.sign({ sessionId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })}" 
                 style="background-color: #4A5D23; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block; font-family: Arial, sans-serif;">
                Start Your Assessment
              </a>
            </div>
            
            <!-- What to Expect -->
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h2 style="color: #4A5D23; font-size: 20px; margin-bottom: 15px; font-family: 'Georgia', 'Times New Roman', serif;">What to Expect:</h2>
              <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 15px; font-family: Arial, sans-serif;">
                The assessment uses adaptive AI to ask follow-up questions based on your answers. This isn't a 
                generic quiz—it's a conversation designed to map YOUR specific sabotage patterns, triggers, and 
                protective strategies.
              </p>
              <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 15px; font-family: Arial, sans-serif;">
                Your responses are completely private. No human will see your answers. Your data is 
                automatically deleted after your personalized protocol is generated.
              </p>
              <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
                Immediately after completion, your recommended 30-Day Transformation Protocol will be 
                delivered to this email address. Save it. Reference it. Use it.
              </p>
            </div>
            
            <!-- Disclaimer -->
            <div style="background-color: #FFF3CD; border: 1px solid #D4AF37; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0; text-align: center; font-family: Arial, sans-serif;">
                <strong>Disclaimer:</strong> This assessment is not a diagnostic tool and does not replace 
                professional mental health support. If you are experiencing crisis-level distress, please seek 
                immediate professional care.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #F5F1E8; padding: 20px; text-align: center; border-top: 1px solid #4A5D23;">
            <p style="color: #666; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">
              Need support? Contact us at support@becomeyou.ai
            </p>
          </div>
        </div>
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

export async function sendReportEmail(email: string, pdfUrl: string, pdfBuffer?: Buffer) {
  console.log('Sending report email to:', email)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  try {
    console.log('Sending email via Resend...')
    
    const emailData: any = {
      from: 'Become You <noreply@becomeyou.ai>',
      to: [email],
      subject: 'Your Personalized 30-Day Protocol is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #007bff; text-align: center;">Your Protocol is Ready!</h1>
          
          <p style="font-size: 18px; color: #333; text-align: center; margin: 30px 0;">
            Your personalized 30-day transformation protocol has been generated and is attached to this email.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #007bff; font-size: 16px; font-weight: bold;">
              📎 Your personalized protocol is attached as a PDF file
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Download the attachment to view your complete 30-day transformation plan.
          </p>
        </div>
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