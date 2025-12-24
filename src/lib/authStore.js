import { authService, dbService } from '../services/supabase';
import { logger } from './logger';

// Simple observable store implementation
class AuthStore {
    constructor() {
        this.state = {
            user: null,
            profile: null,
            subscription: null,
            loading: true,
            isAuthenticated: false
        };
        this.listeners = new Set();
        this.initialized = false;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state); // Immediate update
        
        if (!this.initialized) {
            this.init();
        }

        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.state.isAuthenticated = !!this.state.user;
        this.notify();
    }

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            // Initial Session Check
            const sessionUser = await authService.getUser();
            if (sessionUser) {
                this.setState({ user: sessionUser });
                await this.fetchUserData(sessionUser);
            }
        } catch (error) {
            logger.error('AuthStore init error:', error);
        } finally {
            this.setState({ loading: false });
        }

        // Listen for changes
        authService.onAuthStateChange(async (event, session) => {
            logger.log('AuthStore: Auth state change:', event);
            if (session?.user) {
                // Only fetch data if user changed or we don't have it
                if (session.user.id !== this.state.user?.id) {
                    this.setState({ user: session.user, loading: true });
                    await this.fetchUserData(session.user);
                    this.setState({ loading: false });
                } else {
                     this.setState({ user: session.user });
                }
            } else {
                this.setState({ 
                    user: null, 
                    profile: null, 
                    subscription: null, 
                    loading: false 
                });
            }
        });
    }

    async fetchUserData(user) {
        try {
            const [profile, subscription] = await Promise.all([
                dbService.getProfile(user.id),
                dbService.getSubscription(user.id)
            ]);
            this.setState({ profile, subscription });
        } catch (error) {
            logger.error('AuthStore: Error fetching user data:', error);
        }
    }
}

export const authStore = new AuthStore();