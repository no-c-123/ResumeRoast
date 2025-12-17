/**
 * Generate an improved resume based on analysis suggestions
 */
export function generateImprovedResume(analysisData, originalText) {
  const { suggestions } = analysisData;
  
  // Parse original resume text to extract structured data
  const resumeData = parseResumeText(originalText);
  
  // Apply improvements based on suggestions
  applyImprovements(resumeData, suggestions);
  
  return resumeData;
}

function parseResumeText(text) {
  // Enhanced parsing to extract more information
  if (!text) {
    return {
      name: '',
      location: '',
      phone: '',
      email: '',
      linkedin: '',
      summary: '',
      experience: [],
      education: [],
      skills: '',
      volunteering: ''
    };
  }
  
  // Clean the text - remove JSON markers, extra whitespace
  text = text.replace(/```json|```/g, '').trim();
  const lines = text.split('\n').filter(line => line.trim());
  
  const data = {
    name: '',
    location: '',
    phone: '',
    email: '',
    linkedin: '',
    summary: '',
    experience: [],
    education: [],
    skills: '',
    volunteering: ''
  };
  
  // Extract name - look for standalone name near the top (2-4 words, capitalized)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    // Skip common headers and metadata
    if (line.match(/^(PROFESSIONAL|EXPERIENCE|EDUCATION|SKILLS|SUMMARY|OBJECTIVE|CONTACT|RESUME|CV)/i) ||
        line.includes('@') || 
        line.includes('linkedin') ||
        line.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?/) ||
        line.match(/^[A-Z]{2}$/) || // Skip state codes
        line.includes(',')) {
      continue;
    }
    
    // Look for name pattern: 2-4 capitalized words
    if (line.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/)) {
      data.name = line;
      break;
    }
  }
  
  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    data.email = emailMatch[0];
  }
  
  // Extract phone (various formats)
  const phoneMatch = text.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    data.phone = phoneMatch[0];
  }
  
  // Extract location (look for City, State pattern - more specific)
  const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2})(?:\s|$|\n|•|·)/);
  if (locationMatch) {
    data.location = `${locationMatch[1]}, ${locationMatch[2]}`;
  }
  
  // Extract LinkedIn - be more flexible
  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i);
  if (linkedinMatch) {
    data.linkedin = linkedinMatch[0];
  }
  
  // Extract summary/objective (look for paragraph after SUMMARY or OBJECTIVE)
  const summaryMatch = text.match(/(?:SUMMARY|OBJECTIVE|PROFESSIONAL SUMMARY)[:\s]*\n([^]*?)(?=\n\n[A-Z]|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EDUCATION|SKILLS|$)/i);
  if (summaryMatch && summaryMatch[1]) {
    data.summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  // Extract skills - look in SKILLS section
  const skillsMatch = text.match(/(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|SKILLS & OTHER)[:\s]*\n([^]*?)(?=\n\n[A-Z]|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EDUCATION|VOLUNTEERING|$)/i);
  if (skillsMatch && skillsMatch[1]) {
    // Clean up skills: remove bullets, extra spaces, format as comma-separated
    let skills = skillsMatch[1]
      .trim()
      .replace(/[•\-*·]/g, '')
      .replace(/Skills:/gi, '')
      .replace(/\n+/g, ', ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^,|,$/g, '');
    data.skills = skills;
  }
  
  // Extract volunteering
  const volunteeringMatch = text.match(/(?:VOLUNTEERING|VOLUNTEER EXPERIENCE)[:\s]*\n([^]*?)(?=\n\n[A-Z]|$)/i);
  if (volunteeringMatch && volunteeringMatch[1]) {
    data.volunteering = volunteeringMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  return data;
}

function applyImprovements(resumeData, suggestions) {
  // Apply action items to improve the resume
  if (suggestions.action_items) {
    for (const item of suggestions.action_items) {
      // This would apply specific improvements based on priority
      // For now, we'll just ensure the structure is good
    }
  }
  
  return resumeData;
}

/**
 * Generate HTML resume from template
 */
export async function generateResumeHTML(resumeData, originalText = '', templatePath = '/templates/professional-template.html') {
  try {
    const response = await fetch(templatePath);
    let template = await response.text();
    
    // Replace basic info
    template = template.replace(/\{\{name\}\}/g, resumeData.name || 'Your Name');
    template = template.replace(/\{\{location\}\}/g, resumeData.location || 'City, State');
    template = template.replace(/\{\{phone\}\}/g, resumeData.phone || '+1-234-456-789');
    template = template.replace(/\{\{email\}\}/g, resumeData.email || 'email@example.com');
    template = template.replace(/\{\{linkedin\}\}/g, resumeData.linkedin || 'linkedin.com/in/username');
    template = template.replace(/\{\{summary\}\}/g, resumeData.summary || 'Professional with experience in various industries.');
    template = template.replace(/\{\{skills\}\}/g, resumeData.skills || 'List your skills here');
    template = template.replace(/\{\{volunteering\}\}/g, resumeData.volunteering || '');
    
    // Handle handlebars-style loops - remove them and replace with content from original text
    // For experience section
    const experienceSection = extractSection(originalText, 'EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE');
    template = template.replace(/\{\{#each experience\}\}[\s\S]*?\{\{\/each\}\}/g, 
      experienceSection ? `<div class="job"><div style="white-space: pre-wrap;">${experienceSection}</div></div>` : 
      '<div class="job"><div class="company">Previous Company</div><div class="date">Year - Year</div><div class="job-title">Job Title</div><ul><li>Key achievement or responsibility</li></ul></div>'
    );
    
    // For education section
    const educationSection = extractSection(originalText, 'EDUCATION');
    template = template.replace(/\{\{#each education\}\}[\s\S]*?\{\{\/each\}\}/g,
      educationSection ? `<div class="education-item"><div style="white-space: pre-wrap;">${educationSection}</div></div>` :
      '<div class="education-item"><div class="school">University Name</div><div class="date">Year</div><div class="degree">Degree Name</div></div>'
    );
    
    // Clean up any remaining handlebars syntax
    template = template.replace(/\{\{#if\s+\w+\}\}/g, '');
    template = template.replace(/\{\{\/if\}\}/g, '');
    template = template.replace(/\{\{[^}]+\}\}/g, '');
    
    return template;
  } catch (error) {
    console.error('Error generating resume HTML:', error);
    return null;
  }
}

function extractSection(text, sectionPattern) {
  if (!text) return null;
  
  const regex = new RegExp(`(?:${sectionPattern})[:\\s]*\\n([^]*?)(?=\\n\\n[A-Z]+|$)`, 'i');
  const match = text.match(regex);
  
  if (match && match[1]) {
    return match[1].trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
  
  return null;
}

/**
 * Download resume as PDF
 */
export function downloadResumePDF(htmlContent, fileName = 'improved-resume.pdf') {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print dialog
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
  };
}
