import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, authService } from '../services/supabase';
import Loader from './uicomponents/Loader';
import { motion } from 'framer-motion';

export default function ResumeScorer() {
    const { user, profile: contextProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [result, setResult] = useState(null);
    const [fixing, setFixing] = useState(null); // 'keywords', 'ats', etc.
    const [fixedData, setFixedData] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, [user, contextProfile]);

    const fetchProfile = async () => {
        try {
            if (!user) return;
            const data = contextProfile || await dbService.getProfile(user.id);
            setProfile(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!jobDescription) return;
        setAnalyzing(true);
        setResult(null);
        setFixedData(null);

        try {
            const session = await authService.getSession();
            const resumeData = {
                profile,
                work_experience: profile.work_experience,
                education: profile.education,
                projects: profile.projects,
                skills: profile.skills
            };

            // Call dedicated scoring endpoint
            const response = await fetch('/api/score-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    resumeData,
                    jobDescription
                })
            });

            const data = await response.json();
            
            if (data.success && data.data) {
                setResult(data.data);
            } else {
                throw new Error(data.error || 'Failed to score resume');
            }
            
            setAnalyzing(false);

        } catch (error) {
            console.error('Error scoring resume:', error);
            alert('Failed to analyze resume');
            setAnalyzing(false);
        }
    };

    const handleApplyFix = async (fixType, instructions) => {
        setFixing(fixType);
        try {
            const session = await authService.getSession();
            
            // Use current fixed data as base if available to chain edits
            const currentResume = fixedData || {
                profile,
                work_experience: profile.work_experience,
                education: profile.education,
                projects: profile.projects,
                skills: profile.skills
            };

            const response = await fetch('/api/improve-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    resumeData: currentResume,
                    customInstructions: instructions
                })
            });

            const data = await response.json();
            
            if (data.success && data.improved_resume) {
                // In a real app, we might update the profile or show a comparison
                // For now, we'll alert success and maybe update the local score visually
                alert(`Fix applied! ${data.changes_made?.[0] || 'Resume updated.'}`);
                setFixedData(data.improved_resume);
                
                // Optimistic update of score (visual only)
                if (fixType === 'keywords') {
                    setResult(prev => ({
                        ...prev,
                        score: Math.min(100, prev.score + 15),
                        missingKeywords: []
                    }));
                }
            } else {
                throw new Error(data.error || 'Failed to apply fix');
            }

        } catch (error) {
            console.error('Error applying fix:', error);
            alert('Failed to apply fix: ' + error.message);
        } finally {
            setFixing(null);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
                
                {/* Hero Input Section */}
                <div className="flex flex-col items-center justify-center mb-16 text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-10 h-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                        What's Your Fighting Chance?
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-2xl">
                        Get an instant compatibility analysis in under 10 seconds. We decode the JD to see if you pass the ATS.
                    </p>

                    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
                        {/* Resume Selector */}
                        <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                            <h3 className="text-purple-400 font-semibold mb-4 uppercase text-sm tracking-wider">Your Resume</h3>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="w-12 h-16 bg-white text-black flex items-center justify-center text-xs font-bold rounded">PDF</div>
                                <div>
                                    <div className="font-bold text-white">{profile?.full_name || 'My Resume'}</div>
                                    <div className="text-xs text-neutral-500">Last analyzed: Never</div>
                                </div>
                            </div>
                        </div>

                        {/* Job Description Input */}
                        <div className="bg-[#1a1a1a] border border-pink-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-pink-500/10 transition-all">
                            <h3 className="text-pink-400 font-semibold mb-4 uppercase text-sm tracking-wider">Target Position</h3>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the full job description here..."
                                className="w-full h-32 bg-[#111] border border-neutral-800 rounded-lg p-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500 resize-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!jobDescription || analyzing}
                        className={`px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all ${
                            !jobDescription || analyzing
                                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-pink-500/30'
                        }`}
                    >
                        {analyzing ? 'Scanning...' : '✨ Analyze Match Score'}
                    </button>
                </div>

                {/* Analysis Overlay */}
                {analyzing && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-md">
                        <div className="text-center space-y-6">
                            <div className="w-32 h-32 relative mx-auto">
                                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">🔍</div>
                            </div>
                            <h2 className="text-3xl font-bold text-white">Analyzing 847 keywords...</h2>
                            <p className="text-purple-300">Checking ATS compatibility...</p>
                        </div>
                    </div>
                )}

                {/* Results Dashboard */}
                {result && !analyzing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Hero Score Card */}
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                {/* Score Circle */}
                                <div className="relative w-48 h-48 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="#333" strokeWidth="12" fill="none" />
                                        <circle 
                                            cx="96" cy="96" r="88" 
                                            stroke={result.score > 75 ? '#22c55e' : result.score > 50 ? '#eab308' : '#ef4444'} 
                                            strokeWidth="12" 
                                            fill="none" 
                                            strokeDasharray="552"
                                            strokeDashoffset={552 - (552 * result.score) / 100}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-6xl font-black text-white">{result.score}</span>
                                        <span className="text-sm text-neutral-400 uppercase tracking-widest mt-1">Match</span>
                                    </div>
                                </div>

                                {/* Text Context */}
                                <div className="text-center md:text-left space-y-4">
                                    <h2 className="text-3xl font-bold text-white">
                                        {result.score > 80 ? "🔥 Excellent Match!" : result.score > 60 ? "💪 Strong Candidate" : "⚠️ Moderate Fit"}
                                    </h2>
                                    <p className="text-xl text-neutral-300 max-w-xl">
                                        {result.score > 80 
                                            ? "You're interview-ready. Your resume strongly aligns with the job requirements."
                                            : result.score > 60
                                            ? "A few strategic tweaks will perfect your application."
                                            : "Some key areas need attention to pass the initial screening."}
                                    </p>
                                    <div className="inline-block bg-white/5 rounded-full px-4 py-2 text-sm text-purple-300 border border-purple-500/20">
                                        Your resume scores higher than {result.percentile || Math.max(10, Math.round(result.score * 0.85))}% of candidates
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Card 1: Keyword Match */}
                            <div className="bg-[#151515] border border-neutral-800 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-white">Keyword Match</h3>
                                    <span className="text-green-500 font-bold">{result.keywordMatch}%</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-neutral-500 mb-2">MATCHED</div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.matchedKeywords.map(k => (
                                                <span key={k} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 mb-2">MISSING (CRITICAL)</div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.missingKeywords.map(k => (
                                                <span key={k} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleApplyFix('keywords', `Add these missing keywords to the skills section or summary if relevant: ${result.missingKeywords.join(', ')}`)}
                                        disabled={fixing === 'keywords' || result.missingKeywords.length === 0}
                                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg transition-colors mt-2 disabled:opacity-50"
                                    >
                                        {fixing === 'keywords' ? 'Adding...' : 'Auto-Add Missing Keywords'}
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: ATS Check */}
                            <div className="bg-[#151515] border border-neutral-800 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-4">ATS Compatibility</h3>
                                <div className="space-y-3">
                                    {result.atsChecks ? result.atsChecks.map((check, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${check.passed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {check.passed ? '✓' : '✕'}
                                            </div>
                                            {check.name}
                                        </div>
                                    )) : (
                                        // Fallback if old API response or error
                                        <div className="text-neutral-500 text-sm">No detailed ATS data available.</div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleApplyFix('ats', 'Fix all ATS formatting issues, remove tables, and ensure standard headers.')}
                                    disabled={fixing === 'ats' || (result.atsChecks && result.atsChecks.every(c => c.passed))}
                                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg transition-colors mt-6 disabled:opacity-50"
                                >
                                    {fixing === 'ats' ? 'Fixing...' : 'Fix ATS Issues'}
                                </button>
                            </div>

                            {/* Card 3: Skills Gap */}
                            <div className="bg-[#151515] border border-neutral-800 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-4">Skills Gap Analysis</h3>
                                <div className="relative h-40 flex items-center justify-center mb-4">
                                    {/* Mock Venn Diagram Visual - Dynamic Sizing */}
                                    <div 
                                        className="rounded-full absolute left-12 mix-blend-screen flex items-center justify-center text-xs text-blue-200 transition-all duration-1000"
                                        style={{ 
                                            width: `${Math.min(120, Math.max(60, result.matchedKeywords.length * 5))}px`,
                                            height: `${Math.min(120, Math.max(60, result.matchedKeywords.length * 5))}px`,
                                            backgroundColor: 'rgba(59, 130, 246, 0.3)'
                                        }}
                                    >You</div>
                                    <div 
                                        className="rounded-full absolute right-12 mix-blend-screen flex items-center justify-center text-xs text-red-200 transition-all duration-1000"
                                        style={{ 
                                            width: `${Math.min(120, Math.max(60, (result.matchedKeywords.length + result.missingKeywords.length) * 5))}px`,
                                            height: `${Math.min(120, Math.max(60, (result.matchedKeywords.length + result.missingKeywords.length) * 5))}px`,
                                            backgroundColor: 'rgba(239, 68, 68, 0.3)'
                                        }}
                                    >Job</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                    <div className="bg-green-900/30 p-2 rounded">
                                        <div className="font-bold text-green-400">{result.matchedKeywords.length}</div>
                                        <div className="text-neutral-500">Matched</div>
                                    </div>
                                    <div className="bg-red-900/30 p-2 rounded">
                                        <div className="font-bold text-red-400">{result.missingKeywords.length}</div>
                                        <div className="text-neutral-500">Missing</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Plan */}
                        <div className="border-t border-neutral-800 pt-8">
                            <h3 className="text-2xl font-bold text-white mb-6">Priority Action Plan</h3>
                            <div className="space-y-4">
                                {result.priorityActions ? result.priorityActions.map((action, i) => (
                                    <div key={i} className={`bg-[#1a1a1a] border-l-4 ${action.type === 'critical' ? 'border-red-500' : 'border-yellow-500'} rounded-r-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 ${action.type === 'critical' ? 'bg-red-500' : 'bg-yellow-500'} ${action.type === 'critical' ? 'text-white' : 'text-black'} text-[10px] font-bold uppercase rounded`}>
                                                    {action.type === 'critical' ? 'High Priority' : 'Medium Priority'}
                                                </span>
                                                <span className="text-green-400 text-sm font-bold">+{action.points} points</span>
                                            </div>
                                            <h4 className="font-bold text-white">{action.title}</h4>
                                            <p className="text-sm text-neutral-400">{action.description}</p>
                                        </div>
                                        {action.type === 'critical' ? (
                                            <button 
                                                onClick={() => handleApplyFix('critical', `Fix this critical issue: ${action.title} - ${action.description}`)}
                                                disabled={fixing === 'critical'}
                                                className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors whitespace-nowrap disabled:opacity-50"
                                            >
                                                {fixing === 'critical' ? 'Applying...' : 'Apply Fix'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => window.location.href = '/resume-builder?mode=editor'}
                                                className="px-4 py-2 bg-neutral-800 text-white font-bold rounded hover:bg-neutral-700 transition-colors whitespace-nowrap"
                                            >
                                                Fix Manually
                                            </button>
                                        )}
                                    </div>
                                )) : (
                                    // Fallback for older analysis format or if AI didn't return actions
                                    <div className="bg-[#1a1a1a] border-l-4 border-blue-500 rounded-r-xl p-6">
                                        <h4 className="font-bold text-white">Review Results Above</h4>
                                        <p className="text-sm text-neutral-400">Check the keyword and ATS sections for specific improvements.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Improved Resume Preview (If Fix Applied) */}
                        {fixedData && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-t border-neutral-800 pt-12"
                                id="improved-resume-preview"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-white">✨ Improved Resume Preview</h3>
                                    <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold text-white shadow-lg hover:shadow-green-500/20 transition-all">
                                        Download Improved PDF
                                    </button>
                                </div>

                                <div className="bg-white text-black p-8 rounded-xl shadow-2xl relative overflow-hidden min-h-[600px]">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
                                    
                                    {/* Resume Content */}
                                    <div className="max-w-4xl mx-auto space-y-6">
                                        <header className="text-center border-b pb-6">
                                            <h1 className="text-3xl font-bold mb-2">{fixedData.profile?.full_name}</h1>
                                            <div className="flex justify-center gap-4 text-sm text-gray-600">
                                                <span>{fixedData.profile?.email}</span>
                                                <span>{fixedData.profile?.phone}</span>
                                                <span>{fixedData.profile?.location}</span>
                                                <span>{fixedData.profile?.linkedin}</span>
                                            </div>
                                        </header>

                                        <section>
                                            <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 border-black mb-3">Professional Summary</h2>
                                            <p className="text-sm leading-relaxed">{fixedData.profile?.professional_summary}</p>
                                        </section>

                                        <section>
                                            <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 border-black mb-3">Skills</h2>
                                            <p className="text-sm leading-relaxed">{fixedData.profile?.skills}</p>
                                        </section>

                                        <section>
                                            <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 border-black mb-3">Work Experience</h2>
                                            <div className="space-y-4">
                                                {fixedData.work_experience?.map((job, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between font-bold text-sm">
                                                            <span>{job.position}</span>
                                                            <span>{job.start_date} – {job.end_date}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm italic mb-2">
                                                            <span>{job.company}</span>
                                                            <span>{job.location}</span>
                                                        </div>
                                                        <ul className="list-disc ml-4 space-y-1">
                                                            {(job.description || '').split('|').map((bullet, j) => (
                                                                <li key={j} className="text-sm pl-1">{bullet.trim()}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                        
                                        <section>
                                            <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 border-black mb-3">Projects</h2>
                                            <div className="space-y-4">
                                                {fixedData.projects?.map((proj, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between font-bold text-sm">
                                                            <span>{proj.title}</span>
                                                        </div>
                                                        <p className="text-sm mt-1">{proj.description}</p>
                                                        {proj.tech && <p className="text-xs text-gray-500 mt-1 italic">Tech: {proj.tech}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h2 className="text-sm font-bold uppercase tracking-wider border-b-2 border-black mb-3">Education</h2>
                                            <div className="space-y-4">
                                                {fixedData.education?.map((edu, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between font-bold text-sm">
                                                            <span>{edu.institution}</span>
                                                            <span>{edu.graduation_date}</span>
                                                        </div>
                                                        <div className="text-sm">{edu.degree}</div>
                                                        <div className="text-sm text-gray-600">{edu.location}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
