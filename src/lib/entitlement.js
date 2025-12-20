import { supabaseAdmin } from './supabaseAdmin';

export async function checkSubscription(userId) {
  if (!userId) return false;

  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('status, plan, current_period_end')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) return false;

    // Check if subscription is active or lifetime
    const isValid = 
      subscription.status === 'active' || 
      subscription.status === 'completed' || // Often used for lifetime one-time payments
      subscription.plan === 'lifetime' ||
      (subscription.status === 'canceled' && new Date(subscription.current_period_end) > new Date());

    return isValid;
  } catch (err) {
    console.error('Error checking subscription:', err);
    return false;
  }
}
