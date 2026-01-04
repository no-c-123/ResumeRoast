import { createClient } from '@supabase/supabase-js';

export const POST = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { resumeId } = await request.json();

    if (!resumeId) {
      return new Response(JSON.stringify({ error: 'Resume ID is required' }), { status: 400 });
    }

    // 1. Get resume to find file path
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('file_path')
      .eq('id', resumeId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Resume not found' }), { status: 404 });
    }

    // 2. Delete file from storage if it exists
    if (resume.file_path) {
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue to delete record anyway
      }
    }

    // 3. Delete record from DB
    const { error: deleteError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Failed to delete resume record' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Delete handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
