export function parseResumeTextToStructuredData(resumeText) {
  if (!resumeText) {
    return {
      profile: {
        full_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        professional_summary: '',
        skills: '',
        volunteering: ''
      },
      work_experience: [],
      education: [],
      projects: []
    };
  }

  const lines = resumeText.split('\n').filter(line => line.trim());
  const data = {
    profile: {
      full_name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      professional_summary: '',
      skills: '',
      volunteering: ''
    },
    work_experience: [],
    education: [],
    projects: []
  };

  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    data.profile.email = emailMatch[0];
  }

  const phoneMatch = resumeText.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    data.profile.phone = phoneMatch[0];
  }

  const locationMatch = resumeText.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2})(?:\s|$|\n|•|·)/);
  if (locationMatch) {
    data.profile.location = locationMatch[0].trim();
  }

  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/([\w-]+)/i);
  if (linkedinMatch) {
    data.profile.linkedin = `https://${linkedinMatch[0]}`;
  }

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/) && 
        !line.match(/^(PROFESSIONAL|EXPERIENCE|EDUCATION|SKILLS|SUMMARY|OBJECTIVE|CONTACT|RESUME|CV)/i) &&
        !line.includes('@') && !line.includes('linkedin') && !line.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?/)) {
      data.profile.full_name = line;
      break;
    }
  }

  const summaryMatch = resumeText.match(/(?:SUMMARY|OBJECTIVE|PROFESSIONAL SUMMARY)[:\s]*\n([^]*?)(?=\n\n[A-Z]|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EDUCATION|SKILLS|$)/i);
  if (summaryMatch && summaryMatch[1]) {
    data.profile.professional_summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
  }

  const skillsMatch = resumeText.match(/(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|SKILLS & OTHER)[:\s]*\n([^]*?)(?=\n\n[A-Z]|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EDUCATION|VOLUNTEERING|$)/i);
  if (skillsMatch && skillsMatch[1]) {
    let skills = skillsMatch[1]
      .trim()
      .replace(/[•\-*·]/g, '')
      .replace(/Skills:/gi, '')
      .replace(/\n+/g, ', ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^,|,$/g, '');
    data.profile.skills = skills;
  }

  const volunteeringMatch = resumeText.match(/(?:VOLUNTEERING|VOLUNTEER EXPERIENCE)[:\s]*\n([^]*?)(?=\n\n[A-Z]|$)/i);
  if (volunteeringMatch && volunteeringMatch[1]) {
    data.profile.volunteering = volunteeringMatch[1].trim().replace(/\s+/g, ' ');
  }

  const experienceSection = extractSection(resumeText, 'EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE');
  if (experienceSection) {
    data.work_experience = parseExperienceSection(experienceSection);
  }

  const educationSection = extractSection(resumeText, 'EDUCATION');
  if (educationSection) {
    data.education = parseEducationSection(educationSection);
  }

  return data;
}

function extractSection(text, sectionPattern) {
  const regex = new RegExp(`(${sectionPattern})[:\s]*\n([^]*?)(?=\n\n[A-Z]{2,}|${sectionPattern}|$)`, 'i');
  const match = text.match(regex);
  if (match && match[2]) {
    return match[2].trim();
  }
  return null;
}

function parseExperienceSection(sectionText) {
  const experiences = [];
  const lines = sectionText.split('\n').filter(line => line.trim());
  
  let currentExp = null;
  let collectingDescription = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s+(?:Software|Senior|Junior|Lead|Manager|Engineer|Developer|Analyst|Specialist|Coordinator|Director|VP|President|Developer|Designer|Consultant|Architect|Scientist|Researcher|Intern|Assistant|Coordinator|Executive|Administrator|Supervisor|Technician)/i)) {
      if (currentExp && currentExp.position) {
        experiences.push(currentExp);
      }
      currentExp = {
        position: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        description: '',
        current: false
      };
      
      const atMatch = line.match(/^(.+?)\s+(?:at|@|,)\s+(.+)$/i);
      if (atMatch) {
        currentExp.position = atMatch[1].trim();
        const companyParts = atMatch[2].trim().split(',').map(p => p.trim());
        currentExp.company = companyParts[0];
        if (companyParts.length > 1) {
          currentExp.location = companyParts.slice(1).join(', ');
        }
      } else {
        currentExp.position = line;
      }
      collectingDescription = false;
    } else if (line.match(/\d{4}\s*[-–]\s*\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}\s*[-–]\s*(Present|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4})/i)) {
      if (currentExp) {
        const dateMatch = line.match(/(\w+\s+\d{4}|\d{4})\s*[-–]\s*(\w+\s+\d{4}|\d{4}|Present)/i);
        if (dateMatch) {
          currentExp.start_date = dateMatch[1].trim();
          currentExp.end_date = dateMatch[2].trim();
          if (dateMatch[2].toLowerCase() === 'present') {
            currentExp.current = true;
            currentExp.end_date = '';
          }
        }
        collectingDescription = true;
      }
    } else if (collectingDescription && currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.match(/^[A-Z]/))) {
      const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
      if (cleanLine.length > 10) {
        currentExp.description += (currentExp.description ? ' | ' : '') + cleanLine;
      }
    }
  }
  
  if (currentExp && currentExp.position) {
    experiences.push(currentExp);
  }
  
  return experiences;
}

function parseEducationSection(sectionText) {
  const educations = [];
  const lines = sectionText.split('\n').filter(line => line.trim());
  
  let currentEdu = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/(Bachelor|Master|Doctor|PhD|Associate|Certificate|Diploma)/i)) {
      if (currentEdu) {
        educations.push(currentEdu);
      }
      currentEdu = {
        degree: '',
        institution: '',
        location: '',
        graduation_date: '',
        current: false
      };
      
      const parts = line.split(/\s+in\s+|\s+from\s+/i);
      if (parts.length >= 2) {
        currentEdu.degree = parts[0].trim();
        currentEdu.institution = parts[1].trim();
      } else {
        currentEdu.degree = line;
      }
    } else if (line.match(/\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}/i) && currentEdu) {
      currentEdu.graduation_date = line;
    } else if (line.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s*(University|College|Institute|School)/i) && currentEdu && !currentEdu.institution) {
      currentEdu.institution = line;
    }
  }
  
  if (currentEdu) {
    educations.push(currentEdu);
  }
  
  return educations;
}

