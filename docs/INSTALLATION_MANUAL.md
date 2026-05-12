# Online Class Marker System Installation and User Manual

This manual explains how to install, configure, run, and use the Online Class Marker System on a local development machine.

## 1. System Overview

Online Class Marker System is a web application for managing online assessments. It supports admin, teacher, and student portals.

Main features include:

- User authentication with Supabase Auth.
- Admin management for departments, courses, sessions, teachers, students, and analytics.
- Teacher tools for question banks, AI question generation, test templates, test creation, publishing, live monitoring, evaluation, and reports.
- Student tools for logging in, viewing assigned tests, attempting exams, submitting answers, and checking results.
- IP proctoring support, including computer labs and expected IP assignments.
- Real-time monitoring using Socket.IO.
- PDF/report generation.

## 2. Technology Stack

- Frontend: React, Vite, Material UI, Tailwind CSS, Framer Motion.
- Backend: Node.js, Express, Socket.IO.
- Database and authentication: Supabase PostgreSQL and Supabase Auth.
- AI question generation: Google Gemini API through `@google/genai`.
- Package manager: npm.

## 3. Prerequisites

Install these before starting:

- Node.js 20 or newer.
- npm, included with Node.js.
- Git.
- A Supabase account and project.
- Optional: Supabase CLI, if you prefer applying migrations from the terminal.
- Optional: Google AI Studio API key, only required for AI question generation.

Check your local versions:

```powershell
node -v
npm -v
git --version
```

## 4. Project Setup

Clone the project, or open the existing project folder:

```powershell
cd C:\Users\kanza\Online-Class-Marker-System
```

Install dependencies:

```powershell
npm install
```

The project uses a single `package.json` for both frontend and backend dependencies.

## 5. Supabase Project Setup

Create or open a Supabase project from the Supabase dashboard.

In the Supabase dashboard, collect these values:

- Project URL.
- Anon/public API key.
- Service role key.

You can usually find them in:

```text
Project Settings -> API
```

Important security note:

- The anon key can be used by the frontend.
- The service role key must only be used by the backend.
- Never expose the service role key in browser code.
- Do not commit real keys to Git.

## 6. Environment Configuration

Create a `.env` file in the project root. You can copy from `.env.example`, but replace all values with your own project values.

Recommended `.env` format:

```env
# Frontend: Vite exposes only VITE_ variables to the browser
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Backend
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=5000

# Optional: AI question generator
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_RETRY_COUNT=2
```

This application loads environment variables from:

- Project root `.env`.
- Optional `server/.env`, which overrides duplicate values from root `.env`.

For a simple setup, keep everything in the root `.env`.

## 7. Database Installation

The database schema is stored in:

```text
supabase/migrations
```

Apply migrations in filename order:

1. `001_initial_schema.sql`
2. `003_create_first_admin.sql`
3. `004_add_users_is_active.sql`
4. `005_add_show_results_immediately.sql`
5. `005_attempts_pass_fail.sql`
6. `006_negative_marking_wrong_threshold.sql`
7. `007_ip_proctor.sql`
8. `008_unique_attempt_per_student_test.sql`
9. `009_computer_labs_ip_assignments.sql`

### Option A: Apply Migrations in Supabase SQL Editor

Open:

```text
Supabase Dashboard -> SQL Editor
```

For each migration file:

1. Open the file from `supabase/migrations`.
2. Copy the SQL.
3. Paste it into the Supabase SQL Editor.
4. Run it.
5. Continue with the next migration file.

Run them in order because later migrations depend on tables and columns from earlier migrations.

### Option B: Apply Migrations with Supabase CLI

If you use Supabase CLI, first link the local project:

```powershell
supabase login
supabase link --project-ref your-project-ref
```

Then push migrations:

```powershell
supabase db push
```

If your local migration history has duplicate numbering, such as two `005_` files, check carefully that both files are applied.

## 8. Initial Admin Account

This app uses Supabase Auth for login, but also requires a matching row in the custom `public.users` table.

To create an admin:

1. Open the app signup page after running the frontend.
2. Register with the Admin role.
3. Confirm the email if Supabase email confirmation is enabled.
4. Check that a row exists in `public.users` with:

```text
role = admin
```

Alternatively, create a Supabase Auth user from the dashboard, copy its Auth user ID, then insert a matching `public.users` row:

```sql
INSERT INTO users (auth_id, name, email, role, is_active)
VALUES (
  'auth-user-uuid-here',
  'System Admin',
  'admin@example.com',
  'admin',
  true
);
```

The repository also includes:

```text
supabase/seed_admin_kanza.sql
```

Use that only if the Auth user ID and email match your Supabase project.

## 9. Running the Application Locally

You need two terminals: one for the backend API and one for the frontend.

### Terminal 1: Start Backend Server

From the project root:

```powershell
node server/index.js
```

Expected behavior:

- Express API starts on port `5000`.
- Socket.IO starts on the same server.
- Console shows that the server is running.

Backend base URL:

```text
http://localhost:5000
```

### Terminal 2: Start Frontend

From the project root:

```powershell
npm run dev
```

Vite usually starts at:

```text
http://localhost:5173
```

Open that URL in your browser.

## 10. Production Build

To create a production frontend build:

```powershell
npm run build
```

The compiled frontend is written to:

```text
dist
```

To preview the production build locally:

```powershell
npm run preview
```

The backend still needs to run separately:

```powershell
node server/index.js
```

## 11. Login and Role Selection

The login screen provides role choices:

- Teacher
- Student
- Admin

The selected role is used to route the user to the correct portal after Supabase login.

The actual authority comes from the `public.users.role` value in Supabase:

- `admin` opens the admin portal.
- `teacher` opens the teacher portal.
- `student` opens the student portal.

