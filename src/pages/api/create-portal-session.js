import { stripe } from '../../lib/stripe';

export const POST = async ({ request }) => {
  try {
    const { session_id } = await request.json();
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    
    const origin = new URL(request.url).origin;
    const YOUR_DOMAIN = import.meta.env.FRONTEND_URL || origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer,
      return_url: YOUR_DOMAIN,
    });
    
    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Portal session error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), { status: 500 });
  }
}
