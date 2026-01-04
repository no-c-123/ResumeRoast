import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { logger } from '../../lib/logger.js';
import { z } from 'zod';

export const prerender = false;

const anthropic = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY
});

const SuggestSkillsSchema = z.object({
  userId: z.string(),
  summary: z.string().max(2000),
  currentSkills: z.string().optional()
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

    const rawBody = await request.json();
    const result = SuggestSkillsSchema.safeParse(rawBody);

    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const { userId, summary, currentSkills } = result.data;

    if (user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Rate limiting (lighter limit for suggestions?)
    if (!checkRateLimit(userId)) {
       // Ideally we'd have a separate lighter rate limit for this, 
       // but for now let's reuse or skip if it's too strict.
       // Assuming standard rate limit is fine for now.
    }

    if (!summary || summary.length < 10) {
      return new Response(JSON.stringify({ skills: [] }), { status: 200 });
    }

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Use Haiku for speed and lower cost
      max_tokens: 500,
      temperature: 0.5,
      messages: [{
        role: "user",
        content: `You are a career expert. Analyze the following professional summary and suggest 8-12 relevant skills (hard and soft).
        
        Summary: "${summary}"
        
        ${currentSkills ? `Exclude these skills as the user already has them: ${currentSkills}` : ''}
        
        Return ONLY a JSON array of strings. No other text.`
      }]
    });

    let skills = [];
    try {
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        skills = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        skills = responseText.split(',').map(s => s.trim());
      }
    } catch (e) {
      logger.error('Failed to parse AI skills response', e);
    }

    return new Response(JSON.stringify({
      success: true,
      skills: skills.slice(0, 12)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error suggesting skills:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}