# Resume Roast - Setup Instructions

## 1. Database Setup

Run the SQL commands in `supabase-schema.sql` in your Supabase SQL Editor:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Copy and paste the contents of `supabase-schema.sql`
- Execute the query

This will create:
- `resume_analyses` table with RLS policies
- `resume_templates` table
- Necessary indexes for performance

## 2. Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values:
   - `PUBLIC_SUPABASE_URL`: From your Supabase project settings
   - `PUBLIC_SUPABASE_ANON_KEY`: From your Supabase project API settings
   - `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com/

## 3. Install Dependencies

Already installed:
- @anthropic-ai/sdk
- pdf-parse
- mammoth

## 4. How It Works

### File Upload Flow:
1. User uploads resume (PDF/DOC/DOCX)
2. File is validated (type and size)
3. Text is extracted using pdf-parse or mammoth
4. Text is sent to Claude Sonnet 4 for analysis
5. Analysis is saved to Supabase with timestamp
6. Results are displayed to user

### Analysis Storage:
- Each analysis is stored in `resume_analyses` table
- Includes: file name, ATS score, full suggestions JSON, timestamp
- Users can only access their own analyses (RLS enabled)

### Features Implemented:
✅ File upload with drag & drop
✅ AI-powered resume analysis with Claude Sonnet 4
✅ ATS scoring (0-100)
✅ Detailed section-by-section feedback
✅ Analysis history with timestamps
✅ View past analyses

### Next Steps (Optional):
- [ ] PDF generation for improved resumes
- [ ] Resume templates library
- [ ] Before/after preview functionality
- [ ] Export analysis as PDF report
- [ ] Email notifications for completed analyses

## 5. Testing

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Log in to your account
3. Navigate to the Dashboard
4. Upload a resume (PDF or Word doc)
5. Wait for the AI analysis (typically 10-30 seconds)
6. View results in the dashboard

## API Endpoint

The analysis API is available at `/api/analyze-resume`

**Method:** POST  
**Body:** FormData with:
- `file`: Resume file
- `userId`: User ID from auth
- `sessionToken`: Session access token

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "file_name": "resume.pdf",
    "ats_score": 85,
    "suggestions": { ... },
    "created_at": "2025-12-15T..."
  }
}
```

## Troubleshooting

### "Failed to parse resume"
- Ensure file is a valid PDF or Word document
- Check file isn't corrupted or password-protected

### "Unauthorized"
- User must be logged in
- Session token must be valid

### API errors
- Verify ANTHROPIC_API_KEY is set correctly
- Check API key has sufficient credits
- Review server logs for detailed error messages
