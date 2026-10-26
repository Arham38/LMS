# CodeCraft Academy — Bootcamp Learning Management System (LMS)

A production-grade, cohort-based Learning Management System designed for intensive live online software engineering bootcamps (MERN Full-Stack, Python for Engineers, Applied AI & Machine Learning).

All instruction happens live over interactive video conferencing (Google Meet or Zoom). **There are no pre-recorded video libraries and no video hosting.** The platform manages marketing, admissions, manual PKR payment verification (JazzCash, EasyPaisa, SadaBiz, Bank Wire), class schedules with strict join windows, attendance, lesson notes, auto-graded quizzes, weekly project rubric grading, announcements, real-time notifications, student gradebooks, and cohort analytics.

---

## Architecture & Monorepo Structure

```text
├── client/                      # React 18 + Vite Frontend
│   ├── public/                  # Static assets (Favicon, OG Image, Robots.txt, Sitemap.xml)
│   ├── e2e/                     # Playwright End-to-End Smoke Test Suite
│   └── src/
│       ├── components/          # Custom Design System UI Kit (zero external UI libraries)
│       │   ├── common/          # ErrorBoundary, OfflineNotice, RouteSuspense
│       │   ├── layout/          # PublicLayout, StudentLayout, AdminLayout
│       │   └── ui/              # Button, Input, Table, Modal, ConfirmDialog, Badge, etc.
│       ├── config/              # Brand constants (CodeCraft, colors, contacts)
│       ├── content/             # Central site copy (site.js - single source of truth)
│       ├── context/             # AuthContext (JWT session state)
│       ├── pages/               # Public marketing, Student portal, Admin workspaces
│       ├── routes/              # Route-level code-splitting (React.lazy + RouteSuspense)
│       ├── services/            # Axios API clients (auth, course, quiz, storage, contact)
│       ├── styles/              # Design tokens (tokens.css) & Tailwind configuration
│       └── utils/               # SEO meta hooks, analytics wrapper, helpers
│
├── server/                      # Node.js + Express Backend
│   └── src/
│       ├── config/              # Environment validation (Zod) & DB connection
│       ├── controllers/         # Request handlers (auth, enrollment, quiz, assignment, etc.)
│       ├── middleware/          # protect, authorizeRoles, requireApprovedEnrollment, rate limiters
│       ├── models/              # Mongoose schema models (User, Course, Session, Quiz, etc.)
│       ├── routes/              # Modular Express route declarations
│       ├── scripts/             # Database seeding (seed.js)
│       ├── services/            # Business logic (notificationService, storageService, email)
│       ├── tests/               # Jest + Supertest + mongodb-memory-server test suites
│       ├── utils/               # ApiError, asyncHandler, response formatting
│       └── validators/          # Fail-fast Zod request schemas
│
├── docs/                        # Architecture & Engineering Specifications
│   ├── DESIGN_SYSTEM.md         # Visual rules, tokens, typography, and anti-patterns
│   ├── PROJECT_CONTEXT.md       # Master project specification & non-negotiables
│   └── STORAGE_R2_SETUP.md      # Cloudflare R2 bucket setup guide
│
├── .eslintrc.json               # Code linting configuration
├── .prettierrc                  # Code formatting standards
└── package.json                 # Monorepo root scripts & workspaces
```

---

## Security & Architectural Principles

- **No Passwords or Tokens Leaked**: Password hashes use `bcryptjs` (cost 12) with `select: false` on Mongoose models. Single-use password reset tokens are hashed with SHA-256 and expire in 30 minutes. Internal instructor notes (`privateNotes`) are strictly stripped from student responses.
- **Strict Join Window Rule**: Live lecture meeting links are never included in list responses. They are issued only via `POST /api/sessions/:id/join` to approved students inside the join window: **15 minutes before scheduled start until 30 minutes after completion**.
- **Quiz Integrity**: Questions returned during an active attempt strictly omit `correctIndexes` and `explanation`. Full answers are revealed only according to the quiz policy (`immediately`, `after_close`, or `never`).
- **Private Cloud Storage**: Files never pass through the Node.js server. The server verifies caller authorization and generates short-lived presigned Cloudflare R2 URLs (upload PUT valid for 15 minutes, download GET valid for 1 hour).
- **Immutability of Privileges**: Students cannot set their own role, course fee, amount due, enrollment status, submission status, or assignment marks. All authorization checks occur on the server.
- **Rate Limiting**: Multi-tiered rate limiters via `express-rate-limit`:
  - Authentication endpoints: 10 requests per 15 minutes per IP.
  - Public contact forms: 10 requests per 15 minutes per IP.
  - General API: 300 requests per 15 minutes per IP.

