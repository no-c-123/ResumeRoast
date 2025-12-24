import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { logger } from '../../lib/logger.js';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
    
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!checkRateLimit(user.id)) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { resumeData, jobDescription } = await request.json();

    const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0,
        messages: [{
            role: "user",
            content: `Analyze this resume against the job description and return a detailed JSON score report.

RESUME:
${JSON.stringify(resumeData)}

JOB DESCRIPTION:
${jobDescription}

REQUIRED JSON FORMAT:
{
  "score": <number 0-100>,
  "keywordMatch": <number 0-100>,
  "matchedKeywords": ["string", "string", ...],
  "missingKeywords": ["string", "string", ...],
  "experienceMet": <number of years or requirements met>,
  "experienceTotal": <number of years or requirements total>,
  "skillsMatched": <number>,
  "skillsTotal": <number>,
  "atsChecks": [
    { "name": "Standard section headers", "passed": boolean },
    { "name": "No tables or text boxes", "passed": boolean },
    { "name": "Readable fonts", "passed": boolean },
    { "name": "File name optimization", "passed": boolean }
  ],
  "percentile": <number 0-100>,
  "priorityActions": [
    { "type": "critical|important|nice_to_have", "title": "string", "description": "string", "points": <number> }
  ]
}`
        }]
    });

    let scoreData;
    try {
        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
        scoreData = JSON.parse(cleanJson);
    } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError);
        return new Response(JSON.stringify({ error: 'Failed to score resume' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: true,
        data: scoreData
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error scoring resume:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
