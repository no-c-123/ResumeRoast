import { describe, it, expect } from 'vitest';
import { CheckoutSchema, ImproveSchema, MetadataSchema, TailorSchema } from './schemas';

describe('Zod Schemas Validation', () => {
  
  describe('CheckoutSchema', () => {
    it('validates a correct subscription payload', () => {
      const payload = {
        planKey: 'pro',
        mode: 'subscription',
        user_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = CheckoutSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('validates a payload without user_id (optional)', () => {
      const payload = { planKey: 'free' };
      const result = CheckoutSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('fails on invalid UUID', () => {
      const payload = { user_id: 'not-a-uuid' };
      const result = CheckoutSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].code).toBe('invalid_string');
    });
  });

  describe('ImproveSchema', () => {
    it('validates a correct improve payload', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        resumeText: 'This is a sample resume text that is definitely longer than fifty characters to pass the minimum length requirement.',
        resumeData: {
          profile: { full_name: 'John Doe' }
        }
      };
      const result = ImproveSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('fails when resume text is too short', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        resumeText: 'Too short',
      };
      const result = ImproveSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('String must contain at least 50 character(s)');
    });

    it('fails when userId is missing', () => {
        const payload = {
          resumeText: 'This is a sample resume text that is definitely longer than fifty characters to pass the minimum length requirement.',
        };
        const result = ImproveSchema.safeParse(payload);
        expect(result.success).toBe(false);
      });
  });

  describe('MetadataSchema', () => {
    it('defaults careerLevel to professional', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = MetadataSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.careerLevel).toBe('professional');
    });

    it('accepts valid career levels', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        careerLevel: 'executive'
      };
      const result = MetadataSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid career levels', () => {
      const payload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        careerLevel: 'super-senior'
      };
      const result = MetadataSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('TailorSchema', () => {
    it('validates correct tailor payload', () => {
      const payload = {
        resumeText: 'This is a sample resume text that is definitely longer than fifty characters to pass the minimum length requirement.',
        jobDescription: 'Software Engineer needed. Must know React and Node.js.'
      };
      const result = TailorSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('fails when job description is missing', () => {
      const payload = {
        resumeText: 'This is a sample resume text that is definitely longer than fifty characters to pass the minimum length requirement.',
      };
      const result = TailorSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

});
