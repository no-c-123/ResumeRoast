import { stripe } from '../../lib/stripe';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export const POST = async ({ request }) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || import.meta.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  
  let event;
  const body = await request.text();

  if (endpointSecret) {
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    // Fallback for development without signature verification (NOT RECOMMENDED for production)
    // But constructEvent is strict if secret is provided.
    // If no secret, we might parse body directly, but usually we want secret.
    // For now assuming secret is present or we try JSON parse if not (but Stripe usually requires verification).
    try {
       event = JSON.parse(body);
    } catch (e) {
       return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
       });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error handling webhook:', err);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), { status: 500 });
  }
};

async function handleCheckoutCompleted(session) {
  try {
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const userId = session.metadata?.user_id;
    
    let user = null;

    if (userId) {
      const { data: { user: authUser }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!error && authUser) {
        user = authUser;
      }
    }

    if (!user) {
      const customer = await stripe.customers.retrieve(customerId);
      const email = customer.email;

      if (email) {
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (!userError && users) {
          user = users.find(u => u.email === email);
        }
      }
    }

    if (!user) {
      console.error('User not found for checkout session:', session.id);
      return;
    }

    let plan = 'free';
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (session.mode === 'payment') {
        plan = 'lifetime';
      } else {
        const price = subscription.items.data[0]?.price;
        if (price?.lookup_key?.includes('Pro') || price?.lookup_key?.includes('pro')) {
          plan = 'pro';
        } else {
          plan = 'pro';
        }
      }
    }

    const subscriptionData = {
      user_id: user.id,
      status: subscriptionId ? 'active' : 'completed',
      plan: plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId || null,
      current_period_start: subscriptionId ? new Date().toISOString() : null,
      current_period_end: subscriptionId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('user_id', user.id);
    } else {
      subscriptionData.created_at = new Date().toISOString();
      await supabaseAdmin
        .from('user_subscriptions')
        .insert(subscriptionData);
    }

    console.log(`Subscription created/updated for user ${user.id}: ${plan}`);
  } catch (err) {
    console.error('Error in handleCheckoutCompleted:', err);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata?.user_id;
    
    let user = null;

    if (userId) {
      const { data: { user: authUser }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!error && authUser) {
        user = authUser;
      }
    }

    if (!user && customer.email) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      if (users) {
        user = users.find(u => u.email === customer.email);
      }
    }

    if (!user) {
      console.error('User not found for subscription update');
      return;
    }

    const price = subscription.items.data[0]?.price;
    let plan = 'pro';
    if (price?.lookup_key?.includes('Pro') || price?.lookup_key?.includes('pro')) {
      plan = 'pro';
    }

    const subscriptionData = {
      status: subscription.status,
      plan: plan,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('user_subscriptions')
      .update(subscriptionData)
      .eq('user_id', user.id);

    console.log(`Subscription updated for user ${user.id}`);
  } catch (err) {
    console.error('Error in handleSubscriptionUpdate:', err);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (!user) return;

    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    console.log(`Subscription canceled for user ${user.id}`);
  } catch (err) {
    console.error('Error in handleSubscriptionDeleted:', err);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdate(subscription);
  } catch (err) {
    console.error('Error in handlePaymentSucceeded:', err);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (!user) return;

    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    console.log(`Payment failed for user ${user.id}`);
  } catch (err) {
    console.error('Error in handlePaymentFailed:', err);
  }
}
