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
  
  // Validate file content magic numbers
  const isValid = await validateFileContent(file);
  if (!isValid) {
      throw new Error('File content does not match its extension. Please upload a valid file.');
  }
  
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
  try {
    console.log('Starting PDF extraction for file:', file.name, 'size:', file.size);
    const { PdfReader } = await import('pdfreader');
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Got buffer, length:', buffer.length);
    
    return new Promise((resolve, reject) => {
      const reader = new PdfReader();
      let fullText = '';
      let currentPage = 0;
      let lastY = -1;
      
      reader.parseBuffer(buffer, (err, item) => {
        if (err) {
          console.error('PDF parse error:', err);
          reject(new Error('PDF parsing failed: ' + err.message));
        } else if (!item) {
          console.log('PDF parsing complete. Total text length:', fullText.length);
          console.log('First 500 chars:', fullText.substring(0, 500));
          
          if (!fullText || fullText.trim().length < 50) {
            reject(new Error('Could not extract enough text from PDF. The PDF might contain only images or be password protected.'));
          } else {
            resolve(fullText.trim());
          }
        } else if (item.page) {
          currentPage = item.page;
          fullText += '\n';
          console.log('Processing page', currentPage);
          lastY = -1;
        } else if (item.text) {
          // Check for vertical position change to detect new lines
          if (lastY !== -1 && Math.abs(item.y - lastY) > 0.5) {
            fullText += '\n';
          } else if (lastY !== -1 && !fullText.endsWith('\n')) {
             // Add space between words on the same line if not already spaced
             if (!fullText.endsWith(' ')) {
                fullText += ' ';
             }
          }
          
          fullText += item.text;
          lastY = item.y;
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

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const ZIP_MAGIC = [0x50, 0x4B, 0x03, 0x04]; // PK.. (DOCX is a zip)
const DOC_MAGIC = [0xD0, 0xCF, 0x11, 0xE0]; // DOCx

async function validateFileContent(file) {
    try {
        const arrayBuffer = await file.slice(0, 4).arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check PDF
        if (file.type === 'application/pdf') {
            if (bytes[0] === PDF_MAGIC[0] && bytes[1] === PDF_MAGIC[1] && bytes[2] === PDF_MAGIC[2] && bytes[3] === PDF_MAGIC[3]) {
                return true;
            }
            return false;
        }
        
        // Check DOCX
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            if (bytes[0] === ZIP_MAGIC[0] && bytes[1] === ZIP_MAGIC[1] && bytes[2] === ZIP_MAGIC[2] && bytes[3] === ZIP_MAGIC[3]) {
                return true;
            }
            return false;
        }
        
        // Check DOC
        if (file.type === 'application/msword') {
            if (bytes[0] === DOC_MAGIC[0] && bytes[1] === DOC_MAGIC[1] && bytes[2] === DOC_MAGIC[2] && bytes[3] === DOC_MAGIC[3]) {
                return true;
            }
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Error validating file content:', e);
        return false;
    }
}
