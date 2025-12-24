export function parseResumeTextToStructuredData(resumeText) {
  if (!resumeText || resumeText.trim().length < 10) {
    return createEmptyStructure();
  }

  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line);
  const data = createEmptyStructure();

  // Extract contact information
  extractContactInfo(resumeText, data);
  
  // Extract name and header info (must be done early)
  extractHeaderInfo(lines, data);
  
  // Extract sections
  extractProfessionalSummary(resumeText, data);
  extractSkills(resumeText, data);
  extractVolunteering(resumeText, data);
  
  // Extract structured sections
  extractExperience(resumeText, data);
  extractEducation(resumeText, data);
  extractProjects(resumeText, data);

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

function extractContactInfo(text, data) {
  // Email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  if (emailMatch) {
    data.profile.email = emailMatch[0];
  }

  // Phone - improved patterns
  const phonePatterns = [
    // (123) 456-7890 or 123-456-7890
    /\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    // +1 123 456 7890
    /\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    // International loose
    /\+?\d{1,4}[-.\s]?\(?\d{2,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      // Clean up the phone number (remove leading/trailing chars that might be captured by loose regex)
      let phone = phoneMatch[0].trim();
      // If it starts with ')' or ends with '(', strip it
      if (phone.startsWith(')')) phone = phone.substring(1).trim();
      if (phone.endsWith('(')) phone = phone.substring(0, phone.length - 1).trim();
      
      data.profile.phone = phone;
      break;
    }
  }

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) {
    data.profile.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }
}

