import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function FeedbackForm() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("https://formspree.io/f/mojnnzyd", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    email,
                    message
                })
            });

            if (response.ok) {
                setSucceeded(true);
                setEmail('');
                setMessage('');
            } else {
                const data = await response.json();
                if (Object.hasOwn(data, 'errors')) {
                    setError(data.errors.map(error => error.message).join(", "));
                } else {
                    setError("Oops! There was a problem submitting your form");
                }
            }
        } catch (err) {
            setError("Failed to connect to the server. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    if (succeeded) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl mx-auto bg-zinc-900/50 border border-green-500/30 rounded-3xl p-8 md:p-12 text-center"
            >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#22c55e" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Message Received!</h3>
                <p className="text-zinc-400 text-lg mb-8">
                    Thanks for helping us make Resume Roast better. We read every piece of feedback.
                </p>
                <button 
                    onClick={() => setSucceeded(false)}
                    className="text-orange-500 hover:text-orange-400 font-bold transition-colors"
                >
                    Send another message
                </button>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">We Want Your Feedback</h2>
                <p className="text-zinc-400">
                    Found a bug? Have a feature request? Or just want to say hi? 
                    Let us know what you're thinking.
                </p>
            </motion.div>

            <motion.form 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit} 
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden group"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email" 
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-black/50 border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell us what's on your mind..."
                            className="w-full bg-black/50 border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all min-h-[150px] resize-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.01] shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <span>Send Feedback</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
