import { z } from 'zod';

export const CheckoutSchema = z.object({
  planKey: z.string().optional(),
  price_id: z.string().optional(),
  lookup_key: z.string().optional(),
  mode: z.enum(['subscription', 'payment']).optional(),
  user_id: z.string().uuid().optional(),
});

export const ImproveSchema = z.object({
  userId: z.string().uuid(),
  resumeText: z.string().optional().nullable(),
  resumeData: z.object({
    profile: z.object({
      full_name: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      linkedin: z.string().optional().nullable(),
      professional_summary: z.string().optional().nullable(),
      skills: z.string().optional().nullable(),
      volunteering: z.string().optional().nullable(),
    }).optional().nullable(),
    work_experience: z.array(z.any()).optional().nullable(),
    education: z.array(z.any()).optional().nullable(),
    projects: z.array(z.any()).optional().nullable(),
  }).optional().nullable(),
  analysisId: z.string().uuid().optional().nullable(),
  customInstructions: z.string().optional().nullable(),
  targetLanguage: z.string().optional().default('English'),
});

export const MetadataSchema = z.object({
  userId: z.string().uuid(),
  careerLevel: z.enum(['intern', 'new_grad', 'professional', 'executive']).optional().default('professional'),
});

export const TailorSchema = z.object({
  resumeText: z.string().optional(),
  resumeData: z.object({
    profile: z.object({
      full_name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedin: z.string().optional(),
      professional_summary: z.string().optional(),
      skills: z.string().optional(),
      volunteering: z.string().optional(),
    }).optional(),
    work_experience: z.array(z.any()).optional(),
    education: z.array(z.any()).optional(),
    projects: z.array(z.any()).optional(),
  }).optional(),
  jobDescription: z.string().min(10),
  originalSuggestions: z.any().optional(),
  targetLanguage: z.string().optional().default('English'),
});
