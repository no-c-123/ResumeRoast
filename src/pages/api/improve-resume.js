import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseResumeTextToStructuredData } from '../../lib/resumeParser.js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { checkSubscription } from '../../lib/entitlement.js';
import { checkAiLimit, recordAiUsage } from '../../lib/server/subscriptionUtils.js';
import { logger } from '../../lib/logger.js';
import { ImproveSchema } from '../../lib/schemas';

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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const sessionToken = authHeader.replace('Bearer ', '');

    const rawBody = await request.json();
    const result = ImproveSchema.safeParse(rawBody);

    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: result.error.format() }), { status: 400 });
    }

    const { userId, resumeText, resumeData, analysisId } = result.data;

    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
    if (authError || user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enforce Subscription OR Limit for Improvement Features
    const hasValidSubscription = await checkSubscription(userId);
    let isAllowed = hasValidSubscription;
    
    if (!isAllowed) {
        // Check free limit
        const limitCheck = await checkAiLimit(userId);
        if (limitCheck.canGenerate) {
            isAllowed = true;
            // We will record usage AFTER successful generation or maybe here?
            // Better to record here to prevent parallel abuse, but if generation fails user loses credit.
            // Let's record here for safety.
            await recordAiUsage(userId);
        }
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ 
            error: 'You have reached your free limit for AI improvements. Please upgrade to Pro for unlimited access.',
            code: 'LIMIT_REACHED'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let finalResumeData = resumeData;
    
    if (resumeText && (!resumeData || !resumeData.profile || !resumeData.profile.full_name)) {
      const parsedResume = parseResumeTextToStructuredData(resumeText);
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      finalResumeData = {
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
    }

    if (!finalResumeData || !finalResumeData.profile) {
      return new Response(JSON.stringify({ error: 'Resume data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let analysisContext = '';
    if (analysisId) {
      const { data: analysis } = await supabase
        .from('resume_analyses')
        .select('suggestions')
        .eq('id', analysisId)
        .single();
      
      if (analysis?.suggestions) {
        const issues = analysis.suggestions.critical_issues || [];
        const actionItems = analysis.suggestions.action_items || [];
        analysisContext = `
The resume was previously analyzed with these issues:
Critical Issues: ${issues.join(', ')}
Action Items: ${actionItems.map(item => item.task).join('; ')}`;
      }
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: `You are an expert resume writer and ATS optimization specialist. Your job is to rewrite this resume to make it ATS-friendly, professional, and impactful while keeping all the core information intact.

${analysisContext}

Current Resume Data:
${JSON.stringify(finalResumeData, null, 2)}

INSTRUCTIONS:
1. **Professional Summary**: Rewrite to be concise, impactful, and ATS-friendly. Use strong action verbs and quantify when possible.
2. **Work Experience**: 
   - Rewrite each job description to start with strong action verbs
   - Add quantifiable achievements where possible (if none exist, suggest measurable impacts)
   - Make language professional and avoid informal tone
   - Split long descriptions into clear, impactful bullet points (use "|" as separator between bullets)
3. **Skills**: Organize skills professionally, remove redundancies, add missing relevant skills if appropriate
4. **Education**: Ensure all fields are complete and professionally formatted
5. **Overall**: Fix grammar, spelling, formatting issues, and ensure professional tone throughout

IMPORTANT RULES:
- Keep the person's actual experience and facts - don't make up fake accomplishments
- If they lack quantified metrics, suggest improvement like "managed inventory system" → "managed inventory system for 50+ units"
- For limited experience, suggest adding relevant coursework, personal projects, or certifications
- Be encouraging and constructive - if someone has limited experience, acknowledge it and suggest growth paths

Return the improved resume in this exact JSON format:
{
  "profile": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "professional_summary": "string",
    "skills": "string",
    "volunteering": "string"
  },
  "work_experience": [
    {
      "position": "string",
      "company": "string",
      "location": "string",
      "start_date": "string",
      "end_date": "string",
      "description": "string (use | to separate bullet points)"
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
  "improvement_notes": ["string array of what was changed and why"],
  "suggestions_for_user": ["string array of actionable steps the user can take to further improve, like 'Consider adding certifications in X' or 'Build personal projects showcasing Y skills'"]
}`
      }]
    });

    // Parse AI response
    let improvedResume;
    try {
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : responseText;
      improvedResume = JSON.parse(cleanJson);
    } catch (parseError) {
      logger.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Our AI generated a response that we couldn\'t process. Please try again.',
        // Don't expose raw response in production, maybe log it
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      improved_resume: improvedResume,
      changes_made: improvedResume.improvement_notes || ['Resume improved successfully!'],
      suggestions: improvedResume.suggestions_for_user || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error improving resume:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred while improving your resume. Please try again later.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
