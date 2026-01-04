import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, authService } from '../services/supabase';
import Loader from './uicomponents/Loader';
import { renderTemplate } from './ResumeTemplates';

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

export default function VersionManager() {
    const { user } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchResumes();
        } else {
            const timer = setTimeout(() => {
                 if (!user) setLoading(false); 
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const fetchResumes = async () => {
        try {
            const data = await dbService.getResumes(user.id);
            setResumes(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('resume', file);

            const session = await authService.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/upload-resume', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            // Refresh list
            await fetchResumes();
            alert('Resume uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Error uploading resume: ${error.message}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [editingTitleId, setEditingTitleId] = useState(null);
    const [newTitle, setNewTitle] = useState('');

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        setConfirmDeleteId(id);
    };

    const cancelDelete = (e) => {
        e?.stopPropagation();
        setConfirmDeleteId(null);
    };

    const confirmDelete = async (id, e) => {
        e?.stopPropagation();
        setDeletingId(id);
        try {
            const session = await authService.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/delete-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ resumeId: id })
            });

            if (!response.ok) {
                throw new Error('Failed to delete resume');
            }

            setResumes(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete resume');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const startEditing = (resume, e) => {
        e.stopPropagation();
        setEditingTitleId(resume.id);
        setNewTitle(resume.title || 'Untitled Resume');
    };

    const cancelEditing = (e) => {
        e?.stopPropagation();
        setEditingTitleId(null);
        setNewTitle('');
    };

    const saveTitle = async (id, e) => {
        e?.stopPropagation();
        if (!newTitle.trim()) return;

        try {
            await dbService.updateResume(id, { title: newTitle });
            setResumes(prev => prev.map(r => r.id === id ? { ...r, title: newTitle } : r));
            setEditingTitleId(null);
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update title');
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

    if (!user) {
         return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
                <p className="text-neutral-400 mb-6">You need to be logged in to manage versions.</p>
                <a href="/login" className="px-6 py-3 bg-orange-500 rounded-lg text-white font-bold">Log In</a>
            </div>
         );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <a href="/" className="text-neutral-500 hover:text-white mb-4 inline-block transition-colors">← Back</a>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                            Version History
                        </h1>
                        <button 
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : '+ Upload New Resume'}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".pdf,.doc,.docx" 
                            className="hidden" 
                        />
                    </div>
                    <p className="text-neutral-400">
                        View and manage your resume snapshots and analysis history.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Map through resumes */}
                    {resumes.map((resume) => (
                        <div key={resume.id} className="bg-[#1a1a1a] border border-orange-500/30 rounded-xl p-6 shadow-lg shadow-orange-500/10 relative group overflow-hidden">
                            
                            {/* Delete Confirmation Modal Overlay */}
                            {confirmDeleteId === resume.id && (
                                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                                    <h3 className="text-white font-bold text-lg mb-2">Delete Resume?</h3>
                                    <p className="text-neutral-400 text-sm mb-6">This action cannot be undone.</p>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={(e) => cancelDelete(e)}
                                            className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 font-bold text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={(e) => confirmDelete(resume.id, e)}
                                            disabled={deletingId === resume.id}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold text-sm"
                                        >
                                            {deletingId === resume.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-6 gap-4">
                                {editingTitleId === resume.id ? (
                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                        <input 
                                            type="text" 
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            className="bg-neutral-900 border border-neutral-700 text-white px-2 py-1 rounded w-full text-sm focus:border-orange-500 outline-none"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveTitle(resume.id, e);
                                                if (e.key === 'Escape') cancelEditing(e);
                                            }}
                                        />
                                        <button onClick={(e) => saveTitle(resume.id, e)} className="text-green-500 hover:text-green-400 shrink-0">✓</button>
                                        <button onClick={(e) => cancelEditing(e)} className="text-red-500 hover:text-red-400 shrink-0">✕</button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center gap-2 overflow-hidden min-w-0">
                                        <h2 className="text-xl font-bold text-white truncate" title={resume.title}>
                                            {resume.title}
                                        </h2>
                                        <button 
                                            onClick={(e) => startEditing(resume, e)}
                                            className="text-neutral-600 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            title="Rename Resume"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 shrink-0">
                                    {resume.is_active && (
                                        <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs rounded-full border border-green-500/20 whitespace-nowrap">Active</span>
                                    )}
                                    <button 
                                        onClick={(e) => handleDeleteClick(resume.id, e)}
                                        className="text-neutral-500 hover:text-red-500 p-2 rounded hover:bg-white/5 transition-colors"
                                        title="Delete Resume"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            
                            <div 
                                className="aspect-[210/297] bg-white text-black mb-6 rounded shadow-inner overflow-hidden relative cursor-pointer group" 
                                onClick={() => window.location.href=`/resume-builder?id=${resume.id}`}
                            >
                                
                                {/* Resume Preview or Fallback Link */}
                                {false && resume.content && (resume.content.profile?.full_name || resume.content.work_experience?.length > 0) ? (
                                    <div className="w-full h-full overflow-hidden pointer-events-none select-none relative bg-white">
                                        <div className="w-[210mm] h-[297mm] origin-top-left transform scale-[0.33] md:scale-[0.33] lg:scale-[0.33] absolute top-0 left-0 p-[20mm]">
                                            {renderTemplate({
                                                selectedTemplate: resume.template_id || 'professional',
                                                templates,
                                                profile: resume.content.profile || {},
                                                hasWorkExperience: resume.content.work_experience?.length > 0,
                                                workExperience: resume.content.work_experience || [],
                                                hasEducation: resume.content.education?.length > 0,
                                                education: resume.content.education || [],
                                                hasProjects: resume.content.projects?.length > 0,
                                                projects: resume.content.projects || []
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-500 p-4 text-center">
                                        <div className="text-4xl mb-2">📄</div>
                                        <p className="text-sm font-bold text-neutral-800 break-words w-full px-2">{resume.title || 'Resume File'}</p>
                                        {resume.file_path && (
                                            <a 
                                                href={`${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${resume.file_path}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold z-20 pointer-events-auto transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Open Original File
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <button 
                                    onClick={() => window.location.href=`/resume-builder?id=${resume.id}`}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                    Edit Resume
                                </button>
                                <button 
                                    onClick={() => window.location.href=`/analyzing?resumeId=${resume.id}`}
                                    className="w-full py-3 bg-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-700"
                                >
                                    Analyze Score
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Empty State / Add New Card */}
                    {resumes.length === 0 && !uploading && (
                        <div className="bg-[#1a1a1a] border border-neutral-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center text-3xl mb-4">
                                📄
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Resumes Yet</h3>
                            <p className="text-neutral-500 mb-6">Upload a resume to get started managing different versions.</p>
                            <button 
                                onClick={handleUploadClick}
                                className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Upload Resume
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

