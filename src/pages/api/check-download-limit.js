import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function POST({ request }) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase.rpc('check_download_limit', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking download limit:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check download limit',
          canDownload: false,
          downloadsUsed: 0,
          downloadsRemaining: 0,
          maxDownloads: 1,
          plan: 'free'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        canDownload: data.can_download,
        downloadsUsed: data.downloads_used,
        downloadsRemaining: data.downloads_remaining,
        maxDownloads: data.max_downloads,
        plan: data.plan,
        resetDate: data.reset_date
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in check-download-limit API:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

