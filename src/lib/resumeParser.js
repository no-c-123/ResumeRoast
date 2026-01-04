export function parseResumeTextToStructuredData(resumeText) {
  if (!resumeText || resumeText.trim().length < 10) {
    return createEmptyStructure();
  }

  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line);
  const data = createEmptyStructure();

  // Extract in order of reliability
  extractName(lines, data);
  extractContactInfo(resumeText, data);
  extractLocation(resumeText, data);
  extractProfessionalSummary(resumeText, data);
  extractSkills(resumeText, data);
  extractExperience(resumeText, data);
  extractEducation(resumeText, data);
  extractProjects(resumeText, data);
  extractVolunteering(resumeText, data);

  return data;
}

function createEmptyStructure() {
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

function extractName(lines, data) {
  // Name is typically in the first 3 lines, all caps or title case
  const skipWords = /^(RESUME|CURRICULUM|CV|PROFESSIONAL|CONTACT|PHONE|EMAIL|ADDRESS|SUMMARY|OBJECTIVE|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|HTTP|WWW)/i;
  
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip lines with contact info
    if (line.includes('@') || line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) continue;
    
    // Skip section headers
    if (skipWords.test(line)) continue;
    
    // Name should be 2-5 words, 5-50 chars
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && line.length >= 5 && line.length <= 50) {
      // Check if it looks like a name (mostly letters, possibly with periods for initials)
      if (/^[A-Z][a-zA-Z.\s'-]+$/.test(line)) {
        data.profile.full_name = line;
        return;
      }
    }
  }
}

function extractContactInfo(text, data) {
  // Email - most reliable pattern
  const emailMatch = text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  if (emailMatch) {
    data.profile.email = emailMatch[0];
  }

  // Phone - multiple formats
  const phonePatterns = [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,  // (123) 456-7890
    /\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,  // +1 123 456 7890
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/  // 123-456-7890
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      data.profile.phone = phoneMatch[0].trim();
      break;
    }
  }

  // LinkedIn
  const linkedinPatterns = [
    /linkedin\.com\/in\/[\w-]+/i,
    /linkedin\.com\/[\w-]+/i
  ];
  
  for (const pattern of linkedinPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.profile.linkedin = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
      break;
    }
  }
}

function extractLocation(text, data) {
  // Look for "City, State" or "City, Country" pattern
  // Exclude lines that look like section headers or descriptions
  const lines = text.split('\n').map(l => l.trim());
  
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    
    // Skip lines with section headers
    if (/^(RESUME|PROFESSIONAL|SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS)/i.test(line)) continue;
    
    // Match "City, State/Country" pattern
    const locationMatch = line.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z\s]+)\b/);
    
    if (locationMatch && locationMatch[0].length < 50) {
      const location = locationMatch[0];
      // Exclude if it contains verbs/actions
      if (!/develop|design|build|create|manage|lead|work|experience/i.test(location)) {
        data.profile.location = location;
        return;
      }
    }
  }
}

function extractProfessionalSummary(text, data) {
  // Find summary section - be flexible with headers
  const summaryHeaders = [
    'PROFESSIONAL SUMMARY',
    'SUMMARY',
    'PROFILE',
    'OBJECTIVE',
    'ABOUT ME',
    'ABOUT'
  ];
  
  for (const header of summaryHeaders) {
    const regex = new RegExp(`${header}[:\\s]*\\n([\\s\\S]+?)(?=\\n\\s*(?:SKILLS|EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|TECHNICAL SKILLS)|$)`, 'i');
    const match = text.match(regex);
    
    if (match && match[1]) {
      let summary = match[1].trim();
      // Clean up extra whitespace
      summary = summary.replace(/\s+/g, ' ');
      // Remove any stray section headers that leaked in
      summary = summary.replace(/\b(SKILLS|EXPERIENCE|EDUCATION|PROJECTS)\b.*/i, '').trim();
      
      if (summary.length > 30) {
        data.profile.professional_summary = summary;
        return;
      }
    }
  }
}

