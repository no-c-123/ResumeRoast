import { supabase } from './supabaseClient';

export async function getUserPlan(userId) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return { plan: 'free', status: 'free', subscription: null };
    }

    if (!data) {
      return { plan: 'free', status: 'free', subscription: null };
    }

    return {
      plan: data.plan || 'free',
      status: data.status || 'free',
      subscription: data
    };
  } catch (err) {
    console.error('Error in getUserPlan:', err);
    return { plan: 'free', status: 'free', subscription: null };
  }
}

export async function checkDownloadLimit(userId) {
  try {
    const { data, error } = await supabase.rpc('check_download_limit', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking download limit:', error);
      return {
        canDownload: false,
        downloadsUsed: 0,
        downloadsRemaining: 0,
        maxDownloads: 1,
        plan: 'free',
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        error: error.message
      };
    }

    return {
      canDownload: data.can_download,
      downloadsUsed: data.downloads_used,
      downloadsRemaining: data.downloads_remaining,
      maxDownloads: data.max_downloads,
      plan: data.plan,
      resetDate: data.reset_date
    };
  } catch (err) {
    console.error('Error in checkDownloadLimit:', err);
    return {
      canDownload: false,
      downloadsUsed: 0,
      downloadsRemaining: 0,
      maxDownloads: 1,
      plan: 'free',
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      error: err.message
    };
  }
}

export async function recordDownload(userId, resumeType = 'standard') {
  try {
    const { error } = await supabase
      .from('resume_downloads')
      .insert({
        user_id: userId,
        resume_type: resumeType,
        downloaded_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording download:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in recordDownload:', err);
    return { success: false, error: err.message };
  }
}

export async function isPremiumUser(userId) {
  const { plan } = await getUserPlan(userId);
  return ['pro', 'premium', 'lifetime'].includes(plan);
}

export async function isFreeUser(userId) {
  const { plan } = await getUserPlan(userId);
  return plan === 'free';
}

