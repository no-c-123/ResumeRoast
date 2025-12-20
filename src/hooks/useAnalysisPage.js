import { useState, useEffect } from 'react';
import { checkDownloadLimit, recordDownload, checkAiLimit } from '../lib/subscriptionUtils';
import { parseResumeTextToStructuredData } from '../lib/resumeParser';
import { logger } from '../lib/logger';
import { generateTailoredPdf } from '../utils/pdfGenerator';
import { authService, dbService } from '../services/supabase';

export function useAnalysisPage(analysisId) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [aiLimit, setAiLimit] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    
    // Tailoring state
    const [jobDescription, setJobDescription] = useState('');
    const [tailoring, setTailoring] = useState(false);
    const [tailoredResult, setTailoredResult] = useState(null);
    const [tailoredResume, setTailoredResume] = useState(null);
    const [downloadingTailored, setDownloadingTailored] = useState(false);

    // Improvement state
    const [improvedResume, setImprovedResume] = useState(null);
    const [improvementNotes, setImprovementNotes] = useState('');
    const [isImproving, setIsImproving] = useState(false);
    const [downloadingResume, setDownloadingResume] = useState(false);

    useEffect(() => {
        if (!analysisId) return;
        
        async function loadData() {
            setLoading(true);
            try {
                const session = await authService.getSession();
                if (!session) {
                    window.location.href = '/login';
                    return;
                }

                // Parallel fetching
                const [analysisData, profileData, subscriptionData, limitData] = await Promise.all([
                    dbService.getAnalysis(analysisId, session.user.id),
                    dbService.getProfile(session.user.id),
                    dbService.getSubscription(session.user.id),
                    checkAiLimit(session.user.id)
                ]);

                if (!analysisData) throw new Error('Analysis not found');
                
                setAnalysis(analysisData);
                setUserProfile(profileData);
                setIsPremium(!!subscriptionData);
                setAiLimit(limitData);

            } catch (err) {
                logger.error('Error loading analysis page data:', err);
                setError('Failed to load analysis');
            } finally {
                setLoading(false);
            }
        }
        
        loadData();
    }, [analysisId]);

    const handleImproveWithAI = async () => {
        setIsImproving(true);
        try {
            const session = await authService.getSession();
            if (!session) {
                alert('Please log in to use AI improvement');
                return;
            }

            const parsedData = parseResumeTextToStructuredData(analysis.analysis_text);
            const structuredData = {
                profile: {
                    full_name: userProfile?.full_name || parsedData.profile.full_name || '',
                    email: userProfile?.email || parsedData.profile.email || '',
                    phone: userProfile?.phone || parsedData.profile.phone || '',
                    location: userProfile?.location || parsedData.profile.location || '',
                    linkedin: userProfile?.linkedin || parsedData.profile.linkedin || '',
                    professional_summary: userProfile?.professional_summary || parsedData.profile.professional_summary || '',
                    skills: userProfile?.skills || parsedData.profile.skills || '',
                    volunteering: userProfile?.volunteering || parsedData.profile.volunteering || ''
                },
                work_experience: (userProfile?.work_experience?.length > 0) ? userProfile.work_experience : parsedData.work_experience,
                education: (userProfile?.education?.length > 0) ? userProfile.education : parsedData.education,
                projects: (userProfile?.projects?.length > 0) ? userProfile.projects : parsedData.projects
            };

            const response = await fetch('/api/improve-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    resumeText: analysis.analysis_text,
                    resumeData: structuredData,
                    analysisId: analysis.id
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to improve resume');

            setImprovedResume(result.improved_resume);
            
            if (!isPremium && aiLimit) {
                setAiLimit(prev => ({ ...prev, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
            }
            
            if (result.changes_made) {
                setImprovementNotes(Array.isArray(result.changes_made) ? result.changes_made.join('\n') : result.changes_made);
            } else {
                setImprovementNotes('Resume improved successfully!');
            }
        } catch (err) {
            logger.error('Error improving resume:', err);
            alert('Error improving resume: ' + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    const handleDownloadResume = () => {
        if (!improvedResume) return;
        localStorage.setItem('improvedResumeData', JSON.stringify(improvedResume));
        localStorage.setItem('improvementNotes', JSON.stringify(improvementNotes.split('\n')));
        window.location.href = '/resume-builder?improved=true';
    };

    const handleTailorResume = async () => {
        if (!isPremium) {
            window.location.href = '/pricing';
            return;
        }
        if (!jobDescription.trim()) {
            alert('Please enter a job description to tailor your resume.');
            return;
        }

        setTailoring(true);
        setTailoredResult(null);
        setTailoredResume(null);

        try {
            const session = await authService.getSession();
            const formData = new FormData();
            formData.append('resumeText', analysis.analysis_text);
            formData.append('jobDescription', jobDescription);
            formData.append('originalSuggestions', JSON.stringify(analysis.suggestions));

            const response = await fetch('/api/tailor-resume', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to tailor resume');
            }

            const result = await response.json();
            const tailoredData = result.tailored_resume;
            
            setTailoredResume(tailoredData);
            setTailoredResult({
                matchScore: result.match_score,
                keyChanges: result.key_changes,
                keywordsAdded: result.keywords_added
            });

            // Store for backup/redirect
            localStorage.setItem('tailoredResumeData', JSON.stringify(tailoredData));
            localStorage.setItem('tailorResult', JSON.stringify({
                matchScore: result.match_score,
                keyChanges: result.key_changes,
                keywordsAdded: result.keywords_added
            }));
            
        } catch (err) {
            logger.error('Error tailoring resume:', err);
            alert('Error tailoring resume: ' + err.message);
        } finally {
            setTailoring(false);
        }
    };

    const handleDownloadTailoredResume = async () => {
        if (!tailoredResume) return;
        setDownloadingTailored(true);
        
        try {
            const session = await authService.getSession();
            if (!session) {
                alert('Please log in to download your resume');
                return;
            }

            const limitCheck = await checkDownloadLimit(session.user.id);
            if (!limitCheck.canDownload) {
                const resetDate = new Date(limitCheck.resetDate).toLocaleDateString();
                const message = limitCheck.plan === 'free' 
                    ? `You've reached your monthly download limit (${limitCheck.maxDownloads} download${limitCheck.maxDownloads > 1 ? 's' : ''} per month).\n\nUpgrade to Pro or Lifetime for unlimited downloads.\n\nYour limit resets on ${resetDate}.`
                    : `You've reached your download limit. Your limit resets on ${resetDate}.`;
                
                if (confirm(message + '\n\nWould you like to upgrade your plan?')) {
                    window.location.href = '/payment?plan=pro';
                }
                return;
            }

            await recordDownload(session.user.id, 'tailored');
            await generateTailoredPdf(tailoredResume);
            
        } catch (err) {
            logger.error('Error downloading tailored resume:', err);
            alert('Error downloading tailored resume. Please try again.');
        } finally {
            setDownloadingTailored(false);
        }
    };

    return {
        analysis, loading, error, isPremium, aiLimit,
        showUpgradeModal, setShowUpgradeModal, upgradeFeatureName, setUpgradeFeatureName,
        jobDescription, setJobDescription,
        tailoring, tailoredResult, tailoredResume, downloadingTailored,
        improvedResume, improvementNotes, isImproving, downloadingResume,
        handleImproveWithAI, handleDownloadResume,
        handleTailorResume, handleDownloadTailoredResume
    };
}
