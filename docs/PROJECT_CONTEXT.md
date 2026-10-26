# Master Context: Bootcamp LMS

## Product Overview
A Learning Management System for ONE instructor (the admin) who runs paid live online bootcamps (MERN, Python, AI/ML/DL). Live classes happen on Google Meet or Zoom. There are NO recorded videos and NO video hosting. The website handles: public marketing pages, registration, manual-payment enrollment, class schedule and join links, attendance, notes, quizzes, assignments, grading, announcements, notifications and dashboards.

## Stack
- **Client**: React 18 + Vite, Tailwind CSS, react-router v6, Axios, react-hook-form + zod, lucide-react. No UI kit: build our own components per `docs/DESIGN_SYSTEM.md`.
- **Server**: Node 20, Express, Mongoose, jsonwebtoken, bcryptjs, zod, helmet, cors, express-rate-limit, morgan, @aws-sdk/client-s3.
- **Database**: MongoDB Atlas. Files: Supabase Storage (small files only). Deploy: Vercel (client) and Render (server).
- **Monorepo**: `/client`, `/server`, `/docs`. ES modules everywhere. ESLint and Prettier configured.
- **Server folders**: `src/{config,models,controllers,routes,middleware,services,validators,utils,scripts,tests}`
- **Client folders**: `src/{pages,components/ui,components/layout,features,context,services,hooks,utils,styles,config}`

## Roles
- `admin` and `student` only.
- The admin is created only by the seed script.

## API Conventions
- Base path `/api`. JSON only.
- Success: `{ success: true, data, message? }`.
- Error: `{ success: false, message, code, errors? }`.
- Correct HTTP status codes (400, 401, 403, 404, 409, 422, 429, 500).
- Pagination: `?page=1&limit=20` returns `data: { items, page, limit, total, totalPages }`. Maximum limit 100.
- Dates are stored in UTC and displayed in `Asia/Karachi` on the client.
- Every request body, query and param is validated with Zod. Unknown fields are stripped. Never trust the client for role, status, price, amount, user id or ownership.

## Security Rules (Non-negotiable)
- Passwords hashed with bcryptjs (cost 12). JWT expires in 7 days, signed with JWT_SECRET, sent as a Bearer token.
- `protect` middleware: valid token, user exists, `user.isActive` is true. `authorizeRoles(...roles)` comes after it. Every protected route enforces access on the SERVER, never only in the UI.
- Course content (sessions, notes, quizzes, assignments, announcements) is available only to the admin and to students with an APPROVED enrollment in that course. Use one reusable middleware: `requireApprovedEnrollment`.
- Students can read and write only their own records (enrollments, attempts, submissions, attendance). Check ownership on every read and write.
- Rate limits: auth routes 10 requests per 15 minutes per IP, general API 300 per 15 minutes.
- helmet, CORS limited to CLIENT_URL, body size limit 100kb, reject request keys that start with $ or contain a dot, no stack traces in production responses.
- Never log passwords, tokens or secrets. `.env` is in `.gitignore`. Provide `.env.example` files with names only.
- The admin cannot delete or deactivate their own account.

## Storage Rules (Small files only, used from Phase 2.5)
- Supabase Storage with a PRIVATE bucket (`uploads`). Files never pass through our Express server: the server only issues short-lived presigned URLs (PUT for upload, GET valid for 1 hour).
- Allowed kinds: pdf (max 20MB, admin only, for notes and attachments), image png/jpeg (max 5MB, payment proofs), zip or pdf (max 50MB, student assignment submissions).
- Validate MIME type, extension and size on the server before issuing an upload URL. Generate keys like `uploads/{kind}/{userId}/{uuid}.{ext}`; never use the user's filename in the key.
- The database stores only the object key. A GET URL is issued only after the server checks that the caller is the admin, an approved student of the owning course (notes), or the owner (submissions, payment proofs).
- Delete the Supabase object when its database record is deleted.
- Env names: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`.

## Live Class Rules
The meeting link is never included in list responses. It is returned only by a join endpoint, only to approved students or the admin, and only inside the join window: 15 minutes before the start until 30 minutes after the scheduled end.

## Quality Rules
- Simple readable code. No dead code, no duplicate files, no commented-out blocks, no leftover `console.log`.
- Every data screen has loading (skeleton), error (with retry) and empty states. Every form has validation messages and a loading state on submit.
- Every destructive action uses a `ConfirmDialog`.
- Every list is paginated on the server. Add database indexes on every foreign key and every filtered field.
- Write integration tests (jest + supertest + mongodb-memory-server) for the phase's access-control rules and main flows. Tests must pass before finishing.

## Workflow For Every Phase
1. Re-read `docs/PROJECT_CONTEXT.md` and `docs/DESIGN_SYSTEM.md`.
2. Implement ONLY the current phase. Do not start the next one.
3. Follow the design system exactly. No generic template look.
4. Run lint, tests and the app. Fix what fails.
5. Finish with: files created or changed, how to run, a manual test checklist, and anything you were unsure about. Do not guess silently.
