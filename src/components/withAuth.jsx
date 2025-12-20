import React, { useEffect, useState } from 'react';
import { authService } from '../services/supabase';
import { logger } from '../lib/logger';
import Loader from './uicomponents/Loader.jsx';

export function withAuth(WrappedComponent) {
  return function ProtectedRoute(props) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const session = await authService.getSession();
          if (!session) {
            window.location.href = '/login';
          } else {
            setAuthenticated(true);
          }
        } catch (error) {
          logger.error('Auth check failed:', error);
          window.location.href = '/login';
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, []);

    if (loading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader />
        </div>
      );
    }

    if (!authenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
