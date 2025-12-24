import React, { useState } from 'react';
import { dbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Loader from './uicomponents/Loader';

const TestimonialForm = () => {
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await dbService.submitTestimonial({
                user_id: user?.id,
                name: name || user?.user_metadata?.full_name || 'Anonymous',
                role,
                content,
                rating,
                is_public: false // Requires moderation
            });
            setSuccess(true);
            setContent('');
            setRole('');
        } catch (err) {
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-neutral-900/50 border border-green-500/20 rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-neutral-400">Your feedback helps us improve Resume Roast for everyone.</p>
                <button 
                    onClick={() => setSuccess(false)}
                    className="mt-6 text-orange-500 hover:text-orange-400 font-medium text-sm"
                >
                    Send another response
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Share Your Experience</h3>
            <p className="text-neutral-400 mb-6 text-sm">Tell us what you think about Resume Roast.</p>

            <div className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2">Rating</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`transition-colors ${star <= rating ? 'text-orange-500' : 'text-neutral-700 hover:text-neutral-500'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2">Your Feedback</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What did you like? What can we improve?"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 min-h-[120px]"
                        required
                    />
                </div>

                {/* Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-2">Name (Optional)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={user?.user_metadata?.full_name || "John Doe"}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-2">Job Title (Optional)</label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Software Engineer"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Submit Feedback'}
                </button>
            </div>
        </form>
    );
};

export default TestimonialForm;
