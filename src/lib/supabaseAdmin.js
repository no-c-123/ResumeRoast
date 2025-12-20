import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin must not be used on the client side');
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.warn('Supabase Service Role Key is missing!');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});