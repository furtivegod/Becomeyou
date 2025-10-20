import { supabase } from '@/lib/supabase'
import { 
  sendPatternRecognitionEmail,
  sendEvidence7DayEmail,
  sendIntegrationThresholdEmail,
  sendCompoundEffectEmail,
  sendDirectInvitationEmail
} from './email'

/**
 * Email Queue Management System
 * 
 * This module handles the creation and processing of automated email sequences
 * for users who complete the You 3.0 assessment. It schedules follow-up emails
 * and processes them via Vercel cron jobs.
 */

// Create email sequence for a user
export async function createEmailSequence(userId: string, sessionId: string, userEmail: string, userName: string) {
  try {
    console.log('Creating email sequence for user:', userId)
    
    const email = userEmail
    const name = userName || email.split('@')[0]

    // Schedule emails with proper day-based delays (in milliseconds)
    const emailSchedule = [
      { delay: 3 * 24 * 60 * 60 * 1000, function: sendPatternRecognitionEmail, name: 'pattern_recognition' }, // 3 days
      { delay: 7 * 24 * 60 * 60 * 1000, function: sendEvidence7DayEmail, name: 'evidence_7day' }, // 7 days  
      { delay: 14 * 24 * 60 * 60 * 1000, function: sendIntegrationThresholdEmail, name: 'integration_threshold' }, // 14 days
      { delay: 21 * 24 * 60 * 60 * 1000, function: sendCompoundEffectEmail, name: 'compound_effect' }, // 21 days
      { delay: 30 * 24 * 60 * 60 * 1000, function: sendDirectInvitationEmail, name: 'direct_invitation' } // 30 days
    ]

    // Schedule each email
    for (const emailItem of emailSchedule) {
      const scheduledTime = new Date(Date.now() + emailItem.delay)
      
      // Store in database for cron job to process
      const { error: insertError } = await supabase
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

      if (insertError) {
        console.error(`Failed to schedule email ${emailItem.name}:`, insertError)
        throw new Error(`Failed to schedule email ${emailItem.name}: ${insertError.message}`)
      }
    }

    console.log('Email sequence created successfully')
    return true

  } catch (error) {
    console.error('Error creating email sequence:', error)
    throw error
  }
}

// Process pending emails (called by cron job)
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
        // Fetch planData for personalization
        const { data: planOutput, error: planError } = await supabase
          .from('plan_outputs')
          .select('plan_json')
          .eq('session_id', email.session_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (planError || !planOutput) {
          console.warn(`No plan data found for session ${email.session_id}, sending generic email.`)
        }

        // Send the appropriate email
        switch (email.email_type) {
          case 'pattern_recognition':
            await sendPatternRecognitionEmail(email.email, email.user_name, planOutput?.plan_json)
            break
          case 'evidence_7day':
            await sendEvidence7DayEmail(email.email, email.user_name, planOutput?.plan_json)
            break
          case 'integration_threshold':
            await sendIntegrationThresholdEmail(email.email, email.user_name, planOutput?.plan_json)
            break
          case 'compound_effect':
            await sendCompoundEffectEmail(email.email, email.user_name, planOutput?.plan_json)
            break
          case 'direct_invitation':
            await sendDirectInvitationEmail(email.email, email.user_name, planOutput?.plan_json)
            break
          default:
            console.warn(`Unknown email type in queue: ${email.email_type}`)
            errors++
            continue
        }

        // Mark as sent
        const { error: updateError } = await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id)

        if (updateError) {
          console.error(`Failed to update email status for ${email.id}:`, updateError)
        }

        processed++
        console.log(`Email sent successfully: ${email.email_type} to ${email.email}`)

      } catch (error) {
        console.error(`Failed to send email ${email.id} (${email.email_type}):`, error)
        
        // Mark as failed with error details
        const { error: failUpdateError } = await supabase
          .from('email_queue')
          .update({ 
            status: 'failed',
            sent_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', email.id)

        if (failUpdateError) {
          console.error(`Failed to update failed email status for ${email.id}:`, failUpdateError)
        }

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
