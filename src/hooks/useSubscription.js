import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/supabase';
import { logger } from '../lib/logger';

export function useSubscription(user) {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await dbService.getSubscription(user.id);
            setSubscription(data);
        } catch (err) {
            logger.error('Error fetching subscription:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    return { subscription, loading, error, refetch: fetchSubscription };
}
