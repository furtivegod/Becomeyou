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
      subject: 'Your Personal Assessment is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #007bff; text-align: center;">Your Assessment is Ready!</h1>
          
          <p style="font-size: 18px; color: #333; text-align: center; margin: 30px 0;">
            Your personalized assessment is ready. Click the link below to begin your transformation journey.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${jwt.sign({ sessionId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })}" 
               style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">
              🚀 Start Your Assessment
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            This link will take you directly to your personalized assessment.
          </p>
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