import { stripe } from '../../lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../lib/logger';
import { SERVER_PLANS } from '../../config/plans';
import { CheckoutSchema } from '../../lib/schemas';

export const POST = async ({ request }) => {
  try {
    const rawBody = await request.json();
    const result = CheckoutSchema.safeParse(rawBody);

    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: result.error.format() }), { status: 400 });
    }

    const body = result.data;
    const planKey = body.planKey; 
    
    // Look up price_id or lookup_key from server config
    let priceId = null;
    let lookupKey = null;
    let mode = body.mode || 'subscription';

    if (planKey && SERVER_PLANS[planKey]) {
        const planConfig = SERVER_PLANS[planKey];
        priceId = planConfig.price_id;
        lookupKey = planConfig.lookup_key;
        
        // Auto-detect mode if not provided, based on plan key
        if (!body.mode) {
            mode = planKey === 'lifetime' ? 'payment' : 'subscription';
        }
    } else {
        // Fallback for legacy calls (if any)
        priceId = body.price_id;
        lookupKey = body.lookup_key;
    }

    const userId = body.user_id;

    // Verify user if userId is provided
    if (userId) {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
             return new Response(JSON.stringify({ error: 'Authentication required' }), { 
                 status: 401,
                 headers: { 'Content-Type': 'application/json' }
             });
        }
        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL, 
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user || user.id !== userId) {
             return new Response(JSON.stringify({ error: 'Unauthorized request' }), { 
                 status: 403,
                 headers: { 'Content-Type': 'application/json' }
             });
        }
    }
    
    const origin = new URL(request.url).origin;
    const YOUR_DOMAIN = import.meta.env.FRONTEND_URL || origin;

    let sessionParams = {
      billing_address_collection: 'auto',
      line_items: [
        {
          price: '',
          quantity: 1,
        },
      ],
      mode,
      success_url: `${YOUR_DOMAIN}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/payment?canceled=true`,
      automatic_tax: { enabled: true },
    };

    if (userId) {
      sessionParams.metadata = {
        user_id: userId
      };
    }
    if (mode === 'subscription') {
      sessionParams.subscription_data = { trial_period_days: 7 };
    }
    if (!priceId && lookupKey) {
      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        expand: ['data.product'],
      });
      if (!prices.data.length) {
        return new Response(JSON.stringify({ error: 'No Stripe price found for the provided lookup_key.' }), { status: 400 });
      }
      priceId = prices.data[0].id;
    }
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'No price_id or valid lookup_key provided.' }), { status: 400 });
    }
    sessionParams.line_items[0].price = priceId;
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    logger.error('Stripe checkout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), { status: 500 });
  }
}
