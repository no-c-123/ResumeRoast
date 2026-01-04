import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { TextArea } from '../ui/TextArea';

export const ProfessionalSection = ({ 
    profile, 
    handleProfileChange, 
    expandedSections, 
    toggleSection,
    improvingSection,
    aiImprovements,
    handleAIImprove,
    suggestedSkills,
    isSuggestingSkills,
    fetchSuggestedSkills
}) => {
    return (
        <>
            {/* Summary */}
            <div className="bg-[#1a1a1a] border-l-4 border-blue-500 rounded-r-xl overflow-hidden mb-6">
                <SectionHeader
                    icon="✨"
                    title="Professional Summary"
                    subtitle="Your 30-second elevator pitch"
                    isComplete={profile.professional_summary?.length > 50}
                    isOpen={expandedSections['summary']}
                    onToggle={() => toggleSection('summary')}
                />
                <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections['summary'] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="bg-[#151515] border-t border-neutral-800 p-6">
                        <TextArea
                            label="Summary"
                            value={profile.professional_summary}
                            onChange={e => handleProfileChange('professional_summary', e.target.value)}
                            placeholder="Motivated professional with experience in..."
                            maxLength={500}
                            onImprove={() => handleAIImprove('professional_summary', profile.professional_summary, 'Make it more professional, concise, and result-oriented.', 500)}
                            isImproving={improvingSection === 'professional_summary'}
                            improvementResult={aiImprovements['professional_summary']}
                        />

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                className="px-3 py-1 bg-neutral-800 text-neutral-400 text-xs rounded hover:bg-neutral-700 hover:text-white transition-colors"
                                onClick={() => handleProfileChange('professional_summary', "Motivated professional with a strong foundation in...")}
                            >
                                + Entry-Level Template
                            </button>
                            <button
                                className="px-3 py-1 bg-neutral-800 text-neutral-400 text-xs rounded hover:bg-neutral-700 hover:text-white transition-colors"
                                onClick={() => handleProfileChange('professional_summary', "Experienced leader with 10+ years driving strategic initiatives...")}
                            >
                                + Senior Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skills */}
            <div className="bg-[#1a1a1a] border-l-4 border-purple-500 rounded-r-xl overflow-hidden mb-6">
                <SectionHeader
                    icon="🎯"
                    title="Skills & Technologies"
                    subtitle="Keywords for ATS optimization"
                    isComplete={profile.skills?.length > 10}
                    isOpen={expandedSections['skills']}
                    onToggle={() => toggleSection('skills')}
                />
                <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections['skills'] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="bg-[#151515] border-t border-neutral-800 p-6">
                        <TextArea
                            label="Skills (Comma Separated)"
                            value={profile.skills}
                            onChange={e => handleProfileChange('skills', e.target.value)}
                            placeholder="React, Node.js, Project Management, Communication..."
                            aiAssist={false}
                        />
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-blue-400 text-sm font-bold flex items-center gap-2">
                                    💡 Suggested Skills {isSuggestingSkills && <span className="animate-spin">⌛</span>}
                                </h4>
                                <button
                                    onClick={() => fetchSuggestedSkills(profile.professional_summary)}
                                    className="text-xs text-blue-400 hover:text-white underline"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {suggestedSkills.length === 0 && !isSuggestingSkills && (
                                    <p className="text-neutral-500 text-xs italic">
                                        Type more in your summary to get AI recommendations...
                                    </p>
                                )}
                                {suggestedSkills.map(s => (
                                    <button
                                        key={s}
                                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors"
                                        onClick={() => {
                                            const current = profile.skills || '';
                                            const separator = current.trim().endsWith(',') || current === '' ? '' : ', ';
                                            handleProfileChange('skills', current + separator + s);
                                            // Ideally we should remove from suggested skills in the parent or handle it here if we had state
                                        }}
                                    >
                                        + {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
