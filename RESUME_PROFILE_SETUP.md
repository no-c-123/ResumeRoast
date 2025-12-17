# Resume Profile System Setup Guide

## Overview
This system allows users to save their resume information once and reuse it across all downloaded resumes, eliminating the need for text parsing.

## Setup Steps

### 1. Database Setup
Run the SQL schema in your Supabase SQL Editor:
```bash
supabase-user-profiles-schema.sql
```

This creates:
- `user_profiles` table with personal and professional information
- Automatic profile creation when users sign up
- Row Level Security policies

### 2. Features Added

#### Resume Builder Page (`/resume-builder`)
- Dedicated page for users to input and save their information
- Fields: Name, Location, Phone, Email, LinkedIn, Summary, Skills, Volunteering
- Auto-saves to database with upsert (creates or updates)
- Pre-fills email from authentication

#### Updated Download Flow
1. User clicks "Download Updated Resume"
2. System checks database for saved profile
3. If profile exists → Use saved data (instant)
4. If no profile → Falls back to text parsing (shows tip to use Resume Builder)
5. Opens modal with pre-filled information
6. User can review/edit before downloading

### 3. Benefits

**For Users:**
- ✅ No need to re-enter information every time
- ✅ Consistent data across all resumes
- ✅ Easy to update in one place
- ✅ Faster download process

**For System:**
- ✅ No complex text parsing needed
- ✅ More accurate data
- ✅ Better user experience
- ✅ Reduced errors from parsing failures

### 4. Navigation

Add a link to the Resume Builder in your navigation/account page:

```jsx
<a href="/resume-builder">Build Your Resume</a>
```

Or add to account dashboard:
```jsx
<div className="card">
  <h3>Resume Information</h3>
  <p>Save your information for faster downloads</p>
  <a href="/resume-builder">Manage Resume Info</a>
</div>
```

### 5. Workflow

**First Time User:**
1. User signs up → Profile created automatically with email
2. User goes to `/resume-builder` → Fills out information
3. User uploads resume for analysis
4. User downloads improved resume → Modal shows saved info
5. User edits if needed → Downloads PDF

**Returning User:**
1. User uploads new resume for analysis
2. User downloads improved resume → Instantly shows saved info
3. User can update profile anytime at `/resume-builder`

### 6. Database Fields

```sql
user_profiles:
- id (UUID)
- user_id (UUID) - Links to auth.users
- full_name (TEXT)
- location (TEXT)
- phone (TEXT)
- email (TEXT)
- linkedin (TEXT)
- professional_summary (TEXT)
- skills (TEXT)
- volunteering (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 7. Testing

1. Sign up or log in
2. Go to `/resume-builder`
3. Fill out your information
4. Save
5. Upload a resume for analysis
6. Click "Download Updated Resume"
7. Verify modal shows your saved information
8. Download PDF

### 8. Future Enhancements

Potential additions:
- Work experience builder (add/edit jobs)
- Education builder (add/edit degrees)
- Multiple resume templates
- Resume versioning
- Export/import resume data
- LinkedIn integration for auto-fill
- Resume preview before download

## File Structure

```
/src
  /components
    ResumeBuilder.jsx          # New - Profile management page
    ResumeEditorModal.jsx      # Updated - Uses DB data
    AnalysisResultsPage.jsx    # Updated - Fetches DB data
  /pages
    resume-builder.astro       # New - Route for builder
  /lib
    resumeGenerator.js         # Fallback parser (still used for experience/education)
    
/supabase-user-profiles-schema.sql  # New - Database schema
```

## Migration Path

For existing users with no profile:
1. They can continue using the parser (fallback)
2. System shows tip to use Resume Builder
3. Once they save info, future downloads are instant
4. No forced migration needed
