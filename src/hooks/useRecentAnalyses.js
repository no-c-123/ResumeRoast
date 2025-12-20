import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/supabase';
import { logger } from '../lib/logger';

export function useRecentAnalyses(user) {
    const [analyses, setAnalyses] = useState([]);
    const [stats, setStats] = useState({ total: 0, avgScore: 0, lastAnalysis: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalyses = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Parallel fetching
            const [data, count] = await Promise.all([
                dbService.getRecentAnalyses(user.id, 5),
                dbService.getAnalysesCount(user.id)
            ]);

            setAnalyses(data);

            // Calculate stats
            if (data && data.length > 0) {
                const total = count !== null ? count : data.length;
                const avgScore = Math.round(data.reduce((sum, analysis) => sum + (analysis.ats_score || 0), 0) / data.length);
                const lastAnalysis = data[0].created_at;
                setStats({ total, avgScore, lastAnalysis });
            } else {
                setStats({ total: 0, avgScore: 0, lastAnalysis: null });
            }

        } catch (err) {
            logger.error('Error fetching analyses:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);

    return { analyses, stats, loading, error, refetch: fetchAnalyses };
}
