# Resume Template & Features Guide

## Resume Template

The professional resume template is located at `/src/templates/professional-template.html`.

### Features Added:

1. **Resume Template**
   - Clean, professional design based on the sample resume
   - ATS-friendly formatting
   - Supports dynamic content replacement
   - Located in `/src/templates/professional-template.html`

2. **Download Updated Resume Button** ✅
   - Now fully functional
   - Generates an improved resume based on AI suggestions
   - Opens print dialog for saving as PDF
   - Shows loading state during generation
   - Located in Analysis Results page

3. **Tailor for Job Description Tab** ✅ **PREMIUM ONLY**
   - New tab in analysis results
   - Paste any job description
   - AI analyzes keyword matches
   - Provides specific tailoring recommendations
   - Shows match score percentage
   - Download tailored resume
   - **Only accessible to premium users**

## Setup Instructions

### 1. Database Setup
Run the subscription schema in your Supabase SQL Editor:
```bash
# Execute this file in Supabase SQL Editor:
supabase-subscriptions-schema.sql
```

### 2. Grant Premium Access (for testing)
To test the premium feature, add a subscription for your user in Supabase:
```sql
INSERT INTO user_subscriptions (user_id, status, plan)
VALUES ('your-user-id-here', 'active', 'pro');
```

### 3. Environment Variables
Ensure your `.env` file has:
```
ANTHROPIC_API_KEY=your_key_here
PUBLIC_SUPABASE_URL=your_url_here
PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## How It Works

### Download Resume Flow:
1. User clicks "Download Updated Resume"
2. System parses original resume text
3. Applies AI suggestions to improve content
4. Generates HTML from template
5. Opens print dialog for PDF save

### Tailor Resume Flow:
1. User switches to "Tailor for Job" tab
2. Premium check - redirects to pricing if not premium
3. User pastes job description
4. AI analyzes resume vs job posting
5. Returns:
   - Match score
   - Keyword matches
   - Specific recommendations
   - Missing skills
   - Revised sections
6. User can download tailored version

## API Endpoints

- `/api/analyze-resume` - Main resume analysis
- `/api/tailor-resume` - Job-specific tailoring (Premium only)

## Components Updated

- `AnalysisResultsPage.jsx` - Added tabs, download, and tailor functionality
- `/lib/resumeGenerator.js` - Resume generation logic
- `/templates/professional-template.html` - Resume template

## Premium Features

The "Tailor for Job Description" feature is premium-only:
- Checks `user_subscriptions` table
- Looks for `status IN ('active', 'trialing')`
- Shows premium badge on tab
- Redirects free users to pricing page

## Testing

1. **Test Download**: Click "Download Updated Resume" on any analysis
2. **Test Premium Tab**: 
   - Without subscription: Should redirect to pricing
   - With subscription: Should allow job description input and tailoring
