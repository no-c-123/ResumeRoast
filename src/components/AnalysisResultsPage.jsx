import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { jsPDF } from 'jspdf';
import { checkDownloadLimit, recordDownload, checkAiLimit } from '../lib/subscriptionUtils';
import { parseResumeTextToStructuredData } from '../lib/resumeParser';
import { logger } from '../lib/logger';
import UpgradeModal from './UpgradeModal';

function AnalysisResultsPage({ analysisId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [activeTab, setActiveTab] = useState('analysis');
    const [isPremium, setIsPremium] = useState(false);
    const [aiLimit, setAiLimit] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [tailoring, setTailoring] = useState(false);
    const [tailoredResult, setTailoredResult] = useState(null);
    const [tailoredResume, setTailoredResume] = useState(null);
    const [downloadingResume, setDownloadingResume] = useState(false);
    const [downloadingTailored, setDownloadingTailored] = useState(false);
    const [improvedResume, setImprovedResume] = useState(null);
    const [improvementNotes, setImprovementNotes] = useState('');
    const [isImproving, setIsImproving] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        fetchAnalysis();
        checkPremiumStatus();
        fetchUserProfile();
    }, [analysisId]);

    useEffect(() => {
        if (analysisId) {
            fetchAiLimit();
        }
    }, [analysisId, isPremium]); // Re-fetch limit when premium status changes or analysisId changes

    const fetchAiLimit = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const limit = await checkAiLimit(session.user.id);
                setAiLimit(limit);
            }
        } catch (err) {
            logger.error('Error fetching AI limit:', err);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
            
            if (data) {
                setUserProfile(data);
            }
        } catch (err) {
            logger.error('Error fetching user profile:', err);
        }
    };

    const fetchAnalysis = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = '/login';
                return;
            }

            const { data, error } = await supabase
                .from('resume_analyses')
                .select('*')
                .eq('id', analysisId)
                .eq('user_id', session.user.id)
                .single();

            if (error) throw error;
            setAnalysis(data);
        } catch (err) {
            logger.error('Error fetching analysis:', err);
            setError('Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    const checkPremiumStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('status')
                .eq('user_id', session.user.id)
                .in('status', ['active', 'trialing'])
                .maybeSingle();

            if (error) {
                logger.error('Error checking subscription:', error);
                setIsPremium(false);
                return;
            }

            setIsPremium(!!data);
        } catch (err) {
            logger.error('No premium subscription found:', err);
            setIsPremium(false);
        }
    };

    const handleImproveWithAI = async () => {
        setIsImproving(true);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please log in to use AI improvement');
                setIsImproving(false);
                return;
            }

            // Parse the raw text into structured data to help the AI
            const parsedData = parseResumeTextToStructuredData(analysis.analysis_text);
            
            // Merge with user profile if available, prioritizing profile data
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
                    resumeData: structuredData, // Send structured data
                    analysisId: analysis.id
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to improve resume');
            }

            const improvedData = result.improved_resume;
            setImprovedResume(improvedData);
            
            // Update local limit
            if (!isPremium && aiLimit) {
                setAiLimit(prev => ({ ...prev, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
            }
            
            if (result.changes_made) {
                if (Array.isArray(result.changes_made)) {
                    setImprovementNotes(result.changes_made.join('\n'));
                } else if (typeof result.changes_made === 'string') {
                    setImprovementNotes(result.changes_made);
                } else {
                    setImprovementNotes('Resume improved successfully!');
                }
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
            const { data: { session } } = await supabase.auth.getSession();
            const sessionToken = session?.access_token;

            const formData = new FormData();
            formData.append('resumeText', analysis.analysis_text);
            formData.append('jobDescription', jobDescription);
            formData.append('originalSuggestions', JSON.stringify(analysis.suggestions));

            const response = await fetch('/api/tailor-resume', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to tailor resume');
            }

            const result = await response.json();
            
            const tailoredData = result.tailored_resume;
            
            localStorage.setItem('tailoredResumeData', JSON.stringify(tailoredData));
            localStorage.setItem('tailorResult', JSON.stringify({
                matchScore: result.match_score,
                keyChanges: result.key_changes,
                keywordsAdded: result.keywords_added
            }));
            
            window.location.href = '/resume-builder?tailored=true';
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please log in to download your resume');
                setDownloadingTailored(false);
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
                setDownloadingTailored(false);
                return;
            }

            await recordDownload(session.user.id, 'tailored');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = margin;
            
            const addText = (text, size, isBold = false, color = [0, 0, 0]) => {
                if (!text) return;
                pdf.setFontSize(size);
                pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                pdf.setTextColor(...color);
                const lines = pdf.splitTextToSize(text, contentWidth);
                lines.forEach(line => {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = margin;
                    }
                    pdf.text(line, margin, yPos);
                    yPos += size * 0.5;
                });
            };

            const addBullet = (text, size = 10) => {
                if (!text) return;
                pdf.setFontSize(size);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
                const bulletWidth = 5;
                const lines = pdf.splitTextToSize(text, contentWidth - bulletWidth);
                lines.forEach((line, index) => {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = margin;
                    }
                    if (index === 0) {
                        pdf.text('•', margin, yPos);
                    }
                    pdf.text(line, margin + bulletWidth, yPos);
                    yPos += size * 0.5;
                });
            };
            
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            const nameWidth = pdf.getTextWidth(tailoredResume.profile.full_name || 'Your Name');
            pdf.text(tailoredResume.profile.full_name || 'Your Name', (pageWidth - nameWidth) / 2, yPos);
            yPos += 8;
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const contactInfo = [tailoredResume.profile.email, tailoredResume.profile.phone, tailoredResume.profile.location].filter(Boolean).join(' | ');
            const contactWidth = pdf.getTextWidth(contactInfo);
            pdf.text(contactInfo, (pageWidth - contactWidth) / 2, yPos);
            yPos += 6;
            
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;
            
            if (tailoredResume.profile.professional_summary) {
                addText('PROFESSIONAL SUMMARY', 13, true);
                yPos += 2;
                addText(tailoredResume.profile.professional_summary, 10);
                yPos += 6;
            }
            
            if (tailoredResume.profile.skills) {
                addText('SKILLS', 13, true);
                yPos += 2;
                addText(tailoredResume.profile.skills, 10);
                yPos += 6;
            }
            
            if (tailoredResume.work_experience && tailoredResume.work_experience.length > 0) {
                addText('WORK EXPERIENCE', 13, true);
                yPos += 3;
                
                tailoredResume.work_experience.forEach((exp, index) => {
                    if (exp.position) {
                        addText(exp.position, 12, true);
                    }
                    
                    const companyInfo = [];
                    if (exp.company) companyInfo.push(exp.company);
                    if (exp.location) companyInfo.push(exp.location);
                    if (companyInfo.length > 0) {
                        addText(companyInfo.join(', '), 10, false, [60, 60, 60]);
                    }
                    
                    const dateRange = [exp.start_date, exp.end_date || 'Present'].filter(Boolean).join(' - ');
                    if (dateRange) {
                        addText(dateRange, 9, false, [100, 100, 100]);
                    }
                    
                    if (exp.description) {
                        yPos += 1;
                        const bulletPoints = exp.description.includes('|') 
                            ? exp.description.split('|').map(b => b.trim())
                            : [exp.description];
                        
                        bulletPoints.forEach(bullet => {
                            if (bullet.trim()) {
                                addBullet(bullet.trim(), 10);
                            }
                        });
                    }
                    
                    if (index < tailoredResume.work_experience.length - 1) {
                        yPos += 4;
                    }
                });
                yPos += 6;
            }
            
            if (tailoredResume.education && tailoredResume.education.length > 0) {
                addText('EDUCATION', 13, true);
                yPos += 3;
                
                tailoredResume.education.forEach((edu, index) => {
                    if (edu.degree) {
                        addText(edu.degree, 12, true);
                    }
                    
                    const schoolInfo = [];
                    if (edu.institution) schoolInfo.push(edu.institution);
                    if (edu.location) schoolInfo.push(edu.location);
                    if (schoolInfo.length > 0) {
                        addText(schoolInfo.join(', '), 10, false, [60, 60, 60]);
                    }
                    
                    if (edu.graduation_date) {
                        addText(edu.graduation_date, 9, false, [100, 100, 100]);
                    }
                    
                    if (index < tailoredResume.education.length - 1) {
                        yPos += 4;
                    }
                });
                yPos += 6;
            }
            
            if (tailoredResume.profile.volunteering) {
                addText('VOLUNTEERING', 13, true);
                yPos += 2;
                addText(tailoredResume.profile.volunteering, 10);
            }
            
            const fileName = `${tailoredResume.profile.full_name || 'Resume'}_TAILORED.pdf`;
            pdf.save(fileName);
            
        } catch (err) {
            logger.error('Error downloading tailored resume:', err);
            alert('Error downloading tailored resume. Please try again.');
        } finally {
            setDownloadingTailored(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading analysis...</div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-red-500 text-xl">{error || 'Analysis not found'}</div>
            </div>
        );
    }

    const suggestions = analysis.suggestions || {};
    const atsScore = suggestions.ats_score || 0;
    
    const getScoreColor = (score) => {
        if (score >= 80) return 'from-green-500 to-green-600';
        if (score >= 60) return 'from-yellow-500 to-yellow-600';
        if (score >= 40) return 'from-orange-500 to-orange-600';
        return 'from-red-500 to-red-600';
    };

    const getProgressWidth = (score) => `${score}%`;

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="min-h-screen bg-black text-white py-20 px-4 md:px-10 lg:px-20">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </button>
                    <p className="text-neutral-400 text-sm">{analysis.file_name}</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-neutral-800">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-6 py-3 font-semibold transition-colors relative ${
                            activeTab === 'analysis' 
                                ? 'text-white' 
                                : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        Analysis
                        {activeTab === 'analysis' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            if (!isPremium && aiLimit && !aiLimit.canGenerate) {
                                setUpgradeFeatureName('Tailor for Job');
                                setShowUpgradeModal(true);
                            } else {
                                setActiveTab('tailor');
                            }
                        }}
                        className={`px-6 py-3 font-semibold transition-colors relative flex items-center gap-2 ${
                            activeTab === 'tailor' 
                                ? 'text-white' 
                                : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        Tailor for Job
                        {!isPremium && (
                            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-2xl [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] border-[3px] border-transparent [animation:border_4s_linear_infinite]">
                                Premium
                            </span>
                        )}
                        {activeTab === 'tailor' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                        )}
                    </button>
                </div>

                <UpgradeModal 
                    isOpen={showUpgradeModal} 
                    onClose={() => setShowUpgradeModal(false)}
                    featureName={upgradeFeatureName}
                    remainingRequests={aiLimit?.generationsRemaining}
                />

                {/* Analysis Tab Content */}
                {activeTab === 'analysis' && (
                <>
                {/* Score Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8">Your Roast Score</h1>
                    
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-12 h-12 bg-gradient-to-r ${getScoreColor(atsScore)} bg-clip-text text-transparent`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                        </svg>
                        <div className={`text-8xl md:text-9xl font-black bg-gradient-to-r ${getScoreColor(atsScore)} bg-clip-text text-transparent`}>
                            {atsScore}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md mx-auto h-4 bg-neutral-800 rounded-full overflow-hidden mb-6">
                        <div 
                            className={`h-full bg-gradient-to-r ${getScoreColor(atsScore)} rounded-full transition-all duration-1000`}
                            style={{ width: getProgressWidth(atsScore) }}
                        />
                    </div>

                    {/* Score Summary */}
                    <div className="max-w-2xl mx-auto">
                        <p className="text-neutral-300 text-lg leading-relaxed">
                            {suggestions.overall_assessment || 'Your resume analysis is ready. Check the detailed feedback below.'}
                        </p>
                    </div>
                </div>

                {/* Detailed Analysis Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-6">Detailed Analysis</h2>

                    {/* The Brutal Truth */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('truth')}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-xl p-6 flex items-center justify-between border border-neutral-800"
                        >
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                                </svg>
                                <span className="text-xl font-semibold">The Brutal Truth</span>
                            </div>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className={`w-6 h-6 transition-transform ${expandedSection === 'truth' ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                        {expandedSection === 'truth' && (
                            <div className="bg-neutral-900/50 border border-neutral-800 border-t-0 rounded-b-xl p-6 animate-fade-in">
                                <p className="text-neutral-300 leading-relaxed mb-4">
                                    {suggestions.overall_assessment}
                                </p>
                                {suggestions.critical_issues && suggestions.critical_issues.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-red-400 mb-3">Critical Issues:</h4>
                                        <ul className="space-y-2">
                                            {suggestions.critical_issues.map((issue, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-neutral-300">
                                                    <span className="text-red-500 mt-1">•</span>
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* What's Wrong */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('wrong')}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-xl p-6 flex items-center justify-between border border-neutral-800"
                        >
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-yellow-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <span className="text-xl font-semibold">What's Wrong</span>
                            </div>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className={`w-6 h-6 transition-transform ${expandedSection === 'wrong' ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                        {expandedSection === 'wrong' && (
                            <div className="bg-neutral-900/50 border border-neutral-800 border-t-0 rounded-b-xl p-6 animate-fade-in">
                                {suggestions.section_feedback && Object.entries(suggestions.section_feedback).map(([section, feedback]) => (
                                    <div key={section} className="mb-4 last:mb-0">
                                        <h4 className="font-semibold text-orange-500 capitalize mb-2">{section}</h4>
                                        <p className="text-neutral-300 text-sm leading-relaxed">{feedback}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* How to Fix It */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('fix')}
                            className="w-full bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-xl p-6 flex items-center justify-between border border-neutral-800"
                        >
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xl font-semibold">How to Fix It</span>
                            </div>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className={`w-6 h-6 transition-transform ${expandedSection === 'fix' ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                        {expandedSection === 'fix' && (
                            <div className="bg-neutral-900/50 border border-neutral-800 border-t-0 rounded-b-xl p-6 animate-fade-in">
                                {suggestions.action_items && suggestions.action_items.length > 0 && (
                                    <div className="space-y-4">
                                        {suggestions.action_items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                                                <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {item.priority}
                                                </div>
                                                <p className="text-neutral-300 flex-1">{item.task}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {suggestions.ats_tips && suggestions.ats_tips.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-blue-400 mb-3">ATS Optimization Tips:</h4>
                                        <ul className="space-y-2">
                                            {suggestions.ats_tips.map((tip, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-neutral-300 text-sm">
                                                    <span className="text-blue-400 mt-1">→</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Improvement Section */}
                {improvedResume && improvementNotes && (
                    <div className="mb-8 bg-blue-900/30 border border-blue-500 rounded-xl p-6 animate-fade-in">
                        <h4 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            AI Improvements Applied
                        </h4>
                        <ul className="text-sm text-neutral-300 space-y-2">
                            {improvementNotes.split('\n').map((note, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-blue-400 mt-1">•</span>
                                    <span>{note}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-sm text-neutral-400">
                            Your improved resume is ready for download below!
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {!improvedResume && (
                        <button 
                            onClick={() => {
                                if (!isPremium && aiLimit && aiLimit.generationsRemaining <= 0) {
                                    setUpgradeFeatureName('AI Resume Improvement');
                                    setShowUpgradeModal(true);
                                    return;
                                }
                                handleImproveWithAI();
                            }}
                            disabled={isImproving}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-neutral-700 disabled:to-neutral-600 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 relative"
                        >
                            {!isPremium && (
                                <div className="absolute top-[-15px] right-[-15px] ">
                                    <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-2xl [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] border-[3px] border-transparent [animation:border_4s_linear_infinite]">
                                        {aiLimit && aiLimit.generationsRemaining > 0 ? `${aiLimit.generationsRemaining} left` : 'PRO'}
                                    </span>
                                </div>
                            )}
                            {isImproving ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Improving with AI...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                    </svg>
                                    Improve with AI
                                </>
                            )}
                        </button>
                    )}
                    {improvedResume && (
                        <button 
                            onClick={handleDownloadResume}
                            disabled={downloadingResume}
                            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-neutral-700 disabled:to-neutral-600 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                        >
                            {downloadingResume ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Download Improved Resume
                                </>
                            )}
                        </button>
                    )}
                    {!isPremium && (
                        <a 
                            href="/pricing"
                            className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 border border-neutral-700"
                        >
                            Get Pro Version
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </a>
                    )}
                </div>

                {/* Detailed Checklist Link */}
                <div className="mt-12 text-center">
                    <a 
                        href={`/analysis/${analysisId}/checklist`}
                        className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors font-medium"
                    >
                        View Detailed 39-Point Checklist
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </div>
                </>
                )}

                {/* Tailor for Job Tab Content */}
                {activeTab === 'tailor' && (
                <div className="animate-fade-in">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Tailor Your Resume</h1>
                        <p className="text-neutral-400 text-lg">
                            Optimize your resume for a specific job posting
                        </p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
                        <label className="block text-sm font-semibold mb-3">
                            Paste Job Description
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the complete job description here..."
                            className="w-full h-64 bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleTailorResume}
                        disabled={tailoring || !jobDescription.trim()}
                        className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-neutral-700 disabled:to-neutral-600 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        {tailoring ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Tailoring Resume...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                </svg>
                                Tailor Resume with AI
                            </>
                        )}
                    </button>

                    {tailoredResume && tailoredResult && (
                        <div className="mt-8 space-y-6 animate-fade-in">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Tailored Resume Preview
                                    </h3>
                                    {tailoredResult.matchScore && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-neutral-400">Match Score:</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000"
                                                        style={{ width: `${tailoredResult.matchScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-xl font-bold text-green-500">
                                                    {tailoredResult.matchScore}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 mb-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-lg font-semibold mb-2">{tailoredResume.profile.full_name}</h4>
                                            <p className="text-sm text-neutral-400">
                                                {[tailoredResume.profile.email, tailoredResume.profile.phone, tailoredResume.profile.location].filter(Boolean).join(' • ')}
                                            </p>
                                        </div>
                                        
                                        {tailoredResume.profile.professional_summary && (
                                            <div>
                                                <h5 className="font-semibold text-orange-400 mb-2">Professional Summary</h5>
                                                <p className="text-sm text-neutral-300">{tailoredResume.profile.professional_summary}</p>
                                            </div>
                                        )}
                                        
                                        {tailoredResume.profile.skills && (
                                            <div>
                                                <h5 className="font-semibold text-orange-400 mb-2">Skills</h5>
                                                <p className="text-sm text-neutral-300">{tailoredResume.profile.skills}</p>
                                            </div>
                                        )}
                                        
                                        {tailoredResume.work_experience && tailoredResume.work_experience.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-orange-400 mb-2">Work Experience</h5>
                                                <div className="space-y-3">
                                                    {tailoredResume.work_experience.slice(0, 2).map((exp, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <p className="font-semibold text-white">{exp.position} at {exp.company}</p>
                                                            <p className="text-neutral-400 text-xs">{exp.start_date} - {exp.end_date || 'Present'}</p>
                                                            {exp.description && (
                                                                <p className="text-neutral-300 mt-1 text-xs">
                                                                    {exp.description.split('|')[0].substring(0, 100)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {tailoredResult.keyChanges && tailoredResult.keyChanges.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-blue-400 mb-3">Key Changes Made</h4>
                                        <ul className="space-y-2">
                                            {tailoredResult.keyChanges.map((change, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-300">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>{change}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {tailoredResult.keywordsAdded && tailoredResult.keywordsAdded.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-green-400 mb-3">Keywords Added</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {tailoredResult.keywordsAdded.map((keyword, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm text-green-400">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleDownloadTailoredResume}
                                    disabled={downloadingTailored}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-neutral-700 disabled:to-neutral-600 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {downloadingTailored ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                            Download Tailored Resume
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                        <p className="text-sm text-neutral-400">
                            <strong className="text-white">💡 Tip:</strong> Our AI analyzes the job description and suggests specific changes to maximize your chances of getting past ATS systems and impressing recruiters.
                        </p>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

export default AnalysisResultsPage;
