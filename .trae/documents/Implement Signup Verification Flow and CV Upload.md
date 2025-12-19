I have analyzed the codebase and found that the **Resume Builder** already has a "Upload Resume" feature implemented (`handleFileUpload`), but it is currently only shown if the URL contains `?new=true`. 

I will implement the requested flow "Sign Up -> Verify -> Resume Builder" and ensure the upload option appears for new users.

### **Plan: Implement Signup Verification Flow & CV Upload Trigger**

#### **1. Modify Signup Flow in `LoginForm.jsx`**
*   **Goal**: Redirect new users to the verification page instead of directly to the builder, and configure the email link to redirect to the builder.
*   **Changes**:
    *   Update `handleSignUp` function:
        *   Add `emailRedirectTo: window.location.origin + '/resume-builder'` to the `supabase.auth.signUp` options. This ensures that when the user clicks the email link, they land on the builder.
        *   Change the success redirect from `window.location.href = '/resume-builder?new=true'` to `window.location.href = '/verify-email'`.

#### **2. Trigger Upload Option in `ResumeBuilder.jsx`**
*   **Goal**: Ensure the "Upload Your Existing Resume" screen appears for users arriving from the verification link (who won't have `?new=true` in the URL).
*   **Changes**:
    *   Modify `fetchProfile` function:
        *   In the `else` block (where no existing profile is found), set `setShowUploadOption(true)`.
        *   This guarantees that any user with an empty profile (like a newly verified user) sees the upload/create options immediately.

#### **Verification**
*   **User Action**: Sign up with a new email.
*   **Expected Result**: Redirect to `/verify-email`.
*   **User Action**: Click link in email.
*   **Expected Result**: Redirect to `/resume-builder`.
*   **User Action**: Page loads.
*   **Expected Result**: "Upload Your Existing Resume" option is visible.
