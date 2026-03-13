# Admin Features – Verification

All admin actions **persist to Supabase** (no mock data). Schema: `supabase/migrations/001_initial_schema.sql`.

---

## 1. Academic Structure Management

| Feature | Page | DB Table(s) | Operations |
|--------|------|-------------|------------|
| Create / Edit / Delete **Departments** | Admin → Departments | `departments` | `insert`, `update`, `delete` |
| Create / Edit / Delete **Courses** (under department) | Admin → Courses | `courses` | `insert`, `update`, `delete`; linked via `department_id` |
| Create / Edit / Delete **Academic Sessions** | Admin → Academic Sessions | `academic_sessions` | `insert`, `update`, `delete` |

- No subjects or templates in admin (those are teacher-only).

---

## 2. Teacher Management

| Feature | Page | DB Table(s) | Operations |
|--------|------|-------------|------------|
| **Create teacher accounts** | Admin → Teachers | `auth.users` (Supabase Auth) + `users` (role=teacher) | `signUp` + `users.insert` |
| **Assign teacher to one or multiple courses** | Admin → Teachers | `teachers` | `insert` (one row per user–course pair) |
| **Remove teacher from course** | Admin → Teachers (row action) | `teachers` | `delete` by teacher row id |
| **Activate / deactivate teacher accounts** | Admin → Users | `users` | `update` `is_active` |

- “Teacher only sees courses assigned to them” is enforced in the **Teacher portal** by filtering on the `teachers` table (admin only creates the data).

---

## 3. Student Management

| Feature | Page | DB Table(s) | Operations |
|--------|------|-------------|------------|
| **Create student accounts** | Admin → Students | `auth.users` + `users` (role=student) + `students` | `signUp` + `users.insert` + `students.insert` |
| **Assign students to courses** | Admin → Students | `students` | `insert` with `course_id` + `enrollment_number` |
| **Bulk upload students** | Admin → Bulk Upload | `auth.users` + `users` + `students` | Same as above, per CSV row |
| **Activate / deactivate students** | Admin → Users | `users` | `update` `is_active` |

---

## 4. Institutional Analytics Dashboard

| Metric | Source | Read-only |
|--------|--------|-----------|
| Total tests conducted | `tests` (count) | Yes |
| Course-wise performance | `attempts` + `tests` + `courses` | Yes |
| Department-wise performance | Aggregated from course performance | Yes |
| Pass/fail ratios | `attempts.score` vs threshold | Yes |
| Average scores per course | From `attempts` + `tests` | Yes |
| Test completion rates | `attempts.submitted_at` vs total | Yes |

- All analytics are **read-only** (select/count/aggregate). No writes.

---

## 5. Admin CANNOT (and does not)

- **Modify test questions** – No admin UI or routes for `questions` table.
- **Modify templates** – No admin UI or routes for `test_templates` table.
- **Modify scoring** – No admin UI to change scoring rules or `answers`/`attempts` marks.
- **Interfere in live tests** – No admin route for live monitoring; that is teacher-only.

Admin sidebar and routes only include: Dashboard, Departments, Courses, Academic Sessions, Teachers, Students, Users, Bulk Upload, Analytics.

---

## Summary

- All listed admin features are implemented and **saved in the DB** via Supabase client (`insert` / `update` / `delete` where applicable).
- Analytics only read from the DB.
- Admin has no access to questions, templates, scoring, or live tests.