---

## Environment Variables

### Server (`server/.env`)
Create `server/.env` based on `server/.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Express listening port | `5000` |
| `NODE_ENV` | Runtime environment | `development` (or `production`) |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/bootcamp_lms` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | Strong random string (min 32 chars) |
| `JWT_EXPIRE` | Token validity duration | `7d` |
| `CLIENT_URL` | Trusted frontend origin for CORS | `http://localhost:5173` |
| `ADMIN_NAME` | Initial administrator name for seeder | `Lead Instructor` |
| `ADMIN_EMAIL`| Initial administrator login email | `admin@codecraft.pk` |
| `ADMIN_PASSWORD` | Initial administrator login password | `AdminSecret123!` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Cloudflare dashboard |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token access key | R2 token |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token secret key | R2 secret |
| `R2_BUCKET` | Cloudflare R2 private bucket name | `codecraft-files` |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible API endpoint | `https://<account_id>.r2.cloudflarestorage.com` |

### Client (`client/.env`)
Create `client/.env`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Getting Started

### 1. Installation
Install all root, server, and client dependencies:
```bash
npm install
```

### 2. Database Seeding
Populate the database with the default administrator account, initial published bootcamp courses, schedule data, and payment settings:
```bash
npm run seed --prefix server
```

### 3. Running in Development
Start both server and client concurrently:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Vite client starts on http://localhost:5173
```

---

## Running Tests

### Integration & Unit Tests (Jest + Supertest + In-Memory MongoDB)
The server includes comprehensive automated integration test suites with zero external database dependencies:
```bash
npm test --prefix server
```
Suites cover:
- Health & rate limiting (`health.test.js`)
- Authentication, tokens & password reset (`auth.test.js`)
- Enrollment & manual payment verification (`enrollment.test.js`)
- Cloudflare R2 presigned URLs & file access controls (`storage.test.js`)
- Live sessions, join windows & attendance marking (`session.test.js`)
- Auto-graded quizzes, attempts & answer hiding (`quiz.test.js`)
- Assignments, rubric grading & late penalties (`assignment.test.js`)
- Dashboards, notifications, directory & gradebook (`dashboard_gradebook.test.js`)
- Public contact form & admin inbox (`contact.test.js`)

### End-to-End Smoke Tests (Playwright)
Run the automated browser test suite verifying user registration, catalog, and responsive layouts:
```bash
npm run test:e2e --prefix client
```

### Production Client Build
Verify that all components and lazy-loaded route chunks compile cleanly without warnings:
```bash
npm run build:client
```

---

## Design System Compliance

This application adheres strictly to [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md):
- **Palette**: Paper background (`#FAF7F2`), crisp surface cards (`#FFFFFF`), deep obsidian ink (`#14181F`), deep green brand primary (`#12372A`), and burnt orange accent (`#D9480F`) used with restraint.
- **Typography**: Self-hosted `@fontsource` packages for zero layout shift (CLS). Editorial headings in Fraunces Serif, interface elements in Manrope, code/IDs in JetBrains Mono.
- **Zero AI-Website Tropes**: No purple/pink gradients, no neon drop-shadows, no emoji headings, no floating or bouncing animations, and no fabricated statistics or fake testimonials.
- **Destructive Confirmations**: All deletions and state resets require a `ConfirmDialog` modal. Zero `window.alert` or `window.confirm` calls.
- **Accessibility**: Keyboard operable (focus traps, Escape to close, visible focus rings), accessible form labels, aria-live toast notifications, and responsive layouts tested at 360px, 768px, and 1280px.

---

## License

Private & Proprietary — CodeCraft Academy. All rights reserved.
