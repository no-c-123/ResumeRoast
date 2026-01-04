import { describe, it, expect, vi } from 'vitest';
import { validateResumeFile, extractTextFromFile } from './fileParser';

describe('fileParser', () => {
    describe('validateResumeFile', () => {
        it('should return valid for correct PDF file', () => {
            const file = {
                name: 'test.pdf',
                type: 'application/pdf',
                size: 1024 * 1024 // 1MB
            };
            const result = validateResumeFile(file);
            expect(result.valid).toBe(true);
        });

        it('should return valid for correct Word file', () => {
            const file = {
                name: 'test.docx',
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 1024 // 1KB
            };
            const result = validateResumeFile(file);
            expect(result.valid).toBe(true);
        });

        it('should fail for unsupported file type', () => {
            const file = {
                name: 'test.exe',
                type: 'application/x-msdownload',
                size: 1024
            };
            const result = validateResumeFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Please upload a PDF or Word document');
        });

        it('should fail for file too large', () => {
            const file = {
                name: 'large.pdf',
                type: 'application/pdf',
                size: 10 * 1024 * 1024 // 10MB
            };
            const result = validateResumeFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('File size exceeds');
        });

        it('should fail for missing file', () => {
            const result = validateResumeFile(null);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('No file provided');
        });
    });

    describe('extractTextFromFile (Security/Validation)', () => {
        it('should throw error for invalid magic numbers (spoofed extension)', async () => {
            // Mock a file that claims to be PDF but has random bytes
            const spoofedFile = {
                name: 'fake.pdf',
                type: 'application/pdf',
                size: 100,
                arrayBuffer: async () => new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer, // Not %PDF
                slice: (start, end) => ({
                    arrayBuffer: async () => new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer
                })
            };

            await expect(extractTextFromFile(spoofedFile)).rejects.toThrow('File content does not match its extension');
        });

        it('should pass validation for valid PDF magic numbers', async () => {
            // Mock a valid PDF header
            const validPdf = {
                name: 'valid.pdf',
                type: 'application/pdf',
                size: 100,
                arrayBuffer: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer, // %PDF
                slice: (start, end) => ({
                    arrayBuffer: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer
                })
            };

            // We expect it to try to parse and fail (since we didn't mock pdf-parse), 
            // but NOT fail on validation.
            // If validation passes, it proceeds to extractFromPDF which will likely fail on our mock buffer.
            // So we check that the error is NOT the validation error.
            
            try {
                await extractTextFromFile(validPdf);
            } catch (e) {
                expect(e.message).not.toContain('File content does not match its extension');
            }
        });
    });
});
