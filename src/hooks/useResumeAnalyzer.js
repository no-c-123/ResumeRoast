import { useState } from 'react';
import { authService } from '../services/supabase';
import { logger } from '../lib/logger';

export function useResumeAnalyzer() {
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const analyzeResume = async (file, userId) => {
        if (!file || !userId) return null;

        setAnalyzing(true);
        setError(null);

        try {
            const session = await authService.getSession();
            if (!session) throw new Error('No active session');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);

            const response = await fetch('/api/analyze-resume', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Analysis failed');
            }

            return result.analysis;
        } catch (err) {
            logger.error('Analysis error:', err);
            setError(err.message);
            throw err;
        } finally {
            setAnalyzing(false);
        }
    };

    return { analyzeResume, analyzing, error };
}
