import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const EmailConfirmationBanner = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Check for pending email change or unconfirmed account
    const newEmail = user?.new_email;
    const isNewEmailPending = !!newEmail;
    const isUnconfirmed = user && !user.email_confirmed_at;
    
    // The email we are waiting for confirmation on
    const targetEmail = newEmail || user?.email;

    useEffect(() => {
        setMounted(true);
        // Check if previously dismissed for this specific email
        if (user && targetEmail) {
            const key = `hide_email_confirm_${user.id}_${targetEmail}`;
            const dismissed = localStorage.getItem(key);
            if (dismissed) {
                setIsVisible(false);
            } else {
                // Reset visibility if it's a new email or different context
                setIsVisible(true);
            }
        }
    }, [user, targetEmail]);

    if (!mounted || !user || !isVisible) return null;

    // Only show if there is something to confirm
    if (!isNewEmailPending && !isUnconfirmed) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        if (targetEmail) {
            localStorage.setItem(`hide_email_confirm_${user.id}_${targetEmail}`, 'true');
        }
    };

    return (
        <div className="w-full bg-orange-500/10 border-b border-orange-500/20 px-4 py-3 relative animate-fade-in">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {isNewEmailPending ? 'Please confirm your new email address' : 'Please confirm your email address'}
                        </p>
                        <p className="text-xs text-neutral-400">
                            We sent a confirmation link to <span className="text-white">{targetEmail}</span>
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/5 rounded-lg transition-colors text-neutral-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default EmailConfirmationBanner;
