import { useState, useCallback } from 'react';
import { authService, dbService } from '../services/supabase';
import { logger } from '../lib/logger';

export function useResumeAnalysis(initialAnalysisId, user) {
    const [phase, setPhase] = useState(initialAnalysisId ? 3 : 1);
    const [file, setFile] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState("Reading your resume...");
    const [analysisData, setAnalysisData] = useState(null);
    const [resumeText, setResumeText] = useState('');
    const [fixing, setFixing] = useState(null);
    const [fixedData, setFixedData] = useState(null);
    const [changesMade, setChangesMade] = useState([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(null);

    const messages = [
        "Reading your resume...",
        "Analyzing keywords...",
        "Checking ATS compatibility...",
        "Generating score..."
    ];

    // Transform API response to Dashboard structure
    const processAnalysisData = useCallback((data) => {
        if (!data) return null;
        const suggestions = data.suggestions || {};
        const checklist = suggestions.checklist_results || {};
        
        // Categorize issues
        const critical = suggestions.critical_issues?.map(issue => ({
            type: 'critical',
            title: issue,
            description: "This is a critical issue identified by our AI.",
            fix: "Review the section mentioned and apply best practices.",
            impact: "+15 points",
            time: "10 mins"
        })) || [];

        // Map checklist failures to warnings/critical
        const warnings = [];
        const wins = [];

        Object.values(checklist).flat().forEach(item => {
            if (item.status === 'FAIL') {
                warnings.push({
                    type: 'warning',
                    title: item.item,
                    description: item.feedback,
                    fix: "Follow the suggestion to improve this area.",
                    impact: "+5 points",
                    time: "5 mins"
                });
            } else if (item.status === 'PASS') {
                wins.push({
                    type: 'win',
                    title: item.item,
                    description: item.feedback,
                    impact: "Maintained",
                    time: "0 mins"
                });
            }
        });

        // Opportunities from action items
        const opportunities = suggestions.action_items?.map(item => ({
            type: 'opportunity',
            title: item.task,
            description: "Growth opportunity to stand out.",
            fix: "Implement this action item.",
            impact: "+10 points",
            time: "15 mins"
        })) || [];

        return {
            score: suggestions.ats_score || 0,
            summary: suggestions.overall_assessment,
            critical,
            warnings,
            wins,
            opportunities,
            stats: {
                words: data.stats?.word_count || suggestions.stats?.word_count || "500+", 
                bullets: data.stats?.bullet_count || suggestions.stats?.bullet_count || "20+",
                issues: critical.length + warnings.length
            }
        };
    }, []);

    const fetchAnalysis = useCallback(async (id) => {
        if (!user) return;
        try {
            const data = await dbService.getAnalysis(id, user.id);
            if (data) {
                setAnalysisData(processAnalysisData(data));
                setResumeText(data.resume_text || data.analysis_text || ''); // Fallback
                setPhase(3);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    }, [user, processAnalysisData]);

    const startAnalysis = async (resumeFile) => {
        setPhase(2);
        setFile(resumeFile);
        setError(null);

        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            setLoadingMessage(messages[msgIndex]);
            msgIndex = (msgIndex + 1) % messages.length;
        }, 2000);

        try {
            const session = await authService.getSession();
            if (!session) {
                throw new Error("Please log in to analyze your resume");
            }

            const formData = new FormData();
            formData.append('file', resumeFile);
            formData.append('userId', session.user.id);
            formData.append('careerLevel', 'professional');

            const response = await fetch('/api/analyze-resume', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData
            });

            const result = await response.json();
            
            clearInterval(msgInterval);

            if (!response.ok) throw new Error(result.error || 'Analysis failed');

            const processed = processAnalysisData(result.analysis);
            setAnalysisData(processed);
            if (result.resumeText) {
                setResumeText(result.resumeText);
            }
            
            setTimeout(() => setPhase(3), 1000);

        } catch (error) {
            clearInterval(msgInterval);
            logger.error(error);
            setError(error.message);
            setPhase(1);
            alert("Analysis failed: " + error.message);
        }
    };

    const handleApplyFix = async (fixType, instructions, options = {}) => {
        if (!user) return;
        setFixing(fixType);
        try {
            const session = await authService.getSession();
            
            const response = await fetch('/api/improve-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    resumeData: fixedData, 
                    resumeText: resumeText,
                    customInstructions: instructions,
                    targetLanguage: options.targetLanguage || 'English'
                })
            });

            const data = await response.json();
            
            if (data.success && data.improved_resume) {
                setFixedData(data.improved_resume);
                setChangesMade(data.changes_made || []);
                return data;
            } else {
                throw new Error(data.error || 'Failed to apply fix');
            }

        } catch (error) {
            console.error('Error applying fix:', error);
            throw error;
        } finally {
            setFixing(null);
        }
    };

    return {
        phase, setPhase,
        file,
        loadingMessage,
        analysisData,
        resumeText,
        fixing,
        fixedData,
        changesMade,
        isDownloading, setIsDownloading,
        error,
        startAnalysis,
        handleApplyFix,
        fetchAnalysis
    };
}
