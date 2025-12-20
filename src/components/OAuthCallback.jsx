import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';

function OAuthCallback() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
        // Wait a bit or redirect to login if genuinely no user
        const timer = setTimeout(() => {
             window.location.href = '/login';
        }, 2000);
        return () => clearTimeout(timer);
    }

    logger.log('OAuthCallback: User verified', user.id);

    // Decision logic based on profile existence
    if (profile) {
        window.location.href = '/dashboard';
    } else {
        // If user exists but no profile, they might be new
        // or the profile creation webhook hasn't fired yet.
        // Safer to send to onboarding or dashboard to handle it.
        window.location.href = '/resume-builder?new=true';
    }
  }, [user, profile, loading]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-black to-neutral-900 text-white">
      <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-semibold mb-2">Verifying Session...</h2>
    </div>
  );
}

export default OAuthCallback;
