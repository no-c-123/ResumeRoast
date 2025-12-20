import { checkAiLimit } from '../../lib/server/subscriptionUtils';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../lib/logger';

export const prerender = false;

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const POST = async ({ request }) => {
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

    const limitData = await checkAiLimit(user.id);
    
    return new Response(JSON.stringify(limitData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    logger.error('Error in check-ai-limit API:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
