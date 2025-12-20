import { jsPDF } from 'jspdf';
import { logger } from '../lib/logger';

export const generateTailoredPdf = (tailoredResume) => {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = margin;
        
        const addText = (text, size, isBold = false, color = [0, 0, 0]) => {
            if (!text) return;
            pdf.setFontSize(size);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            pdf.setTextColor(...color);
            const lines = pdf.splitTextToSize(text, contentWidth);
            lines.forEach(line => {
                if (yPos > pageHeight - 20) {
                    pdf.addPage();
                    yPos = margin;
                }
                pdf.text(line, margin, yPos);
                yPos += size * 0.5;
            });
        };

        const addBullet = (text, size = 10) => {
            if (!text) return;
            pdf.setFontSize(size);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            const bulletWidth = 5;
            const lines = pdf.splitTextToSize(text, contentWidth - bulletWidth);
            lines.forEach((line, index) => {
                if (yPos > pageHeight - 20) {
                    pdf.addPage();
                    yPos = margin;
                }
                if (index === 0) {
                    pdf.text('•', margin, yPos);
                }
                pdf.text(line, margin + bulletWidth, yPos);
                yPos += size * 0.5;
            });
        };
        
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        const nameWidth = pdf.getTextWidth(tailoredResume.profile.full_name || 'Your Name');
        pdf.text(tailoredResume.profile.full_name || 'Your Name', (pageWidth - nameWidth) / 2, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const contactInfo = [tailoredResume.profile.email, tailoredResume.profile.phone, tailoredResume.profile.location].filter(Boolean).join(' | ');
        const contactWidth = pdf.getTextWidth(contactInfo);
        pdf.text(contactInfo, (pageWidth - contactWidth) / 2, yPos);
        yPos += 6;
        
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
        
        if (tailoredResume.profile.professional_summary) {
            addText('PROFESSIONAL SUMMARY', 13, true);
            yPos += 2;
            addText(tailoredResume.profile.professional_summary, 10);
            yPos += 6;
        }
        
        if (tailoredResume.profile.skills) {
            addText('SKILLS', 13, true);
            yPos += 2;
            addText(tailoredResume.profile.skills, 10);
            yPos += 6;
        }
        
        if (tailoredResume.work_experience && tailoredResume.work_experience.length > 0) {
            addText('WORK EXPERIENCE', 13, true);
            yPos += 3;
            
            tailoredResume.work_experience.forEach((exp, index) => {
                if (exp.position) {
                    addText(exp.position, 12, true);
                }
                
                const companyInfo = [];
                if (exp.company) companyInfo.push(exp.company);
                if (exp.location) companyInfo.push(exp.location);
                if (companyInfo.length > 0) {
                    addText(companyInfo.join(', '), 10, false, [60, 60, 60]);
                }
                
                const dateRange = [exp.start_date, exp.end_date || 'Present'].filter(Boolean).join(' - ');
                if (dateRange) {
                    addText(dateRange, 9, false, [100, 100, 100]);
                }
                
                if (exp.description) {
                    yPos += 1;
                    const bulletPoints = exp.description.includes('|') 
                        ? exp.description.split('|').map(b => b.trim())
                        : [exp.description];
                    
                    bulletPoints.forEach(bullet => {
                        if (bullet.trim()) {
                            addBullet(bullet.trim(), 10);
                        }
                    });
                }
                
                if (index < tailoredResume.work_experience.length - 1) {
                    yPos += 4;
                }
            });
            yPos += 6;
        }
        
        if (tailoredResume.education && tailoredResume.education.length > 0) {
            addText('EDUCATION', 13, true);
            yPos += 3;
            
            tailoredResume.education.forEach((edu, index) => {
                if (edu.degree) {
                    addText(edu.degree, 12, true);
                }
                
                const schoolInfo = [];
                if (edu.institution) schoolInfo.push(edu.institution);
                if (edu.location) schoolInfo.push(edu.location);
                if (schoolInfo.length > 0) {
                    addText(schoolInfo.join(', '), 10, false, [60, 60, 60]);
                }
                
                if (edu.graduation_date) {
                    addText(edu.graduation_date, 9, false, [100, 100, 100]);
                }
                
                if (index < tailoredResume.education.length - 1) {
                    yPos += 4;
                }
            });
            yPos += 6;
        }
        
        if (tailoredResume.profile.volunteering) {
            addText('VOLUNTEERING', 13, true);
            yPos += 2;
            addText(tailoredResume.profile.volunteering, 10);
        }
        
        const fileName = `${tailoredResume.profile.full_name || 'Resume'}_TAILORED.pdf`;
        pdf.save(fileName);
        return true;
    } catch (err) {
        logger.error('Error generating PDF:', err);
        throw err;
    }
};
