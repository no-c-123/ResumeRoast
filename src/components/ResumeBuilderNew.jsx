import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authService, dbService } from '../services/supabase';
import { renderTemplate } from './ResumeTemplates.jsx';
import Loader from './uicomponents/Loader.jsx';
import { logger } from '../lib/logger';

// --- Sub-components ---

const SectionHeader = ({ icon, title, subtitle, isComplete, isOpen, onToggle }) => (
    <div 
        className={`flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors ${isOpen ? 'bg-white/5' : ''}`}
        onClick={onToggle}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isComplete ? 'bg-green-500/20 text-green-500' : 'bg-neutral-800 text-neutral-400'}`}>
                {isComplete ? '✓' : icon}
            </div>
            <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {title}
                    {isComplete && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Complete</span>}
                </h3>
                {subtitle && <p className="text-neutral-500 text-sm">{subtitle}</p>}
            </div>
        </div>
        <div className="text-neutral-500">
            {isOpen ? '▲' : '▼'}
        </div>
    </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", error, icon, helper }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-400">
            {label} {error && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-[#111] border rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all ${
                    error 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : value 
                            ? 'border-green-500/30 focus:border-green-500 focus:ring-green-500/20' 
                            : 'border-neutral-700 focus:border-orange-500 focus:ring-orange-500/20'
                }`}
            />
            {value && !error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    ✓
                </div>
            )}
        </div>
        {helper && <p className="text-xs text-neutral-500">{helper}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

const TextArea = ({ label, value, onChange, placeholder, maxLength, aiAssist = true }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-neutral-400">{label}</label>
            {maxLength && (
                <span className={`text-xs ${value?.length > maxLength ? 'text-red-500' : 'text-neutral-500'}`}>
                    {value?.length || 0}/{maxLength}
                </span>
            )}
        </div>
        <div className="relative">
            <textarea
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                rows={6}
                className="w-full bg-[#111] border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
            />
            {aiAssist && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xs font-bold text-white hover:opacity-90 transition-opacity">
                        <span>🤖</span> AI Improve
                    </button>
                </div>
            )}
        </div>
    </div>
);

