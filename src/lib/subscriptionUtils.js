import { authService, dbService } from '../services/supabase';
import { logger } from './logger';

export async function getUserPlan(userId) {
  try {
    const data = await dbService.getSubscription(userId);

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
    const session = await authService.getSession();
    if (!session) throw new Error('No active session');

    const response = await fetch('/api/check-ai-limit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
    });

    if (!response.ok) {
        throw new Error('Failed to check AI limit');
    }

    return await response.json();
  } catch (err) {
    logger.error('Error in checkAiLimit:', err);
    return { canGenerate: false, error: err.message };
  }
}

export async function recordAiUsage(userId) {
    try {
        const session = await authService.getSession();
        if (!session) throw new Error('No active session');
    
        const response = await fetch('/api/record-ai-usage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({})
        });
    
        if (!response.ok) {
            throw new Error('Failed to record AI usage');
        }
    
        return await response.json();
      } catch (err) {
        logger.error('Error in recordAiUsage:', err);
        return { success: false, error: err.message };
      }
}

export async function checkDownloadLimit(userId) {
  try {
    const session = await authService.getSession();
    if (!session) {
        throw new Error('No active session');
    }

    const response = await fetch('/api/check-download-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({}) 
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check limit');
    }

    const data = await response.json();
    return data;

  } catch (err) {
    logger.error('Error in checkDownloadLimit:', err);
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
    const session = await authService.getSession();
    if (!session) {
        throw new Error('No active session');
    }

    const response = await fetch('/api/record-download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ resumeType })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record download');
    }

    return { success: true };

  } catch (err) {
    logger.error('Error in recordDownload:', err);
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
