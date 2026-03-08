import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authService, dbService } from '../services/supabase';
import { renderTemplate } from './ResumeTemplates.jsx';
import { generateResumePDF } from '../lib/pdfGenerator';
import Loader from './uicomponents/Loader.jsx';
import { logger } from '../lib/logger';

// Import Section Components
import { PersonalSection } from './resume-builder/sections/PersonalSection';
import { EducationSection } from './resume-builder/sections/EducationSection';
import { ProfessionalSection } from './resume-builder/sections/ProfessionalSection';
import { ExperienceSection } from './resume-builder/sections/ExperienceSection';
import { ProjectsSection } from './resume-builder/sections/ProjectsSection';
import { FinalizeSection } from './resume-builder/sections/FinalizeSection';
import { CustomSection } from './resume-builder/sections/CustomSection';

export default function ResumeBuilderNew({ initialMode = 'editor' }) {
    const { user, profile: contextProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [resumeId, setResumeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) setResumeId(id);
    }, []);

    const [lastSaved, setLastSaved] = useState(null);
    const [showPreviewMobile, setShowPreviewMobile] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ 1: true });


    const [profile, setProfile] = useState({
        full_name: '',
        location: '',
        phone: '',
        email: '',
        linkedin: '',
        professional_summary: '',
        skills: '',
        volunteering: ''
    });
    const [workExperience, setWorkExperience] = useState([]);
    const [education, setEducation] = useState([]);
    const [projects, setProjects] = useState([]);
    const [customSections, setCustomSections] = useState([]);


    const [improvingSection, setImprovingSection] = useState(null);
    const [aiImprovements, setAiImprovements] = useState({});
    const [suggestedSkills, setSuggestedSkills] = useState({});
    const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // UI State
    const [selectedTemplate, setSelectedTemplate] = useState('ivy');
    const [zoom, setZoom] = useState(50);
    const [viewMode, setViewMode] = useState('stepper'); // 'stepper' or 'single'
    const [targetLanguage, setTargetLanguage] = useState('English');

    const steps = [
        { id: 1, title: 'Personal', icon: '👤' },
        { id: 2, title: 'Professional', icon: '✨' },
        { id: 3, title: 'Experience', icon: '💼' },
        { id: 4, title: 'Finalize', icon: '✅' }
    ];

    const templates = [
        {
            id: 'ivy',
            name: 'Ivy League',
            font: 'Times New Roman, serif',
            color: '#000000'
        },
        {
            id: 'professional',
            name: 'Professional',
            font: 'Arial, sans-serif',
            color: '#000000'
        },
        {
            id: 'modern',
            name: 'Modern',
            font: 'Calibri, sans-serif',
            color: '#000000'
        },
        {
            id: 'classic',
            name: 'Classic',
            font: 'Georgia, serif',
            color: '#000000'
        },
        {
            id: 'minimalist',
            name: 'Minimalist',
            font: 'Helvetica, Arial, sans-serif',
            color: '#000000'
        },
        {
            id: 'elegant',
            name: 'Elegant',
            font: 'Lora, Georgia, serif',
            color: '#000000'
        },
        {
            id: 'executive',
            name: 'Executive',
            font: 'Garamond, serif',
            color: '#000000'
        }
    ];

    useEffect(() => {
        fetchProfile();
    }, [user, contextProfile, resumeId]);


    useEffect(() => {
        if (!loading && user) {
            const timer = setTimeout(async () => {
                setSaving(true);
                try {
                    // Prepare data structure
                    const currentData = {
                        profile,
                        work_experience: workExperience,
                        education,
                        projects,
                        custom_sections: customSections
                    };

                    if (resumeId) {
                        // Update specific resume version
                        await dbService.updateResume(resumeId, {
                            content: currentData,
                            title: profile.full_name ? `${profile.full_name}'s Resume` : 'Untitled Resume'
                        });
                    } else {
                        // Update default profile (legacy/main)
                        const profileData = {
                            user_id: user.id,
                            full_name: profile.full_name,
                            location: profile.location,
                            phone: profile.phone,
                            email: profile.email,
                            linkedin: profile.linkedin,
                            professional_summary: profile.professional_summary,
                            skills: profile.skills,
                            volunteering: profile.volunteering,
                            work_experience: workExperience,
                            education: education,
                            projects: projects,
                            // custom_sections: customSections, // Don't save to profile yet as schema might not support it
                            updated_at: new Date().toISOString()
                        };
                        await dbService.upsertProfile(profileData);
                    }
                    setLastSaved(new Date());
                } catch (error) {
                    logger.error('Error auto-saving:', error);
                } finally {
                    setSaving(false);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [profile, workExperience, education, projects, customSections, user, loading, resumeId]);

    const fetchProfile = async () => {
        try {
            if (!user) return;

            let data = null;
            let isVersion = false;
            let baseProfile = await dbService.getProfile(user.id);

            if (resumeId) {
                const resume = await dbService.getResume(resumeId);
                if (resume && resume.content) {
                    data = resume.content;
                    isVersion = true;
                }
            } else {
                data = baseProfile;
            }

            if (data) {
                const p = isVersion ? data.profile : data;

                // Smart Merge: Use version data if available, fallback to base profile
                setProfile({
                    full_name: p?.full_name || baseProfile?.full_name || '',
                    location: p?.location || baseProfile?.location || '',
                    phone: p?.phone || baseProfile?.phone || '',
                    email: p?.email || baseProfile?.email || user.email || '',
                    linkedin: p?.linkedin || baseProfile?.linkedin || '',
                    professional_summary: p?.professional_summary || '', // Don't merge summary/skills usually
                    skills: p?.skills || '',
                    volunteering: p?.volunteering || ''
                });

                // Helper to ensure IDs
                const ensureIds = (items) => items.map(item => ({ ...item, id: item.id || crypto.randomUUID() }));

                setEducation(ensureIds(data.education || []));
                setWorkExperience(ensureIds(data.work_experience || []));
                setProjects(ensureIds(data.projects || []));
                setCustomSections(data.custom_sections || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (id) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleProfileChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const addCustomSection = () => {
        const newSection = {
            id: crypto.randomUUID(),
            name: '',
            items: []
        };
        setCustomSections([...customSections, newSection]);
    };

    const updateCustomSection = (id, updatedSection) => {
        setCustomSections(customSections.map(s => s.id === id ? updatedSection : s));
    };

    const removeCustomSection = (id) => {
        setCustomSections(customSections.filter(s => s.id !== id));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (profile.professional_summary && profile.professional_summary.length > 50) {
                fetchSuggestedSkills(profile.professional_summary);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [profile.professional_summary]);

    const fetchSuggestedSkills = async (text) => {
        if (!user || !text) return;
        setIsSuggestingSkills(true);
        try {
            const session = await authService.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/suggest-skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    summary: text,
                    currentSkills: profile.skills
                })
            });

            const data = await response.json();
            if (data.success) {
                if (Array.isArray(data.skills)) {
                    setSuggestedSkills({ "Core Skills": data.skills });
                } else if (typeof data.skills === 'object') {
                    setSuggestedSkills(data.skills);
                }
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setIsSuggestingSkills(false);
        }
    };

    const handleAIImprove = async (sectionId, currentText, contextInstructions, maxChars) => {
        if (!user || !currentText) return;

        setImprovingSection(sectionId);
        try {
            const resumeData = {
                profile,
                work_experience: workExperience,
                education,
                projects
            };

            const session = await authService.getSession();
            const token = session?.access_token;

            let finalInstructions = `Strictly focus on improving the content for: ${sectionId}. 
                    Current content: "${currentText}". 
                    ${contextInstructions || ''}
                    Ensure the output JSON reflects this improvement. Keep other sections unchanged.`;

            if (maxChars) {
                finalInstructions += `\n\nCRITICAL: The improved content MUST be less than ${maxChars} characters. Summarize if necessary to fit this limit.`;
            }

            const response = await fetch('/api/improve-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    resumeData,
                    customInstructions: finalInstructions,
                    targetLanguage
                })
            });

            const data = await response.json();

            if (data.success && data.improved_resume) {
                if (sectionId === 'professional_summary') {
                    handleProfileChange('professional_summary', data.improved_resume.profile.professional_summary);
                } else if (sectionId.startsWith('project-')) {
                    const index = parseInt(sectionId.split('-')[1]);
                    if (!isNaN(index) && data.improved_resume.projects?.[index]) {
                        const newProjects = [...projects];
                        if (newProjects[index]) {
                            newProjects[index] = {
                                ...newProjects[index],
                                description: data.improved_resume.projects[index].description
                            };
                            setProjects(newProjects);
                        }
                    }
                } else if (sectionId.startsWith('work-')) {
                    const index = parseInt(sectionId.split('-')[1]);
                    if (!isNaN(index) && data.improved_resume.work_experience?.[index]) {
                        const newWork = [...workExperience];
                        if (newWork[index]) {
                            newWork[index] = {
                                ...newWork[index],
                                description: data.improved_resume.work_experience[index].description
                            };
                            setWorkExperience(newWork);
                        }
                    }
                }

                setAiImprovements(prev => ({
                    ...prev,
                    [sectionId]: data.changes_made || ['Enhanced clarity and impact', 'Optimized for ATS keywords']
                }));
            }
        } catch (error) {
            console.error('AI Improve error:', error);
        } finally {
            setImprovingSection(null);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setTimeout(() => {
            try {
                generateResumePDF(profile, workExperience, education, projects, selectedTemplate, customSections);
            } catch (error) {
                console.error("PDF generation failed", error);
            } finally {
                setIsDownloading(false);
            }
        }, 500);
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#111]/90 backdrop-blur-md border-b border-neutral-800 z-50 flex items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-4">
                    <a href='/' className="text-neutral-400 hover:text-white transition-colors">
                        ← <span className="hidden md:inline">Back</span>
                    </a>
                    <div className="h-6 w-px bg-neutral-800 hidden md:block"></div>
                    <div>
                        <h1 className="font-bold text-sm md:text-base">Resume Builder</h1>
                        <p className="text-xs text-neutral-500 hidden md:block">Step {currentStep} of 4</p>
                    </div>
                </div>

                {/* Progress Tracker (Desktop) */}
                <div className="hidden lg:flex items-center gap-2">
                    {steps.map((step, i) => (
                        <div
                            key={step.id}
                            onClick={() => setCurrentStep(step.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${currentStep === step.id
                                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                : currentStep > step.id
                                    ? 'text-green-500'
                                    : 'text-neutral-600'
                                }`}
                        >
                            <span className="text-lg">{currentStep > step.id ? '✓' : step.id}</span>
                            <span className="font-medium text-sm">{step.title}</span>
                            {i < steps.length - 1 && <div className="w-8 h-px bg-neutral-800 ml-2"></div>}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {saving ? (
                        <span className="text-xs text-neutral-500 animate-pulse">Saving...</span>
                    ) : lastSaved && (
                        <span className="text-xs text-neutral-500 hidden md:inline">Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="hidden md:block bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold border border-neutral-800 rounded-lg px-2 py-2 outline-none cursor-pointer transition-colors"
                        title="AI Output Language"
                    >
                        <option value="English">English 🇺🇸</option>
                        <option value="Spanish">Spanish 🇪🇸</option>
                        <option value="French">French 🇫🇷</option>
                        <option value="German">German 🇩🇪</option>
                        <option value="Italian">Italian 🇮🇹</option>
                        <option value="Portuguese">Portuguese 🇵🇹</option>
                    </select>

                    <button
                        onClick={() => setViewMode(m => m === 'stepper' ? 'single' : 'stepper')}
                        className="hidden md:block px-3 py-2 text-xs font-bold text-neutral-400 hover:text-white border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                        {viewMode === 'stepper' ? '📜 Single Page' : '👣 Step View'}
                    </button>
                    <button
                        onClick={() => setShowPreviewMobile(true)}
                        className="lg:hidden px-4 py-2 bg-neutral-800 rounded-lg text-sm font-bold"
                    >
                        👁️ Preview
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="hidden md:block px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    >
                        {isDownloading ? 'Generating...' : 'Download'}
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="pt-24 pb-32 px-4 lg:px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Form Area */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                    {/* Hero */}
                    <div className="mb-8 mt-12">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Build Your Professional Story</h1>
                        <p className="text-neutral-400">Save once, use everywhere. Your information automatically populates all future resumes.</p>
                    </div>

                    {/* Steps Content */}
                    {viewMode === 'stepper' ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 1 && (
                                    <>
                                        <PersonalSection 
                                            profile={profile} 
                                            handleProfileChange={handleProfileChange} 
                                            expandedSections={expandedSections} 
                                            toggleSection={toggleSection} 
                                        />
                                        <EducationSection 
                                            education={education} 
                                            setEducation={setEducation} 
                                            expandedSections={expandedSections} 
                                            toggleSection={toggleSection} 
                                        />
                                    </>
                                )}
                                {currentStep === 2 && (
                                    <ProfessionalSection 
                                        profile={profile} 
                                        handleProfileChange={handleProfileChange} 
                                        expandedSections={expandedSections} 
                                        toggleSection={toggleSection} 
                                        improvingSection={improvingSection}
                                        aiImprovements={aiImprovements}
                                        handleAIImprove={handleAIImprove}
                                        suggestedSkills={suggestedSkills}
                                        isSuggestingSkills={isSuggestingSkills}
                                        fetchSuggestedSkills={fetchSuggestedSkills}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <ExperienceSection 
                                        workExperience={workExperience} 
                                        setWorkExperience={setWorkExperience} 
                                        expandedSections={expandedSections} 
                                        toggleSection={toggleSection} 
                                        improvingSection={improvingSection}
                                        aiImprovements={aiImprovements}
                                        handleAIImprove={handleAIImprove}
                                    />
                                )}
                                {currentStep === 4 && (
                                    <>
                                        <ProjectsSection 
                                            projects={projects} 
                                            setProjects={setProjects} 
                                            expandedSections={expandedSections} 
                                            toggleSection={toggleSection} 
                                            improvingSection={improvingSection}
                                            aiImprovements={aiImprovements}
                                            handleAIImprove={handleAIImprove}
                                        />

                                        {customSections.map(section => (
                                            <CustomSection 
                                                key={section.id}
                                                section={section}
                                                updateSection={updateCustomSection}
                                                removeSection={removeCustomSection}
                                                expandedSections={expandedSections}
                                                toggleSection={toggleSection}
                                                handleAIImprove={handleAIImprove}
                                                improvingSection={improvingSection}
                                                aiImprovements={aiImprovements}
                                            />
                                        ))}

                                        <button 
                                            onClick={addCustomSection}
                                            className="w-full py-4 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-500 transition-all font-bold mb-8"
                                        >
                                            + Add Custom Section
                                        </button>

                                        <FinalizeSection 
                                            isDownloading={isDownloading} 
                                            handleDownload={handleDownload} 
                                        />
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            {/* Section 1 */}
                            <div id="section-personal">
                                 <h2 className="text-xl font-bold text-neutral-400 mb-4 uppercase tracking-wider">Personal & Education</h2>
                                 <PersonalSection 
                                    profile={profile} 
                                    handleProfileChange={handleProfileChange} 
                                    expandedSections={expandedSections} 
                                    toggleSection={toggleSection} 
                                />
                                <EducationSection 
                                    education={education} 
                                    setEducation={setEducation} 
                                    expandedSections={expandedSections} 
                                    toggleSection={toggleSection} 
                                />
                            </div>

                            {/* Section 2 */}
                            <div id="section-professional">
                                <h2 className="text-xl font-bold text-neutral-400 mb-4 uppercase tracking-wider">Professional Profile</h2>
                                <ProfessionalSection 
                                    profile={profile} 
                                    handleProfileChange={handleProfileChange} 
                                    expandedSections={expandedSections} 
                                    toggleSection={toggleSection} 
                                    improvingSection={improvingSection}
                                    aiImprovements={aiImprovements}
                                    handleAIImprove={handleAIImprove}
                                    suggestedSkills={suggestedSkills}
                                    isSuggestingSkills={isSuggestingSkills}
                                    fetchSuggestedSkills={fetchSuggestedSkills}
                                />
                            </div>

                            {/* Section 3 */}
                            <div id="section-experience">
                                 <h2 className="text-xl font-bold text-neutral-400 mb-4 uppercase tracking-wider">Work Experience</h2>
                                 <ExperienceSection 
                                    workExperience={workExperience} 
                                    setWorkExperience={setWorkExperience} 
                                    expandedSections={expandedSections} 
                                    toggleSection={toggleSection} 
                                    improvingSection={improvingSection}
                                    aiImprovements={aiImprovements}
                                    handleAIImprove={handleAIImprove}
                                />
                            </div>

                            {/* Section 4 */}
                            <div id="section-projects">
                                 <h2 className="text-xl font-bold text-neutral-400 mb-4 uppercase tracking-wider">Projects & Extras</h2>
                                 <ProjectsSection 
                                    projects={projects} 
                                    setProjects={setProjects} 
                                    expandedSections={expandedSections} 
                                    toggleSection={toggleSection} 
                                    improvingSection={improvingSection}
                                    aiImprovements={aiImprovements}
                                    handleAIImprove={handleAIImprove}
                                />

                                {customSections.map(section => (
                                    <CustomSection 
                                        key={section.id}
                                        section={section}
                                        updateSection={updateCustomSection}
                                        removeSection={removeCustomSection}
                                        expandedSections={expandedSections}
                                        toggleSection={toggleSection}
                                        handleAIImprove={handleAIImprove}
                                        improvingSection={improvingSection}
                                        aiImprovements={aiImprovements}
                                    />
                                ))}

                                <button 
                                    onClick={addCustomSection}
                                    className="w-full py-4 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-500 transition-all font-bold mb-8"
                                >
                                    + Add Custom Section
                                </button>
                            </div>
                            
                            <FinalizeSection 
                                isDownloading={isDownloading} 
                                handleDownload={handleDownload} 
                            />
                        </div>
                    )}
                </div>

                {/* Sticky Preview Sidebar */}
                <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 overflow-hidden shadow-2xl mt-12">
                            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-[#111]">
                                <h3 className="font-bold text-neutral-400 text-sm">Live Preview</h3>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedTemplate}
                                        onChange={e => setSelectedTemplate(e.target.value)}
                                        className="bg-neutral-800 text-white text-xs rounded px-2 py-1 border border-neutral-700 outline-none"
                                    >
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-neutral-400 hover:text-white px-1">-</button>
                                    <span className="text-xs text-neutral-500 py-1">{zoom}%</span>
                                    <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-neutral-400 hover:text-white px-1">+</button>
                                </div>
                            </div>
                            <div className="bg-neutral-800 p-8 h-[700px] overflow-hidden relative">
                                <div
                                    className="bg-white text-black shadow-xl mx-auto inset-0 origin-top-left transition-transform duration-200"
                                    style={{
                                        width: '210mm',
                                        minHeight: '297mm',
                                        transform: `scale(${zoom / 100})`,
                                        marginBottom: `-${(100 - zoom) * 10}px`,
                                    }}
                                >
                                    <div className="p-[20mm] h-full">
                                        {renderTemplate({
                                            selectedTemplate,
                                            templates,
                                            profile,
                                            hasWorkExperience: workExperience.length > 0,
                                            workExperience,
                                            hasEducation: education.length > 0,
                                            education,
                                            hasProjects: projects.length > 0,
                                            projects,
                                            customSections
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-neutral-800 p-4 z-40">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="px-6 py-3 rounded-lg font-bold text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                    >
                        ← Previous
                    </button>

                    <div className="text-sm text-neutral-500 hidden md:block">
                        {saving ? "Saving..." : "All changes saved"}
                    </div>

                    <button
                        onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                        disabled={currentStep === 4}
                        className="px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {currentStep === 4 ? 'Finish' : 'Next Step →'}
                    </button>
                </div>
            </div>

            {/* Mobile Preview Modal */}
            <AnimatePresence>
                {showPreviewMobile && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className="fixed inset-0 z-[60] bg-black flex flex-col"
                    >
                        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                            <h2 className="font-bold">Resume Preview</h2>
                            <button onClick={() => setShowPreviewMobile(false)} className="text-neutral-400 p-2">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-neutral-900 p-4">
                            <div className="bg-white text-black p-4 min-h-[500px] text-xs">
                                {renderTemplate({
                                    selectedTemplate,
                                    templates: templates.map(t => ({ ...t, font: 'Arial, sans-serif' })),
                                    profile,
                                    hasWorkExperience: workExperience.length > 0,
                                    workExperience,
                                    hasEducation: education.length > 0,
                                    education,
                                    hasProjects: projects.length > 0,
                                    projects,
                                    customSections
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
