import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';

function ChecklistDetailsPage({ analysisId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalysis();
    }, [analysisId]);

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
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analysis) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading checklist...</div>
            </div>
        );
    }

    const suggestions = analysis.suggestions || {};

    return (
        <div className="min-h-screen bg-black text-white py-20 px-4 md:px-10 lg:px-20">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <a 
                        href={`/analysis/${analysisId}`}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Results
                    </a>
                    <p className="text-neutral-400 text-sm">{analysis.file_name}</p>
                </div>

                <h1 className="text-4xl font-bold mb-4">Comprehensive Resume Checklist</h1>
                <p className="text-neutral-400 mb-12">All 39 evaluation criteria checked point by point</p>

                <div className="space-y-8">
                    {/* Content and Relevance */}
                    {suggestions.checklist_results?.content_and_relevance && (
                        <div>
                            <h2 className="text-2xl font-bold text-orange-500 mb-6">Content and Relevance</h2>
                            <div className="space-y-3">
                                {suggestions.checklist_results.content_and_relevance.map((item, idx) => (
                                    <div key={idx} className={`p-6 rounded-xl border ${
                                        item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 
                                        item.status === 'FAIL' ? 'bg-red-500/5 border-red-500/20' : 
                                        'bg-neutral-500/5 border-neutral-500/20'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            {item.status === 'PASS' ? (
                                                <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : item.status === 'FAIL' ? (
                                                <svg className="w-7 h-7 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-7 h-7 text-neutral-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-semibold text-white">{item.item}</span>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                        item.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 
                                                        item.status === 'FAIL' ? 'bg-red-500/20 text-red-400' : 
                                                        'bg-neutral-500/20 text-neutral-400'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-neutral-300 leading-relaxed">{item.feedback}</p>
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
                            <h2 className="text-2xl font-bold text-orange-500 mb-6">Structure and Formatting</h2>
                            <div className="space-y-3">
                                {suggestions.checklist_results.structure_and_formatting.map((item, idx) => (
                                    <div key={idx} className={`p-6 rounded-xl border ${
                                        item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            {item.status === 'PASS' ? (
                                                <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-7 h-7 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-semibold text-white">{item.item}</span>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                        item.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-neutral-300 leading-relaxed">{item.feedback}</p>
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
                            <h2 className="text-2xl font-bold text-orange-500 mb-6">Language and Tone</h2>
                            <div className="space-y-3">
                                {suggestions.checklist_results.language_and_tone.map((item, idx) => (
                                    <div key={idx} className={`p-6 rounded-xl border ${
                                        item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            {item.status === 'PASS' ? (
                                                <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-7 h-7 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-semibold text-white">{item.item}</span>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                        item.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-neutral-300 leading-relaxed">{item.feedback}</p>
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
                            <h2 className="text-2xl font-bold text-orange-500 mb-6">Soft Skills Demonstration</h2>
                            <div className="space-y-3">
                                {suggestions.checklist_results.soft_skills.map((item, idx) => (
                                    <div key={idx} className={`p-6 rounded-xl border ${
                                        item.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            {item.status === 'PASS' ? (
                                                <svg className="w-7 h-7 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-7 h-7 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-semibold text-white">{item.item}</span>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                        item.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-neutral-300 leading-relaxed">{item.feedback}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChecklistDetailsPage;
