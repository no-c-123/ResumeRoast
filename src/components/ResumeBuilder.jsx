import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { renderTemplate } from './ResumeTemplates.jsx';
import { checkDownloadLimit, recordDownload, checkAiLimit } from '../lib/subscriptionUtils';
import UpgradeModal from './UpgradeModal.jsx';
import { extractTextFromFile } from '../lib/fileParser.js';
import { parseResumeTextToStructuredData } from '../lib/resumeParser.js';
import Loader from './uicomponents/Loader.jsx';
import { logger } from '../lib/logger';

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
    const [projects, setProjects] = useState([{ id: 1, title: '', link: '', description: '', tech: '' }]);
    const [hasProjects, setHasProjects] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isImproving, setIsImproving] = useState(false);
    const [improvedResume, setImprovedResume] = useState(null);
    const [improvementNotes, setImprovementNotes] = useState('');
    const [showImprovementNotes, setShowImprovementNotes] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [showUploadOption, setShowUploadOption] = useState(false);
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [featureName, setFeatureName] = useState('');
    const [aiLimit, setAiLimit] = useState(null);

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

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
            color: '#000',
            isPremium: false
        },
        { 
            id: 'executive', 
            name: 'Executive', 
            description: 'Sophisticated design with Garamond font',
            font: 'Garamond, serif',
            color: '#000',
            isPremium: true
        },
        { 
            id: 'modern', 
            name: 'Modern', 
            description: 'Contemporary with Calibri and bold sections',
            font: 'Calibri, sans-serif',
            color: '#000',
            isPremium: true
        },
        { 
            id: 'minimalist', 
            name: 'Minimalist', 
            description: 'Ultra-clean Helvetica design with minimal styling',
            font: 'Helvetica, Arial, sans-serif',
            color: '#000',
            isPremium: true
        },
        { 
            id: 'elegant', 
            name: 'Elegant', 
            description: 'Refined Lora font with subtle accents',
            font: 'Lora, Georgia, serif',
            color: '#000',
            isPremium: true
        }
    ];

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isNew = urlParams.get('new') === 'true';
        setIsNewUser(isNew);
        setShowUploadOption(isNew);
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

    useEffect(() => {
        const fetchLimits = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                 const limit = await checkAiLimit(session.user.id);
                 setAiLimit(limit);
            }
        };
        fetchLimits();
    }, []);

    // Helper to check if a value is a placeholder from AI
    const isPlaceholder = (value) => {
        if (!value || typeof value !== 'string') return false;
        const trimmed = value.trim();
        return (trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.toLowerCase().includes('please add');
    };

    // Helper to get clean value
    const getCleanValue = (improvedVal, originalVal) => {
        if (improvedVal && !isPlaceholder(improvedVal)) {
            return improvedVal;
        }
        return originalVal || '';
    };

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = '/login';
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const isImproved = urlParams.get('improved') === 'true';
            const isTailored = urlParams.get('tailored') === 'true';

            let improvedData = null;
            let tailoredData = null;

            if (isImproved) {
                const stored = localStorage.getItem('improvedResumeData');
                if (stored) {
                    improvedData = JSON.parse(stored);
                    setImprovedResume(improvedData);
                    const notes = localStorage.getItem('improvementNotes');
                    if (notes) {
                        const notesArray = JSON.parse(notes);
                        setImprovementNotes(Array.isArray(notesArray) ? notesArray.join('\n') : notesArray);
                        setShowImprovementNotes(true);
                    }
                    localStorage.removeItem('improvedResumeData');
                    localStorage.removeItem('improvementNotes');
                }
            }

            if (isTailored) {
                const stored = localStorage.getItem('tailoredResumeData');
                if (stored) {
                    tailoredData = JSON.parse(stored);
                    setImprovedResume(tailoredData);
                    const tailorResult = localStorage.getItem('tailorResult');
                    if (tailorResult) {
                        const result = JSON.parse(tailorResult);
                        setImprovementNotes(`Tailored for job posting (Match Score: ${result.matchScore}%)\n\nKey Changes:\n${(result.keyChanges || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}`);
                        setShowImprovementNotes(true);
                    }
                    localStorage.removeItem('tailoredResumeData');
                    localStorage.removeItem('tailorResult');
                }
            }

            const dataToUse = improvedData || tailoredData;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            const { data: subscription } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            setIsPremium(subscription?.plan === 'pro' || subscription?.plan === 'premium');

            if (dataToUse) {
                setProfile({
                    full_name: getCleanValue(dataToUse.profile?.full_name, data?.full_name),
                    location: getCleanValue(dataToUse.profile?.location, data?.location),
                    phone: getCleanValue(dataToUse.profile?.phone, data?.phone),
                    email: getCleanValue(dataToUse.profile?.email, data?.email || session.user.email),
                    linkedin: getCleanValue(dataToUse.profile?.linkedin, data?.linkedin),
                    professional_summary: getCleanValue(dataToUse.profile?.professional_summary, data?.professional_summary),
                    skills: getCleanValue(dataToUse.profile?.skills, data?.skills),
                    volunteering: getCleanValue(dataToUse.profile?.volunteering, data?.volunteering)
                });

                if (dataToUse.work_experience && Array.isArray(dataToUse.work_experience) && dataToUse.work_experience.length > 0) {
                    const formattedWork = dataToUse.work_experience.map((exp, idx) => ({
                        id: idx + 1,
                        company: getCleanValue(exp.company, ''),
                        position: getCleanValue(exp.position, ''),
                        start_date: exp.start_date || '',
                        end_date: exp.end_date || '',
                        description: getCleanValue(exp.description, ''),
                        location: getCleanValue(exp.location, ''),
                        current: exp.end_date?.toLowerCase() === 'present' || exp.current || false
                    }));
                    setWorkExperience(formattedWork);
                    setHasWorkExperience(true);
                } else if (data?.work_experience && Array.isArray(data.work_experience)) {
                    setWorkExperience(data.work_experience);
                }

                if (dataToUse.education && Array.isArray(dataToUse.education) && dataToUse.education.length > 0) {
                    const formattedEdu = dataToUse.education.map((edu, idx) => ({
                        id: idx + 1,
                        school: getCleanValue(edu.institution || edu.school, ''),
                        degree: getCleanValue(edu.degree, ''),
                        field: '',
                        start_date: '',
                        end_date: edu.graduation_date || '',
                        current: false
                    }));
                    setEducation(formattedEdu);
                    setHasEducation(true);
                } else if (data?.education && Array.isArray(data.education)) {
                    setEducation(data.education);
                }

                if (dataToUse.projects && Array.isArray(dataToUse.projects) && dataToUse.projects.length > 0) {
                    const formattedProjects = dataToUse.projects.map((proj, idx) => ({
                        id: idx + 1,
                        title: getCleanValue(proj.title, ''),
                        link: getCleanValue(proj.link, ''),
                        description: getCleanValue(proj.description, ''),
                        tech: getCleanValue(proj.tech, '')
                    }));
                    setProjects(formattedProjects);
                    setHasProjects(true);
                } else if (data?.projects && Array.isArray(data.projects)) {
                    setProjects(data.projects);
                }
            } else if (data) {
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

                if (data.work_experience && Array.isArray(data.work_experience)) {
                    setWorkExperience(data.work_experience);
                }
                
                if (data.education && Array.isArray(data.education)) {
                    setEducation(data.education);
                }

                if (data.projects && Array.isArray(data.projects)) {
                    setProjects(data.projects);
                }
                
                if (data.has_work_experience !== undefined) {
                    setHasWorkExperience(data.has_work_experience);
                }
                if (data.has_education !== undefined) {
                    setHasEducation(data.has_education);
                }
                if (data.has_projects !== undefined) {
                    setHasProjects(data.has_projects);
                }
            } else {
                setProfile(prev => ({ ...prev, email: session.user.email || '' }));
                setShowUploadOption(true);
                setIsNewUser(true);
            }
        } catch (err) {
            logger.error('Error fetching profile:', err);
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
            prev.map(exp => {
                if (exp.id === id) {
                    // If checking "current", clear the end_date
                    if (field === 'current' && value === true) {
                        return { ...exp, current: true, end_date: '' };
                    }
                    return { ...exp, [field]: value };
                }
                return exp;
            })
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

    // Projects handlers
    const handleAddProject = () => {
        const newId = Math.max(...projects.map(p => p.id), 0) + 1;
        setProjects(prev => [...prev, { id: newId, title: '', link: '', description: '', tech: '' }]);
        setHasProjects(true);
    };

    const handleRemoveProject = (id) => {
        if (projects.length > 1) {
            setProjects(prev => prev.filter(p => p.id !== id));
        } else {
            // if removing last project, clear and mark hasProjects false
            setProjects([{ id: 1, title: '', link: '', description: '', tech: '' }]);
            setHasProjects(false);
        }
    };

    const handleProjectChange = (id, field, value) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleEducationChange = (id, field, value) => {
        setEducation(prev =>
            prev.map(edu => {
                if (edu.id === id) {
                    // If checking "current", clear the end_date
                    if (field === 'current' && value === true) {
                        return { ...edu, current: true, end_date: '' };
                    }
                    return { ...edu, [field]: value };
                }
                return edu;
            })
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

    const handleImproveWithAI = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please log in to use AI improvement');
                return;
            }

            // Check AI limit
            if (!isPremium && aiLimit && aiLimit.generationsRemaining <= 0) {
                setFeatureName('AI Resume Improvement');
                setUpgradeModalOpen(true);
                return;
            }

            setIsImproving(true);

            const resumeData = {
                profile,
                work_experience: workExperience,
                education: education.map(edu => ({
                    degree: edu.degree,
                    institution: edu.school,
                    location: edu.location || '',
                    graduation_date: edu.graduation_date || (edu.end_date || '')
                }))
            };

            const response = await fetch('/api/improve-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    sessionToken: session.access_token,
                    resumeData
                })
            });

            const result = await response.json();

            if (!response.ok) {
                // If the error is 403, it might be the limit, but we handled it above.
                // However, if the API returns 403, we should probably show the modal too?
                if (response.status === 403 && result.error.includes('limit')) {
                     setFeatureName('AI Resume Improvement');
                     setUpgradeModalOpen(true);
                     setIsImproving(false);
                     return;
                }
                throw new Error(result.error || 'Failed to improve resume');
            }

            setImprovedResume(result.improved_resume);
            setShowImprovementNotes(true);
            
            // Update local limit
            if (!isPremium && aiLimit) {
                setAiLimit(prev => ({ ...prev, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
            }

            alert('Resume improved! Review the changes and download the improved version.');

        } catch (error) {
            logger.error('Error improving resume:', error);
            alert('Failed to improve resume: ' + error.message);
        } finally {
            setIsImproving(false);
        }
    };

    const handleDownloadResume = async () => {
        setIsDownloading(true);
        
        try {
            // Check user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please log in to download your resume');
                setIsDownloading(false);
                return;
            }

            // Check download limit
            const limitCheck = await checkDownloadLimit(session.user.id);
            
            if (!limitCheck.canDownload) {
                const resetDate = new Date(limitCheck.resetDate).toLocaleDateString();
                const message = limitCheck.plan === 'free' 
                    ? `You've reached your monthly download limit (${limitCheck.maxDownloads} download${limitCheck.maxDownloads > 1 ? 's' : ''} per month).\n\nUpgrade to Pro or Lifetime for unlimited downloads.\n\nYour limit resets on ${resetDate}.`
                    : `You've reached your download limit. Your limit resets on ${resetDate}.`;
                
                if (confirm(message + '\n\nWould you like to upgrade your plan?')) {
                    window.location.href = '/payment?plan=pro';
                }
                setIsDownloading(false);
                return;
            }

            // Record download before generating PDF
            const resumeType = improvedResume ? 'improved' : 'standard';
            await recordDownload(session.user.id, resumeType);

            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = margin;
            
            // Use improved data if available, otherwise use current data
            const dataToUse = improvedResume ? improvedResume.profile : profile;
            const workToUse = improvedResume ? improvedResume.work_experience : workExperience;
            const eduToUse = improvedResume ? improvedResume.education : education.map(edu => ({
                degree: edu.degree,
                institution: edu.school,
                location: edu.location || '',
                graduation_date: edu.graduation_date || (edu.end_date || '')
            }));
            const projToUse = improvedResume ? (improvedResume.projects || []) : (profile.projects || projects || []);
            
            // Helper to add text with word wrap
            const addText = (text, size, isBold = false, color = [0, 0, 0]) => {
                if (!text) return;
                pdf.setFontSize(size);
                pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                pdf.setTextColor(...color);
                const lines = pdf.splitTextToSize(text, contentWidth);
                lines.forEach(line => {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = margin;
                    }
                    pdf.text(line, margin, yPos);
                    yPos += size * 0.5;
                });
            };
            
            const addBullet = (text, size = 10) => {
                if (!text) return;
                pdf.setFontSize(size);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
                
                const bulletWidth = 5;
                const lines = pdf.splitTextToSize(text, contentWidth - bulletWidth);
                
                lines.forEach((line, index) => {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = margin;
                    }
                    if (index === 0) {
                        pdf.text('•', margin, yPos);
                    }
                    pdf.text(line, margin + bulletWidth, yPos);
                    yPos += size * 0.5;
                });
            };
            
            const addSpace = (space) => {
                yPos += space;
            };
            
            // NAME (centered, large)
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            const nameWidth = pdf.getTextWidth(dataToUse.full_name || 'Your Name');
            pdf.text(dataToUse.full_name || 'Your Name', (pageWidth - nameWidth) / 2, yPos);
            yPos += 8;
            
            // CONTACT INFO (centered)
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const contactInfo = [dataToUse.email, dataToUse.phone, dataToUse.location].filter(Boolean).join(' | ');
            const contactWidth = pdf.getTextWidth(contactInfo);
            pdf.text(contactInfo, (pageWidth - contactWidth) / 2, yPos);
            yPos += 6;
            
            // SEPARATOR LINE
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;
            
            // PROFESSIONAL SUMMARY
            if (dataToUse.professional_summary) {
                addText('PROFESSIONAL SUMMARY', 13, true);
                yPos += 2;
                addText(dataToUse.professional_summary, 10);
                yPos += 6;
            }
            
            // SKILLS
            if (dataToUse.skills) {
                addText('SKILLS', 13, true);
                yPos += 2;
                addText(dataToUse.skills, 10);
                yPos += 6;
            }
            
            // WORK EXPERIENCE
            if (hasWorkExperience && workToUse.length > 0) {
                addText('WORK EXPERIENCE', 13, true);
                yPos += 3;
                
                workToUse.forEach((exp, index) => {
                    // Job Title (bold)
                    if (exp.position) {
                        addText(exp.position, 12, true);
                    }
                    
                    // Company and dates on same line
                    const companyInfo = [];
                    if (exp.company) companyInfo.push(exp.company);
                    if (exp.location) companyInfo.push(exp.location);
                    if (companyInfo.length > 0) {
                        addText(companyInfo.join(', '), 10, false, [60, 60, 60]);
                    }
                    
                    // Dates
                    const dateRange = [exp.start_date, exp.end_date || 'Present'].filter(Boolean).join(' - ');
                    if (dateRange) {
                        addText(dateRange, 9, false, [100, 100, 100]);
                    }
                    
                    // Description with bullets (check for | separator from AI)
                    if (exp.description) {
                        yPos += 1;
                        const bulletPoints = exp.description.includes('|') 
                            ? exp.description.split('|').map(b => b.trim())
                            : exp.description.split(/\.\s+/).filter(s => s.trim());
                        
                        if (bulletPoints.length > 1) {
                            bulletPoints.forEach(bullet => {
                                if (bullet.trim()) {
                                    const bulletText = bullet.endsWith('.') ? bullet : bullet + '.';
                                    addBullet(bulletText, 10);
                                }
                            });
                        } else {
                            addBullet(exp.description, 10);
                        }
                    }
                    
                    if (index < workToUse.length - 1) {
                        yPos += 4;
                    }
                });
                yPos += 6;
            }
            
            // EDUCATION
            if (hasEducation && eduToUse.length > 0) {
                addText('EDUCATION', 13, true);
                yPos += 3;
                
                eduToUse.forEach((edu, index) => {
                    // Degree (bold)
                    if (edu.degree) {
                        addText(edu.degree, 12, true);
                    }
                    
                    // Institution and location
                    const schoolInfo = [];
                    if (edu.institution) schoolInfo.push(edu.institution);
                    if (edu.location) schoolInfo.push(edu.location);
                    if (schoolInfo.length > 0) {
                        addText(schoolInfo.join(', '), 10, false, [60, 60, 60]);
                    }
                    
                    // Graduation date
                    if (edu.graduation_date) {
                        addText(edu.graduation_date, 9, false, [100, 100, 100]);
                    }
                    
                    if (index < eduToUse.length - 1) {
                        yPos += 4;
                    }
                });
                yPos += 6;
            }
            
            // PROJECTS
            if (projToUse && projToUse.length > 0) {
                addText('PROJECTS', 13, true);
                yPos += 3;

                projToUse.forEach((proj, pIdx) => {
                    if (proj.title) {
                        // Title (bold) and hyperlinked if link provided
                        const titleSize = 12;
                        pdf.setFontSize(titleSize);
                        pdf.setFont('helvetica', 'bold');
                        const title = proj.title;
                        if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
                        pdf.text(title, margin, yPos);
                        const titleWidth = pdf.getTextWidth(title);
                        if (proj.link) {
                            try {
                                pdf.link(margin, yPos - 4, titleWidth, 6, { url: proj.link });
                            } catch (e) {
                                // ignore if link fails
                            }
                        }
                        yPos += 6;
                    }

                    if (proj.tech) {
                        addText(proj.tech, 10, false, [80, 80, 80]);
                        yPos += 2;
                    }

                    if (proj.description) {
                        addBullet(proj.description, 10);
                    }

                    if (pIdx < projToUse.length - 1) yPos += 4;
                });
                yPos += 6;
            }
            
            // VOLUNTEERING
            if (dataToUse.volunteering) {
                addText('VOLUNTEERING', 13, true);
                yPos += 2;
                addText(dataToUse.volunteering, 10);
            }
            
            // Save PDF
            const fileName = improvedResume 
                ? `${dataToUse.full_name || 'Resume'}_IMPROVED.pdf`
                : `${dataToUse.full_name || 'Resume'}.pdf`;
            pdf.save(fileName);
            
        } catch (error) {
            logger.error('Error downloading resume:', error);
            alert('Failed to download resume. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const validateAndUpload = (file) => {
        setUploadError('');
        if (!file) return;
        
        // Basic type check based on extension if type is empty/generic
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isDoc = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx');

        if (!isPdf && !isDoc) {
            setUploadError('Unsupported file type. Please upload a PDF or Word document.');
            return;
        }

        if (file.size > MAX_BYTES) {
            setUploadError('File size exceeds 5MB limit. Please upload a smaller file.');
            return;
        }
        
        handleFileUpload(file);
    };

    const openFilePicker = () => {
        setUploadError('');
        fileInputRef.current?.click();
    }

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        validateAndUpload(file);
    }

    const handleFileUpload = async (file) => {
        setIsUploading(true);
        setUploadError('');
        try {
            const resumeText = await extractTextFromFile(file);
            const parsedData = parseResumeTextToStructuredData(resumeText);
            
            setProfile({
                full_name: parsedData.profile.full_name || '',
                location: parsedData.profile.location || '',
                phone: parsedData.profile.phone || '',
                email: parsedData.profile.email || '',
                linkedin: parsedData.profile.linkedin || '',
                professional_summary: parsedData.profile.professional_summary || '',
                skills: parsedData.profile.skills || '',
                volunteering: parsedData.profile.volunteering || ''
            });

            if (parsedData.work_experience && parsedData.work_experience.length > 0) {
                const formattedWork = parsedData.work_experience.map((exp, idx) => ({
                    id: idx + 1,
                    company: exp.company || '',
                    position: exp.position || '',
                    start_date: exp.start_date || '',
                    end_date: exp.end_date || '',
                    description: exp.description || '',
                    location: exp.location || '',
                    current: exp.end_date?.toLowerCase() === 'present' || exp.current || false
                }));
                setWorkExperience(formattedWork);
                setHasWorkExperience(true);
            }

            if (parsedData.education && parsedData.education.length > 0) {
                const formattedEdu = parsedData.education.map((edu, idx) => ({
                    id: idx + 1,
                    school: edu.institution || edu.school || '',
                    degree: edu.degree || '',
                    field: '',
                    start_date: '',
                    end_date: edu.graduation_date || '',
                    current: false
                }));
                setEducation(formattedEdu);
                setHasEducation(true);
            }

            if (parsedData.projects && parsedData.projects.length > 0) {
                const formattedProjects = parsedData.projects.map((proj, idx) => ({
                    id: idx + 1,
                    title: proj.title || '',
                    link: proj.link || '',
                    description: proj.description || '',
                    tech: proj.tech || ''
                }));
                setProjects(formattedProjects);
                setHasProjects(true);
            }

            setShowUploadOption(false);
            setSuccessMessage('Resume uploaded! Please review and update the information below.');
        } catch (err) {
            logger.error('Error parsing resume:', err);
            alert('Error parsing resume: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage('');
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                alert('Please log in to save your profile');
                setSaving(false);
                return;
            }

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
                    projects: hasProjects ? projects : [],
                    has_projects: hasProjects,
                    has_work_experience: hasWorkExperience,
                    has_education: hasEducation
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                throw error;
            }

            setSuccessMessage('Resume information saved successfully!');
            
            if (improvedResume || improvementNotes) {
                setTimeout(() => {
                    setShowPreview(true);
                }, 1000);
            } else {
                setTimeout(() => {
                    setShowPreview(true);
                }, 1000);
            }
            
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            logger.error('Error saving profile:', err);
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
                        {isNewUser 
                            ? 'Get started by uploading your existing resume or filling out the form below.'
                            : 'Save your information once and use it for all your resumes. This information will automatically populate when you download improved resumes.'}
                    </p>
                </div>

                {showUploadOption && (
                    <div className="mb-8">
                         <div 
                            className={`relative flex flex-col justify-center items-center min-h-[400px] border-4 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer 
                                ${isDragging
                                    ? 'bg-white/10 border-orange-500/80' 
                                    : 'border-white/20 hover:border-orange-500/50 bg-white/5 hover:bg-white/10' 
                                }`}

                            onClick={openFilePicker}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                    openFilePicker();
                            }}
                        >
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl z-10">
                                    <Loader />
                                </div>
                            )}

                            <img src="/logo-orange.png" alt="logo-orange" className="w-20 h-20 mb-4"/>
                            
                            <h2 className="text-white font-bold text-2xl font-outfit mb-3 text-center">
                                Upload Your Existing Resume
                            </h2>

                            <p className="text-white/60 text-base font-outfit mb-4 text-center px-4">
                                Drag & drop your file here to auto-fill your profile
                            </p>

                            <p className="text-white/40 text-lg font-outfit mb-6"> 
                                or 
                            </p>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openFilePicker();
                                    }}
                                    className="w-44 h-11 text-sm bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-2xl hover:opacity-90 duration-300 flex justify-center items-center text-white font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5m-9 0h18" />
                                    </svg>
                                    Browse Files
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowUploadOption(false);
                                    }}
                                    className="w-44 h-11 text-sm bg-neutral-800 border border-neutral-700 rounded-2xl hover:bg-neutral-700 duration-300 flex justify-center items-center text-white font-medium"
                                >
                                    Create from Scratch
                                </button>
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  validateAndUpload(file);
                              }}
                            />

                            <p className="text-white/40 text-sm font-outfit text-center px-2 mt-5">
                                Accepted: PDF, DOC, DOCX • Max 5MB
                            </p>
                            
                            {uploadError && (
                                <p className="text-red-500 text-sm font-outfit pt-2 text-center px-2">{uploadError}</p>
                            )}
                        </div>
                    </div>
                )}

                {showImprovementNotes && improvementNotes && (
                    <div className="mb-8 bg-blue-500/20 border border-blue-500 rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            AI Improvements Applied
                        </h3>
                        <div className="text-neutral-300 whitespace-pre-line">{improvementNotes}</div>
                        <p className="mt-4 text-sm text-neutral-400">
                            Please review the changes below and make any adjustments before saving.
                        </p>
                    </div>
                )}

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

                    {/* Projects */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <h2 className="text-2xl font-bold">Projects</h2>
                            <button
                                type="button"
                                onClick={() => setHasProjects(!hasProjects)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    !hasProjects
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                            >
                                {hasProjects ? "Hide Projects" : "Add Projects"}
                            </button>
                        </div>
                        {hasProjects && projects.map((proj, idx) => (
                            <div key={proj.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-white">Project {idx + 1}</h3>
                                    {projects.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProject(proj.id)}
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
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Project Title *</label>
                                        <input
                                            type="text"
                                            value={proj.title}
                                            onChange={(e) => handleProjectChange(proj.id, 'title', e.target.value)}
                                            placeholder="Project name"
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Project Link</label>
                                        <input
                                            type="url"
                                            value={proj.link}
                                            onChange={(e) => handleProjectChange(proj.id, 'link', e.target.value)}
                                            placeholder="https://github.com/you/project"
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Description *</label>
                                    <textarea
                                        value={proj.description}
                                        onChange={(e) => handleProjectChange(proj.id, 'description', e.target.value)}
                                        placeholder="Brief summary of the project, your role, and impact."
                                        rows={3}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Tech Stack (comma separated)</label>
                                    <input
                                        type="text"
                                        value={proj.tech}
                                        onChange={(e) => handleProjectChange(proj.id, 'tech', e.target.value)}
                                        placeholder="React, Node.js, PostgreSQL"
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                        ))}

                        {hasProjects && (
                            <button
                                type="button"
                                onClick={handleAddProject}
                                className="w-full px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Another Project
                            </button>
                        )}
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
                            
                            {/* Show improvement notification */}
                            {improvedResume && showImprovementNotes && (
                                <div className="mb-4 p-4 bg-blue-900/50 border border-blue-500 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-bold text-blue-300 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                            </svg>
                                            AI Improvements Applied
                                        </h4>
                                        <button 
                                            onClick={() => setShowImprovementNotes(false)}
                                            className="text-neutral-400 hover:text-white"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    {improvedResume.improvement_notes && (
                                        <div className="mb-3">
                                            <p className="text-sm font-semibold text-blue-200 mb-1">Changes Made:</p>
                                            <ul className="text-sm text-neutral-300 space-y-1">
                                                {improvedResume.improvement_notes.map((note, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <span className="text-blue-400 mt-1">•</span>
                                                        <span>{note}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {improvedResume.suggestions_for_user && improvedResume.suggestions_for_user.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-green-200 mb-1">Next Steps to Further Improve:</p>
                                            <ul className="text-sm text-neutral-300 space-y-1">
                                                {improvedResume.suggestions_for_user.map((suggestion, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <span className="text-green-400 mt-1">→</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div 
                                data-resume-preview
                                className="bg-white text-black p-8 rounded-lg shadow-2xl max-w-[210mm] mx-auto"
                                style={{ fontFamily: templates.find(t => t.id === selectedTemplate)?.font }}
                            >
                                {renderTemplate({ 
                                    selectedTemplate, 
                                    templates, 
                                    profile: improvedResume ? improvedResume.profile : profile,
                                    hasWorkExperience, 
                                    workExperience: improvedResume ? improvedResume.work_experience : workExperience,
                                    hasEducation, 
                                    education: improvedResume ? improvedResume.education.map(edu => ({
                                        ...edu,
                                        school: edu.institution,
                                        graduation_date: edu.graduation_date
                                    })) : education,
                                    hasProjects: improvedResume ? !!(improvedResume.projects && improvedResume.projects.length) : hasProjects,
                                    projects: improvedResume ? improvedResume.projects : projects
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-700 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        window.location.href = '/dashboard';
                                    }}
                                    className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    Analyze Resume
                                </button>
                                <button
                                    onClick={handleImproveWithAI}
                                    disabled={isImproving}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative"
                                >
                                    {!isPremium && (
                                        <div className="absolute top-[-15px] right-[-15px]">
                                            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-2xl [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] border-[3px] border-transparent [animation:border_4s_linear_infinite]">
                                                {aiLimit && aiLimit.generationsRemaining > 0 ? `${aiLimit.generationsRemaining} left` : 'PRO'}
                                            </span>
                                        </div>
                                    )}
                                    {isImproving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Improving...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                            </svg>
                                            {improvedResume ? 'Re-Improve' : 'Improve with AI'}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        if (!isPremium) {
                                            window.location.href = '/pricing';
                                            return;
                                        }
                                        setShowPreview(false);
                                        // TODO: Implement job description tailoring
                                        alert('Tailor for job description feature coming soon!');
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 relative"
                                >
                                    {!isPremium && (
                                        <div className="absolute top-[-15px] right-[-15px]">
                                            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-2xl [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] border-[3px] border-transparent [animation:border_4s_linear_infinite]">PRO</span>
                                        </div>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
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
                                            {improvedResume ? 'Download Improved' : 'Download Resume'}
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
            
            <UpgradeModal 
                isOpen={upgradeModalOpen} 
                onClose={() => setUpgradeModalOpen(false)} 
                featureName={featureName}
                remainingRequests={aiLimit?.generationsRemaining || 0}
            />
        </div>
    );
}

export default ResumeBuilder;