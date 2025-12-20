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
  console.log('Starting PDF extraction for file:', file.name, 'size:', file.size);
  
  // Try pdf-parse first as it's generally more reliable for text extraction
  try {
    console.log('Attempting extraction with pdf-parse...');
    const pdf = await import('pdf-parse');
    // Handle default export for both CommonJS and ESM
    const pdfParse = pdf.default || pdf;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdfParse(buffer);
    
    if (data && data.text && data.text.trim().length > 50) {
        console.log('pdf-parse success. Text length:', data.text.length);
        return data.text.trim();
    } else {
        console.log('pdf-parse returned empty or too short text, falling back to pdfreader');
    }
  } catch (e) {
      console.warn('pdf-parse failed:', e);
      console.log('Falling back to pdfreader...');
  }

  // Fallback to pdfreader
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

// Magic numbers
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const ZIP_MAGIC = [0x50, 0x4B, 0x03, 0x04]; // PK.. (DOCX is a zip)
const DOC_MAGIC = [0xD0, 0xCF, 0x11, 0xE0]; // DOC

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
            // Some DOC files might vary, but this is standard OLE
            // Allow if it fails? No, stricter is better for security.
            // But to avoid false positives on valid but weird DOCs, maybe log warning?
            // User requirement is "Malicious files could potentially cause issues".
            // So return false if not matching.
            return false;
        }
        
        return true; // Unknown type, let existing logic handle
    } catch (e) {
        console.error('Error validating file content:', e);
        return false;
    }
}
