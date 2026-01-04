import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Loader from './uicomponents/Loader';
import { renderTemplate } from './ResumeTemplates.jsx';
import { generateResumePDF } from '../lib/pdfGenerator';
import { useResumeAnalysis } from '../hooks/useResumeAnalysis';

// --- Sub-components for Results Dashboard ---

const ScoreCircle = ({ score, size = 150, strokeWidth = 12 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    
    let color = '#ef4444'; // Red
    let text = "We Need to Start Over.";
    
    if (score >= 90) { color = '#22c55e'; text = "Damn. You Actually Know What You're Doing."; }
    else if (score >= 75) { color = '#eab308'; text = "Not Bad. But We Can Make It Killer."; }
    else if (score >= 60) { color = '#f97316'; text = "Houston, We Have a Problem."; }
    else if (score >= 40) { color = '#ef4444'; text = "This Resume is Why You're Not Getting Calls."; }

    return (
        <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke="#333" strokeWidth={strokeWidth} fill="transparent"
                    />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke={color} strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                        className="text-6xl font-black text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {score}
                    </motion.span>
                </div>
            </div>
            <motion.p 
                className="mt-4 text-xl font-bold text-center px-4"
                style={{ color }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                {text}
            </motion.p>
        </div>
    );
};

const IssueCard = ({ type, title, children, expanded, onToggle }) => {
    const colors = {
        critical: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500', icon: '🔴' },
        warning: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: '🟡' },
        win: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500', icon: '🟢' },
        opportunity: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '🔵' }
    };
    const style = colors[type] || colors.warning;

    return (
        <div className={`border-l-4 ${style.border} bg-[#1a1a1a] rounded-r-xl mb-4 overflow-hidden transition-all`}>
            <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{style.icon}</span>
                    <h3 className={`font-bold ${style.text} text-lg`}>{type.toUpperCase()} - {title}</h3>
                </div>
                <button className="text-neutral-500 hover:text-white transition-colors">
                    {expanded ? '▲' : '▼'}
                </button>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-neutral-800 bg-[#151515] p-6"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Component ---

export default function ResumeAnalyzer({ initialAnalysisId }) {
    const { user } = useAuth();
    const {
        phase, setPhase,
        file,
        loadingMessage,
        analysisData,
        fixing,
        fixedData,
        isDownloading, setIsDownloading,
        startAnalysis,
        handleApplyFix,
        fetchAnalysis
    } = useResumeAnalysis(initialAnalysisId, user);

    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState('critical');
    const [expandedIssues, setExpandedIssues] = useState({});
    const [selectedTemplate, setSelectedTemplate] = useState('ivy');
    const [zoom, setZoom] = useState(50);
    const fileInputRef = useRef(null);

    // Load existing analysis if provided
    useEffect(() => {
        if (initialAnalysisId && user) {
            fetchAnalysis(initialAnalysisId);
        }
    }, [initialAnalysisId, user, fetchAnalysis]);

    // --- Phase 1: Upload Handlers ---

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        startAnalysis(selectedFile);
    };

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        handleFileSelect(droppedFile);
    };

    const toggleIssue = (id) => {
        setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDownload = async () => {
        if (!fixedData) return;
        setIsDownloading(true);
        try {
            generateResumePDF(
                fixedData.profile,
                fixedData.work_experience || [],
                fixedData.education || [],
                fixedData.projects || [],
                selectedTemplate
            );
        } catch (error) {
            console.error("PDF generation failed", error);
            alert("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30">
            
            {phase === 1 && (
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <div 
                        className={`w-full max-w-xl p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer
                            ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-800 hover:border-neutral-600 bg-[#111]'}
                        `}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                        />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Drop your resume here</h2>
                            <p className="text-neutral-400">or click to browse (PDF, DOCX)</p>
                        </div>
                    </div>
                </div>
            )}

            {phase === 2 && (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <Loader text={loadingMessage} />
                </div>
            )}

            {/* PHASE 3: DASHBOARD */}
            {phase === 3 && analysisData && (
                <div className="min-h-screen bg-[#0a0a0a] pb-20">
                    {/* Top Section: Score */}
                    <div className="bg-[#111] border-b border-neutral-800 pt-24 pb-12 px-4">
                        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                            
                            {/* Score Card */}
                            <div className="lg:col-span-1 flex justify-center">
                                <ScoreCircle score={analysisData.score} />
                            </div>

                            {/* Stats & Summary */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'ATS Score', val: `${analysisData.score}%` },
                                        { label: 'Issues', val: analysisData.stats.issues, color: 'text-red-500' },
                                        { label: 'Est. Fix Time', val: '45 min' },
                                        { label: 'Format', val: 'Pass', color: 'text-green-500' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800">
                                            <div className="text-neutral-500 text-xs font-bold uppercase mb-1">{stat.label}</div>
                                            <div className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.val}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-neutral-800">
                                    <h3 className="text-lg font-bold text-white mb-2">Analysis Summary</h3>
                                    <p className="text-neutral-300 leading-relaxed">
                                        {analysisData.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* Sidebar: Navigation */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="sticky top-24">
                                <div className="bg-[#1a1a1a] border border-neutral-800 rounded-xl overflow-hidden">
                                    <div className="p-4 bg-[#222] border-b border-neutral-800 font-bold text-white">
                                        Report Sections
                                    </div>
                                    <div className="flex flex-col">
                                        {[
                                            { id: 'critical', label: '🔥 Critical Issues', count: analysisData.critical.length },
                                            { id: 'warning', label: '⚠️ Warnings', count: analysisData.warnings.length },
                                            { id: 'win', label: '✨ Wins', count: analysisData.wins.length },
                                            { id: 'opportunity', label: '📈 Opportunities', count: analysisData.opportunities.length }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`p-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors ${
                                                    activeTab === tab.id ? 'bg-white/5 text-white border-l-4 border-orange-500' : 'text-neutral-400 border-l-4 border-transparent'
                                                }`}
                                            >
                                                <span>{tab.label}</span>
                                                <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">{tab.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2">Ready to fix this?</h4>
                                    <p className="text-sm text-neutral-400 mb-4">You're 45 minutes away from a 90+ score.</p>
                                    <a href="/resume-builder?mode=build" className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-center rounded-lg transition-colors">
                                        Start Improving
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-white mb-2 capitalize">
                                    {activeTab === 'critical' && '🔥 Critical Issues'}
                                    {activeTab === 'warning' && '⚠️ Warnings'}
                                    {activeTab === 'win' && '✨ Wins'}
                                    {activeTab === 'opportunity' && '📈 Opportunities'}
                                </h2>
                                <p className="text-neutral-400">
                                    {activeTab === 'critical' && "Fix these first. They are likely auto-rejecting your application."}
                                    {activeTab === 'warning' && "These won't kill you, but they're hurting your chances."}
                                    {activeTab === 'win' && "Here's what's working in your favor."}
                                    {activeTab === 'opportunity' && "Level up your resume with these tips."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {activeTab === 'critical' && analysisData.critical.map((issue, i) => (
                                    <IssueCard 
                                        key={i} 
                                        type="critical" 
                                        title={issue.title}
                                        expanded={expandedIssues[`c-${i}`]}
                                        onToggle={() => toggleIssue(`c-${i}`)}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-bold text-white mb-2">🎯 The Problem</h4>
                                                <p className="text-neutral-400 text-sm mb-4">{issue.description}</p>
                                                <h4 className="font-bold text-white mb-2">✅ How to Fix</h4>
                                                <p className="text-neutral-400 text-sm">{issue.fix}</p>
                                            </div>
                                            <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-neutral-500 uppercase">Impact</span>
                                                    <span className="text-green-500 font-bold">{issue.impact}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-neutral-500 uppercase">Time</span>
                                                    <span className="text-white font-bold">{issue.time}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleApplyFix('critical', `Fix this critical issue: ${issue.title} - ${issue.description}. ${issue.fix}`)}
                                                    disabled={fixing !== null}
                                                    className="w-full mt-4 py-2 bg-white text-black font-bold text-sm rounded hover:bg-neutral-200 transition-colors disabled:opacity-50"
                                                >
                                                    {fixing === 'critical' ? 'Applying...' : 'Apply Auto-Fix'}
                                                </button>
                                            </div>
                                        </div>
                                    </IssueCard>
                                ))}

                                {activeTab === 'warning' && analysisData.warnings.map((issue, i) => (
                                    <IssueCard 
                                        key={i} 
                                        type="warning" 
                                        title={issue.title}
                                        expanded={expandedIssues[`w-${i}`]}
                                        onToggle={() => toggleIssue(`w-${i}`)}
                                    >
                                        <p className="text-neutral-400 mb-4">{issue.description}</p>
                                        <div className="bg-neutral-900 p-4 rounded text-sm text-neutral-300">
                                            <strong>Fix:</strong> {issue.fix}
                                        </div>
                                    </IssueCard>
                                ))}

                                {activeTab === 'win' && analysisData.wins.map((issue, i) => (
                                    <IssueCard 
                                        key={i} 
                                        type="win" 
                                        title={issue.title}
                                        expanded={expandedIssues[`win-${i}`]}
                                        onToggle={() => toggleIssue(`win-${i}`)}
                                    >
                                        <p className="text-neutral-400">{issue.description}</p>
                                    </IssueCard>
                                ))}

                                {activeTab === 'opportunity' && analysisData.opportunities.map((issue, i) => (
                                    <IssueCard 
                                        key={i} 
                                        type="opportunity" 
                                        title={issue.title}
                                        expanded={expandedIssues[`opp-${i}`]}
                                        onToggle={() => toggleIssue(`opp-${i}`)}
                                    >
                                        <p className="text-neutral-400 mb-4">{issue.description}</p>
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition-colors">
                                            View Details
                                        </button>
                                    </IssueCard>
                                ))}
                                
                                {analysisData[activeTab === 'win' ? 'wins' : activeTab === 'opportunity' ? 'opportunities' : activeTab === 'warning' ? 'warnings' : 'critical'].length === 0 && (
                                    <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-neutral-800 border-dashed">
                                        <p className="text-neutral-500">No items found in this category.</p>
                                    </div>
                                )}
                            </div>

                            {/* Improved Resume Preview (If Fix Applied) */}
                            {fixedData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border-t border-neutral-800 pt-12 mt-12"
                                    id="improved-resume-preview"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-white">✨ Improved Resume Preview</h3>
                                        <button 
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold text-white shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isDownloading ? 'Generating PDF...' : 'Download Improved PDF'}
                                        </button>
                                    </div>

                                    <div className="bg-white text-black p-8 rounded-xl shadow-2xl relative overflow-hidden min-h-[600px]">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
                                        
                                        {/* Resume Content */}
                                        <div className="max-w-4xl mx-auto space-y-6">
                                            {renderTemplate({
                                                selectedTemplate: 'ivy',
                                                templates: [{ id: 'ivy', name: 'Ivy League', font: 'Times New Roman, serif', color: '#000000' }],
                                                profile: fixedData.profile || {},
                                                hasWorkExperience: (fixedData.work_experience || []).length > 0,
                                                workExperience: fixedData.work_experience || [],
                                                hasEducation: (fixedData.education || []).length > 0,
                                                education: fixedData.education || [],
                                                hasProjects: (fixedData.projects || []).length > 0,
                                                projects: fixedData.projects || []
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
