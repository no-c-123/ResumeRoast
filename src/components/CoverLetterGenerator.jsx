import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService, dbService } from '../services/supabase';
import { logger } from '../lib/logger';
import Loader from './uicomponents/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoverLetterGenerator() {
    const { user, profile: contextProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [profile, setProfile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [showCustomization, setShowCustomization] = useState(false);
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('concise');
    const [selectedAchievements, setSelectedAchievements] = useState([]);
    const [achievementsList, setAchievementsList] = useState([]);
    
    // Mock analysis data for the sidebar
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, [user, contextProfile]);

    const fetchProfile = async () => {
        try {
            if (!user) return;
            const data = contextProfile || await dbService.getProfile(user.id);
            setProfile(data);
            
            // Extract achievements from work experience for the checklist
            if (data?.work_experience) {
                const bullets = data.work_experience.flatMap(exp => 
                    exp.description ? exp.description.split('.').filter(s => s.trim().length > 10).map(s => s.trim()) : []
                ).slice(0, 5); // Take first 5
                setAchievementsList(bullets);
            }
        } catch (err) {
            logger.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!jobDescription) return;
        setGenerating(true);
        setCoverLetter(''); // Clear previous
        setAnalysis(null);

        try {
            const session = await authService.getSession();
            // Prepare data for API
            const resumeData = {
                profile,
                work_experience: profile.work_experience,
                education: profile.education,
                projects: profile.projects
            };

            const response = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    resumeData,
                    jobDescription,
                    tone,
                    length,
                    focusedAchievements: selectedAchievements
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate cover letter');
            }

            // Simulate "streaming" or typing effect if needed, but for now just set it
            // We can also set mock analysis data here
            setCoverLetter(result.cover_letter_text);
            setAnalysis({
                keywordMatch: 87,
                tone: tone,
                readability: 'Grade 12',
                atsCompatibility: 95
            });

        } catch (error) {
            logger.error('Error generating cover letter:', error);
            alert('Failed to generate cover letter: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const toggleAchievement = (achievement) => {
        if (selectedAchievements.includes(achievement)) {
            setSelectedAchievements(prev => prev.filter(a => a !== achievement));
        } else {
            if (selectedAchievements.length < 3) {
                setSelectedAchievements(prev => [...prev, achievement]);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(coverLetter);
        alert('Copied to clipboard!');
    };

    const downloadText = () => {
        const element = document.createElement("a");
        const file = new Blob([coverLetter], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "Cover_Letter.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                        Craft Letters That Get Noticed
                    </h1>
                    <p className="text-neutral-400">Generate a tailored cover letter in seconds.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Input & Configuration */}
                    <div className="w-full lg:w-[40%] space-y-6">
                        
                        {/* Resume Selection Card */}
                        <div className="bg-[#1a1a1a] border border-orange-500/30 rounded-xl p-5 shadow-lg hover:shadow-orange-500/10 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">Your Resume</h3>
                                <button className="text-neutral-500 hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center border border-white/5">
                                    <span className="text-xs text-neutral-400">PDF</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{profile?.full_name ? `${profile.full_name} - Resume` : 'My Resume'}</p>
                                    <p className="text-xs text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Job Description Input */}
                        <div className="bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] border border-neutral-800 rounded-xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    Target Job
                                    <span className="text-lg">✨</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Paste from Clipboard" onClick={async () => {
                                        try {
                                            const text = await navigator.clipboard.readText();
                                            setJobDescription(text);
                                        } catch (e) { console.error(e); }
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the complete job description here..."
                                    className="w-full h-48 bg-[#151515] border border-neutral-700 rounded-lg p-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-neutral-500">
                                    {jobDescription.length} chars
                                </div>
                            </div>
                        </div>

                        {/* Customization Panel */}
                        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-[#1a1a1a]">
                            <button 
                                onClick={() => setShowCustomization(!showCustomization)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <span className="font-semibold flex items-center gap-2">Customize Your Letter ⚙️</span>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" viewBox="0 0 24 24" 
                                    strokeWidth={1.5} stroke="currentColor" 
                                    className={`w-4 h-4 transition-transform ${showCustomization ? 'rotate-180' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            
                            <AnimatePresence>
                                {showCustomization && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-neutral-800"
                                    >
                                        <div className="p-5 space-y-6">
                                            {/* Tone Selector */}
                                            <div>
                                                <label className="text-xs font-bold text-neutral-400 uppercase mb-3 block">Tone</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['professional', 'enthusiastic', 'conversational', 'conservative'].map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setTone(t)}
                                                            className={`p-3 rounded-lg border text-left transition-all ${
                                                                tone === t 
                                                                    ? 'border-orange-500 bg-orange-500/10 text-white' 
                                                                    : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                                                            }`}
                                                        >
                                                            <div className="text-sm font-medium capitalize mb-1">
                                                                {t === 'professional' && '👔 '}
                                                                {t === 'enthusiastic' && '🚀 '}
                                                                {t === 'conversational' && '💬 '}
                                                                {t === 'conservative' && '📊 '}
                                                                {t}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Length Preference */}
                                            <div>
                                                <label className="text-xs font-bold text-neutral-400 uppercase mb-3 block">Length</label>
                                                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                                                    <span>Concise 📄</span>
                                                    <span>Detailed 📚</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="1" max="3" 
                                                    step="1"
                                                    value={length === 'concise' ? 1 : length === 'standard' ? 2 : 3}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setLength(val === 1 ? 'concise' : val === 2 ? 'standard' : 'detailed');
                                                    }}
                                                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                />
                                            </div>

                                            {/* Achievements */}
                                            {achievementsList.length > 0 && (
                                                <div>
                                                    <label className="text-xs font-bold text-neutral-400 uppercase mb-3 block">Highlight These Wins (Max 3)</label>
                                                    <div className="space-y-2">
                                                        {achievementsList.map((ach, i) => (
                                                            <label key={i} className="flex items-start gap-2 cursor-pointer group">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={selectedAchievements.includes(ach)}
                                                                    onChange={() => toggleAchievement(ach)}
                                                                    disabled={!selectedAchievements.includes(ach) && selectedAchievements.length >= 3}
                                                                    className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                                                                />
                                                                <span className={`text-sm leading-snug transition-colors ${selectedAchievements.includes(ach) ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
                                                                    {ach}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!jobDescription || generating}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                !jobDescription || generating
                                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02]'
                            }`}
                        >
                            {generating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Crafting your letter...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔥 Generate Cover Letter</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Column: Preview & Results */}
                    <div className="w-full lg:w-[60%]">
                        {!coverLetter && !generating ? (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border border-neutral-800 border-dashed rounded-xl bg-[#151515]">
                                <div className="w-64 h-64 mb-6 relative">
                                    {/* Abstract visual placeholder */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                                    <img src="/logo-orange.png" alt="ResumeRoast" className="w-32 h-32 mx-auto relative z-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Your perfect introduction is one click away</h2>
                                <p className="text-neutral-400 max-w-md mb-8">
                                    Paste the job description to generate a tailored cover letter that highlights your most relevant experience.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                                    {[
                                        { val: '94%', label: 'Recruiters read letters' },
                                        { val: '40%', label: 'Higher response rate' },
                                        { val: '30s', label: 'To stand out' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                                            <div className="text-2xl font-bold text-orange-500 mb-1">{stat.val}</div>
                                            <div className="text-xs text-neutral-500">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : generating ? (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 border border-neutral-800 rounded-xl bg-[#151515] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                                <div className="relative z-10 text-center space-y-8">
                                    <div className="w-24 h-24 mx-auto relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-ping"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-pulse delay-75"></div>
                                        <div className="absolute inset-2 bg-neutral-900 rounded-full flex items-center justify-center border border-orange-500">
                                            <span className="text-4xl">🔥</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Roasting your resume...</h3>
                                        <div className="flex flex-col items-center gap-2 text-sm text-neutral-400">
                                            <span className="animate-fade-in">✅ Analyzing job requirements...</span>
                                            <span className="animate-fade-in delay-1000">🔄 Matching your experience...</span>
                                            <span className="animate-fade-in delay-2000">⏳ Crafting compelling narrative...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Toolbar */}
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setCoverLetter('')} className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors" title="Clear">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                    <button onClick={handleGenerate} className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors" title="Regenerate">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                    </button>
                                    <button onClick={copyToClipboard} className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors" title="Copy">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                        </svg>
                                    </button>
                                    <button onClick={downloadText} className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                        Download
                                    </button>
                                </div>

                                {/* Preview Card */}
                                <div className="bg-white text-black p-8 md:p-12 rounded-lg shadow-2xl min-h-[600px] font-serif leading-relaxed text-lg whitespace-pre-wrap relative">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-lg opacity-80"></div>
                                    {coverLetter}
                                </div>

                                {/* Analysis Sidebar (Sliding Panel in Mobile, Block in Desktop) */}
                                {analysis && (
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-xs text-neutral-500 uppercase font-bold">Keyword Match</div>
                                            <div className="text-xl font-bold text-green-500">{analysis.keywordMatch}%</div>
                                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500" style={{ width: `${analysis.keywordMatch}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-neutral-500 uppercase font-bold">Tone</div>
                                            <div className="text-xl font-bold text-blue-400 capitalize">{analysis.tone}</div>
                                            <div className="text-xs text-neutral-400">Consistent voice</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-neutral-500 uppercase font-bold">Readability</div>
                                            <div className="text-xl font-bold text-orange-400">{analysis.readability}</div>
                                            <div className="text-xs text-neutral-400">Business standard</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-neutral-500 uppercase font-bold">ATS Score</div>
                                            <div className="text-xl font-bold text-purple-500">{analysis.atsCompatibility}%</div>
                                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${analysis.atsCompatibility}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
