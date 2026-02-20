import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { TextArea } from '../ui/TextArea';
import { SkillsEditor } from '../ui/SkillsEditor';

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
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => fetchSuggestedSkills(profile.professional_summary)}
                                className="text-xs text-blue-400 hover:text-white underline flex items-center gap-1"
                            >
                                {isSuggestingSkills ? <span className="animate-spin">⌛</span> : '💡'} Refresh Suggestions
                            </button>
                        </div>
                        
                        <SkillsEditor
                            value={profile.skills}
                            onChange={(val) => handleProfileChange('skills', val)}
                            suggestedSkills={suggestedSkills}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};
