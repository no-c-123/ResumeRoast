import { supabaseAdmin } from './supabaseAdmin';

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 10; // Increased slightly for DB latency buffer

/**
 * Checks if a user has exceeded their rate limit.
 * Uses Supabase to store state across serverless function invocations.
 * 
 * @param {string} identifier - User ID or IP to limit
 * @param {string} endpoint - Optional endpoint name to bucket limits
 * @returns {Promise<boolean>} - True if request is allowed, False if limited
 */
export async function checkRateLimit(identifier, endpoint = 'api') {
  if (!identifier) return true; // Should not happen, but safe fallback

  try {
    const now = new Date();
    const windowStartThreshold = new Date(now.getTime() - RATE_LIMIT_WINDOW_SECONDS * 1000);

    // Get current limit record
    const { data: record, error } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (error) {
      console.error('Rate limit DB error:', error);
      return true; // Fail open on infrastructure error
    }

    if (!record) {
      // Create new record
      const { error: insertError } = await supabaseAdmin
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: now.toISOString()
        });
      
      if (insertError) console.error('Rate limit insert error:', insertError);
      return true;
    }

    // Check if window has expired
    if (new Date(record.window_start) < windowStartThreshold) {
      // Reset window
      const { error: updateError } = await supabaseAdmin
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', record.id);
        
      if (updateError) console.error('Rate limit reset error:', updateError);
      return true;
    }

    // Check count
    if (record.request_count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    // Increment count
    // Note: This has a slight race condition but is acceptable for rate limiting
    const { error: incrementError } = await supabaseAdmin
      .from('rate_limits')
      .update({
        request_count: record.request_count + 1,
        updated_at: now.toISOString()
      })
      .eq('id', record.id);

    if (incrementError) console.error('Rate limit increment error:', incrementError);
    return true;

  } catch (err) {
    console.error('Rate limit exception:', err);
    return true; // Fail open
  }
}
