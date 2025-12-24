import { stripe } from '../../lib/stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { logger } from '../../lib/logger';
import { createClient } from '@supabase/supabase-js';

export const POST = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch subscription data for this user to get Stripe Customer ID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
        logger.error('No stripe customer found for user:', user.id);
        return new Response(JSON.stringify({ error: 'No billing account found' }), { status: 404 });
    }

    const origin = new URL(request.url).origin;
    const YOUR_DOMAIN = import.meta.env.FRONTEND_URL || origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: YOUR_DOMAIN,
    });
    
    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    logger.error('Portal session error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
