import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { renderTemplate } from './ResumeTemplates.jsx';

function ResumeBuilder() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('professional');
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
    const [workExperience, setWorkExperience] = useState([{
        id: 1,
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: '',
        current: false
    }]);
    const [education, setEducation] = useState([{
        id: 1,
        school: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
        current: false
    }]);
    const [hasWorkExperience, setHasWorkExperience] = useState(true);
    const [hasEducation, setHasEducation] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const templates = [
        { 
            id: 'professional', 
            name: 'Professional', 
            description: 'Clean single-column layout with standard headings',
            font: 'Arial, sans-serif',
            color: '#000',
            isPremium: false
        },
        { 
            id: 'classic', 
            name: 'Classic', 
            description: 'Timeless Georgia font for traditional industries',
            font: 'Georgia, serif',
            color: '#374151',
            isPremium: false
        },
        { 
            id: 'executive', 
            name: 'Executive', 
            description: 'Sophisticated design with Garamond font',
            font: 'Garamond, serif',
            color: '#1e40af',
            isPremium: true
        },
        { 
            id: 'modern', 
            name: 'Modern', 
            description: 'Contemporary with Calibri and bold sections',
            font: 'Calibri, sans-serif',
            color: '#059669',
            isPremium: true
        },
        { 
            id: 'minimalist', 
            name: 'Minimalist', 
            description: 'Ultra-clean Helvetica design with minimal styling',
            font: 'Helvetica, Arial, sans-serif',
            color: '#0891b2',
            isPremium: true
        },
        { 
            id: 'elegant', 
            name: 'Elegant', 
            description: 'Refined Lora font with subtle accents',
            font: 'Lora, Georgia, serif',
            color: '#7c3aed',
            isPremium: true
        }
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (showPreview) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showPreview]);

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = '/login';
                return;
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            // Check premium status
            const { data: subscription } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            setIsPremium(subscription?.plan === 'pro' || subscription?.plan === 'premium');

            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    location: data.location || '',
                    phone: data.phone || '',
                    email: data.email || session.user.email || '',
                    linkedin: data.linkedin || '',
                    professional_summary: data.professional_summary || '',
                    skills: data.skills || '',
                    volunteering: data.volunteering || ''
                });

                // Load work experience if it exists
                if (data.work_experience && Array.isArray(data.work_experience)) {
                    setWorkExperience(data.work_experience);
                }
                
                // Load education if it exists
                if (data.education && Array.isArray(data.education)) {
                    setEducation(data.education);
                }
                
                // Load flags
                if (data.has_work_experience !== undefined) {
                    setHasWorkExperience(data.has_work_experience);
                }
                if (data.has_education !== undefined) {
                    setHasEducation(data.has_education);
                }
            } else {
                // Pre-fill email from auth
                setProfile(prev => ({ ...prev, email: session.user.email || '' }));
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleWorkExperienceChange = (id, field, value) => {
        setWorkExperience(prev =>
            prev.map(exp =>
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        );
    };

    const handleAddWorkExperience = () => {
        const newId = Math.max(...workExperience.map(exp => exp.id), 0) + 1;
        setWorkExperience(prev => [...prev, {
            id: newId,
            company: '',
            position: '',
            start_date: '',
            end_date: '',
            description: '',
            current: false
        }]);
    };

    const handleRemoveWorkExperience = (id) => {
        if (workExperience.length > 1) {
            setWorkExperience(prev => prev.filter(exp => exp.id !== id));
        }
    };

    const handleEducationChange = (id, field, value) => {
        setEducation(prev =>
            prev.map(edu =>
                edu.id === id ? { ...edu, [field]: value } : edu
            )
        );
    };

    const handleAddEducation = () => {
        const newId = Math.max(...education.map(edu => edu.id), 0) + 1;
        setEducation(prev => [...prev, {
            id: newId,
            school: '',
            degree: '',
            field: '',
            start_date: '',
            end_date: '',
            current: false
        }]);
    };

    const handleRemoveEducation = (id) => {
        if (education.length > 1) {
            setEducation(prev => prev.filter(edu => edu.id !== id));
        }
    };

    const handleDownloadResume = async () => {
        setIsDownloading(true);
        
        try {
            // Import required libraries
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).jsPDF;
            
            // Get the preview element
            const previewElement = document.querySelector('[data-resume-preview]');
            
            if (!previewElement) {
                throw new Error('Preview element not found');
            }
            
            // Capture the element as canvas with high quality
            const canvas = await html2canvas(previewElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: previewElement.scrollWidth,
                windowHeight: previewElement.scrollHeight
            });
            
            // Calculate dimensions for A4 page
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Add image to PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            
            // Download the PDF
            const fileName = `${profile.full_name || 'Resume'}_${templates.find(t => t.id === selectedTemplate)?.name}.pdf`;
            pdf.save(fileName);
            
        } catch (error) {
            console.error('Error downloading resume:', error);
            alert('Failed to download resume. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSave = async () => {
        console.log('Save button clicked');
        setSaving(true);
        setSuccessMessage('');
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session:', session);
            
            if (!session) {
                alert('Please log in to save your profile');
                setSaving(false);
                return;
            }

            console.log('Saving profile:', profile);

            const { data, error } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: session.user.id,
                    full_name: profile.full_name,
                    location: profile.location,
                    phone: profile.phone,
                    email: profile.email,
                    linkedin: profile.linkedin,
                    professional_summary: profile.professional_summary,
                    skills: profile.skills,
                    volunteering: profile.volunteering,
                    work_experience: hasWorkExperience ? workExperience : [],
                    education: hasEducation ? education : [],
                    has_work_experience: hasWorkExperience,
                    has_education: hasEducation
                }, {
                    onConflict: 'user_id'
                });

            console.log('Upsert result:', { data, error });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Save successful!');
            setSuccessMessage('Resume information saved successfully!');
            
            // Show template picker after successful save
            setTimeout(() => {
                setShowPreview(true);
            }, 1000);
            
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            console.error('Error saving profile:', err);
            alert(`Error saving profile: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-20 px-4 md:px-10 lg:px-20">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Build Your Resume</h1>
                    <p className="text-neutral-400 text-lg">
                        Save your information once and use it for all your resumes. This information will automatically populate when you download improved resumes.
                    </p>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-500 font-medium">{successMessage}</span>
                    </div>
                )}

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold border-b border-neutral-800 pb-3">Personal Information</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    placeholder="San Francisco, CA"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="+1-234-456-7890"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    LinkedIn
                                </label>
                                <input
                                    type="text"
                                    value={profile.linkedin}
                                    onChange={(e) => handleChange('linkedin', e.target.value)}
                                    placeholder="linkedin.com/in/username"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold border-b border-neutral-800 pb-3">Professional Information</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Professional Summary *
                            </label>
                            <textarea
                                value={profile.professional_summary}
                                onChange={(e) => handleChange('professional_summary', e.target.value)}
                                placeholder="A brief professional summary highlighting your key qualifications, experience, and career objectives..."
                                rows={5}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                            <p className="text-sm text-neutral-500 mt-2">2-3 sentences that highlight your expertise and value</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Skills (comma-separated) *
                            </label>
                            <textarea
                                value={profile.skills}
                                onChange={(e) => handleChange('skills', e.target.value)}
                                placeholder="JavaScript, Python, React, Node.js, Database Management, Project Management, Agile, Leadership"
                                rows={3}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                            <p className="text-sm text-neutral-500 mt-2">List your key technical and soft skills separated by commas</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Volunteering (optional)
                            </label>
                            <textarea
                                value={profile.volunteering}
                                onChange={(e) => handleChange('volunteering', e.target.value)}
                                placeholder="Describe any volunteer work, community involvement, or pro-bono projects..."
                                rows={3}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Work Experience */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <h2 className="text-2xl font-bold">Work Experience</h2>
                            <button
                                type="button"
                                onClick={() => setHasWorkExperience(!hasWorkExperience)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    !hasWorkExperience
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                            >
                                {hasWorkExperience ? "Don't have any" : "Add Work Experience"}
                            </button>
                        </div>
                        
                        {hasWorkExperience && workExperience.map((exp, index) => (
                            <div key={exp.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-white">Experience {index + 1}</h3>
                                    {workExperience.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveWorkExperience(exp.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(e) => handleWorkExperienceChange(exp.id, 'company', e.target.value)}
                                            placeholder="e.g., Google, Microsoft, etc."
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Position/Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={exp.position}
                                            onChange={(e) => handleWorkExperienceChange(exp.id, 'position', e.target.value)}
                                            placeholder="e.g., Senior Software Engineer"
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Start Date *
                                        </label>
                                        <input
                                            type="month"
                                            value={exp.start_date}
                                            onChange={(e) => handleWorkExperienceChange(exp.id, 'start_date', e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            End Date *
                                        </label>
                                        <input
                                            type="month"
                                            value={exp.end_date}
                                            onChange={(e) => handleWorkExperienceChange(exp.id, 'end_date', e.target.value)}
                                            disabled={exp.current}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <label className="flex items-center gap-2 mt-2 text-sm text-neutral-300">
                                            <input
                                                type="checkbox"
                                                checked={exp.current}
                                                onChange={(e) => handleWorkExperienceChange(exp.id, 'current', e.target.checked)}
                                                className="w-4 h-4 bg-neutral-800 border-neutral-700 rounded focus:ring-2 focus:ring-orange-500"
                                            />
                                            Currently working here
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={exp.description}
                                        onChange={(e) => handleWorkExperienceChange(exp.id, 'description', e.target.value)}
                                        placeholder="Describe your responsibilities, achievements, and key projects..."
                                        rows={4}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    />
                                    <p className="text-sm text-neutral-500 mt-2">Use bullet points or paragraphs to describe your role</p>
                                </div>
                            </div>
                        ))}

                        {hasWorkExperience && (
                            <button
                                type="button"
                                onClick={handleAddWorkExperience}
                                className="w-full px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Another Work Experience
                            </button>
                        )}
                    </div>

                    {/* Education */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <h2 className="text-2xl font-bold">Education</h2>
                            <button
                                type="button"
                                onClick={() => setHasEducation(!hasEducation)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    !hasEducation
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                            >
                                {hasEducation ? "Don't have any" : "Add Education"}
                            </button>
                        </div>
                        
                        {hasEducation && education.map((edu, index) => (
                            <div key={edu.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-white">Education {index + 1}</h3>
                                    {education.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEducation(edu.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            School/University *
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.school}
                                            onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
                                            placeholder="e.g., MIT, Stanford, etc."
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Degree *
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.degree}
                                            onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                                            placeholder="e.g., Bachelor of Science"
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Field of Study *
                                    </label>
                                    <input
                                        type="text"
                                        value={edu.field}
                                        onChange={(e) => handleEducationChange(edu.id, 'field', e.target.value)}
                                        placeholder="e.g., Computer Science"
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Start Date *
                                        </label>
                                        <input
                                            type="month"
                                            value={edu.start_date}
                                            onChange={(e) => handleEducationChange(edu.id, 'start_date', e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            End Date *
                                        </label>
                                        <input
                                            type="month"
                                            value={edu.end_date}
                                            onChange={(e) => handleEducationChange(edu.id, 'end_date', e.target.value)}
                                            disabled={edu.current}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <label className="flex items-center gap-2 mt-2 text-sm text-neutral-300">
                                            <input
                                                type="checkbox"
                                                checked={edu.current}
                                                onChange={(e) => handleEducationChange(edu.id, 'current', e.target.checked)}
                                                className="w-4 h-4 bg-neutral-800 border-neutral-700 rounded focus:ring-2 focus:ring-orange-500"
                                            />
                                            Currently studying here
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {hasEducation && (
                            <button
                                type="button"
                                onClick={handleAddEducation}
                                className="w-full px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Another Education
                            </button>
                        )}
                    </div>

                    {/* Note */}
                    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                        <p className="text-sm text-neutral-300">
                            <strong className="text-white">💡 Note:</strong> This information will be used to populate your downloaded resumes. Your work experience and education will still come from the resumes you upload for analysis.
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-neutral-700 disabled:to-neutral-600 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                </svg>
                                Save Resume Information
                            </>
                        )}
                    </button>

            {/* Template Picker & Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 w-full h-full">
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-700 max-w-5xl w-full max-h-[85vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold">Choose Your Template</h2>
                                <p className="text-neutral-400 text-sm mt-1">Select a design and preview your resume</p>
                            </div>
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="text-neutral-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        {/* Template Selection */}
                        <div className="p-6 border-b border-neutral-700">
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="w-full flex items-center justify-between bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white hover:bg-neutral-700 transition-colors"
                            >
                                <div className="text-left">
                                    <span className="block text-sm font-medium text-neutral-300">Select Template</span>
                                    <span className="block text-xs text-neutral-400 mt-1">
                                        {templates.find(t => t.id === selectedTemplate)?.name} - {templates.find(t => t.id === selectedTemplate)?.description}
                                    </span>
                                </div>
                                <svg
                                    className={`w-5 h-5 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showTemplates && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    {templates.map(template => {
                                        const isLocked = template.isPremium && !isPremium;
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => {
                                                    if (isLocked) {
                                                        alert('This template is only available for Pro members. Upgrade to unlock all premium templates!');
                                                        return;
                                                    }
                                                    setSelectedTemplate(template.id);
                                                    setShowTemplates(false);
                                                }}
                                                className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                                                    selectedTemplate === template.id
                                                        ? 'border-orange-500 bg-orange-500/10'
                                                        : isLocked
                                                        ? 'border-neutral-700 bg-neutral-800/50 opacity-75'
                                                        : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800'
                                                }`}
                                            >
                                                {template.isPremium && (
                                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 z-20 shadow-lg">
                                                        {isLocked && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        PRO
                                                    </div>
                                                )}
                                                <div className="aspect-[8.5/11] bg-white rounded mb-3 overflow-hidden relative shadow-md">
                                                    {isLocked && (
                                                        <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                                                            <div className="text-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-12 h-12 mx-auto mb-2">
                                                                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                                                </svg>
                                                                <div className="text-white text-xs font-semibold">Pro Only</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div 
                                                        className="w-full h-full p-3 text-black text-[6px] leading-tight overflow-hidden"
                                                        style={{ fontFamily: template.font }}
                                                    >
                                                        {/* Professional */}
                                                        {template.id === 'professional' && (
                                                            <div className="text-center">
                                                                <div className="font-bold text-[9px] mb-1">John Doe</div>
                                                                <div className="text-[5px] mb-2 pb-1 border-b" style={{ borderColor: template.color }}>New York | 555-1234 | john@email.com</div>
                                                                <div className="text-left mb-2">
                                                                    <div className="font-bold text-[6px] mb-1 uppercase tracking-wide" style={{ color: template.color }}>Professional Summary</div>
                                                                    <div className="text-[5px] leading-relaxed">Results-driven professional with 5+ years of experience in software development and project management.</div>
                                                                </div>
                                                                <div className="text-left mb-2">
                                                                    <div className="font-bold text-[6px] mb-1 uppercase tracking-wide" style={{ color: template.color }}>Skills</div>
                                                                    <div className="text-[5px]">JavaScript • React • Python • SQL</div>
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="font-bold text-[6px] uppercase tracking-wide" style={{ color: template.color }}>Work Experience</div>
                                                                    <div className="text-[5px] font-bold mt-1">Senior Software Engineer</div>
                                                                    <div className="text-[5px]">Tech Corp • 2020 - Present</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Classic */}
                                                        {template.id === 'classic' && (
                                                            <div className="text-center">
                                                                <div className="font-bold text-[9px] mb-1">John Doe</div>
                                                                <div className="text-[5px] mb-2 pb-1 border-b border-neutral-400">New York | 555-1234 | john@email.com</div>
                                                                <div className="text-left mb-2">
                                                                    <div className="font-bold text-[6px] mb-1 border-b border-neutral-300 pb-0.5">SUMMARY</div>
                                                                    <div className="text-[5px] leading-relaxed">Experienced professional with proven track record in delivering high-quality results.</div>
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="font-bold text-[6px] border-b border-neutral-300 pb-0.5 mb-1">EXPERIENCE</div>
                                                                    <div className="text-[5px] font-bold">Software Engineer</div>
                                                                    <div className="text-[5px] italic mb-1">Tech Corp</div>
                                                                    <div className="text-[5px]">Led development of key features</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Executive */}
                                                        {template.id === 'executive' && (
                                                            <div>
                                                                <div className="font-bold text-[10px] mb-1" style={{ color: template.color }}>John Doe</div>
                                                                <div className="text-[5px] mb-2">New York<br/>555-1234<br/>john@email.com</div>
                                                                <div className="mb-2">
                                                                    <div className="font-bold text-[6px] mb-1 pb-1 border-b-2" style={{ borderColor: template.color }}>PROFESSIONAL SUMMARY</div>
                                                                    <div className="text-[5px] leading-relaxed">Executive leader with extensive experience in strategic planning and team development.</div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-[6px] pb-1 border-b-2 mb-1" style={{ borderColor: template.color }}>EXPERIENCE</div>
                                                                    <div className="text-[5px] font-bold" style={{ color: template.color }}>Senior Director of Engineering</div>
                                                                    <div className="text-[5px]">Global Tech Inc • 2018 - Present</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Modern */}
                                                        {template.id === 'modern' && (
                                                            <div>
                                                                <div className="font-bold text-[10px] mb-1 pb-1 border-b-2" style={{ borderColor: template.color }}>John Doe</div>
                                                                <div className="text-[5px] mb-2">New York | 555-1234 | john@email.com</div>
                                                                <div className="mb-2">
                                                                    <div className="font-bold text-[6px] mb-1" style={{ color: template.color }}>PROFILE</div>
                                                                    <div className="text-[5px] leading-relaxed">Modern professional with passion for innovative solutions and collaborative work environments.</div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-[6px] mb-1" style={{ color: template.color }}>EXPERIENCE</div>
                                                                    <div className="pl-2 border-l-2 mb-1" style={{ borderColor: template.color }}>
                                                                        <div className="text-[5px] font-bold">Full Stack Developer</div>
                                                                        <div className="text-[5px]">Tech Innovations • 2019 - Present</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Minimalist */}
                                                        {template.id === 'minimalist' && (
                                                            <div>
                                                                <div className="font-light text-[11px] mb-2">John Doe</div>
                                                                <div className="text-[5px] text-neutral-600 mb-2">New York | 555-1234 | john@email.com</div>
                                                                <div className="text-[5px] mb-2 leading-relaxed">Clean and minimal professional with focus on user experience and interface design.</div>
                                                                <div className="mb-2">
                                                                    <div className="text-[4px] font-bold uppercase text-neutral-500 mb-1 tracking-widest">Experience</div>
                                                                    <div className="text-[5px] font-semibold">UX Designer</div>
                                                                    <div className="text-[5px] text-neutral-600">Design Studio Co • 2020 - Present</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Elegant */}
                                                        {template.id === 'elegant' && (
                                                            <div className="text-center">
                                                                <div className="font-bold text-[10px] mb-2 pb-1 border-b-2" style={{ borderColor: template.color }}>John Doe</div>
                                                                <div className="text-[5px] mb-2">New York • 555-1234 • john@email.com</div>
                                                                <div className="text-left mb-2">
                                                                    <div className="font-bold text-[6px] mb-1" style={{ color: template.color }}>Professional Summary</div>
                                                                    <div className="text-[5px] leading-relaxed">Elegant professional with refined approach to problem-solving and client relations.</div>
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="font-bold text-[6px] mb-1" style={{ color: template.color }}>Experience</div>
                                                                    <div className="text-[5px] font-bold">Senior Consultant</div>
                                                                    <div className="text-[5px]">Advisory Partners • 2019 - Present</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                                                <p className="text-xs text-neutral-400 mt-1">{template.description}</p>
                                                {selectedTemplate === template.id && !isLocked && (
                                                    <div className="mt-2 flex items-center gap-1 text-orange-500 text-xs">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                        </svg>
                                                        Selected
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Resume Preview */}
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Preview</h3>
                            <div 
                                data-resume-preview
                                className="bg-white text-black p-8 rounded-lg shadow-2xl max-w-[210mm] mx-auto"
                                style={{ fontFamily: templates.find(t => t.id === selectedTemplate)?.font }}
                            >
                                {renderTemplate({ 
                                    selectedTemplate, 
                                    templates, 
                                    profile, 
                                    hasWorkExperience, 
                                    workExperience, 
                                    hasEducation, 
                                    education 
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-700 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        window.location.href = '/account';
                                    }}
                                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    Analyze Resume
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        // TODO: Implement job description tailoring
                                        alert('Tailor for job description feature coming soon!');
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                    </svg>
                                    Tailor for Job
                                </button>
                                <button
                                    onClick={handleDownloadResume}
                                    disabled={isDownloading}
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                            Download Resume
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    );
}

export default ResumeBuilder;
