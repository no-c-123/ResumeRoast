import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseResumeTextToStructuredData } from '../../lib/resumeParser.js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { checkSubscription } from '../../lib/entitlement.js';
import { checkAiLimit, recordAiUsage } from '../../lib/server/subscriptionUtils.js';
import { logger } from '../../lib/logger.js';
import { TailorSchema } from '../../lib/schemas';

export const prerender = false;

const anthropic = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY
});

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function POST({ request }) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let rawData;

        if (contentType.includes('application/json')) {
            rawData = await request.json();
        } else {
            const formData = await request.formData();
            rawData = {
                resumeText: formData.get('resumeText'),
                jobDescription: formData.get('jobDescription'),
                originalSuggestions: JSON.parse(formData.get('originalSuggestions') || '{}'),
            };
        }
        
        const validation = TailorSchema.safeParse(rawData);

        if (!validation.success) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid input',
                details: validation.error.format()
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { resumeText, jobDescription, resumeData: providedResumeData } = validation.data;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            {
              global: {
                headers: {
                  Authorization: authHeader
                }
              }
            }
        );

        const sessionToken = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
        
        if (authError || !user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Enforce Subscription OR Limit for Tailoring
        const hasValidSubscription = await checkSubscription(user.id);
        let isAllowed = hasValidSubscription;

        if (!isAllowed) {
            const limitCheck = await checkAiLimit(user.id);
            if (limitCheck.canGenerate) {
                isAllowed = true;
                await recordAiUsage(user.id);
            }
        }

        if (!isAllowed) {
            return new Response(JSON.stringify({ 
                error: 'You have reached your free limit for resume tailoring. Please upgrade to Pro for unlimited access.',
                code: 'LIMIT_REACHED'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!checkRateLimit(user.id)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Rate limit exceeded. Please try again later.'
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let resumeData = providedResumeData;

        if (!resumeData && resumeText) {
             const parsedResume = parseResumeTextToStructuredData(resumeText);
             const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

             resumeData = {
                profile: {
                    full_name: parsedResume.profile.full_name || profileData?.full_name || '',
                    professional_summary: parsedResume.profile.professional_summary || profileData?.professional_summary || '',
                    email: parsedResume.profile.email || profileData?.email || user.email,
                    phone: parsedResume.profile.phone || profileData?.phone || '',
                    location: parsedResume.profile.location || profileData?.location || '',
                    linkedin: parsedResume.profile.linkedin || profileData?.linkedin || '',
                    skills: parsedResume.profile.skills || profileData?.skills || '',
                    volunteering: parsedResume.profile.volunteering || profileData?.volunteering || ''
                },
                work_experience: parsedResume.work_experience.length > 0 ? parsedResume.work_experience : (profileData?.work_experience || []),
                education: parsedResume.education.length > 0 ? parsedResume.education : (profileData?.education || []),
                projects: profileData?.projects || []
            };
        } else if (!resumeData) {
            // Fallback to profile data if no resumeText and no resumeData provided (though schema validation might catch this if strict)
            // But since both are optional now, we need to handle this case
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (profileData) {
                 resumeData = {
                    profile: {
                        full_name: profileData.full_name || '',
                        professional_summary: profileData.professional_summary || '',
                        email: profileData.email || user.email,
                        phone: profileData.phone || '',
                        location: profileData.location || '',
                        linkedin: profileData.linkedin || '',
                        skills: profileData.skills || '',
                        volunteering: profileData.volunteering || ''
                    },
                    work_experience: profileData.work_experience || [],
                    education: profileData.education || [],
                    projects: profileData.projects || []
                 };
            }
        }

        if (!resumeData) {
             return new Response(JSON.stringify({
                success: false,
                error: 'No resume data found to tailor.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            temperature: 0.7,
            messages: [{
                role: "user",
                content: `You are an expert resume writer specializing in tailoring resumes for specific job postings and ATS optimization.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TASK: Tailor this resume specifically for the job description above. Rewrite sections to:
1. Include job-specific keywords naturally throughout
2. Emphasize relevant experience and skills that match the job requirements
3. Reframe achievements to align with what the job is looking for
4. Add or modify skills section to include relevant keywords from the job description
5. Update professional summary to highlight relevant qualifications for this specific role
6. Modify work experience descriptions to use terminology from the job description where appropriate

IMPORTANT RULES:
- Keep all actual experience and facts - don't make up fake accomplishments
- Use "|" as separator between bullet points in work experience descriptions
- Maintain professional tone and accuracy
- Only add skills/qualifications that are reasonable given the person's experience
- Make changes that increase ATS match score while staying truthful

Return the tailored resume in this exact JSON format:
{
  "profile": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "professional_summary": "string (tailored for this job)",
    "skills": "string (include job-relevant keywords)",
    "volunteering": "string"
  },
  "work_experience": [
    {
      "position": "string",
      "company": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "description": "string (use | to separate bullet points, tailored for job)"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "graduation_date": "string"
    }
  ],
  "projects": [
    {
      "title": "string",
      "link": "string",
      "description": "string",
      "tech": "string"
    }
  ],
  "match_score": 85,
  "key_changes": ["string array of what was changed and why"],
  "keywords_added": ["string array of keywords from job description that were incorporated"]
}`
            }]
        });

        let tailoredResume;
        try {
            const responseText = message.content[0].text;
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            tailoredResume = JSON.parse(cleanJson);
        } catch (parseError) {
            logger.error('Failed to parse AI response:', parseError);
            return new Response(JSON.stringify({ 
                error: 'Our AI generated a response that we couldn\'t process. Please try again.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            tailored_resume: tailoredResume,
            match_score: tailoredResume.match_score || 0,
            key_changes: tailoredResume.key_changes || [],
            keywords_added: tailoredResume.keywords_added || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        logger.error('Error tailoring resume:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'An unexpected error occurred while tailoring your resume. Please try again later.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
