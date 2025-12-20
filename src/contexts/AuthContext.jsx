import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, dbService } from '../services/supabase';
import { logger } from '../lib/logger';

const AuthContext = createContext({
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser) => {
    try {
      const [userProfile, userSub] = await Promise.all([
        dbService.getProfile(currentUser.id),
        dbService.getSubscription(currentUser.id)
      ]);
      setProfile(userProfile);
      setSubscription(userSub);
    } catch (error) {
      logger.error('Error fetching user data in context:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const sessionUser = await authService.getUser();
        if (sessionUser && mounted) {
          setUser(sessionUser);
          await fetchUserData(sessionUser);
        }
      } catch (error) {
        logger.error('Auth init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      logger.log('Auth state change:', event);
      if (session?.user) {
        setUser(session.user);
        await fetchUserData(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    subscription,
    loading,
    isAuthenticated: !!user,
    signIn: () => window.location.href = '/login',
    signOut: async () => {
      await authService.signOut();
      window.location.href = '/';
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
