import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';

export const authService = {
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      logger.error('Error fetching session:', error);
      return null;
    }
  },

  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      return null;
    }
  },

  async signOut() {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  },

  async signInWithPassword(credentials) {
    try {
        logger.log('authService: calling supabase.auth.signInWithPassword');
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        logger.log('authService: supabase.auth.signInWithPassword returned', { error: !!error, user: !!data?.user });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        logger.error('Error signing in:', error);
        return { data: null, error };
    }
  },

  async signInWithOAuth(options) {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth(options);
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        logger.error('Error signing in with OAuth:', error);
        return { data: null, error };
    }
  },

  async signUp(credentials) {
    try {
        const { data, error } = await supabase.auth.signUp(credentials);
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        logger.error('Error signing up:', error);
        return { data: null, error };
    }
  },

  async updateEmail(email) {
    try {
      const { data, error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error updating email:', error);
      return { data: null, error };
    }
  },

  async updatePassword(password) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error updating password:', error);
      return { data: null, error };
    }
  },

  async resetPasswordForEmail(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error resetting password:', error);
      return { data: null, error };
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export const dbService = {
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      return null;
    }
  },

  async getSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      return null;
    }
  },

  async getAnalysis(analysisId, userId) {
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching analysis:', error);
      throw error;
    }
  },

  async getRecentAnalyses(userId, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching recent analyses:', error);
      throw error;
    }
  },

  async getAnalysesCount(userId) {
    try {
      const { count, error } = await supabase
        .from('resume_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count;
    } catch (error) {
      logger.error('Error fetching analyses count:', error);
      return 0;
    }
  },

  async upsertProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error upserting profile:', error);
      throw error;
    }
  },

  async submitTestimonial(testimonialData) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert([testimonialData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error submitting testimonial:', error);
      throw error;
    }
  },

  // Resume Management
  async getResumes(userId) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching resumes:', error);
      return [];
    }
  },

  async getResume(resumeId) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching resume:', error);
      return null;
    }
  },

  async createResume(resumeData) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert([resumeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating resume:', error);
      throw error;
    }
  },

  async updateResume(resumeId, updates) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating resume:', error);
      throw error;
    }
  },

  async deleteResume(resumeId) {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting resume:', error);
      throw error;
    }
  }
};
