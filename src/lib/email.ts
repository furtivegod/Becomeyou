import { Resend } from 'resend'
import jwt from 'jsonwebtoken'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.NODE_ENV === 'production'
  ? 'BECOME YOU <noreply@becomeyou.com>'
  : 'onboarding@resend.dev'

export async function sendMagicLink(email: string, sessionId: string) {
  const token = jwt.sign(
    { sessionId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )
  
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/assessment/${sessionId}?token=${token}`
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
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
      console.error('Error sending magic link:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Failed to send magic link:', error)
    throw error
  }
}

export async function sendReportEmail(email: string, pdfUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
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