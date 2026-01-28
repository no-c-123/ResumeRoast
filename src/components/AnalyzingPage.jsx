import { useEffect, useState, useRef } from 'react';
import { authService, dbService } from '../services/supabase';
import { getFile, setFile, removeFile } from '../lib/storage';
import { logger } from '../lib/logger';
import Loader from './uicomponents/Loader.jsx';

function AnalyzingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('upload'); // 'upload' | 'analyzing'
    const [careerLevel, setCareerLevel] = useState('professional');
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Resume Selection
    const [resumes, setResumes] = useState([]);
    const [showResumeSelector, setShowResumeSelector] = useState(false);

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const analysisSteps = [
        {
            title: "Extracting Resume Text",
            description: "Reading and parsing your document...",
            icon: "📄"
        },
        {
            title: "ATS Compatibility Check",
            description: "Analyzing keywords and formatting for Applicant Tracking Systems...",
            icon: "🤖"
        },
        {
            title: "Content Evaluation",
            description: "Checking relevance, achievements, and quantifiable results...",
            icon: "📊"
        },
        {
            title: "Structure & Formatting",
            description: "Reviewing layout, consistency, and visual hierarchy...",
            icon: "📐"
        },
        {
            title: "Language & Tone Analysis",
            description: "Evaluating grammar, action verbs, and professional tone...",
            icon: "✍️"
        },
        {
            title: "Soft Skills Assessment",
            description: "Identifying demonstrated soft skills and leadership examples...",
            icon: "🎯"
        },
        {
            title: "Generating Recommendations",
            description: "Creating personalized improvement suggestions...",
            icon: "💡"
        },
        {
            title: "Finalizing Report",
            description: "Compiling your comprehensive resume analysis...",
            icon: "✅"
        }
    ];

    useEffect(() => {
        // Fetch resumes for selection
        const loadResumes = async () => {
            const session = await authService.getSession();
            if (session?.user) {
                const data = await dbService.getResumes(session.user.id);
                setResumes(data || []);
            }
        };
        loadResumes();

        const params = new URLSearchParams(window.location.search);
        const rId = params.get('resumeId');
        
        if (rId) {
            setPhase('analyzing');
            // Small delay to allow UI to render 'analyzing' state
            setTimeout(() => analyzeResume(rId), 100);
        } else {
            // Check if a file is already pending (from legacy flow or reloads)
            const checkPending = async () => {
                 const metaData = sessionStorage.getItem('pendingAnalysisMeta');
                 if (metaData) {
                     setPhase('analyzing');
                     analyzeResume();
                 }
            };
            checkPending();
        }
    }, []);

    useEffect(() => {
        if (phase === 'analyzing') {
            // Simulate progress through steps
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) return 100;
                    return prev + 1;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'analyzing') {
            // Update current step based on progress
            const stepIndex = Math.floor((progress / 100) * analysisSteps.length);
            if (stepIndex < analysisSteps.length) {
                setCurrentStep(stepIndex);
            }
        }
    }, [progress, phase]);

    // --- Upload Logic ---

    const handleFileSelect = async (file) => {
        setFileError('');
        if (!file) return;

        const typeOk = !file.type || ACCEPTED.includes(file.type);
        if (!typeOk) {
            setFileError('Unsupported file type. Please upload a PDF or Word document.');
            return;
        }

        if (file.size > MAX_BYTES) {
            setFileError('File size exceeds 5MB limit. Please upload a smaller file.');
            return;
        }

        try {
            await setFile('pendingAnalysisFile', file);
            sessionStorage.setItem('pendingAnalysisMeta', JSON.stringify({
                fileName: file.name,
                careerLevel: careerLevel
            }));
            setPhase('analyzing');
            analyzeResume();
        } catch (err) {
            logger.error('Error saving file:', err);
            setFileError('Failed to process file. Please try again.');
        }
    };

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFileSelect(file);
    };

    // --- Analysis Logic ---
    const analyzeResume = async (resumeIdParam) => {
        try {
            let file, level;
            
            if (!resumeIdParam) {
                // Get the uploaded file from IndexedDB
                const metaData = sessionStorage.getItem('pendingAnalysisMeta');
                
                // Backward compatibility for existing sessionStorage
                const oldFileData = sessionStorage.getItem('pendingAnalysis');
                
                if (metaData) {
                    const meta = JSON.parse(metaData);
                    level = meta.careerLevel;
                    file = await getFile('pendingAnalysisFile');
                } else if (oldFileData) {
                     const data = JSON.parse(oldFileData);
                     level = data.careerLevel;
                     const byteCharacters = atob(data.fileContent);
                     const byteNumbers = new Array(byteCharacters.length);
                     for (let i = 0; i < byteCharacters.length; i++) {
                         byteNumbers[i] = byteCharacters.charCodeAt(i);
                     }
                     const byteArray = new Uint8Array(byteNumbers);
                     const blob = new Blob([byteArray]);
                     file = new File([blob], data.fileName, { type: 'application/pdf' });
                }

                if (!file) {
                    setPhase('upload'); // Go back to upload if no file found
                    return;
                }
            }

            // Get current user session
            const session = await authService.getSession();
            if (!session) {
                // Cleanup
                if (!resumeIdParam) {
                    const metaData = sessionStorage.getItem('pendingAnalysisMeta');
                    if (metaData) {
                        await removeFile('pendingAnalysisFile');
                        sessionStorage.removeItem('pendingAnalysisMeta');
                    } else {
                        sessionStorage.removeItem('pendingAnalysis');
                    }
                }
                window.location.href = '/login';
                return;
            }

            // Create FormData for API request
            const formData = new FormData();
            if (resumeIdParam) {
                formData.append('resumeId', resumeIdParam);
            } else if (file) {
                formData.append('file', file);
            }
            
            formData.append('userId', session.user.id);
            formData.append('careerLevel', level || careerLevel || 'professional');

            // Call the analysis API
            const response = await fetch('/api/analyze-resume', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Analysis failed');
            }

            const result = await response.json();
            const analysisId = result.analysis?.id;

            if (!analysisId) {
                throw new Error('No analysis ID returned from server');
            }

            // Clean up storage
            if (!resumeIdParam) {
                const metaData = sessionStorage.getItem('pendingAnalysisMeta');
                if (metaData) {
                    await removeFile('pendingAnalysisFile');
                    sessionStorage.removeItem('pendingAnalysisMeta');
                } else {
                    sessionStorage.removeItem('pendingAnalysis');
                }
            }

            // Redirect to results page
            window.location.href = `/analysis/${analysisId}`;

        } catch (error) {
            logger.error('Analysis error:', error);
            // Don't redirect immediately - show the error on the page
            setCurrentStep(-1); // Use -1 to indicate error state
            alert(`Failed to analyze resume: ${error.message}\n\nCheck the browser console and terminal for more details.`);
            setPhase('upload'); // Let them try again
        }
    };

    if (phase === 'upload') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none"></div>
                <div className="max-w-4xl w-full text-center z-10">
                    <div className="mb-12">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/20">
                            <span className="text-5xl">🔥</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                            Ready for the Truth?
                        </h1>
                        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                            Upload your resume and discover what's <span className="text-orange-500 font-bold">really</span> holding you back.
                        </p>
                    </div>

                    {/* Career Level Selection */}
                    <div className="mb-8">
                        <label className="block text-neutral-400 text-sm font-medium mb-4">
                            Select your career level:
                        </label>
                        <div className="flex justify-center gap-4 flex-wrap">
                            {['intern', 'new_grad', 'professional'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setCareerLevel(level)}
                                    className={`px-6 py-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                                        careerLevel === level
                                            ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(255,122,0,0.2)] text-white'
                                            : 'border-white/10 bg-white/5 hover:border-orange-500/50 hover:bg-white/10 text-neutral-400'
                                    }`}
                                >
                                    <span>{level === 'intern' ? '🎓' : level === 'new_grad' ? '🚀' : '💼'}</span>
                                    <span className="capitalize">{level.replace('_', ' ')}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        className={`
                            relative max-w-2xl mx-auto h-[350px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group
                            ${isDragging 
                                ? 'border-orange-500 bg-orange-500/10 scale-105 shadow-[0_0_50px_rgba(249,115,22,0.3)]' 
                                : 'border-neutral-700 bg-neutral-900/50 hover:border-orange-500/50 hover:bg-neutral-900'
                            }
                        `}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="text-center space-y-4 pointer-events-none">
                            <div className={`text-6xl transition-transform duration-300 ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`}>
                                📄
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                {isDragging ? "Drop it like it's hot! 🔥" : "Drop Your Resume Here"}
                            </h3>
                            <p className="text-neutral-400">PDF, DOCX supported (Max 5MB)</p>
                            {fileError && <p className="text-red-500 font-bold">{fileError}</p>}
                            <button className="px-6 py-2 bg-white text-black font-bold rounded-full mt-4 hover:bg-neutral-200 transition-colors pointer-events-auto">
                                Browse Files
                            </button>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                        />
                    </div>

                    {resumes.length > 0 && (
                         <div className="mt-6 text-center">
                            <button 
                                onClick={() => setShowResumeSelector(true)}
                                className="text-neutral-500 hover:text-orange-500 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                            >
                                <span className="text-lg">📂</span>
                                Select from your uploaded resumes
                            </button>
                        </div>
                    )}

                    {showResumeSelector && (
                        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowResumeSelector(false)}>
                            <div className="bg-[#1a1a1a] border border-orange-500/30 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Select Resume to Analyze</h3>
                                    <button onClick={() => setShowResumeSelector(false)} className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">✕</button>
                                </div>
                                
                                <div className="space-y-3">
                                    {resumes.map(resume => (
                                        <div 
                                            key={resume.id} 
                                            onClick={() => {
                                                setPhase('analyzing');
                                                analyzeResume(resume.id);
                                            }}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800 bg-[#151515] hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                📄
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white truncate">{resume.title || 'Untitled Resume'}</div>
                                                <div className="text-xs text-neutral-500 flex items-center gap-2">
                                                    <span>{new Date(resume.updated_at).toLocaleDateString()}</span>
                                                    {resume.is_active && <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20">Active</span>}
                                                </div>
                                            </div>
                                            <div className="text-neutral-500 group-hover:text-orange-500">→</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-20">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="mb-6">
                        <div className="inline-block animate-spin-slow">
                            <svg className="w-20 h-20 text-orange-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Analyzing Your Resume</h1>
                    <p className="text-neutral-400 text-lg">Sit tight while our AI roasts your resume with brutal honesty...</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-neutral-400">Progress</span>
                        <span className="text-sm font-semibold text-orange-500">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Analysis Steps */}
                <div className="space-y-4">
                    {analysisSteps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isComplete = index < currentStep;
                        
                        return (
                            <div
                                key={index}
                                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                    isActive
                                        ? 'bg-orange-500/10 border-orange-500/50 scale-105'
                                        : isComplete
                                        ? 'bg-green-500/5 border-green-500/20'
                                        : 'bg-white/5 border-white/10'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`text-3xl transition-all duration-300 ${
                                        isActive ? 'animate-bounce' : ''
                                    }`}>
                                        {isComplete ? '✅' : step.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`font-semibold text-lg ${
                                                isActive ? 'text-orange-500' : 
                                                isComplete ? 'text-green-400' : 
                                                'text-neutral-400'
                                            }`}>
                                                {step.title}
                                            </h3>
                                            {isActive && (
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-75"></span>
                                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-150"></span>
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-sm ${
                                            isActive ? 'text-white' : 'text-neutral-500'
                                        }`}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Message */}
                <div className="mt-12 text-center">
                    <p className="text-neutral-500 text-sm">
                        This usually takes 30-60 seconds. Don't refresh the page!
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                .delay-75 {
                    animation-delay: 75ms;
                }
                .delay-150 {
                    animation-delay: 150ms;
                }
            `}</style>
        </div>
    );
}

export default AnalyzingPage;