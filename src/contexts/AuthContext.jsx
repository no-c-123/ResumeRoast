import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/supabase';
import { authStore } from '../lib/authStore';

// Keep Context for backward compatibility if needed, 
// but useAuth will read from store directly to support Islands.
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
    // This component now mainly serves to initialize the store if not already done,
    // and provide context for legacy components (if any strictly require Context).
    // But since useAuth uses the store, the Context value is less critical.
    
    const [state, setState] = useState(authStore.state);

    useEffect(() => {
        const unsubscribe = authStore.subscribe(setState);
        return unsubscribe;
    }, []);

    const value = {
        ...state,
        signIn: () => window.location.href = '/login',
        signOut: async () => {
            await authService.signOut();
            window.location.href = '/';
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    // HACK: To support Astro Islands, we bypass React Context and subscribe 
    // to the global store directly. This ensures state sharing across 
    // separate React roots (NavBar vs LoginForm).
    const [state, setState] = useState(authStore.state);

    useEffect(() => {
        const unsubscribe = authStore.subscribe(setState);
        return unsubscribe;
    }, []);

    return {
        ...state,
        signIn: () => window.location.href = '/login',
        signOut: async () => {
            await authService.signOut();
            window.location.href = '/';
        }
    };
};
