import { supabase } from '@/lib/supabase'
import { 
  sendPatternRecognitionEmail,
  sendEvidence7DayEmail,
  sendIntegrationThresholdEmail,
  sendCompoundEffectEmail,
  sendDirectInvitationEmail
} from './email'

// Create email sequence for a user
export async function createEmailSequence(userId: string, sessionId: string, userEmail: string, userName: string) {
  try {
    console.log('Creating email sequence for user:', userId)
    
    const email = userEmail
    const name = userName || email.split('@')[0]

    // Schedule emails with delays
    const emailSchedule = [
      { delay: 48 * 60 * 60 * 1000, function: sendPatternRecognitionEmail, name: 'pattern_recognition' },
      { delay: 7 * 24 * 60 * 60 * 1000, function: sendEvidence7DayEmail, name: 'evidence_7day' },
      { delay: 14 * 24 * 60 * 60 * 1000, function: sendIntegrationThresholdEmail, name: 'integration_threshold' },
      { delay: 21 * 24 * 60 * 60 * 1000, function: sendCompoundEffectEmail, name: 'compound_effect' },
      { delay: 30 * 24 * 60 * 60 * 1000, function: sendDirectInvitationEmail, name: 'direct_invitation' }
    ]

    // Schedule each email
    for (const emailItem of emailSchedule) {
      const scheduledTime = new Date(Date.now() + emailItem.delay)
      
      // Store in database for cron job to process
      await supabase
        .from('email_queue')
        .insert({
          user_id: userId,
          session_id: sessionId,
          email: email,
          user_name: name,
          email_type: emailItem.name,
          scheduled_for: scheduledTime.toISOString(),
          status: 'pending'
        })
    }

    console.log('Email sequence created successfully')
    return true

  } catch (error) {
    console.error('Error creating email sequence:', error)
    throw error
  }
}

// Process pending emails (called by cron job)
// Note: On Hobby plan, this runs once daily at 9 AM UTC
// All pending emails for the day will be processed in this single run
export async function processEmailQueue() {
  try {
    console.log('Processing email queue...')
    
    // Get emails that are due
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())

    if (error) {
      console.error('Error fetching emails:', error)
      return { processed: 0, errors: 0 }
    }

    if (!emails || emails.length === 0) {
      console.log('No emails to process')
      return { processed: 0, errors: 0 }
    }

    let processed = 0
    let errors = 0

    for (const email of emails) {
      try {
        // Fetch planData for personalization (optional)
        let planData = null
        try {
          const { data: planOutput } = await supabase
            .from('plan_outputs')
            .select('plan_json')
            .eq('session_id', email.session_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          planData = planOutput?.plan_json
        } catch (planError) {
          console.warn(`No plan data found for session ${email.session_id}, sending generic email.`)
        }

        // Send the appropriate email
        switch (email.email_type) {
          case 'pattern_recognition':
            await sendPatternRecognitionEmail(email.email, email.user_name, planData)
            break
          case 'evidence_7day':
            await sendEvidence7DayEmail(email.email, email.user_name, planData)
            break
          case 'integration_threshold':
            await sendIntegrationThresholdEmail(email.email, email.user_name, planData)
            break
          case 'compound_effect':
            await sendCompoundEffectEmail(email.email, email.user_name, planData)
            break
          case 'direct_invitation':
            await sendDirectInvitationEmail(email.email, email.user_name, planData)
            break
          default:
            console.error('Unknown email type:', email.email_type)
            continue
        }

        // Mark as sent
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id)

        processed++
        console.log(`Email sent: ${email.email_type} to ${email.email}`)

      } catch (error) {
        console.error(`Failed to send email ${email.id}:`, error)
        
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed',
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id)

        errors++
      }
    }

    console.log(`Email queue processed: ${processed} sent, ${errors} failed`)
    return { processed, errors }

  } catch (error) {
    console.error('Error processing email queue:', error)
    throw error
  }
}
