import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromFile } from '../../lib/fileParser.js';
import { parseResumeTextToStructuredData } from '../../lib/resumeParser.js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { checkSubscription } from '../../lib/entitlement.js';
import { checkAiLimit, recordAiUsage } from '../../lib/server/subscriptionUtils.js';
import { logger } from '../../lib/logger';
import { MetadataSchema } from '../../lib/schemas';

export const prerender = false;

const apiKey = process.env.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;

const anthropic = new Anthropic({
  apiKey: apiKey
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

    const formData = await request.formData();
    const file = formData.get('file');
    const resumeId = formData.get('resumeId');
    
    // Validate non-file fields
    const rawMetadata = {
        userId: formData.get('userId'),
        careerLevel: formData.get('careerLevel') || undefined
    };

    const result = MetadataSchema.safeParse(rawMetadata);

    if (!result.success) {
        return new Response(JSON.stringify({ error: 'Invalid input', details: result.error.format() }), { status: 400 });
    }

    const { userId, careerLevel } = result.data;

    if (!file && !resumeId) {
      return new Response(JSON.stringify({ error: 'Missing resume file or resume ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isAllowed = await checkRateLimit(userId, 'analyze-resume');
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
    if (authError || user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check Subscription Entitlement
    const hasValidSubscription = await checkSubscription(userId);
    let isEntitled = hasValidSubscription;

    if (!isEntitled) {
        const limitCheck = await checkAiLimit(userId);
        if (limitCheck.canGenerate) {
            isEntitled = true;
            // Record usage for free users to enforce the limit
            await recordAiUsage(userId);
        } else {
             return new Response(JSON.stringify({ 
                error: 'You have reached your free limit for resume analysis. Please upgrade to Pro for unlimited access.',
                code: 'LIMIT_REACHED'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }


    // Create authenticated Supabase client for this user's session
    const authenticatedSupabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        }
      }
    );

    // Extract text from resume
    let resumeText;
    let fileName = file ? file.name : 'Stored Resume';

    try {
      if (resumeId) {
          // Fetch from DB
          const { data: resume, error: resumeError } = await authenticatedSupabase
              .from('resumes')
              .select('raw_text, title')
              .eq('id', resumeId)
              .single();
          
          if (resumeError || !resume) {
              throw new Error('Resume not found');
          }
          resumeText = resume.raw_text;
          fileName = resume.title;
          
          if (!resumeText) {
              // Fallback: Try to reconstruct from JSON content? 
              // For now, if raw_text is missing (old resumes?), we might fail or need fallback.
              // But new uploads will have it.
              throw new Error('Resume text not available for this version');
          }
      } else {
          logger.log('Starting text extraction for file:', file.name, 'type:', file.type, 'size:', file.size);
          resumeText = await extractTextFromFile(file);
      }

      logger.log('Extracted text length:', resumeText?.length);
      logger.log('First 300 characters:', resumeText?.substring(0, 300));
    } catch (extractError) {
      logger.error('Error extracting text:', extractError);
      return new Response(JSON.stringify({ 
        error: 'Unable to read the resume file. Please ensure it is a valid PDF or Word document.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return new Response(JSON.stringify({ 
        error: 'The resume content appears to be empty or too short. If this is a scanned PDF (image-only), please use a text-based PDF.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call Claude API for analysis
    const careerLevelContext = {
      'intern': {
        description: 'an INTERN or entry-level candidate seeking their first internship or job',
        expectations: `
**IMPORTANT CONTEXT:** This is an INTERN/ENTRY-LEVEL resume. Adjust your expectations accordingly:
- It's NORMAL to have limited or NO professional work experience
- Academic projects, coursework, and personal projects are HIGHLY VALUABLE
- Volunteer work, club leadership, and extracurricular activities COUNT as experience
- Focus on potential, eagerness to learn, and transferable skills from non-professional contexts
- Be ENCOURAGING about academic achievements, relevant coursework, and personal initiatives
- A 1-page resume is EXPECTED and APPROPRIATE
- Do NOT penalize heavily for lack of professional accomplishments - focus on what they HAVE done
- Evaluate based on: relevant coursework, academic projects, soft skills development, and demonstrated initiative
- **SCORING:** Baseline score should be 50-70 for a decent intern resume. Score based on potential, not extensive experience.
- **FEEDBACK TONE:** Constructive and encouraging. Suggest actionable steps like "Add personal projects", "Include relevant coursework", "Highlight transferable skills from part-time jobs/volunteering"`
      },
      'new_grad': {
        description: 'a NEW GRADUATE with 0-2 years of professional experience',
        expectations: `
**IMPORTANT CONTEXT:** This is a NEW GRAD resume (0-2 years experience). Adjust your expectations:
- Limited professional experience is EXPECTED and ACCEPTABLE
- Recent academic experience and projects are STILL RELEVANT
- Internship experience should be highlighted and valued highly
- Entry-level positions, part-time work, and contract roles are all valuable
- Focus on growth trajectory, learning ability, and potential
- Be SUPPORTIVE about combining academic and early professional experience
- A 1-page resume is IDEAL at this stage
- Evaluate based on: internships, academic projects, early career accomplishments, and demonstrated skills
- **SCORING:** Baseline score should be 55-75 for a solid new grad resume. Reward internships and academic projects.
- **FEEDBACK TONE:** Balance honesty with encouragement. Suggest "Quantify internship achievements", "Add technical projects", "Highlight leadership in clubs/organizations"`
      },
      'professional': {
        description: 'a PROFESSIONAL with 2+ years of experience',
        expectations: `
**CONTEXT:** This is an EXPERIENCED PROFESSIONAL resume. Apply standard professional criteria:
- Expect quantifiable professional accomplishments and measurable impact
- Look for career progression and increasing responsibility
- Professional achievements should be well-documented with metrics
- Advanced skills and specialized expertise should be evident
- Leadership, mentorship, and strategic contributions are important
- A 2-page resume is acceptable for extensive experience
- **SCORING:** Be strict - baseline score 60-80. High scores (85+) require exceptional accomplishments with strong metrics.
- **FEEDBACK TONE:** Direct and professional. Expect polish and quantified results. Suggest "Quantify all achievements", "Show career progression", "Demonstrate leadership impact"`
      }
    };

    const context = careerLevelContext[careerLevel] || careerLevelContext['professional'];

    // Check for API key
    if (!apiKey) {
        logger.error('ANTHROPIC_API_KEY is missing');
        return new Response(JSON.stringify({ error: 'Server configuration error: Missing AI API key' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: `You are an expert resume reviewer, career coach, and ATS (Applicant Tracking System) specialist. Your job is to provide honest but constructive and ENCOURAGING feedback to help job seekers improve their resumes.

${context.expectations}

You are reviewing a resume for ${context.description}.

Analyze this resume thoroughly using the comprehensive checklist below. For EACH point, evaluate whether it PASSES or FAILS and provide specific feedback that is APPROPRIATE for this career level.

**CONTENT AND RELEVANCE CHECKLIST:**
1. Tailored to job description - Uses keywords and skills matching role requirements
2. Relevant experience highlighted - Prioritizes directly related experience
3. Accomplishments over duties - Quantifies impact with numbers, percentages, or dollars
4. Strong summary statement - Concise professional summary with key skills and goals
5. Relevant skills listed - Skills needed for the position are present
6. Specific examples provided - Concrete examples demonstrate abilities
7. Concise language - Uses action verbs and direct language
8. Targeted keywords - Industry-specific terms for ATS compatibility
9. No irrelevant personal info - Omits date of birth, marital status, etc.
10. Up-to-date information - Current contact info and experience
11. Clear objective (if applicable) - Focuses on helping company, not just personal goals

**STRUCTURE AND FORMATTING CHECKLIST:**
12. Readable layout - Clean formatting with appropriate white space
13. Consistent formatting - Uniform fonts, bullet points, and spacing
14. Professional font - Standard typefaces (Arial, Calibri, Times New Roman)
15. Appropriate length - One to two pages maximum
16. Reverse chronological order - Most recent experience first
17. Clear headings - Bold, easy-to-read section headings
18. Bullet points for readability - Text broken up for easy scanning
19. No informal elements - Professional email and no graphics
20. PDF format ready - Can be saved as PDF maintaining formatting
21. Optimized for ATS - Simple format without complex tables or images

**LANGUAGE AND TONE CHECKLIST:**
22. Professional tone - Maintains professional and confident voice
23. Action verbs - Bullet points start with strong action verbs
24. Correct grammar - Free of grammatical errors
25. Proper spelling - No spelling mistakes
26. No jargon (unless applicable) - Avoids overly complex internal jargon
27. No abbreviations - Spells out abbreviations first time or uses universally known ones

**SOFT SKILLS DEMONSTRATION:**
28. Communication skills - Shows clear articulation
29. Teamwork - Demonstrates collaboration and empathy
30. Problem-solving - Shows ability to overcome obstacles
31. Organizational skills - Evidence of time management and attention to detail
32. Leadership - Displays delegation and decision-making
33. Adaptability - Shows flexibility and open-mindedness
34. Critical thinking - Demonstrates sound judgment
35. Attention to detail - Precision in work shown
36. Initiative - Takes ownership of tasks
37. Versatility - Adjusts to different roles
38. Creativity - Innovative problem-solving approaches
39. Interpersonal skills - Builds positive relationships

Resume content:
${resumeText}

**IMPORTANT:** Evaluate EVERY single checklist item above. For each one, determine if it PASSES or FAILS and provide specific reasoning.

Format your response as valid JSON with this exact structure:
{
  "ats_score": <number 0-100>,
  "overall_assessment": "<string>",
  "checklist_results": {
    "content_and_relevance": [
      {"item": "Tailored to job description", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Relevant experience highlighted", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Accomplishments over duties", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Strong summary statement", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Relevant skills listed", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Specific examples provided", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Concise language", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Targeted keywords", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "No irrelevant personal info", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Up-to-date information", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Clear objective", "status": "PASS|FAIL|N/A", "feedback": "<specific feedback>"}
    ],
    "structure_and_formatting": [
      {"item": "Readable layout", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Consistent formatting", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Professional font", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Appropriate length", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Reverse chronological order", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Clear headings", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Bullet points for readability", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "No informal elements", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "PDF format ready", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Optimized for ATS", "status": "PASS|FAIL", "feedback": "<specific feedback>"}
    ],
    "language_and_tone": [
      {"item": "Professional tone", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Action verbs", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Correct grammar", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Proper spelling", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "No jargon (unless applicable)", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "No abbreviations", "status": "PASS|FAIL", "feedback": "<specific feedback>"}
    ],
    "soft_skills": [
      {"item": "Communication skills", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Teamwork", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Problem-solving", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Organizational skills", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Leadership", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Adaptability", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Critical thinking", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Attention to detail", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Initiative", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Versatility", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Creativity", "status": "PASS|FAIL", "feedback": "<specific feedback>"},
      {"item": "Interpersonal skills", "status": "PASS|FAIL", "feedback": "<specific feedback>"}
    ]
  },
  "strengths": ["<string>", "<string>", ...],
  "critical_issues": ["<string>", "<string>", ...],
  "section_feedback": {
    "contact": "<string>",
    "summary": "<string>",
    "experience": "<string>",
    "skills": "<string>",
    "education": "<string>",
    "additional": "<string>"
  },
  "ats_tips": ["<string>", "<string>", ...],
  "action_items": [
    {"priority": 1, "task": "<string>"},
    {"priority": 2, "task": "<string>"},
    {"priority": 3, "task": "<string>"},
    {"priority": 4, "task": "<string>"},
    {"priority": 5, "task": "<string>"}
  ]
}

**CRITICAL SCORING GUIDELINES:**
1. Score based on what the candidate HAS, not what they're missing due to experience level
2. For interns/new grads with limited experience, a 60-70 score is GOOD if they have solid fundamentals
3. Suggest ACTIONABLE improvements based on their situation:
   - Limited experience? → "Build personal projects", "Add relevant coursework", "Seek internships"
   - Poor formatting? → "Use bullet points", "Add consistent spacing", "Use professional font"
   - Missing metrics? → "Quantify responsibilities where possible", "Estimate impact (e.g., 'managed 20+ customers')"
4. overall_assessment should acknowledge their current level and provide hope: "This shows promise for a [career level]. Here's how to strengthen it with what you have..."
5. Action items should be ACHIEVABLE for their situation - don't ask an intern to "show 5 years of leadership"`
      }]
    });

    // Parse Claude's response
    let analysis;
    try {
      const responseText = message.content[0].text;
      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : responseText;
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      logger.error('Failed to parse Claude response:', parseError);
      return new Response(JSON.stringify({ error: 'Our AI had trouble analyzing your resume. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: existingProfile } = await authenticatedSupabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const parsedResume = parseResumeTextToStructuredData(resumeText);
      
      const profileData = {
        user_id: userId,
        full_name: parsedResume.profile.full_name || '',
        email: parsedResume.profile.email || user.email || '',
        phone: parsedResume.profile.phone || '',
        location: parsedResume.profile.location || '',
        linkedin: parsedResume.profile.linkedin || '',
        professional_summary: parsedResume.profile.professional_summary || '',
        skills: parsedResume.profile.skills || '',
        volunteering: parsedResume.profile.volunteering || '',
        work_experience: parsedResume.work_experience || [],
        education: parsedResume.education || [],
        projects: parsedResume.projects || [],
        has_work_experience: parsedResume.work_experience.length > 0,
        has_education: parsedResume.education.length > 0,
        has_projects: parsedResume.projects.length > 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await authenticatedSupabase
        .from('user_profiles')
        .insert(profileData);
    }

    // Store analysis in Supabase (use authenticated client)
    const { data: savedAnalysis, error: dbError } = await authenticatedSupabase
      .from('resume_analyses')
      .insert({
        user_id: userId,
        file_name: fileName,
        analysis_text: message.content[0].text,
        ats_score: analysis.ats_score,
        suggestions: {
            ...analysis,
            stats: {
                word_count: resumeText.split(/\s+/).length,
                bullet_count: (resumeText.match(/•|·|-|\*/g) || []).length
            }
        },
        career_level: careerLevel,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to save analysis results. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: savedAnalysis,
      resumeText: resumeText // Return extracted text for client-side use (e.g. auto-fix)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error analyzing resume:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred during analysis: ' + error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
