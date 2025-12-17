// pdf-parse library with different API
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

/**
 * Extract text content from uploaded resume files
 * @param {File} file - The uploaded file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file) {
  const fileType = file.type;
  
  try {
    if (fileType === 'application/pdf') {
      return await extractFromPDF(file);
    } else if (
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractFromWord(file);
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to parse resume file');
  }
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Create PDFParse instance with buffer data
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  
  return result.text;
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
