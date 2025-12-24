import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { checkSubscription } from '../../lib/entitlement.js';
import { checkAiLimit, recordAiUsage } from '../../lib/server/subscriptionUtils.js';
import { logger } from '../../lib/logger.js';
import { z } from 'zod';

export const prerender = false;

const anthropic = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY
});

const RequestSchema = z.object({
    resumeData: z.object({
        profile: z.any(),
        work_experience: z.any(),
        education: z.any(),
        projects: z.any(),
    }),
    jobDescription: z.string().optional()
});

export async function POST({ request }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enforce Subscription OR Limit
    const hasValidSubscription = await checkSubscription(userId);
    let isAllowed = hasValidSubscription;
    
    if (!isAllowed) {
        const limitCheck = await checkAiLimit(userId);
        if (limitCheck.canGenerate) {
            isAllowed = true;
            await recordAiUsage(userId);
        }
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ 
            error: 'You have reached your free limit. Please upgrade to Pro for unlimited cover letters.',
            code: 'LIMIT_REACHED'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const rawBody = await request.json();
    const result = RequestSchema.safeParse(rawBody);

    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const { resumeData, jobDescription } = result.data;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: `You are an expert career coach and professional writer. Your task is to write a compelling, professional cover letter for a job application.

Job Description (if provided):
${jobDescription || "No specific job description provided. Write a general cover letter highlighting the candidate's strengths."}

Candidate's Resume Data:
${JSON.stringify(resumeData, null, 2)}

INSTRUCTIONS:
1. **Tone**: Professional, confident, and enthusiastic.
2. **Structure**:
   - **Header**: Standard business letter format (if possible in text, otherwise just start with salutation).
   - **Opening**: Hook the reader, state the position applied for (if known), and express enthusiasm.
   - **Body Paragraphs**: Connect the candidate's specific skills and experiences (from the resume) to the job requirements (from the JD). Use specific examples/metrics.
   - **Closing**: Reiterate value, request an interview, and sign off professionally.
3. **Customization**: Do NOT use placeholders like "[Company Name]" if you can infer it from the JD. If not, use generic terms or clear placeholders like [Company Name].
4. **Formatting**: Use markdown for bolding key points if appropriate, but keep it looking like a standard letter.

Return the result as a JSON object:
{
  "cover_letter_text": "The full text of the cover letter...",
  "key_points_highlighted": ["Array of 3-4 key strengths emphasized"]
}`
      }]
    });

    let generatedContent;
    try {
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : responseText;
      generatedContent = JSON.parse(cleanJson);
    } catch (parseError) {
      logger.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate cover letter. Please try again.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(generatedContent), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error generating cover letter:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
