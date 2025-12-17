import { useState } from 'react';

function AnalysisResults({ analysis, onClose, onNewAnalysis }) {
    const [activeSection, setActiveSection] = useState('overview');
    
    const suggestions = analysis.suggestions || {};
    const atsScore = suggestions.ats_score || 0;
    
    // Determine score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-green-500/20 border-green-500/50';
        if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
        return 'bg-red-500/20 border-red-500/50';
    };

    return (
        <div className="animate-fade-in">
            {/* Header with Score */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className='text-2xl font-bold'>Resume Analysis</h2>
                    <p className="text-neutral-400 text-sm mt-1">{analysis.file_name}</p>
                </div>
                <div className={`flex items-center gap-4 px-6 py-4 rounded-xl border-2 ${getScoreBgColor(atsScore)}`}>
                    <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(atsScore)}`}>{atsScore}</div>
                        <div className="text-xs text-neutral-400 mt-1">ATS Score</div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-2 mb-6 border-b border-neutral-500/20 pb-2 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'checklist', label: 'Checklist' },
                    { id: 'strengths', label: 'Strengths' },
                    { id: 'issues', label: 'Issues' },
                    { id: 'sections', label: 'Section Feedback' },
                    { id: 'ats', label: 'ATS Tips' },
                    { id: 'actions', label: 'Action Items' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeSection === tab.id
                                ? 'bg-orange-500 text-white'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Content Area */}
            <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-500/20 min-h-[400px]">
                {activeSection === 'overview' && (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Overall Assessment</h3>
                        <p className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
                            {suggestions.overall_assessment || 'No assessment available'}
                        </p>
                    </div>
                )}

                {activeSection === 'checklist' && (
                    <div>
                        <h3 className="text-xl font-bold mb-6">Comprehensive Resume Checklist</h3>
                        <div className="space-y-8">
                            {/* Content and Relevance */}
                            {suggestions.checklist_results?.content_and_relevance && (
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-500 mb-4">Content and Relevance</h4>
                                    <div className="space-y-3">
                                        {suggestions.checklist_results.content_and_relevance.map((item, idx) => (
                                            <div key={idx} className={`p-4 rounded-lg border ${
                                                item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 
                                                item.status === 'FAIL' ? 'bg-red-500/5 border-red-500/20' : 
                                                'bg-neutral-500/5 border-neutral-500/20'
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    {item.status === 'PASS' ? (
                                                        <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : item.status === 'FAIL' ? (
                                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-neutral-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                        </svg>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-white">{item.item}</span>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                item.status === 'PASS' ? 'bg-green-500/20 text-green-500' : 
                                                                item.status === 'FAIL' ? 'bg-red-500/20 text-red-500' : 
                                                                'bg-neutral-500/20 text-neutral-400'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-neutral-300">{item.feedback}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Structure and Formatting */}
                            {suggestions.checklist_results?.structure_and_formatting && (
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-500 mb-4">Structure and Formatting</h4>
                                    <div className="space-y-3">
                                        {suggestions.checklist_results.structure_and_formatting.map((item, idx) => (
                                            <div key={idx} className={`p-4 rounded-lg border ${
                                                item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    {item.status === 'PASS' ? (
                                                        <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-white">{item.item}</span>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                item.status === 'PASS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-neutral-300">{item.feedback}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Language and Tone */}
                            {suggestions.checklist_results?.language_and_tone && (
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-500 mb-4">Language and Tone</h4>
                                    <div className="space-y-3">
                                        {suggestions.checklist_results.language_and_tone.map((item, idx) => (
                                            <div key={idx} className={`p-4 rounded-lg border ${
                                                item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    {item.status === 'PASS' ? (
                                                        <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-white">{item.item}</span>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                item.status === 'PASS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-neutral-300">{item.feedback}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Soft Skills */}
                            {suggestions.checklist_results?.soft_skills && (
                                <div>
                                    <h4 className="text-lg font-semibold text-orange-500 mb-4">Soft Skills Demonstration</h4>
                                    <div className="space-y-3">
                                        {suggestions.checklist_results.soft_skills.map((item, idx) => (
                                            <div key={idx} className={`p-4 rounded-lg border ${
                                                item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    {item.status === 'PASS' ? (
                                                        <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-white">{item.item}</span>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                item.status === 'PASS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-neutral-300">{item.feedback}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'strengths' && (
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-green-500">Key Strengths</h3>
                        <ul className="space-y-3">
                            {suggestions.strengths?.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-neutral-200">{strength}</span>
                                </li>
                            )) || <p className="text-neutral-400">No strengths identified</p>}
                        </ul>
                    </div>
                )}

                {activeSection === 'issues' && (
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-red-500">Critical Issues</h3>
                        <ul className="space-y-3">
                            {suggestions.critical_issues?.map((issue, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                    <span className="text-neutral-200">{issue}</span>
                                </li>
                            )) || <p className="text-neutral-400">No critical issues identified</p>}
                        </ul>
                    </div>
                )}

                {activeSection === 'sections' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold mb-4">Section-by-Section Feedback</h3>
                        {suggestions.section_feedback && Object.entries(suggestions.section_feedback).map(([section, feedback]) => (
                            <div key={section} className="border-l-4 border-orange-500 pl-4">
                                <h4 className="font-semibold text-orange-500 capitalize mb-2">{section}</h4>
                                <p className="text-neutral-200 whitespace-pre-wrap">{feedback}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeSection === 'ats' && (
                    <div>
                        <h3 className="text-xl font-bold mb-4">ATS Optimization Tips</h3>
                        <ul className="space-y-3">
                            {suggestions.ats_tips?.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="w-6 h-6 flex-shrink-0 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 text-sm font-bold mt-1">
                                        {idx + 1}
                                    </div>
                                    <span className="text-neutral-200">{tip}</span>
                                </li>
                            )) || <p className="text-neutral-400">No ATS tips available</p>}
                        </ul>
                    </div>
                )}

                {activeSection === 'actions' && (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Priority Action Items</h3>
                        <div className="space-y-3">
                            {suggestions.action_items?.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 bg-neutral-800/50 p-4 rounded-lg border border-neutral-500/20">
                                    <div className="w-8 h-8 flex-shrink-0 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {item.priority}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-neutral-200">{item.task}</p>
                                    </div>
                                </div>
                            )) || <p className="text-neutral-400">No action items available</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
                <button
                    onClick={onNewAnalysis}
                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
                >
                    Analyze Another Resume
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold transition-colors"
                >
                    View History
                </button>
            </div>
        </div>
    );
}

export default AnalysisResults;
