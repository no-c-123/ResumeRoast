import { supabaseAdmin } from '../supabaseAdmin';
import { logger } from '../logger';

export async function getUserPlan(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      logger.error('Error fetching subscription:', error);
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
    logger.error('Error in getUserPlan:', err);
    return { plan: 'free', status: 'free', subscription: null };
  }
}

export async function checkAiLimit(userId) {
  try {
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
    const { count, error } = await supabaseAdmin
        .from('resume_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('resume_type', 'ai_generation')
        .gte('downloaded_at', startOfMonth)
        .lt('downloaded_at', nextMonth);

    if (error) {
        logger.error('Error checking AI limit:', error);
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
    logger.error('Error in checkAiLimit:', err);
    return { canGenerate: false, error: err.message };
  }
}

export async function recordAiUsage(userId) {
    return recordDownload(userId, 'ai_generation');
}

export async function checkDownloadLimit(userId) {
    // Server-side implementation of checkDownloadLimit
    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

        const { plan } = await getUserPlan(userId);

        if (['pro', 'premium', 'lifetime'].includes(plan)) {
             return {
                canDownload: true,
                downloadsUsed: 0,
                downloadsRemaining: 9999,
                maxDownloads: 9999,
                plan,
                resetDate: nextMonth
            };
        }

        const { count, error } = await supabaseAdmin
            .from('resume_downloads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('resume_type', 'ai_generation') // Exclude AI generations from download limit
            .gte('downloaded_at', startOfMonth)
            .lt('downloaded_at', nextMonth);
        
        if (error) throw error;

        const maxDownloads = 1; // Free limit
        const downloadsUsed = count || 0;

        return {
            canDownload: downloadsUsed < maxDownloads,
            downloadsUsed,
            downloadsRemaining: Math.max(0, maxDownloads - downloadsUsed),
            maxDownloads,
            plan: 'free',
            resetDate: nextMonth
        };

    } catch (err) {
        logger.error('Error in server checkDownloadLimit:', err);
        throw err;
    }
}

export async function recordDownload(userId, resumeType = 'standard') {
  try {
    const { error } = await supabaseAdmin
        .from('resume_downloads')
        .insert({
            user_id: userId,
            resume_type: resumeType,
            downloaded_at: new Date().toISOString()
        });

    if (error) throw error;
    return { success: true };

  } catch (err) {
    logger.error('Error in recordDownload:', err);
    return { success: false, error: err.message };
  }
}
