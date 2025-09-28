import { Resend } from 'resend'
import jwt from 'jsonwebtoken'

const resend = new Resend(process.env.RESEND_API_KEY)

// Use Resend's default domain for now
const FROM = 'onboarding@resend.dev' // Always use this for now

export async function sendMagicLink(email: string, sessionId: string) {
  console.log('Email service called with:', { email, sessionId })
  console.log('RESEND_API_KEY status:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET')
  console.log('FROM address:', FROM)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL not configured')
  }

  const token = jwt.sign(
    { sessionId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )
  
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${token}`
  console.log('Generated magic link:', magicLink)
  
  try {
    console.log('Sending email via Resend...')
    const { data, error } = await resend.emails.send({
      from: FROM, // This will be 'onboarding@resend.dev'
      to: [email],
      subject: 'Your Personal Assessment is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Welcome to BECOME YOU</h1>
          <p style="font-size: 16px; line-height: 1.6;">Your personalized assessment is ready! Click the link below to begin your journey of transformation.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Start Your Assessment
            </a>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">This link will expire in 24 hours.</p>
        </div>
      `
    })
    
    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${JSON.stringify(error)}`)
    }
    
    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to send magic link:', error)
    throw error
  }
}

export async function sendReportEmail(email: string, pdfUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM, // This will be 'onboarding@resend.dev'
      to: [email],
      subject: 'Your Personalized 30-Day Protocol is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Your Protocol is Ready!</h1>
          <p style="font-size: 16px; line-height: 1.6;">Congratulations on completing your assessment. Your personalized 30-day protocol has been generated and is ready for download.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Download Your Protocol
            </a>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">You can also view your report online at any time.</p>
        </div>
      `
    })
    
    if (error) {
      console.error('Error sending report email:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Failed to send report email:', error)
    throw error
  }
}