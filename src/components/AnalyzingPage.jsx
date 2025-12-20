import { useEffect, useState } from 'react';
import { authService } from '../services/supabase';
import { getFile, removeFile } from '../lib/storage';
import { logger } from '../lib/logger';

function AnalyzingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

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
        analyzeResume();
    }, []);

    useEffect(() => {
        // Simulate progress through steps
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 100;
                return prev + 1;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Update current step based on progress
        const stepIndex = Math.floor((progress / 100) * analysisSteps.length);
        if (stepIndex < analysisSteps.length) {
            setCurrentStep(stepIndex);
        }
    }, [progress]);

    const analyzeResume = async () => {
        try {
            // Get the uploaded file from IndexedDB
            const metaData = sessionStorage.getItem('pendingAnalysisMeta');
            
            // Backward compatibility for existing sessionStorage
            const oldFileData = sessionStorage.getItem('pendingAnalysis');
            
            let file, careerLevel;
            
            if (metaData) {
                const meta = JSON.parse(metaData);
                careerLevel = meta.careerLevel;
                file = await getFile('pendingAnalysisFile');
            } else if (oldFileData) {
                 const data = JSON.parse(oldFileData);
                 careerLevel = data.careerLevel;
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
                window.location.href = '/';
                return;
            }

            // Get current user session
            const session = await authService.getSession();
            if (!session) {
                // Cleanup
                if (metaData) {
                    await removeFile('pendingAnalysisFile');
                    sessionStorage.removeItem('pendingAnalysisMeta');
                } else {
                    sessionStorage.removeItem('pendingAnalysis');
                }
                window.location.href = '/login';
                return;
            }

            // Create FormData for API request
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', session.user.id);
            formData.append('careerLevel', careerLevel || 'professional');

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
            if (metaData) {
                await removeFile('pendingAnalysisFile');
                sessionStorage.removeItem('pendingAnalysisMeta');
            } else {
                sessionStorage.removeItem('pendingAnalysis');
            }

            // Redirect to results page
            window.location.href = `/analysis/${analysisId}`;

        } catch (error) {
            logger.error('Analysis error:', error);
            // Don't redirect immediately - show the error on the page
            setCurrentStep(-1); // Use -1 to indicate error state
            alert(`Failed to analyze resume: ${error.message}\n\nCheck the browser console and terminal for more details.`);
            // Allow user to go back manually
            setTimeout(() => {
                if (confirm('Go back to homepage?')) {
                    window.location.href = '/';
                }
            }, 500);
        }
    };

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
