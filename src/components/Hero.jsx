import {useRef, useState} from "react";
import Loader from './uicomponents/Loader.jsx';
import { setFile } from '../lib/storage';
import { logger } from '../lib/logger';

function Hero() {

    // Career level selection moved to /analyzing page as requested

    return (
        <div className="flex flex-col justify-center items-center min-h-screen overflow-x-hidden px-4 md:px-10 lg:px-20 pt-20 pb-10">
            <section className="flex flex-col items-center justify-center w-full mb-16">
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 text-center leading-tight">
                    Your Resume Sucks.
                </h1>
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 text-center leading-tight">
                    Let's Fix It.
                </h1>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
                    
                    {/* 1. Upload & Analyze */}
                    <a 
                        href="/analyzing"
                        className="group flex flex-col p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-neutral-800/80 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5m-9 0h18" />
                            </svg>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            Upload & Analyze
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6 flex-grow">
                            Get instant AI feedback on your existing resume. We support PDF and DOCX.
                        </p>

                        <div className="flex items-center text-orange-500 font-medium text-sm group-hover:translate-x-2 transition-transform">
                            Go to Analyzer 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </a>

                    {/* 2. Build from Scratch */}
                    <a href="/resume-builder?mode=build" className="group flex flex-col p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-700 transition-colors border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            Build from Scratch
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6 flex-grow">
                            Create a professional resume step-by-step with our guided builder.
                        </p>
                        <div className="flex items-center text-orange-500 font-medium text-sm group-hover:translate-x-2 transition-transform">
                            Start Building
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </a>

                    {/* 3. Generate Cover Letter */}
                    <a href="/cover-letter" className="group flex flex-col p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-700 transition-colors border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            Cover Letter
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6 flex-grow">
                            Generate a tailored cover letter based on your resume and job description.
                        </p>
                        <div className="flex items-center text-orange-500 font-medium text-sm group-hover:translate-x-2 transition-transform">
                            Write Now
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </a>

                    {/* 4. Resume Scorer */}
                    <a href="/resume-scorer" className="group flex flex-col p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-700 transition-colors border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            Resume Scorer
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6 flex-grow">
                            See how well your resume matches a specific job description with AI scoring.
                        </p>
                        <div className="flex items-center text-neutral-500 font-medium text-sm group-hover:text-orange-500 transition-colors">
                            Check Score
                        </div>
                    </a>

                    {/* 5. Manage Versions */}
                    <a href="/versions" className="group flex flex-col p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-700 transition-colors border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            Manage Versions
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6 flex-grow">
                            Create multiple versions of your resume for different roles (e.g. Frontend vs Fullstack).
                        </p>
                        <div className="flex items-center text-neutral-500 font-medium text-sm group-hover:text-orange-500 transition-colors">
                            Manage Versions
                        </div>
                    </a>

                    {/* 6. Tailor for Jobs */}
                    <a href="/tailor" className="group flex flex-col p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300 hover:shadow-lg">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-700 transition-colors border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                            Tailor for Jobs
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6 flex-grow">
                            Quickly optimize your resume keywords for a specific job description.
                        </p>
                        <div className="flex items-center text-neutral-500 font-medium text-sm group-hover:text-orange-500 transition-colors">
                            Optimize Now
                        </div>
                    </a>

                </div>
            </section>
        </div>
    )
}
//368 x 170
export default Hero;