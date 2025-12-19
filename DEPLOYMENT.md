# Deployment Guide

This guide covers everything you need to deploy ResumeRoast to production with Stripe payment integration.

## Prerequisites

- Stripe account (live mode activated)
- Supabase project
- Anthropic API key
- Domain name (optional but recommended)

## Architecture Overview

Your application consists of two parts:
1. **Frontend (Astro)**: Main application with SSR
2. **Stripe API Server (Express)**: Handles Stripe checkout sessions and webhooks

You can deploy these together or separately depending on your hosting provider.

## Environment Variables

### Frontend (Astro) Environment Variables

Set these in your hosting platform's environment variables:

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe API Server URL (where your Express server is hosted)
PUBLIC_STRIPE_API_URL=https://your-stripe-api.example.com
# For local dev, this defaults to http://localhost:4242
```

### Stripe API Server Environment Variables

Set these where you deploy your Express server (`server.js`):

```bash
# Stripe
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard > Webhooks

# Frontend URL (for redirects)
FRONTEND_URL=https://yourdomain.com

# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server Port (optional, defaults to 4242)
PORT=4242
```

## Deployment Options

### Option 1: Deploy Both Together (Recommended for Simplicity)

#### Using Railway/Render/Fly.io

1. **Deploy Astro Frontend:**
   - Build command: `npm run build`
   - Start command: `node ./dist/server/entry.mjs`
   - Set frontend environment variables

2. **Deploy Stripe Server:**
   - Start command: `npm run server`
   - Set Stripe server environment variables
   - Make sure `FRONTEND_URL` points to your frontend URL
   - Set `ALLOWED_ORIGINS` to include your frontend URL

3. **Update Frontend:**
   - Set `PUBLIC_STRIPE_API_URL` to your Stripe server URL

#### Using Vercel (Frontend) + Railway/Render (Stripe Server)

1. **Deploy Astro to Vercel:**
   - Install Vercel adapter: `npm install @astrojs/vercel`
   - Update `astro.config.mjs` to use `@astrojs/vercel` adapter
   - Deploy to Vercel
   - Set frontend environment variables in Vercel dashboard

2. **Deploy Stripe Server separately:**
   - Deploy `server.js` to Railway, Render, or Fly.io
   - Set Stripe server environment variables
   - Set `FRONTEND_URL` to your Vercel URL
   - Set `ALLOWED_ORIGINS` to your Vercel URL

3. **Update Frontend:**
   - Set `PUBLIC_STRIPE_API_URL` in Vercel environment variables

### Option 2: Integrate Stripe into Astro API Routes

Instead of a separate Express server, you can create Astro API routes for Stripe:

1. Create `/src/pages/api/stripe/create-checkout-session.js`
2. Create `/src/pages/api/stripe/create-portal-session.js`
3. Create `/src/pages/api/stripe/webhook.js`
4. Update `PaywallModal.jsx` to use `/api/stripe/...` endpoints

This eliminates the need for a separate server.

## Stripe Webhook Setup

1. **Go to Stripe Dashboard > Developers > Webhooks**
2. **Add endpoint:**
   - URL: `https://your-stripe-api.example.com/webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. **Copy the webhook signing secret** (starts with `whsec_`)
4. **Set it as `STRIPE_WEBHOOK_SECRET`** in your Stripe server environment variables

## Stripe Products & Prices Setup

### Lifetime Plan
- Create a one-time payment product in Stripe Dashboard
- Set the price ID in `PaywallModal.jsx` (line 27): `price_id: 'price_...'`
- Or use a lookup key: `lookup_key: 'Lifetime_plan-0d04ed9'`

### Pro Plan (Subscription)
- Create a recurring subscription product
- Set the lookup key in `PaywallModal.jsx` (line 10): `lookup_key: 'Pro_plan-0d04ed9'`

## Testing Before Going Live

1. **Test in Stripe Test Mode:**
   - Use test API keys (`sk_test_...`)
   - Test checkout flow
   - Test webhook events using Stripe CLI: `stripe listen --forward-to localhost:4242/webhook`

2. **Switch to Live Mode:**
   - Update `STRIPE_LIVE_SECRET_KEY` to live key (`sk_live_...`)
   - Update webhook endpoint to production URL
   - Test with a small real transaction

## Security Checklist

- [ ] All API keys are in environment variables (never in code)
- [ ] HTTPS is enabled for all endpoints
- [ ] CORS is properly configured with specific allowed origins
- [ ] Webhook signature verification is enabled
- [ ] Stripe webhook secret is set correctly
- [ ] No test keys in production
- [ ] Error messages don't expose sensitive information

## Post-Deployment

1. **Monitor Stripe Dashboard:**
   - Check for failed payments
   - Monitor webhook delivery
   - Review transaction logs

2. **Test Payment Flow:**
   - Make a test purchase
   - Verify redirect after payment
   - Check webhook events are received

3. **Set up Alerts:**
   - Stripe dashboard alerts for failed payments
   - Server monitoring for errors
   - Webhook delivery failures

## Troubleshooting

### "Connection Refused" Error
- Ensure Stripe server is running
- Check `PUBLIC_STRIPE_API_URL` is correct
- Verify CORS allows your frontend origin

### Webhook Not Receiving Events
- Verify webhook URL is accessible
- Check webhook secret is correct
- Ensure webhook endpoint is handling raw body (already configured)

### Payment Succeeds but User Not Redirected
- Check `FRONTEND_URL` is correct
- Verify success URL in checkout session
- Check browser console for errors

### CORS Errors
- Add your frontend URL to `ALLOWED_ORIGINS`
- Ensure no trailing slashes in URLs
- Check both HTTP and HTTPS if applicable

## Quick Reference

### Local Development
```bash
# Terminal 1: Astro frontend
npm run dev

# Terminal 2: Stripe server
npm run server
```

### Production Build
```bash
# Build Astro
npm run build

# Start Astro (if using Node adapter)
node ./dist/server/entry.mjs

# Start Stripe server
npm run server
```

## Support

For issues:
1. Check Stripe Dashboard logs
2. Check server logs
3. Verify all environment variables are set
4. Test webhook with Stripe CLI locally first

