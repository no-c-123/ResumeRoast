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

export async function checkAiLimit(userId) {
  try {
    // For now, we will simulate the check using resume_downloads table or just assume 1 free request per month
    // Ideally we should have a 'ai_generations' table. 
    // Since we can't easily create a table, we'll use a hack or assume we can create it.
    // Given the constraints, let's use `resume_downloads` with a special type 'ai_generation' to track it.
    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

    const { plan } = await getUserPlan(userId);
    
    if (['pro', 'premium', 'lifetime'].includes(plan)) {
        return {
            canGenerate: true,
            generationsUsed: 0,
            generationsRemaining: 9999,
            maxGenerations: 9999,
            plan,
            resetDate: nextMonth
        };
    }

    //check usage for free users
    const { count, error } = await supabase
        .from('resume_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('resume_type', 'ai_generation')
        .gte('downloaded_at', startOfMonth)
        .lt('downloaded_at', nextMonth);

    if (error) {
        console.error('Error checking AI limit:', error);
        // Fail safe: if network error, allow generation (optional, or block)
        // For now, return false but log it.
        return { 
            canGenerate: false, 
            error: error.message,
            generationsRemaining: 0,
            maxGenerations: 5 
        };
    }

    const maxGenerations = 5; // Free limit
    const generationsUsed = count || 0;
    
    return {
        canGenerate: generationsUsed < maxGenerations,
        generationsUsed,
        generationsRemaining: Math.max(0, maxGenerations - generationsUsed),
        maxGenerations,
        plan: 'free',
        resetDate: nextMonth
    };

  } catch (err) {
    console.error('Error in checkAiLimit:', err);
    return { canGenerate: false, error: err.message };
  }
}

export async function recordAiUsage(userId) {
    return recordDownload(userId, 'ai_generation');
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

