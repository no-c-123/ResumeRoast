import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { extractTextFromFile } from '../../lib/fileParser.js';

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
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const sessionToken = formData.get('sessionToken');
    const careerLevel = formData.get('careerLevel') || 'professional';

    if (!file || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
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
    try {
      resumeText = await extractTextFromFile(file);
      console.log('Extracted text length:', resumeText?.length);
    } catch (extractError) {
      console.error('Error extracting text:', extractError);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse resume file', 
        details: extractError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!resumeText || resumeText.trim().length < 100) {
      return new Response(JSON.stringify({ error: 'Could not extract enough text from resume' }), {
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
- Do NOT penalize for lack of professional accomplishments - focus on what they HAVE done
- Evaluate based on: relevant coursework, academic projects, soft skills development, and demonstrated initiative`
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
- Evaluate based on: internships, academic projects, early career accomplishments, and demonstrated skills`
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
- A 2-page resume is acceptable for extensive experience`
      }
    };

    const context = careerLevelContext[careerLevel] || careerLevelContext['professional'];

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
}`
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
      console.error('Failed to parse Claude response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store analysis in Supabase (use authenticated client)
    const { data: savedAnalysis, error: dbError } = await authenticatedSupabase
      .from('resume_analyses')
      .insert({
        user_id: userId,
        file_name: file.name,
        analysis_text: message.content[0].text,
        ats_score: analysis.ats_score,
        suggestions: analysis,
        career_level: careerLevel,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to save analysis' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: savedAnalysis
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
