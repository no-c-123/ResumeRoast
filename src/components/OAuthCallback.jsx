import React, { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function OAuthCallback() {
  useEffect(() => {
    async function handleOAuth() {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('access_token')) {
          // Wait for Supabase to restore session
          setTimeout(async () => {
            const userResult = await supabase.auth.getUser();
            const { data: { user }, error: userError } = userResult;
            if (userError) {
              console.error('OAuthCallback: getUser() error', userError);
            }
            if (user) {
              // Check if user is new by looking for their profile
              const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();
              
              if (!profile || error) {
                window.location.href = '/resume-builder?new=true';
              } else {
                window.location.href = '/';
              }
            } else {
              window.location.href = '/login';
            }
          }, 1000);
        } else if (hashParams.get('error')) {
          window.location.href = '/login?error=' + encodeURIComponent(hashParams.get('error_description') || 'Authentication failed');
        } else {
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (error) {
        console.error('OAuthCallback: caught error', error);
        window.location.href = '/login';
      }
    }
    handleOAuth();
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
