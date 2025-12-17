export const prerender = false;

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const resumeText = formData.get('resumeText');
        const jobDescription = formData.get('jobDescription');
        const originalSuggestions = JSON.parse(formData.get('originalSuggestions') || '{}');

        if (!resumeText || !jobDescription) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Resume text and job description are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check authorization
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Call Claude API to tailor the resume
        const anthropicApiKey = import.meta.env.ANTHROPIC_API_KEY;
        
        if (!anthropicApiKey) {
            console.error('ANTHROPIC_API_KEY is not set');
            return new Response(JSON.stringify({
                success: false,
                error: 'API key not configured'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const prompt = `You are an expert resume consultant specializing in ATS optimization and job matching.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK: Analyze how well this resume matches the job description and provide tailored recommendations.

Provide your response in this JSON format:
{
  "matchScore": [number 0-100],
  "keywords": ["keyword1", "keyword2", ...],
  "changes": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    ...
  ],
  "missingSkills": ["skill1", "skill2", ...],
  "strengthsToEmphasize": ["strength1", "strength2", ...],
  "sectionsToRevise": {
    "summary": "Revised summary that includes job-specific keywords...",
    "experience": ["Revised bullet point 1", "Revised bullet point 2", ...]
  }
}

Focus on:
1. Extracting key requirements and qualifications from the job description
2. Identifying matching keywords between resume and job posting
3. Suggesting specific changes to increase ATS match score
4. Highlighting missing skills that should be added (if applicable)
5. Recommending which achievements to emphasize based on job requirements`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        const contentBlock = data.content?.[0];
        
        if (!contentBlock || contentBlock.type !== 'text') {
            throw new Error('Unexpected response format from Claude API');
        }

        // Parse the JSON response from Claude
        let tailoredAnalysis;
        try {
            const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                tailoredAnalysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse Claude response:', contentBlock.text);
            throw new Error('Failed to parse AI response');
        }

        return new Response(JSON.stringify({
            success: true,
            tailored: tailoredAnalysis
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error tailoring resume:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