function extractSkills(text, data) {
  const skillsHeaders = ['SKILLS', 'TECHNICAL SKILLS', 'TECHNOLOGIES', 'COMPETENCIES'];
  
  for (const header of skillsHeaders) {
    const regex = new RegExp(`${header}[:\\s]*\\n([\\s\\S]+?)(?=\\n\\s*(?:EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|PROFESSIONAL SUMMARY|VOLUNTEERING)|$)`, 'i');
    const match = text.match(regex);
    
    if (match && match[1]) {
      let skills = match[1].trim();
      
      // Clean up formatting
      skills = skills.replace(/[•\-*]\s*/g, '');  // Remove bullets
      skills = skills.replace(/\n+/g, ', ');  // Replace newlines with commas
      skills = skills.replace(/\s{2,}/g, ' ');  // Normalize spaces
      skills = skills.replace(/,\s*,+/g, ',');  // Remove duplicate commas
      skills = skills.replace(/,\s*$/, '');  // Remove trailing comma
      
      // Remove any section headers that leaked in
      skills = skills.replace(/\b(EXPERIENCE|EDUCATION|PROJECTS)\b.*/i, '').trim();
      
      if (skills.length > 10) {
        data.profile.skills = skills;
        return;
      }
    }
  }
}

function extractExperience(text, data) {
  const experienceHeaders = [
    'WORK EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'EXPERIENCE',
    'EMPLOYMENT HISTORY',
    'WORK HISTORY'
  ];
  
  for (const header of experienceHeaders) {
    const regex = new RegExp(`${header}[:\\s]*\\n([\\s\\S]+?)(?=\\n\\s*(?:EDUCATION|PROJECTS|SKILLS|VOLUNTEERING|CERTIFICATIONS)|$)`, 'i');
    const match = text.match(regex);
    
    if (match && match[1]) {
      data.work_experience = parseExperienceSection(match[1]);
      return;
    }
  }
}

function parseExperienceSection(sectionText) {
  const experiences = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentExp = null;
  
  for (const line of lines) {
    // Check for date range pattern
    const dateMatch = line.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s*[-–—]\s*((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current)/i);
    
    if (dateMatch) {
      // Save previous experience if exists
      if (currentExp && currentExp.position) {
        experiences.push(currentExp);
      }
      
      const positionOrCompany = line.substring(0, dateMatch.index).trim();
      
      // Start new experience
      currentExp = {
        position: positionOrCompany,
        company: '',
        location: '',
        start_date: convertDateToYYYYMM(dateMatch[1]),
        end_date: /Present|Current/i.test(dateMatch[2]) ? '' : convertDateToYYYYMM(dateMatch[2]),
        current: /Present|Current/i.test(dateMatch[2]),
        description: ''
      };
      continue;
    }
    
    // Check for "Position at Company" or "Position | Company" pattern
    const titleCompanyMatch = line.match(/^(.+?)\s+(?:at|@|\|)\s+(.+)$/i);
    if (titleCompanyMatch && !line.startsWith('•') && !line.startsWith('-')) {
      if (currentExp) {
        currentExp.position = titleCompanyMatch[1].trim();
        currentExp.company = titleCompanyMatch[2].trim();
      }
      continue;
    }
    
    // Check if this is a job title line (short, no bullet, title case)
    if (line.length < 60 && !line.startsWith('•') && !line.startsWith('-') && /^[A-Z]/.test(line)) {
      if (currentExp) {
        if (!currentExp.position) {
          currentExp.position = line;
        } else if (!currentExp.company) {
          currentExp.company = line;
        }
      }
      continue;
    }
    
    // This is description text (bullet points or regular text)
    if (currentExp) {
      const cleanLine = line.replace(/^[•\-*]\s*/, '');
      if (currentExp.description) {
        currentExp.description += '\n• ' + cleanLine;
      } else {
        currentExp.description = '• ' + cleanLine;
      }
    }
  }
  
  // Don't forget the last experience
  if (currentExp && currentExp.position) {
    experiences.push(currentExp);
  }
  
  return experiences;
}

function extractEducation(text, data) {
  const educationHeaders = ['EDUCATION', 'ACADEMIC BACKGROUND', 'ACADEMIC'];
  
  for (const header of educationHeaders) {
    const regex = new RegExp(`${header}[:\\s]*\\n([\\s\\S]+?)(?=\\n\\s*(?:EXPERIENCE|WORK EXPERIENCE|SKILLS|PROJECTS|VOLUNTEERING|CERTIFICATIONS)|$)`, 'i');
    const match = text.match(regex);
    
    if (match && match[1]) {
      data.education = parseEducationSection(match[1]);
      return;
    }
  }
}

