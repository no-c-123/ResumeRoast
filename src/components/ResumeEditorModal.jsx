import { useState, useEffect } from 'react';

function ResumeEditorModal({ isOpen, onClose, resumeData, onSave }) {
    const [editedData, setEditedData] = useState(resumeData || {});

    useEffect(() => {
        if (resumeData) {
            setEditedData(resumeData);
        }
    }, [resumeData]);

    if (!isOpen || !resumeData) return null;

    const handleChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        onSave(editedData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Review Resume Information</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-neutral-400 text-sm mb-6">
                        Please review and complete your information before downloading. All fields are required for a professional resume.
                    </p>

                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-neutral-800 pb-2">Personal Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Full Name *</label>
                            <input
                                type="text"
                                value={editedData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Location *</label>
                                <input
                                    type="text"
                                    value={editedData.location || ''}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    placeholder="San Francisco, CA"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Phone *</label>
                                <input
                                    type="tel"
                                    value={editedData.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="+1-234-456-7890"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={editedData.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">LinkedIn</label>
                                <input
                                    type="text"
                                    value={editedData.linkedin || ''}
                                    onChange={(e) => handleChange('linkedin', e.target.value)}
                                    placeholder="linkedin.com/in/username"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Summary */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-neutral-800 pb-2">Professional Summary</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Summary *</label>
                            <textarea
                                value={editedData.summary || ''}
                                onChange={(e) => handleChange('summary', e.target.value)}
                                placeholder="A brief professional summary highlighting your key qualifications and experience..."
                                rows={4}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-neutral-800 pb-2">Skills</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Skills (comma-separated) *</label>
                            <textarea
                                value={editedData.skills || ''}
                                onChange={(e) => handleChange('skills', e.target.value)}
                                placeholder="JavaScript, Python, React, Node.js, Database Management, Project Management"
                                rows={3}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Note about experience and education */}
                    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                        <p className="text-sm text-neutral-300">
                            <strong className="text-white">📝 Note:</strong> Your work experience and education sections have been automatically extracted from your original resume. The improved version will use the content from your uploaded file.
                        </p>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 p-6 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold transition-all border border-neutral-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg font-semibold transition-all"
                    >
                        Continue to Download
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ResumeEditorModal;
