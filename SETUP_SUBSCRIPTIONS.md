# Subscription & Download Limits Setup Guide

This guide explains how to set up the free plan with download limits and user roles.

## Database Setup

### 1. Run the SQL Migration

Execute the SQL migration file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-migrations.sql`
4. Execute the query

This will create:
- `resume_downloads` table to track downloads
- Database functions: `get_user_plan()` and `check_download_limit()`
- Proper indexes and RLS policies

### 2. Environment Variables

Add these to your Stripe server (server.js) environment:

```bash
# Supabase (for webhook handler)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for admin operations

# Or use PUBLIC variables if service role not available
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

**Note:** The webhook handler needs admin access to look up users. Use the service role key for production.

## User Plans & Roles

### Plan Types

1. **Free Plan** (`free`)
   - 1 resume download per month
   - Basic resume analysis
   - Limited features

2. **Pro Plan** (`pro`)
   - Unlimited downloads
   - All premium features
   - Monthly subscription

3. **Lifetime Plan** (`lifetime`)
   - Unlimited downloads
   - All premium features
   - One-time payment

### Default Plan Assignment

- New users automatically get `free` plan
- No subscription record = free user
- Subscription record with `status = 'active'` or `'trialing'` = paid user

## How Download Limits Work

### Free Users
- Limited to **1 download per month**
- Counter resets on the 1st of each month
- When limit is reached, user sees upgrade prompt

### Paid Users (Pro/Lifetime)
- **Unlimited downloads**
- No monthly restrictions

### Download Tracking

Downloads are tracked in the `resume_downloads` table:
- Each download is recorded with timestamp
- Monthly count is calculated per user
- Limit check happens before PDF generation

## Webhook Handler

The webhook handler (`server.js`) automatically:
1. Creates subscription records when payment succeeds
2. Updates subscription status on changes
3. Sets plan type based on Stripe product
4. Handles subscription cancellations

### Webhook Events Handled

- `checkout.session.completed` - Creates/updates subscription
- `customer.subscription.created` - Sets up new subscription
- `customer.subscription.updated` - Updates subscription details
- `customer.subscription.deleted` - Marks subscription as canceled
- `invoice.payment_succeeded` - Confirms active subscription
- `invoice.payment_failed` - Marks subscription as past_due

## Testing

### Test Free Plan Limits

1. Create a test user (or use existing)
2. Ensure no subscription record exists (free user)
3. Try to download a resume - should work first time
4. Try to download again - should show limit message
5. Verify upgrade prompt appears

### Test Paid Plan

1. Complete a Stripe checkout (test mode)
2. Check `user_subscriptions` table - should have record
3. Try multiple downloads - should all work
4. Verify unlimited access

### Manual Subscription Creation (for testing)

```sql
-- Create a free user (no subscription)
-- Just ensure no record in user_subscriptions

-- Create a pro user
INSERT INTO user_subscriptions (
  user_id,
  status,
  plan,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'user-uuid-here',
  'active',
  'pro',
  NOW(),
  NOW() + INTERVAL '30 days',
  false
);

-- Create a lifetime user
INSERT INTO user_subscriptions (
  user_id,
  status,
  plan,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'user-uuid-here',
  'active',
  'lifetime',
  NOW(),
  NOW() + INTERVAL '100 years',
  false
);
```

## Utility Functions

### Frontend Usage

```javascript
import { 
  getUserPlan, 
  checkDownloadLimit, 
  recordDownload,
  isPremiumUser,
  isFreeUser 
} from '../lib/subscriptionUtils';

// Check if user can download
const limit = await checkDownloadLimit(userId);
if (!limit.canDownload) {
  // Show upgrade prompt
}

// Record a download
await recordDownload(userId, 'standard'); // or 'improved', 'tailored'

// Check user plan
const { plan } = await getUserPlan(userId);
```

### Database Functions

```sql
-- Get user's plan
SELECT get_user_plan('user-uuid-here');
-- Returns: 'free', 'pro', 'premium', or 'lifetime'

-- Check download limit
SELECT check_download_limit('user-uuid-here');
-- Returns JSON with can_download, downloads_used, etc.
```

## Troubleshooting

### "User not found" in webhook
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Check that user_id is being passed in checkout session metadata
- Verify user exists in Supabase Auth

### Downloads not being tracked
- Check `resume_downloads` table has RLS policies enabled
- Verify user is authenticated when downloading
- Check browser console for errors

### Limit not working
- Verify database functions are created
- Check RLS policies allow user to insert downloads
- Ensure `checkDownloadLimit` is called before download

### Subscription not created after payment
- Check webhook is receiving events
- Verify webhook secret is correct
- Check server logs for errors
- Ensure Stripe customer email matches Supabase user email

## Security Notes

- RLS policies ensure users can only see their own downloads
- Service role key should be kept secret (server-side only)
- Download limits are enforced server-side via database functions
- Webhook signature verification prevents unauthorized requests