function parseEducationSection(sectionText) {
  const educationItems = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentEdu = null;
  
  for (const line of lines) {
    // Check for date pattern
    const dateMatch = line.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s*[-–—]\s*((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current)/i);
    
    if (dateMatch) {
      if (currentEdu) {
        educationItems.push(currentEdu);
      }
      
      const schoolOrDegree = line.substring(0, dateMatch.index).trim();
      
      currentEdu = {
        school: schoolOrDegree,
        degree: '',
        location: '',
        start_date: convertDateToYYYYMM(dateMatch[1]),
        end_date: /Present|Current/i.test(dateMatch[2]) ? '' : convertDateToYYYYMM(dateMatch[2]),
        current: /Present|Current/i.test(dateMatch[2])
      };
      continue;
    }
    
    // Check for school name
    if (/University|College|Institute|School|Academy/i.test(line)) {
      if (!currentEdu) {
        currentEdu = {
          school: '',
          degree: '',
          location: '',
          start_date: '',
          end_date: '',
          current: false
        };
      }
      currentEdu.school = line;
      continue;
    }
    
    // Check for degree
    if (/Bachelor|Master|Doctor|PhD|B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|MBA|Associate/i.test(line)) {
      if (!currentEdu) {
        currentEdu = {
          school: '',
          degree: '',
          location: '',
          start_date: '',
          end_date: '',
          current: false
        };
      }
      currentEdu.degree = line;
      continue;
    }
    
    // Check for location
    const locationMatch = line.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z\s]+)\b/);
    if (locationMatch && currentEdu && !currentEdu.location) {
      currentEdu.location = locationMatch[0];
    }
  }
  
  if (currentEdu) {
    educationItems.push(currentEdu);
  }
  
  return educationItems;
}

function extractProjects(text, data) {
  const projectHeaders = ['PROJECTS', 'PERSONAL PROJECTS', 'KEY PROJECTS'];
  
  for (const header of projectHeaders) {
    const regex = new RegExp(`${header}[:\\s]*\\n([\\s\\S]+?)(?=\\n\\s*(?:EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|VOLUNTEERING|CERTIFICATIONS)|$)`, 'i');
    const match = text.match(regex);
    
    if (match && match[1]) {
      data.projects = parseProjectsSection(match[1]);
      return;
    }
  }
}

function parseProjectsSection(sectionText) {
  const projects = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentProject = null;
  
  for (const line of lines) {
    // Check if this is a project title (short line, not a bullet, not a URL)
    // AND check if it's NOT a continuation of a previous sentence (previous line didn't end with punctuation)
    // AND check if the line itself doesn't end with a period (titles rarely end with periods)
    const isTitleCandidate = line.length < 100 && 
                           !line.startsWith('•') && 
                           !line.startsWith('-') && 
                           !line.startsWith('http') && 
                           /^[A-Z]/.test(line) &&
                           !line.trim().endsWith('.');

    // If it looks like a title, but we have a current project with a "hanging" description (no period at end),
    // treat this line as a continuation of that description instead of a new title.
    let isContinuation = false;
    if (currentProject && currentProject.description) {
        const descTrimmed = currentProject.description.trim();
        if (descTrimmed.length > 0 && !/[.!?;]$/.test(descTrimmed)) {
            isContinuation = true;
        }
    }

    if (isTitleCandidate && !isContinuation) {
      // Save previous project
      if (currentProject) {
        projects.push(currentProject);
      }
      
      // Start new project
      currentProject = {
        title: line,
        description: ''
      };
      continue;
    }
    
    // This is description text
    if (currentProject) {
      const cleanLine = line.replace(/^[•\-*]\s*/, '');
      if (currentProject.description) {
        // If the previous description didn't end with a space or newline, add a space
        const needsSpace = !currentProject.description.endsWith(' ') && !currentProject.description.endsWith('\n');
        currentProject.description += (needsSpace ? ' ' : '') + cleanLine;
      } else {
        currentProject.description = cleanLine;
      }
    }
  }
  
  if (currentProject) {
    projects.push(currentProject);
  }
  
  return projects;
}

function extractVolunteering(text, data) {
  const regex = /(?:VOLUNTEER|VOLUNTEERING|COMMUNITY)[:\s]*\n([\s\S]+?)(?=\n\s*(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)|$)/i;
  const match = text.match(regex);
  
  if (match && match[1]) {
    data.profile.volunteering = match[1].trim().replace(/\s+/g, ' ');
  }
}

// Helper function to convert "May 2024" or "May 2024 - Present" to "2024-05"
function convertDateToYYYYMM(dateStr) {
  if (!dateStr || /Present|Current/i.test(dateStr)) return '';
  
  const monthMap = {
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12'
  };
  
  // Extract month and year
  const match = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})/i);
  
  if (match) {
    const month = monthMap[match[1].toLowerCase()];
    const year = match[2];
    return `${year}-${month}`;
  }
  
  return '';
}
