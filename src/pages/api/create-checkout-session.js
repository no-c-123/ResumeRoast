import { stripe } from '../../lib/stripe';

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    let priceId = body.price_id;
    let mode = body.mode || 'subscription';
    const userId = body.user_id;
    
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
    if (!priceId && body.lookup_key) {
      const prices = await stripe.prices.list({
        lookup_keys: [body.lookup_key],
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
    console.error('Stripe checkout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), { status: 500 });
  }
}
