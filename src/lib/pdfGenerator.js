import { jsPDF } from 'jspdf';

const formatDateRange = (startDate, endDate, isCurrent) => {
    if (!startDate && !endDate) return '';
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    
    const start = formatDate(startDate);
    const end = isCurrent ? 'Present' : formatDate(endDate);
    
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    return end;
};

export const generateResumePDF = (profile, workExperience, education, projects, selectedTemplate = 'professional', customSections = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // Template Config
    const configs = {
        professional: { font: 'helvetica', accent: '#2563eb' }, // Blue
        modern: { font: 'helvetica', accent: '#000000' }, // Black
        classic: { font: 'times', accent: '#000000' },
        executive: { font: 'times', accent: '#2563eb' },
        minimalist: { font: 'helvetica', accent: '#000000' },
        elegant: { font: 'times', accent: '#2563eb' },
        ivy: { font: 'times', accent: '#000000' }
    };

    const config = configs[selectedTemplate] || configs.professional;
    const fontName = config.font;
    const accentColor = config.accent;

    // Helper for page breaks
    const checkPageBreak = (heightNeeded) => {
        if (y + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = 20;
            return true;
        }
        return false;
    };

    // Helper to print text with wrapping
    const printText = (text, fontSize, isBold = false, align = 'left', color = '#000000', isItalic = false) => {
        if (!text) return;
        
        doc.setFontSize(fontSize);
        const fontStyle = isBold && isItalic ? 'bolditalic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal';
        doc.setFont(fontName, fontStyle);
        doc.setTextColor(color);
        
        // Handle alignment manually for center
        if (align === 'center') {
            const lines = doc.splitTextToSize(text, contentWidth);
            lines.forEach(line => {
                checkPageBreak(fontSize * 0.5);
                doc.text(line, pageWidth / 2, y, { align: 'center' });
                y += (fontSize * 0.45); // Line height
            });
            y += 2; // Paragraph spacing
        } else {
            const lines = doc.splitTextToSize(text, contentWidth);
            checkPageBreak(lines.length * (fontSize * 0.5));
            doc.text(lines, margin, y);
            y += (lines.length * (fontSize * 0.45)) + 2;
        }
    };

    // --- Header ---
    if (selectedTemplate === 'ivy') {
        printText(profile.full_name || 'Your Name', 24, true, 'center');
        
        const contact = [
            profile.location,
            profile.phone,
            profile.email,
            profile.linkedin ? 'LinkedIn' : ''
        ].filter(Boolean).join('  •  '); // Use bullet for Ivy
        
        printText(contact, 10, false, 'center', '#000000');
        
        // No line for Ivy
        y += 10;
    } else {
        printText(profile.full_name || 'Your Name', 24, true, 'center');
        
        const contact = [
            profile.location,
            profile.phone,
            profile.email,
            profile.linkedin ? 'LinkedIn' : ''
        ].filter(Boolean).join(' | ');
        
        printText(contact, 10, false, 'center', '#444444');
        
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
    }

    // --- Summary ---
    if (profile.professional_summary) {
        checkPageBreak(20);
        
        if (selectedTemplate === 'ivy') {
            doc.setFontSize(10);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text('PROFESSIONAL SUMMARY', margin, y);
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
            printText(profile.professional_summary, 10, false);
        } else {
            printText('PROFESSIONAL SUMMARY', 12, true, 'left', accentColor);
            printText(profile.professional_summary, 10, false);
        }
        y += 5;
    }

    // --- Skills ---
    if (profile.skills) {
        checkPageBreak(20);
        if (selectedTemplate === 'ivy') {
            doc.setFontSize(10);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text('SKILLS', margin, y);
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
            printText(profile.skills, 10, false);
        } else {
            printText('SKILLS', 12, true, 'left', accentColor);
            printText(profile.skills.split(',').map(s => s.trim()).join(' | '), 10, false);
        }
        y += 5;
    }

    // --- Experience ---
    if (workExperience.length > 0) {
        checkPageBreak(20);
        if (selectedTemplate === 'ivy') {
            doc.setFontSize(10);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text('WORK EXPERIENCE', margin, y);
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
        } else {
            printText('WORK EXPERIENCE', 12, true, 'left', accentColor);
        }
        
        workExperience.forEach(exp => {
            if (!exp.company && !exp.position) return;
            checkPageBreak(30);
            
            // Position
            doc.setFontSize(11);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text(exp.position || 'Position', margin, y);
            
            // Date
            const dateStr = formatDateRange(exp.start_date, exp.end_date, exp.current);
            if (selectedTemplate === 'ivy') {
                doc.setFont(fontName, 'bold'); // Bold date for Ivy
                doc.setFontSize(11);
                doc.setTextColor('#000000');
            } else {
                doc.setFont(fontName, 'normal');
                doc.setFontSize(10);
                doc.setTextColor('#666666');
            }
            doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
            
            y += 5;
            
            // Company
            doc.setFontSize(10);
            doc.setFont(fontName, 'italic');
            doc.setTextColor(selectedTemplate === 'ivy' ? '#000000' : '#444444');
            doc.text(exp.company || '', margin, y);
            
            if (selectedTemplate === 'ivy' && exp.location) {
                 // Right align location for Ivy
                 doc.text(exp.location, pageWidth - margin, y, { align: 'right' });
            }

            y += 6;
            
            // Description
            if (exp.description) {
                printText(exp.description, 10, false);
            }
            y += 3;
        });
    }

    // --- Education ---
    if (education.length > 0) {
        checkPageBreak(20);
        if (selectedTemplate === 'ivy') {
            doc.setFontSize(10);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text('EDUCATION', margin, y);
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
        } else {
            printText('EDUCATION', 12, true, 'left', accentColor);
        }
        
        education.forEach(edu => {
            if (!edu.school && !edu.degree) return;
            checkPageBreak(25);
            
            if (selectedTemplate === 'ivy') {
                // School Name First for Ivy
                 doc.setFontSize(11);
                doc.setFont(fontName, 'bold');
                doc.setTextColor('#000000');
                doc.text(edu.school || 'School', margin, y);

                const dateStr = formatDateRange(edu.start_date, edu.end_date, edu.current);
                doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
                y += 5;

                // Degree
                doc.setFontSize(10);
                doc.setFont(fontName, 'normal'); // Normal for degree
                doc.text(edu.degree || '', margin, y);
                
                if (edu.location) {
                    doc.text(edu.location, pageWidth - margin, y, { align: 'right' });
                }
                y += 6;

            } else {
                // Degree First for others
                doc.setFontSize(11);
                doc.setFont(fontName, 'bold');
                doc.setTextColor('#000000');
                doc.text(edu.degree || 'Degree', margin, y);
                
                // Date
                const dateStr = formatDateRange(edu.start_date, edu.end_date, edu.current);
                doc.setFont(fontName, 'normal');
                doc.setFontSize(10);
                doc.setTextColor('#666666');
                doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
                
                y += 5;
                
                // School
                doc.setFontSize(10);
                doc.setFont(fontName, 'italic');
                doc.setTextColor('#444444');
                doc.text(edu.school || '', margin, y);
                y += 6;
            }
            
            if (edu.field) {
                printText(edu.field, 10, false);
            }
            y += 3;
        });
    }

    // --- Projects ---
    if (projects.length > 0) {
        checkPageBreak(20);
        if (selectedTemplate === 'ivy') {
            doc.setFontSize(10);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text('PROJECTS', margin, y);
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
        } else {
            printText('PROJECTS', 12, true, 'left', accentColor);
        }
        
        projects.forEach(proj => {
            if (!proj.title) return;
            checkPageBreak(25);
            
            // Title
            doc.setFontSize(11);
            doc.setFont(fontName, 'bold');
            doc.setTextColor('#000000');
            doc.text(proj.title, margin, y);
            y += 6;
            
            if (proj.description) {
                printText(proj.description, 10, false);
            }
            y += 3;
        });
    }

    // --- Volunteering ---
    if (profile.volunteering) {
        checkPageBreak(20);
        printText('VOLUNTEERING', 12, true, 'left', accentColor);
        printText(profile.volunteering, 10, false);
    }

    // --- Custom Sections ---
    if (customSections && customSections.length > 0) {
        customSections.forEach(section => {
            if (!section.items || section.items.length === 0) return;
            
            checkPageBreak(20);
            
            if (selectedTemplate === 'ivy') {
                doc.setFontSize(10);
                doc.setFont(fontName, 'bold');
                doc.setTextColor('#000000');
                doc.text(section.name.toUpperCase(), margin, y);
                y += 2;
                doc.setDrawColor(0, 0, 0);
                doc.line(margin, y, pageWidth - margin, y);
                y += 5;
            } else {
                printText(section.name, 12, true, 'left', accentColor);
            }

            section.items.forEach(item => {
                checkPageBreak(25);
                
                // Title
                doc.setFontSize(11);
                doc.setFont(fontName, 'bold');
                doc.setTextColor('#000000');
                doc.text(item.title, margin, y);
                
                // Subtitle
                if (item.subtitle) {
                    if (selectedTemplate === 'ivy') {
                        doc.setFont(fontName, 'bold');
                    } else {
                        doc.setFont(fontName, 'normal');
                        doc.setTextColor('#666666');
                    }
                    doc.setFontSize(10);
                    doc.text(item.subtitle, pageWidth - margin, y, { align: 'right' });
                }
                
                y += 6;
                
                // Description
                if (item.description) {
                    printText(item.description, 10, false);
                }
                y += 3;
            });
            y += 2;
        });
    }

    doc.save(`${profile.full_name || 'Resume'}.pdf`);
};
