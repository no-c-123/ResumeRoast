import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { logger } from '../../lib/logger.js';
import { z } from 'zod';

export const prerender = false;

const anthropic = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY || 'dummy_key'
});

const SuggestSkillsSchema = z.object({
  userId: z.string(),
  summary: z.string().max(2000),
  currentSkills: z.string().optional()
});

export async function POST({ request }) {
  try {
    // Check API Key
    if (!import.meta.env.ANTHROPIC_API_KEY) {
       console.error('Missing ANTHROPIC_API_KEY');
       return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), { 
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
    }

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

    const rawBody = await request.json();
    const result = SuggestSkillsSchema.safeParse(rawBody);

    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const { userId, summary, currentSkills } = result.data;

    if (user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Rate limiting
    const isAllowed = await checkRateLimit(userId);
    if (!isAllowed) {
       return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
         status: 429,
         headers: { 'Content-Type': 'application/json' }
       });
    }

    if (!summary || summary.length < 10) {
      return new Response(JSON.stringify({ skills: {} }), { status: 200 });
    }

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022", // Use Haiku for speed and lower cost
      max_tokens: 1000,
      temperature: 0.5,
      messages: [{
        role: "user",
        content: `You are a career expert. Analyze the following professional summary and suggest relevant skills categorized by type (e.g., "Hard Skills", "Soft Skills", "Tools", "Core Skills", or other relevant custom categories based on the user's profile).

        Summary: "${summary}"
        
        ${currentSkills ? `The user already has these skills (format is 'Category: skill, skill'): ${currentSkills}. Do NOT suggest these again.` : ''}
        
        Return ONLY a JSON object where keys are category names and values are arrays of skill strings. Example:
        {
          "Hard Skills": ["React", "Node.js"],
          "Soft Skills": ["Leadership"],
          "Tools": ["VS Code"]
        }
        No other text.`
      }]
    });

    let skills = {};
    try {
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        skills = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON object found, try array
        const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
             const arr = JSON.parse(arrayMatch[0]);
             skills = { "Core Skills": arr };
        }
      }
    } catch (e) {
      logger.error('Failed to parse AI skills response', e);
    }

    return new Response(JSON.stringify({
      success: true,
      skills: skills // Now an object
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error suggesting skills:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}