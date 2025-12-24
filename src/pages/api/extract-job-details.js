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

    const { jobDescription } = await request.json();

    if (!jobDescription || jobDescription.length < 10) {
        return new Response(JSON.stringify({ error: 'Job description is too short' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0,
        messages: [{
            role: "user",
            content: `Extract key information from this job description. Return ONLY valid JSON.

JOB DESCRIPTION:
${jobDescription}

REQUIRED JSON FORMAT:
{
  "role": "Job Title",
  "company": "Company Name (if found, else 'Unknown')",
  "requirements": [
    { "name": "Requirement (e.g. React, 5+ years exp)", "type": "critical|important|nice_to_have" }
  ],
  "stack": ["Tech 1", "Tech 2", "Tech 3"]
}

Limit requirements to top 5-7 most important ones. Limit stack to technical skills found.`
        }]
    });

    let extractedInfo;
    try {
        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
        extractedInfo = JSON.parse(cleanJson);
    } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError);
        return new Response(JSON.stringify({ error: 'Failed to extract information' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: true,
        data: extractedInfo
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error extracting job details:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
