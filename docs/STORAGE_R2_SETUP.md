# Cloudflare R2 Storage Setup Guide

This document describes how to configure Cloudflare R2 Object Storage for the Bootcamp LMS.

---

## 1. Architecture Overview

- **Direct Uploads**: The browser requests a presigned PUT URL from `POST /api/uploads/presign`, then uploads the file directly to Cloudflare R2 using standard `XMLHttpRequest` with upload progress. Files **never** pass through or consume memory on the Express server.
- **Controlled Access Downloads**: Files are kept strictly private in the bucket. When an authorized user requests a file, `GET /api/files/url?key=...` verifies user permissions and returns a short-lived signed GET URL (valid for 1 hour).
- **Storage Key Convention**: Keys are generated server-side following the pattern:
  ```
  uploads/{kind}/{userId}/{uuid}.{ext}
  ```
  Original filenames are sanitized and never used directly as keys.

---

## 2. File Whitelist & Size Limits

| Kind | Allowed MIME Types | Max Size | Allowed Roles | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `image` | `image/png`, `image/jpeg` | 5 MB | Student, Admin | Payment proof screenshots, profile pictures |
| `pdf` | `application/pdf` | 20 MB | **Admin Only** | Lecture notes, cheat sheets, course materials |
| `zip` | `application/zip`, `application/x-zip-compressed` | 50 MB | Student, Admin | Student assignment submissions |

---

## 3. Cloudflare Dashboard Setup Steps

### Step 1: Create an R2 Bucket
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, click **R2 Object Storage**.
3. Click **Create bucket**.
4. Choose a bucket name (e.g. `lms-bootcamp-storage`).
5. Choose **Automatic** or select a region close to your primary audience (e.g., APAC / WNAM).
6. Click **Create Bucket**.

### Step 2: Generate R2 API Credentials
1. In the R2 Overview page, look for **Account Details** on the right side and copy your **Account ID**.
2. Click **Manage R2 API Tokens** in the right sidebar.
3. Click **Create API token**.
4. Configure the token:
   - **Token Name**: `lms-server-token`
   - **Permissions**: **Object Read & Write** (or create a scoped token for your specific bucket)
   - **Specify bucket(s)**: Select your newly created bucket (e.g. `lms-bootcamp-storage`)
   - **TTL**: Select your preferred expiration or leave indefinite for production.
5. Click **Create API Token**.
6. **IMPORTANT**: Copy the following values immediately (they won't be shown again):
   - **Access Key ID**
   - **Secret Access Key**
   - **Jurisdiction / S3 API Endpoint**: Looks like `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 4. Bucket CORS Policy Configuration

Direct client-side uploads (via `PUT`) and downloads (via `GET`) require Cross-Origin Resource Sharing (CORS) enabled on your R2 bucket.

### How to apply CORS in Cloudflare Dashboard:
1. Navigate to your bucket in **R2 Object Storage** &rarr; `lms-bootcamp-storage`.
2. Click the **Settings** tab.
3. Scroll down to the **CORS Policy** section and click **Add CORS Policy** (or **Edit CORS Policy**).
4. Paste the following JSON policy. Replace `http://localhost:5173` with your actual client domain in production (e.g., `https://codecraft-academy.vercel.app`).

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://codecraft-academy.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Range"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

> [!IMPORTANT]
> - `AllowedMethods` must include `PUT` for direct browser uploads and `GET` for downloading/previewing files.
> - `AllowedHeaders` must include `Content-Type` because the client sends `Content-Type: image/png` or `image/jpeg` with the `PUT` request.
> - `AllowedOrigins` should only list your trusted frontend URL(s). Never use `*` in production when credentials or private student data are involved.

---

## 5. Server Environment Configuration

Add the following environment variables to `/server/.env` (and configure them in your deployment platform, e.g. Render / Railway):

```bash
# Cloudflare R2 Object Storage
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="lms-bootcamp-storage"
R2_PUBLIC_URL="https://your_bucket.r2.cloudflarestorage.com" # Optional fallback
```

---

## 6. Verification Checklist

1. **CORS Preflight Test**:
   - In browser developer tools, watch network requests when uploading a receipt on `/enroll/:courseId`.
   - A `OPTIONS` preflight request should return HTTP `200` or `204` with `Access-Control-Allow-Origin: http://localhost:5173`.
   - The subsequent `PUT` request should return HTTP `200 OK`.
2. **Access Security Verification**:
   - As a student, request a signed URL for another student's uploaded payment proof: the server must return `403 Forbidden` (`FILE_ACCESS_DENIED`).
   - As a student, request a presigned upload URL for `pdf`: the server must return `403 Forbidden` (`ADMIN_ONLY_UPLOAD`).
   - As an admin, viewing an enrollment card in `/admin/enrollments` fetches a signed GET URL and previews the receipt image.
