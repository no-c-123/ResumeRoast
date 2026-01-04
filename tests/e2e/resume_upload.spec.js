import { test, expect } from '@playwright/test';

test.describe('Resume Upload Flow', () => {
  test('should load the analyzing page and show upload area', async ({ page }) => {
    await page.goto('http://localhost:4321/analyzing');
    
    // Check for drop zone text (case insensitive)
    await expect(page.getByText('Drop Your Resume Here', { exact: false })).toBeVisible();
    await expect(page.getByText('PDF, DOCX supported')).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    await page.goto('http://localhost:4321/analyzing');
    
    // Create a dummy file
    const buffer = Buffer.from('this is a text file');
    
    // Upload invalid file
    await page.setInputFiles('input[type="file"]', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer
    });

    // Expect inline error message
    await expect(page.getByText('Unsupported file type. Please upload a PDF or Word document.')).toBeVisible();
  });
});
