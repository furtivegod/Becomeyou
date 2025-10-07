# Deployment Requirements

## Vercel Plan Requirements

### Current Setup (Hobby Plan Compatible)
- **Cron Schedule**: Once daily at 9 AM UTC (`0 9 * * *`)
- **Max Duration**: 60 seconds
- **Email Processing**: All pending emails processed in single daily run

### Hobby Plan Limitations
- ✅ **2 cron jobs per account** (we use 1)
- ✅ **Once per day scheduling** (our schedule: daily at 9 AM)
- ⚠️ **Unreliable timing** (can be up to 1 hour late)
- ⚠️ **No guaranteed execution time**

### Email Sequence Timing
With daily processing, email sequences will be sent as follows:

| Email | Original Timing | Hobby Plan Timing |
|-------|----------------|-------------------|
| Email 1 | Immediate | Immediate (after assessment) |
| Email 2 | 48 hours | Next day at 9 AM UTC |
| Email 3 | 7 days | 7 days later at 9 AM UTC |
| Email 4 | 14 days | 14 days later at 9 AM UTC |
| Email 5 | 21 days | 21 days later at 9 AM UTC |
| Email 6 | 30 days | 30 days later at 9 AM UTC |

### Upgrading to Pro Plan (Optional)
If you need more precise timing:
- **Pro Plan**: Unlimited cron invocations
- **Precise timing**: Exact execution times
- **Multiple schedules**: Can run every 6 hours if needed

### Current Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/email-queue",
      "schedule": "0 9 * * *"
    }
  ],
  "functions": {
    "src/app/api/cron/email-queue/route.ts": {
      "maxDuration": 60
    }
  }
}
```

## Environment Variables Required
- `RESEND_API_KEY` - For sending emails
- `PDFSHIFT_API_KEY` - For PDF generation
- `SUPABASE_URL` - Database connection
- `SUPABASE_ANON_KEY` - Database access
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access
- `NEXT_PUBLIC_APP_URL` - App URL for email links

## Database Requirements
- `email_queue` table must exist
- Proper RLS policies configured
- All email sequence functions working