export default function ResumeBuilderNew({ initialMode = 'editor' }) {
    const { user, profile: contextProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showPreviewMobile, setShowPreviewMobile] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ 1: true }); // Section ID -> bool
    
    // Resume Data State
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
    
    // UI State
    const [selectedTemplate, setSelectedTemplate] = useState('professional');
    const [zoom, setZoom] = useState(50);

    const steps = [
        { id: 1, title: 'Personal', icon: '👤' },
        { id: 2, title: 'Professional', icon: '✨' },
        { id: 3, title: 'Experience', icon: '💼' },
        { id: 4, title: 'Finalize', icon: '✅' }
    ];

    const templates = [
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
    }, [user, contextProfile]);

    // Auto-save to DB
    useEffect(() => {
        if (!loading && user) {
            const timer = setTimeout(async () => {
                setSaving(true);
                try {
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
                        updated_at: new Date().toISOString()
                    };
                    
                    await dbService.upsertProfile(profileData);
                    setLastSaved(new Date());
                } catch (error) {
                    logger.error('Error auto-saving profile:', error);
                } finally {
                    setSaving(false);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [profile, workExperience, education, projects, user, loading]);

    const fetchProfile = async () => {
        try {
            if (!user) return;
            const data = contextProfile || await dbService.getProfile(user.id);
            
            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    location: data.location || '',
                    phone: data.phone || '',
                    email: data.email || user.email || '',
                    linkedin: data.linkedin || '',
                    education: data.education || [],
                    professional_summary: data.professional_summary || '',
                    skills: data.skills || '',
                    volunteering: data.volunteering || ''
                });
                setWorkExperience(data.work_experience || []);
                setProjects(data.projects || []);
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
    

    const renderEducation = () => (
        <div className="bg-[#1a1a1a] border-l-4 border-yellow-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader 
                icon="🎓" 
                title="Education" 
                subtitle={`${education.length} schools added`}
                isComplete={education.length > 0}
                isOpen={expandedSections['education']}
                onToggle={() => toggleSection('education')}
            />
            <div 
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    expandedSections['education'] ? 'max-h-[2000px]' : 'max-h-0'
                }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    {education.map((edu, i) => (
                        <div key={i} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 relative space-y-4">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-white text-sm">Education {i + 1}</h4>
                                <button 
                                    className="text-red-500 hover:text-red-400 text-xs"
                                    onClick={() => {
                                        const newEdu = education.filter((_, idx) => idx !== i);
                                        setEducation(newEdu);
                                    }}
                                >Remove</button>
                            </div>
                            
                            <InputField 
                                label="School / University"
                                value={edu.school}
                                onChange={(e) => {
                                    const newEdu = [...education];
                                    newEdu[i] = { ...newEdu[i], school: e.target.value };
                                    setEducation(newEdu);
                                }}
                                placeholder="e.g. Stanford University"
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label="Degree"
                                    value={edu.degree}
                                    onChange={(e) => {
                                        const newEdu = [...education];
                                        newEdu[i] = { ...newEdu[i], degree: e.target.value };
                                        setEducation(newEdu);
                                    }}
                                    placeholder="e.g. BS Computer Science"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <InputField 
                                        label="Start"
                                        value={edu.start_date}
                                        onChange={(e) => {
                                            const newEdu = [...education];
                                            newEdu[i] = { ...newEdu[i], start_date: e.target.value };
                                            setEducation(newEdu);
                                        }}
                                        placeholder="2020"
                                    />
                                    <InputField 
                                        label="End"
                                        value={edu.end_date}
                                        onChange={(e) => {
                                            const newEdu = [...education];
                                            newEdu[i] = { ...newEdu[i], end_date: e.target.value };
                                            setEducation(newEdu);
                                        }}
                                        placeholder="2024"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button 
                        className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all"
                        onClick={() => {
                            const newEdu = { school: '', degree: '', start_date: '', end_date: '' };
                            setEducation([...education, newEdu]);
                        }}
                    >
                        + Add Education
                    </button>
                </div>
            </div>
        </div>
    );

    const renderPersonal = () => (
        <div className="bg-[#1a1a1a] border-l-4 border-orange-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader 
                icon="👤" 
                title="Personal Information" 
                subtitle="Start with the basics"
                isComplete={profile.full_name && profile.email && profile.phone}
                isOpen={expandedSections['personal']}
                onToggle={() => toggleSection('personal')}
            />
            
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedSections['personal'] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    <InputField 
                        label="Full Name" 
                        value={profile.full_name} 
                        onChange={e => handleProfileChange('full_name', e.target.value)}
                        placeholder="e.g. Hector Leal"
                        helper="Your name as it should appear on your resume"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            label="Location" 
                            value={profile.location} 
                            onChange={e => handleProfileChange('location', e.target.value)}
                            placeholder="City, Country"
                            icon="📍"
                        />
                        <InputField 
                            label="Phone" 
                            value={profile.phone} 
                            onChange={e => handleProfileChange('phone', e.target.value)}
                            placeholder="(555) 123-4567"
                            icon="📱"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            label="Email" 
                            value={profile.email} 
                            onChange={e => handleProfileChange('email', e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                        />
                        <InputField 
                            label="LinkedIn" 
                            value={profile.linkedin} 
                            onChange={e => handleProfileChange('linkedin', e.target.value)}
                            placeholder="linkedin.com/in/username"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProfessional = () => (
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
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        expandedSections['summary'] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="bg-[#151515] border-t border-neutral-800 p-6">
                        <TextArea 
                            label="Summary"
                            value={profile.professional_summary}
                            onChange={e => handleProfileChange('professional_summary', e.target.value)}
                            placeholder="Motivated professional with experience in..."
                            maxLength={400}
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
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        expandedSections['skills'] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
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
                            <h4 className="text-blue-400 text-sm font-bold mb-2">💡 Suggested Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Team Leadership', 'Agile', 'Git', 'Problem Solving'].map(s => (
                                    <button 
                                        key={s} 
                                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors"
                                        onClick={() => {
                                            const current = profile.skills || '';
                                            const separator = current.trim().endsWith(',') || current === '' ? '' : ', ';
                                            handleProfileChange('skills', current + separator + s);
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

    const renderExperience = () => (
        <>
            {/* Work Experience */}
            <div className="bg-[#1a1a1a] border-l-4 border-green-500 rounded-r-xl overflow-hidden mb-6">
                <SectionHeader 
                    icon="💼" 
                    title="Work Experience" 
                    subtitle={`${workExperience.length} positions added`}
                    isComplete={workExperience.length > 0}
                    isOpen={expandedSections['work']}
                    onToggle={() => toggleSection('work')}
                />
                <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        expandedSections['work'] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                        {workExperience.length === 0 ? (
                            <div className="text-center py-8 bg-neutral-900 rounded-lg border border-neutral-800 border-dashed">
                                <p className="text-neutral-500 mb-4">No work experience added yet.</p>
                                <button 
                                    className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
                                    onClick={() => {
                                        const newExp = { position: '', company: '', start_date: '', end_date: '' };
                                        setWorkExperience([...workExperience, newExp]);
                                    }}
                                >
                                    + Add Position
                                </button>
                            </div>
                        ) : (
                            workExperience.map((exp, i) => (
                                <div key={i} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white text-sm">Position {i + 1}</h4>
                                        <button 
                                            className="text-red-500 hover:text-red-400 text-xs"
                                            onClick={() => {
                                                const newExp = workExperience.filter((_, idx) => idx !== i);
                                                setWorkExperience(newExp);
                                            }}
                                        >Remove</button>
                                    </div>
                                    
                                    <InputField 
                                        label="Job Title"
                                        value={exp.position}
                                        onChange={(e) => {
                                            const newExp = [...workExperience];
                                            newExp[i] = { ...newExp[i], position: e.target.value };
                                            setWorkExperience(newExp);
                                        }}
                                        placeholder="e.g. Senior Software Engineer"
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField 
                                            label="Company"
                                            value={exp.company}
                                            onChange={(e) => {
                                                const newExp = [...workExperience];
                                                newExp[i] = { ...newExp[i], company: e.target.value };
                                                setWorkExperience(newExp);
                                            }}
                                            placeholder="e.g. Tech Corp"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <InputField 
                                                label="Start"
                                                value={exp.start_date}
                                                onChange={(e) => {
                                                    const newExp = [...workExperience];
                                                    newExp[i] = { ...newExp[i], start_date: e.target.value };
                                                    setWorkExperience(newExp);
                                                }}
                                                placeholder="2020"
                                            />
                                            <InputField 
                                                label="End"
                                                value={exp.end_date}
                                                onChange={(e) => {
                                                    const newExp = [...workExperience];
                                                    newExp[i] = { ...newExp[i], end_date: e.target.value };
                                                    setWorkExperience(newExp);
                                                }}
                                                placeholder="Present"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {workExperience.length > 0 && (
                            <button 
                                className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all"
                                onClick={() => {
                                    const newExp = { position: '', company: '', start_date: '', end_date: '' };
                                    setWorkExperience([...workExperience, newExp]);
                                }}
                            >
                                + Add Another Position
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Projects */}
            <div className="bg-[#1a1a1a] border-l-4 border-pink-500 rounded-r-xl overflow-hidden mb-6">
                <SectionHeader 
                    icon="🚀" 
                    title="Projects" 
                    subtitle={`${projects.length} projects added`}
                    isComplete={projects.length > 0}
                    isOpen={expandedSections['projects']}
                    onToggle={() => toggleSection('projects')}
                />
                <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        expandedSections['projects'] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                        {projects.map((proj, i) => (
                            <div key={i} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white text-sm">Project {i + 1}</h4>
                                    <button 
                                        className="text-red-500 hover:text-red-400 text-xs"
                                        onClick={() => {
                                            const newProjects = projects.filter((_, idx) => idx !== i);
                                            setProjects(newProjects);
                                        }}
                                    >Remove</button>
                                </div>
                                
                                <InputField 
                                    label="Project Title"
                                    value={proj.title}
                                    onChange={(e) => {
                                        const newProjects = [...projects];
                                        newProjects[i] = { ...newProjects[i], title: e.target.value };
                                        setProjects(newProjects);
                                    }}
                                    placeholder="e.g. Portfolio Website"
                                />
                                
                                <TextArea 
                                    label="Description"
                                    value={proj.description}
                                    onChange={(e) => {
                                        const newProjects = [...projects];
                                        newProjects[i] = { ...newProjects[i], description: e.target.value };
                                        setProjects(newProjects);
                                    }}
                                    placeholder="Describe what you built..."
                                    maxLength={200}
                                    aiAssist={false}
                                />
                            </div>
                        ))}
                        <button 
                            className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all"
                            onClick={() => {
                                const newProj = { title: '', description: '', link: '' };
                                setProjects([...projects, newProj]);
                            }}
                        >
                            + Add Project
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    const renderFinalize = () => (
        <div className="space-y-6 text-center py-12">
            <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center text-5xl mb-6">
                🎉
            </div>
            <h2 className="text-3xl font-bold text-white">Resume Complete!</h2>
            <p className="text-neutral-400 max-w-md mx-auto">
                You've filled out all the sections. Now preview your resume, choose a template, and download it.
            </p>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={() => {}} // Handle download
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-bold text-white hover:shadow-lg transition-all"
                >
                    Download PDF
                </button>
                <a 
                    href="/analyzing"
                    className="px-8 py-3 bg-neutral-800 border border-neutral-700 rounded-lg font-bold text-white hover:bg-neutral-700 transition-all"
                >
                    Analyze Score
                </a>
            </div>
        </div>
    );

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
                            className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${
                                currentStep === step.id 
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
                        <span className="text-xs text-neutral-500 hidden md:inline">Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    )}
                    <button 
                        onClick={() => setShowPreviewMobile(true)}
                        className="lg:hidden px-4 py-2 bg-neutral-800 rounded-lg text-sm font-bold"
                    >
                        👁️ Preview
                    </button>
                    <button className="hidden md:block px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors">
                        Download
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="pt-24 pb-32 px-4 lg:px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Form Area */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                    {/* Hero */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Build Your Professional Story</h1>
                        <p className="text-neutral-400">Save once, use everywhere. Your information automatically populates all future resumes.</p>
                    </div>

                    {/* Steps Content */}
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
                                    {renderPersonal()}
                                    {renderEducation()}
                                </>
                            )}
                            {currentStep === 2 && renderProfessional()}
                            {currentStep === 3 && renderExperience()}
                            {currentStep === 4 && renderFinalize()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Sticky Preview Sidebar */}
                <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 overflow-hidden shadow-2xl">
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
                                            projects
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
                                    templates: templates.map(t => ({...t, font: 'Arial, sans-serif'})),
                                    profile,
                                    hasWorkExperience: workExperience.length > 0,
                                    workExperience,
                                    hasEducation: education.length > 0,
                                    education,
                                    hasProjects: projects.length > 0,
                                    projects
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
