# Supabase Storage Setup Guide

This document describes how to configure Supabase Storage for the Bootcamp LMS.

---

## 1. Architecture Overview

- **Direct Uploads**: The browser requests a presigned PUT URL from `POST /api/uploads/presign`, then uploads the file directly to Supabase Storage using standard `XMLHttpRequest` with real-time upload progress. Files **never** pass through or consume memory on the Express server.
- **Controlled Access Downloads**: Files are kept strictly private in the `uploads` bucket. When an authorized user requests a file, `GET /api/files/url?key=...` verifies user permissions and returns a short-lived signed GET URL (valid for 1 hour).
- **Storage Key Convention**: Keys are generated server-side following the pattern:
  ```
  uploads/{kind}/{userId}/{uuid}.{ext}
  ```
  Original filenames are sanitized and never used directly as keys.

---

## 2. File Whitelist & Size Limits

| Kind | Allowed MIME Types | Max Size | Allowed Roles | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `image` | `image/png`, `image/jpeg`, `image/jpg` | 5 MB | Student, Admin | Payment proof screenshots, profile pictures |
| `pdf` | `application/pdf` | 20 MB | **Admin Only** | Lecture notes, cheat sheets, course materials |
| `zip` | `application/zip`, `application/x-zip-compressed`, `application/octet-stream`, `application/pdf` | 50 MB | Student, Admin | Student assignment submissions |

---

## 3. Supabase Dashboard Configuration

### Step 1: Bucket Setup
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Storage** &rarr; **Buckets**.
3. Ensure the bucket named `uploads` exists.
4. Set the bucket to **Private** (public downloads disabled).

### Step 2: Environment Variables
Add your Supabase credentials to `server/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=uploads
```