function extractHeaderInfo(lines, data) {
  const skipWords = /^(RESUME|CURRICULUM|CV|PROFESSIONAL|CONTACT|PHONE|EMAIL|ADDRESS|SUMMARY|OBJECTIVE|EXPERIENCE|EDUCATION|SKILLS|PROJECTS)$/i;
  
  // Try to parse the first few lines as a structured header
  // Example: "Name Email | Phone | Location"
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length < 3) continue;
    
    // Split by common separators (like | or - or •) or spaces if no separators found
    // Improved: try matching "Name Email" pattern first if separators fail
    let parts = line.split(/[|•]/).map(p => p.trim());
    if (parts.length === 1) {
        // No explicit separators, try splitting by known patterns
        // If line starts with Name and then has Email
        const emailIndex = line.search(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailIndex > 3) {
            parts = [line.substring(0, emailIndex).trim(), line.substring(emailIndex).trim()];
        }
    }
    
    // Part 0 is likely Name if it doesn't look like contact info
    const candidate = parts[0];
    
    if (candidate && candidate.length > 2 && candidate.length < 30 && 
        !candidate.includes('@') && !candidate.match(/\d/) && !skipWords.test(candidate)) {
        
        // Check if it looks like a name (Title Case or All Caps)
        const words = candidate.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
             data.profile.full_name = candidate;
        }
    }
    
    // Check other parts for Location if we haven't found it yet
    if (!data.profile.location) {
        for (let j = 1; j < parts.length; j++) {
            let part = parts[j];
            
            // Check if this part contains the start of a section (e.g. "Monterrey, Mexico PROFESSIONAL SUMMARY...")
            const sectionStartMatch = part.match(/(?:PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|PROFILE|ABOUT ME|WORK EXPERIENCE|EDUCATION|SKILLS)/i);
            if (sectionStartMatch) {
                part = part.substring(0, sectionStartMatch.index).trim();
            }

            // Simple heuristic for location: City, Country or City, State
            if (part.match(/[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+/)) {
                // Strict validation: Location shouldn't be too long
                if (part.length < 50 && !part.includes('Education') && !part.includes('Experience')) {
                    data.profile.location = part;
                }
            }
        }
    }
    
    // If we found name, stop looking for header
    if (data.profile.full_name) break;
  }
  
  // Fallback Location Search if not found in header line
  if (!data.profile.location) {
      const text = lines.join('\n');
      const locationPatterns = [
        /([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/,  // City, ST
        /([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+)/,  // City, Country
      ];
      
      for (const pattern of locationPatterns) {
        const locationMatch = text.match(pattern);
        if (locationMatch && locationMatch[0].length < 40) { // Reduced length limit to avoid capturing "Designed..." text
          const locString = locationMatch[0].trim();
          const invalidWords = /Experience|Education|Summary|Designed|Integrated|Developed|Portfolio|Project|Bachelor|Master|University|College|School|Page|Copyright|Development|Tools|Frameworks|Languages|Databases|Methodologies/i;
          if (!invalidWords.test(locString) && !locString.includes(':')) {
             data.profile.location = locString;
             break;
          }
        }
      }
  }
}

// Deprecated old extractName, replaced by extractHeaderInfo
function extractName(lines, data) {
    // Kept empty to avoid breaking references if any, but logic moved to extractHeaderInfo
}

function extractProfessionalSummary(text, data) {
  // Capture everything after the header until the end of the file
  // We will manually truncate it at the next section to ensure we don't miss anything due to strict regex lookaheads
  const regex = /(?:SUMMARY|OBJECTIVE|PROFILE|ABOUT ME)(?:[:\s]+|\n)([\s\S]+)/i;
  const match = text.match(regex);
  
  if (match && match[1]) {
    let summary = match[1].replace(/^(?:SUMMARY|OBJECTIVE|PROFILE|ABOUT ME)[:\s]*/i, '').trim();
    
    // Find the nearest start of a new section to cut off the summary
    const nextSections = [
      'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT',
      'EDUCATION', 'PROJECTS', 'SKILLS', 'VOLUNTEER', 'LANGUAGES', 'CERTIFICATIONS'
    ];
    
    let cutoffIndex = summary.length;
    
    for (const section of nextSections) {
        // Look for the section header. 
        // We look for it preceded by newline, double space, period, or even just a space if it's a strong header like "WORK EXPERIENCE"
        // We use a regex to find the first occurrence of this section header
        const sectionRegex = new RegExp(`(?:^|\\n|\\r|\\.|\\s{2,}|\\s)(?:${section})(?:[:\\s]|$)`, 'i');
        const sectionMatch = summary.match(sectionRegex);
        
        if (sectionMatch && sectionMatch.index !== undefined && sectionMatch.index < cutoffIndex) {
            cutoffIndex = sectionMatch.index;
        }
    }
    
    summary = summary.substring(0, cutoffIndex).trim();
    data.profile.professional_summary = summary.replace(/\s+/g, ' ');
  }
}

function extractSkills(text, data) {
  // Allow start of line, 2+ spaces, period+space, OR single space before strong headers
  const regex = /(?:^|\n|\s{2,}|\.\s+)(SKILLS|TECHNOLOGIES|COMPETENCIES|STACK)(?:[:\s]+|\n)([\s\S]+?)(?=(?:^|\n|\s{2,}|\.\s+|\s(?=WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EDUCATION|PROJECTS|VOLUNTEER|PROFESSIONAL))(?:EXPERIENCE|WORK|EDUCATION|PROJECTS|VOLUNTEER|PROFESSIONAL)|$)/i;
  const match = text.match(regex);
  
  if (match && match[2]) {
    let rawSkills = match[2];
    
    // Cleanup: remove bullets, normalize spaces
    rawSkills = rawSkills.replace(/[•\-*]/g, '');
    rawSkills = rawSkills.replace(/\n/g, ', ');
    rawSkills = rawSkills.replace(/\s{2,}/g, ' ');
    rawSkills = rawSkills.replace(/,\s*,/g, ',');
    
    let skills = rawSkills.trim();
    if (skills.endsWith(',')) skills = skills.slice(0, -1);
    
    data.profile.skills = skills;
  }
}

function extractVolunteering(text, data) {
  const regex = /(?:VOLUNTEER|COMMUNITY)(?:[:\s]+|\n)([\s\S]+?)(?=(?:^|\n|\s{2,}|\.\s+|\s(?=WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|PROJECTS))(?:EXPERIENCE|WORK|EDUCATION|SKILLS|PROJECTS)|$)/i;
  const match = text.match(regex);
  if (match && match[1]) {
    data.profile.volunteering = match[1].trim().replace(/\s+/g, ' ');
  }
}

function extractExperience(text, data) {
  // Use robust lookahead to stop at the start of the next section
  const sectionRegex = /(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT)(?:[:\s]+|\n)([\s\S]+?)(?=(?:^|\n|\s{2,}|\.\s+|\s(?=EDUCATION|SKILLS|PROJECTS|VOLUNTEER))(?:EDUCATION|SKILLS|PROJECTS|VOLUNTEER)|$)/i;
  const match = text.match(sectionRegex);
  
  if (match && match[1]) {
    const sectionText = match[1];
    data.work_experience = parseExperienceLines(sectionText);
  }
}

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        // Try parsing "May 2027" manually if Date constructor fails
        const parts = dateStr.split(' ');
        if (parts.length === 2) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthIndex = monthNames.findIndex(m => parts[0].startsWith(m));
            if (monthIndex >= 0) {
                const year = parts[1];
                const month = String(monthIndex + 1).padStart(2, '0');
                return `${year}-${month}`;
            }
        }
        return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch (e) {
    return '';
  }
}