If a teacher selects Admin during login, the app will deny admin portal access and offer to continue to the teacher portal.

## 12. Admin Portal Usage

After logging in as Admin, use the admin dashboard to manage system data.

Recommended admin setup order:

1. Create departments.
2. Create academic sessions.
3. Create courses and assign them to departments.
4. Create or approve teacher accounts.
5. Create or import student accounts.
6. Assign teachers to courses.
7. Enroll students in courses.
8. Review analytics and session data.

Admin pages in the app include:

- Dashboard
- Users
- Teachers
- Students
- Sessions
- Departments
- Courses
- Bulk Upload
- Analytics

## 13. Teacher Portal Usage

After logging in as Teacher, the teacher portal is used to build and manage tests.

Recommended teacher workflow:

1. Open the teacher dashboard.
2. Manage the question bank for your assigned course.
3. Add questions manually or generate questions with AI.
4. Create a test template if you want reusable settings.
5. Create a test.
6. Select questions.
7. Configure duration, marks, schedule, negative marking, result visibility, and publishing options.
8. Optional: attach a computer lab for IP assignment.
9. Publish the test.
10. Monitor student activity during the test.
11. Review attempts and results after submission.
12. Generate reports.

### AI Question Generation

The AI generator requires:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

After adding or changing this key, restart the backend:

```powershell
node server/index.js
```

If the key is missing, rejected, rate-limited, or revoked, the question generator will return an error message.

## 14. Student Portal Usage

After logging in as Student, the student portal is used to take assigned tests.

Student workflow:

1. Log in with the Student role selected.
2. Open the student dashboard.
3. View available tests for enrolled courses.
4. Start a published test during its allowed time window.
5. Answer questions.
6. Submit before the timer ends.
7. View results if the teacher enabled immediate result visibility.

Students must have:

- A row in `public.users` with `role = student`.
- At least one row in `students` linking the user to a course.

## 15. Computer Lab and IP Assignment Setup

Migration `009_computer_labs_ip_assignments.sql` adds computer lab support.

It creates:

- `computer_labs`
- `computer_lab_ips`
- `test_ip_assignments`

It also adds IP tracking fields to attempts:

- `assigned_ip`
- `ip_mismatch`
- `duplicate_ip_detected`

Basic lab workflow:

1. Admin or teacher creates a computer lab.
2. Add IP addresses for that lab.
3. Attach the lab to a test.
4. The system assigns each enrolled student an expected IP.
5. During the exam, proctoring checks can log unauthorized IPs, IP changes, and duplicate IPs.

The related API route is mounted at:

```text
/api/labs
```

The related proctoring route is mounted at:

```text
/api/proctor
```

## 16. Live Monitoring

The backend starts an HTTP server with Socket.IO enabled.

Default WebSocket/server URL:

```text
http://localhost:5000
```

The frontend accepts:

```env
VITE_SOCKET_URL=http://localhost:5000
```

During exams, teacher monitoring screens can receive student status updates such as:

- Active
- Suspicious
- Submitted
- Violations
- Questions answered

## 17. Common API Endpoints

The Express server mounts these route groups:

```text
/api/courses
/api/templates
/api/questions
/api/teacher
/api/students
/api/reports
/api/tests
/api/attempts
/api/proctor
/api/labs
/api/generate-questions
/api/student-action
```

Protected API routes require a Supabase access token. The frontend automatically attaches the token using the API client.

Backend authorization requires:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

If this key is missing, protected routes may return:

```text
Server auth is not configured.
```

## 18. Troubleshooting

### Frontend opens but data does not load

Check that the backend is running:

```powershell
node server/index.js
```

Check `.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Login says database is not configured

Check:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Then restart Vite:

```powershell
npm run dev
```

### User logs in but has no portal access

Check Supabase:

1. Auth user exists in `auth.users`.
2. Matching row exists in `public.users`.
3. `public.users.auth_id` matches the Supabase Auth user ID.
4. `public.users.role` is correct.
5. `is_active` is true.

### Protected API returns service role error

Add this to `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Restart backend:

```powershell
node server/index.js
```

### AI question generator fails

Check:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

Then restart backend.

If it still fails, verify your Google AI Studio key is active and has quota.

### Port 5000 is already in use

Use another backend port:

```env
PORT=5001
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

Restart both backend and frontend.

### Vite uses a different frontend port

If `5173` is busy, Vite may use another port. Open the URL printed in the Vite terminal.

### Supabase migration error

Confirm migrations were run in order. The first migration must create the base tables and UUID extension before later migrations are applied.

## 19. Recommended Daily Development Commands

Backend:

```powershell
node server/index.js
```

Frontend:

```powershell
npm run dev
```

Lint:

```powershell
npm run lint
```

Build:

```powershell
npm run build
```

## 20. Deployment Notes

For deployment, you need:

- A hosted frontend, such as Vercel, Netlify, or another static hosting service.
- A hosted backend, such as Render, Railway, Fly.io, or a VPS.
- A Supabase project with all migrations applied.
- Production environment variables set in the hosting dashboards.

Frontend production variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
```

Backend production variables:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5000
```

After deployment, update allowed origins in the backend Socket.IO/CORS configuration if needed.

## 21. Quick Start Summary

For local setup:

1. Install Node.js.
2. Run `npm install`.
3. Create a Supabase project.
4. Fill in `.env`.
5. Apply all SQL migrations from `supabase/migrations`.
6. Create an admin user in Supabase Auth and `public.users`.
7. Start backend with `node server/index.js`.
8. Start frontend with `npm run dev`.
9. Open `http://localhost:5173`.
10. Log in and begin configuring departments, courses, teachers, students, and tests.
