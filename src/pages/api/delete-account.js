import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { logger } from '../../lib/logger';

export const prerender = false;

export async function DELETE({ request }) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create Supabase client with user token
        const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
        const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // Verify the user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token or user not found' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Delete the user (this will cascade delete related data due to foreign keys)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            logger.error('Error deleting user:', deleteError);
            return new Response(
                JSON.stringify({ error: 'Failed to delete account' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Account deleted successfully' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        logger.error('Delete account error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