function parseExperienceLines(text) {
  const experiences = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentExp = null;
  
  for (const line of lines) {
    const dateMatch = line.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)/i);
    const titleCompanyMatch = line.match(/^(.+?)\s+(?:at|@|\|)\s+(.+)$/i);
    
    if (dateMatch) {
      if (currentExp && currentExp.description) {
        experiences.push(currentExp);
        currentExp = null;
      }
      
      if (!currentExp) {
        currentExp = {
          company: '',
          position: '',
          location: '',
          start_date: formatDateForInput(dateMatch[1]),
          end_date: /Present|Current/i.test(dateMatch[2]) ? '' : formatDateForInput(dateMatch[2]),
          current: /Present|Current/i.test(dateMatch[2]),
          description: ''
        };
      } else {
        currentExp.start_date = formatDateForInput(dateMatch[1]);
        currentExp.end_date = /Present|Current/i.test(dateMatch[2]) ? '' : formatDateForInput(dateMatch[2]);
        currentExp.current = /Present|Current/i.test(dateMatch[2]);
      }
      
    } else if (titleCompanyMatch) {
      if (currentExp && currentExp.description) {
        experiences.push(currentExp);
        currentExp = null;
      }
      
      if (!currentExp) currentExp = { description: '', current: false };
      
      currentExp.position = titleCompanyMatch[1].trim();
      currentExp.company = titleCompanyMatch[2].trim();
      
    } else if (line.length < 60 && !line.startsWith('•') && !line.startsWith('-') && !currentExp?.description) {
        if (currentExp && currentExp.description) {
            experiences.push(currentExp);
            currentExp = null;
        }
        if (!currentExp) currentExp = { description: '', current: false };
        
        if (!currentExp.position) currentExp.position = line;
        else if (!currentExp.company) currentExp.company = line;
        
    } else if (currentExp) {
      const cleanLine = line.replace(/^[•\-*]\s*/, '');
      currentExp.description += (currentExp.description ? ' | ' : '') + cleanLine;
    }
  }
  
  if (currentExp) experiences.push(currentExp);
  return experiences;
}

function extractEducation(text, data) {
  const sectionRegex = /(?:EDUCATION|ACADEMIC)(?:[:\s]+|\n)([\s\S]+?)(?=(?:^|\n|\s{2,}|\.\s+|\s(?=EXPERIENCE|WORK EXPERIENCE|SKILLS|PROJECTS|VOLUNTEER))(?:EXPERIENCE|SKILLS|PROJECTS|VOLUNTEER)|$)/i;
  const match = text.match(sectionRegex);
  
  if (match && match[1]) {
    data.education = parseEducationLines(match[1]);
  }
}

