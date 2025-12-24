import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, authService } from '../services/supabase';
import Loader from './uicomponents/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeTailor() {
    const { user, profile: contextProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [tailoring, setTailoring] = useState(false);
    const [tailoredResume, setTailoredResume] = useState(null);
    
    // Mock extraction data
    const [extractedInfo, setExtractedInfo] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);

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

    const handleJobInput = async (text) => {
        setJobDescription(text);
    };

    const extractJobDetails = async () => {
        if (!jobDescription || jobDescription.length < 50) return;
        
        setIsExtracting(true);
        try {
            const session = await authService.getSession();
            const response = await fetch('/api/extract-job-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ jobDescription })
            });
            
            const data = await response.json();
            if (data.success) {
                setExtractedInfo(data.data);
            }
        } catch (err) {
            console.error('Error extracting job details:', err);
        } finally {
            setIsExtracting(false);
        }
    };

    // Trigger extraction when moving to step 2 or when pasting
    useEffect(() => {
        if (step === 2 && jobDescription.length > 50 && !extractedInfo) {
            const timer = setTimeout(extractJobDetails, 1000); // Debounce 1s
            return () => clearTimeout(timer);
        }
    }, [jobDescription, step]);

    const handleTailor = async () => {
        setTailoring(true);
        try {
            const session = await authService.getSession();
            const resumeData = {
                profile,
                work_experience: profile.work_experience,
                education: profile.education,
                projects: profile.projects,
                skills: profile.skills
            };

            const response = await fetch('/api/tailor-resume', {
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
            
            if (!response.ok) throw new Error(data.error);

            setTailoredResume(data.tailored_resume);
            setStep(4); // Go to review
        } catch (error) {
            console.error(error);
            alert('Failed to tailor resume');
        } finally {
            setTailoring(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
                
                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-12">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        {[
                            { id: 1, label: 'Source' },
                            { id: 2, label: 'Target' },
                            { id: 3, label: 'Strategy' },
                            { id: 4, label: 'Review' }
                        ].map((s, i) => (
                            <div key={s.id} className="flex items-center gap-4">
                                <div className={`flex items-center gap-2 ${step >= s.id ? 'text-white' : 'text-neutral-600'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                        step > s.id 
                                            ? 'bg-green-500 border-green-500 text-black' 
                                            : step === s.id 
                                                ? 'border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(255,122,0,0.3)]' 
                                                : 'border-neutral-700 bg-neutral-900'
                                    }`}>
                                        {step > s.id ? '✓' : s.id}
                                    </div>
                                    <span>{s.label}</span>
                                </div>
                                {i < 3 && <div className="w-12 h-px bg-neutral-800"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    
                    {/* STEP 1: Choose Source */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">Select Resume to Tailor</h2>
                                <p className="text-neutral-400">We'll optimize this base resume for your target role.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Current Resume Card */}
                                <div 
                                    className="bg-[#1a1a1a] border-2 border-orange-500 rounded-xl p-6 relative cursor-pointer hover:shadow-lg hover:shadow-orange-500/10 transition-all group"
                                    onClick={() => setStep(2)}
                                >
                                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">SELECTED</div>
                                    <div className="w-full aspect-[8.5/11] bg-white rounded mb-4 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400 text-4xl">📄</div>
                                    </div>
                                    <h3 className="font-bold text-white text-lg">{profile?.full_name || 'My Resume'}</h3>
                                    <p className="text-sm text-neutral-500">Last modified: Today</p>
                                </div>

                                {/* Placeholder for Upload */}
                                <div className="bg-[#111] border border-neutral-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#151515] transition-colors">
                                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center text-2xl">⬆️</div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-white">Upload New</h3>
                                        <p className="text-sm text-neutral-500">PDF or DOCX</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setStep(2)}
                                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-bold text-white hover:shadow-lg transition-all"
                                >
                                    Continue to Target Job →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Define Target */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* Left: Input */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">Target Job Description</h2>
                                <div className="bg-[#1a1a1a] rounded-xl p-1">
                                    <div className="flex border-b border-neutral-800">
                                        <button className="flex-1 py-3 text-sm font-medium text-white border-b-2 border-orange-500">Paste Text</button>
                                        <button className="flex-1 py-3 text-sm font-medium text-neutral-500 hover:text-white">Import URL</button>
                                        <button className="flex-1 py-3 text-sm font-medium text-neutral-500 hover:text-white">Upload</button>
                                    </div>
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => handleJobInput(e.target.value)}
                                        placeholder="Paste the complete job description here..."
                                        className="w-full h-[400px] bg-transparent p-6 text-sm text-white placeholder-neutral-600 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Right: AI Extraction */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">AI Extraction</h2>
                                <div className="bg-[#151515] border border-neutral-800 rounded-xl p-6 h-full min-h-[400px] relative">
                                    {isExtracting ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151515]/80 backdrop-blur-sm z-10">
                                            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                                            <p className="text-orange-500 font-bold animate-pulse">Analyzing Job...</p>
                                        </div>
                                    ) : null}

                                    {extractedInfo ? (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800">
                                                <div className="text-xs text-neutral-500 uppercase font-bold mb-2">Role Detected</div>
                                                <div className="text-xl font-bold text-white">{extractedInfo.role}</div>
                                                <div className="text-sm text-neutral-400">{extractedInfo.company}</div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-neutral-500 uppercase font-bold mb-3">Critical Requirements</div>
                                                <div className="space-y-2">
                                                    {extractedInfo.requirements.map((req, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${req.type === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                            <span className="text-sm text-neutral-300">{req.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-neutral-500 uppercase font-bold mb-3">Tech Stack</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {extractedInfo.stack.map((tech, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">{tech}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-4">
                                            <div className="text-4xl">🤖</div>
                                            <p>Paste job description to extract key info...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <button onClick={() => setStep(1)} className="text-neutral-400 hover:text-white">← Back</button>
                                    <button 
                                        onClick={() => setStep(3)}
                                        disabled={!jobDescription}
                                        className={`px-8 py-3 rounded-lg font-bold transition-all ${
                                            jobDescription 
                                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg' 
                                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Next: Strategy →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Strategy */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto space-y-8"
                        >
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">How Should We Tailor Your Resume?</h2>
                                <p className="text-neutral-400">Customize the optimization strategy.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-neutral-800 hover:border-orange-500/50 transition-colors">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 accent-orange-500" />
                                        <div>
                                            <h3 className="font-bold text-white">Skills Section</h3>
                                            <p className="text-sm text-neutral-400 mt-1">Reorder and prioritize skills based on job frequency.</p>
                                            <span className="inline-block mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">High Impact</span>
                                        </div>
                                    </label>
                                </div>
                                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-neutral-800 hover:border-orange-500/50 transition-colors">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 accent-orange-500" />
                                        <div>
                                            <h3 className="font-bold text-white">Experience Descriptions</h3>
                                            <p className="text-sm text-neutral-400 mt-1">Rewrite bullets to highlight relevant achievements.</p>
                                            <span className="inline-block mt-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Med Impact</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-[#151515] p-6 rounded-xl border border-neutral-800">
                                <h3 className="font-bold text-white mb-4">Tailoring Intensity</h3>
                                <input type="range" className="w-full accent-orange-500" />
                                <div className="flex justify-between text-xs text-neutral-500 mt-2">
                                    <span>Light Touch</span>
                                    <span>Moderate (Recommended)</span>
                                    <span>Deep Customization</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-8">
                                <button onClick={() => setStep(2)} className="text-neutral-400 hover:text-white">← Back</button>
                                <button 
                                    onClick={handleTailor}
                                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all flex items-center gap-2"
                                >
                                    {tailoring ? 'Processing...' : '🔥 Generate Tailored Resume'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Review */}
                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full"
                        >
                            <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
                                {/* Left: Original */}
                                <div className="flex-1 bg-[#1a1a1a] rounded-xl overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-[#111]">
                                        <span className="font-bold text-neutral-400">Original Version 🔒</span>
                                    </div>
                                    <div className="flex-1 p-8 overflow-y-auto bg-white text-black text-xs opacity-70">
                                        {/* Mock preview of original text content */}
                                        <h1 className="text-2xl font-bold mb-4">{profile?.full_name}</h1>
                                        <p className="mb-4">Senior Software Engineer</p>
                                        <hr className="my-4"/>
                                        <p>{profile?.professional_summary}</p>
                                        {/* ... render more ... */}
                                    </div>
                                </div>

                                {/* Right: Tailored */}
                                <div className="flex-1 bg-[#1a1a1a] rounded-xl overflow-hidden flex flex-col border-2 border-orange-500/30">
                                    <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-[#111]">
                                        <span className="font-bold text-white flex items-center gap-2">
                                            Tailored Version ✨ 
                                            <span className="bg-green-500 text-black text-xs px-2 py-0.5 rounded font-bold">Match: 95%</span>
                                        </span>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 bg-white text-black text-xs font-bold rounded hover:bg-neutral-200">Download</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8 overflow-y-auto bg-white text-black text-xs relative">
                                        {/* Render tailored resume content */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                                        <h1 className="text-2xl font-bold mb-4">{tailoredResume?.profile?.full_name || profile?.full_name}</h1>
                                        <p className="mb-4 font-bold text-orange-600">{extractedInfo?.role || 'Tailored Role'}</p>
                                        
                                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-6 border-b pb-4">
                                            {tailoredResume?.profile?.email && <span>📧 {tailoredResume.profile.email}</span>}
                                            {tailoredResume?.profile?.phone && <span>📱 {tailoredResume.profile.phone}</span>}
                                            {tailoredResume?.profile?.location && <span>📍 {tailoredResume.profile.location}</span>}
                                            {tailoredResume?.profile?.linkedin && <span>🔗 {tailoredResume.profile.linkedin}</span>}
                                        </div>

                                        <h2 className="text-sm font-bold uppercase border-b-2 border-orange-500 mb-3 pb-1">Professional Summary</h2>
                                        <div className="bg-yellow-100/50 p-2 -mx-2 rounded mb-6">
                                            <p className="leading-relaxed">{tailoredResume?.profile?.professional_summary || profile?.professional_summary}</p>
                                        </div>

                                        {tailoredResume?.profile?.skills && (
                                            <>
                                                <h2 className="text-sm font-bold uppercase border-b-2 border-orange-500 mb-3 pb-1">Skills</h2>
                                                <div className="bg-blue-50/50 p-2 -mx-2 rounded mb-6">
                                                    <p className="leading-relaxed">{tailoredResume.profile.skills}</p>
                                                </div>
                                            </>
                                        )}

                                        {tailoredResume?.work_experience?.length > 0 && (
                                            <>
                                                <h2 className="text-sm font-bold uppercase border-b-2 border-orange-500 mb-3 pb-1">Work Experience</h2>
                                                <div className="space-y-4 mb-6">
                                                    {tailoredResume.work_experience.map((exp, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between font-bold">
                                                                <span>{exp.position}</span>
                                                                <span>{exp.start_date} - {exp.end_date}</span>
                                                            </div>
                                                            <div className="flex justify-between text-gray-600 italic mb-2">
                                                                <span>{exp.company}</span>
                                                                <span>{exp.location}</span>
                                                            </div>
                                                            <ul className="list-disc ml-4 space-y-1">
                                                                {(exp.description || '').split('|').map((bullet, j) => (
                                                                    <li key={j} className="pl-1">{bullet.trim()}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {tailoredResume?.projects?.length > 0 && (
                                            <>
                                                <h2 className="text-sm font-bold uppercase border-b-2 border-orange-500 mb-3 pb-1">Projects</h2>
                                                <div className="space-y-4 mb-6">
                                                    {tailoredResume.projects.map((proj, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between font-bold">
                                                                <span>{proj.title}</span>
                                                                {proj.link && <a href={proj.link} target="_blank" className="text-blue-500 hover:underline">Link</a>}
                                                            </div>
                                                            <p className="text-sm mt-1">{proj.description}</p>
                                                            {proj.tech && <p className="text-xs text-gray-500 mt-1">Tech: {proj.tech}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {tailoredResume?.education?.length > 0 && (
                                            <>
                                                <h2 className="text-sm font-bold uppercase border-b-2 border-orange-500 mb-3 pb-1">Education</h2>
                                                <div className="space-y-2">
                                                    {tailoredResume.education.map((edu, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between font-bold">
                                                                <span>{edu.institution}</span>
                                                                <span>{edu.graduation_date}</span>
                                                            </div>
                                                            <div>{edu.degree}</div>
                                                            {edu.location && <div className="text-gray-500">{edu.location}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
