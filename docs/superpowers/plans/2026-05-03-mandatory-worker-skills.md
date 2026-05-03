# Mandatory Worker Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce mandatory skill selection for workers during registration and ensure these skills cannot be modified later in the profile.

**Architecture:** 
- **Frontend (Registration):** Validate `primarySkill` existence and map it to the backend `skills` array.
- **Frontend (Profile):** Display the skill as a disabled/read-only field in the edit profile screen to prevent modifications.
- **Backend (Validation):** Enforce skill requirement for workers during registration and remove `skills` from allowed updateable fields in the profile sanitization logic.

**Tech Stack:** React Native, Express, Mongoose, Node.js

---

### Task 1: Backend - Enforce Skills for Workers at Registration

**Files:**
- Modify: `mobile-backend/middleware/validation.js`

- [ ] **Step 1: Add role-based skill validation to registration**
      Modify the `register` validation schema to ensure `skills` are provided if the role is `worker`.
- [ ] **Step 2: Remove `skills` from profile update sanitization**
      Modify `sanitizeProfileData` to remove `skills` from the `allowed` array.
- [ ] **Step 3: Commit backend validation changes**

### Task 2: Frontend - Map Primary Skill during Registration

**Files:**
- Modify: `src/screens/RegisterScreen.js`

- [ ] **Step 1: Update `handleRegister` to map `primarySkill` to `skills` array**
      Transform the payload before calling `signUp` to ensure `skills: [form.primarySkill]` is sent.
- [ ] **Step 2: Commit registration mapping changes**

### Task 3: Frontend - Read-Only Skill in Edit Profile

**Files:**
- Modify: `src/screens/EditProfileScreen.js`

- [ ] **Step 1: Update form state to include `primarySkill`**
      Update `initialForm` and `fetchProfile` to handle the `primarySkill` extracted from the `skills` array.
- [ ] **Step 2: Add read-only Primary Skill field to UI**
      Add a disabled input field for the skill in the "Professional Info" section with a lock icon.
- [ ] **Step 3: Add styles for disabled input and helper text**
      Style the field to look permanent and inactive.
- [ ] **Step 4: Commit profile UI changes**

---

## Verification Plan

### Manual Verification
1.  **Registration:** Register a new Worker. Ensure registration fails if no skill is selected.
2.  **Database Check:** Verify the skill is saved correctly in the `skills` array in MongoDB.
3.  **Edit Profile:** Navigate to Edit Profile as a worker. Verify the "Primary Skill" is visible but locked (disabled).
4.  **Backend Security:** Attempt to send a `PUT` request to `/api/profile/me` with a modified `skills` array and verify it is ignored by the backend.
