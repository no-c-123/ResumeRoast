import React, { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';

function OAuthCallback() {
  useEffect(() => {
    // Flag to prevent multiple checks
    let mounted = true;

    async function handleAuthChange(event, session) {
        if (!mounted) return;
        
        if (session?.user) {
            logger.log('Session restored:', session.user.id);
            try {
                 // Check if user is new by looking for their profile
                const { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (!mounted) return;

                if (!profile) {
                    window.location.href = '/resume-builder?new=true';
                } else {
                    window.location.href = '/';
                }
            } catch (err) {
                logger.error('Profile check failed', err);
                if (mounted) window.location.href = '/';
            }
        } else if (event === 'SIGNED_OUT') {
             if (mounted) window.location.href = '/login';
        }
    }

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Initial check in case state is already present
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            handleAuthChange('SIGNED_IN', session);
        } else {
             // If no session after a short grace period (for hash parsing), check hash manually or fail
             // The onAuthStateChange usually catches the hash flow.
             // If hash is present but no session yet, Supabase handles it.
             // But if error in hash:
             const hashParams = new URLSearchParams(window.location.hash.substring(1));
             if (hashParams.get('error')) {
                 window.location.href = '/login?error=' + encodeURIComponent(hashParams.get('error_description') || 'Authentication failed');
             }
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="loader" style={{ color: '#fff', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)' }}>
      <div className="spinner" style={{ width: 50, height: 50, border: '3px solid rgba(255, 99, 51, 0.1)', borderTopColor: '#FF6333', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
      <h2>Authenticating...</h2>
      <p>Please wait while we sign you in</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default OAuthCallback;