function parseEducationLines(text) {
  const items = [];
  // Split by newlines, but if it's dense, try to match robustly
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let current = null;
  
  for (const line of lines) {
    // If a single line contains Degree AND School AND Date, parse it all at once
    // Use non-greedy matchers or specific patterns to avoid capturing the whole line
    const dateMatch = line.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b|\b\d{4}\b/i);
    const degreeMatch = line.match(/(?:Bachelor|Master|Doctor|PhD|B\.?S|B\.?A|M\.?S|M\.?A|MBA|Degree|Diploma|Certificate)(?:\s+of\s+|\s+in\s+|\s+)[\w\s]*/i);
    const schoolMatch = line.match(/(?:University|College|Institute|School|Academy|Polytechnic|Universidad)[\w\s]*/i);

     if (dateMatch && degreeMatch && schoolMatch) {
         if (current) items.push(current);
         
         // Clean up extracted parts
         // The degree match might include the school if we aren't careful, so we split or constrain it
         // Better strategy: Identify the DATE. Everything before is Degree+School.
         // Split Degree+School by "University" or similar.
         
         const dateStr = dateMatch[0];
         const lineWithoutDate = line.replace(dateStr, '').trim();
         
         // Find where the school starts
         const schoolIndex = lineWithoutDate.search(/(?:University|College|Institute|School|Academy|Polytechnic|Universidad)/i);
         
         let degreeStr = '';
         let schoolStr = '';
         
         if (schoolIndex > 0) {
             degreeStr = lineWithoutDate.substring(0, schoolIndex).trim();
             // Remove trailing comma or " at "
             degreeStr = degreeStr.replace(/,\s*$/, '').replace(/\s+at\s*$/, '');
             schoolStr = lineWithoutDate.substring(schoolIndex).trim();
             // Remove trailing comma
             schoolStr = schoolStr.replace(/,\s*$/, '');
         } else {
             // Fallback if school is first? Unlikely for "Bachelor... University..."
             // Just use the regex matches but be careful
             degreeStr = degreeMatch[0].trim();
             schoolStr = schoolMatch[0].trim();
         }

         items.push({
             institution: schoolStr,
             degree: degreeStr,
             graduation_date: formatDateForInput(dateStr),
             location: ''
         });
         current = null;
         continue; 
    }

    // Flexible Degree Match
    if (/Bachelor|Master|Doctor|PhD|B\.?S|B\.?A|M\.?S|M\.?A|MBA|Degree|Diploma|Certificate/i.test(line)) {
      if (current) items.push(current);
      current = { institution: '', degree: line, graduation_date: '', location: '' };
    } 
    // Flexible Institution Match
    else if (/University|College|Institute|School|Academy|Polytechnic/i.test(line)) {
      if (current && !current.institution) current.institution = line;
      else if (!current) current = { institution: line, degree: '', graduation_date: '', location: '' };
    }
    // Date Match
    else if (/\d{4}/.test(line)) {
      if (current) current.graduation_date = formatDateForInput(line);
    }
  }
  if (current) items.push(current);
  return items;
}

function extractProjects(text, data) {
  const sectionRegex = /(?:PROJECTS)(?:[:\s]+|\n)([\s\S]+?)(?=(?:^|\n|\s{2,}|\.\s+|\s(?=EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|VOLUNTEER))(?:EXPERIENCE|EDUCATION|SKILLS|VOLUNTEER)|$)/i;
  const match = text.match(sectionRegex);
  
  if (match && match[1]) {
    data.projects = parseProjectLines(match[1]);
  }
}

function parseProjectLines(text) {
  const items = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let current = null;
  
  for (const line of lines) {
    if (line.length < 60 && !line.startsWith('•') && !line.startsWith('-')) {
      if (current) items.push(current);
      current = { title: line, link: '', description: '', tech: '' };
      
      const linkMatch = line.match(/https?:\/\/\S+/);
      if (linkMatch) {
          current.link = linkMatch[0];
          current.title = line.replace(linkMatch[0], '').trim();
      }
    } else if (current) {
      const cleanLine = line.replace(/^[•\-*]\s*/, '');
      current.description += (current.description ? ' | ' : '') + cleanLine;
    }
  }
  if (current) items.push(current);
  return items;
}