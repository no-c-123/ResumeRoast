// File parser for resume uploads
import mammoth from 'mammoth';

/**
 * Extract text content from uploaded resume files
 * @param {File} file - The uploaded file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file) {
  const fileType = file.type;
  
  console.log('Extracting text from file type:', fileType);
  
  try {
    if (fileType === 'application/pdf') {
      return await extractFromPDF(file);
    } else if (
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractFromWord(file);
    } else {
      throw new Error('Unsupported file type: ' + fileType);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
}

/**
 * Extract text from PDF file using pdfreader
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromPDF(file) {
  console.log('Starting PDF extraction for file:', file.name, 'size:', file.size);
  
  try {
    const { PdfReader } = await import('pdfreader');
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Got buffer, length:', buffer.length);
    
    return new Promise((resolve, reject) => {
      const reader = new PdfReader();
      let fullText = '';
      let currentPage = 0;
      
      reader.parseBuffer(buffer, (err, item) => {
        if (err) {
          console.error('PDF parse error:', err);
          reject(new Error('PDF parsing failed: ' + err.message));
        } else if (!item) {
          // End of file
          console.log('PDF parsing complete. Total text length:', fullText.length);
          console.log('First 500 chars:', fullText.substring(0, 500));
          
          if (!fullText || fullText.trim().length < 50) {
            reject(new Error('Could not extract enough text from PDF. The PDF might contain only images or be password protected.'));
          } else {
            resolve(fullText.trim());
          }
        } else if (item.page) {
          // New page
          currentPage = item.page;
          fullText += '\n';
          console.log('Processing page', currentPage);
        } else if (item.text) {
          // Text item
          fullText += item.text + ' ';
        }
      });
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    console.error('Error stack:', error.stack);
    throw new Error('PDF parsing failed: ' + error.message);
  }
}

/**
 * Extract text from Word document
 * @param {File} file - Word document file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromWord(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Validate file before processing
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export function validateResumeFile(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a PDF or Word document' };
  }

  return { valid: true };
}
