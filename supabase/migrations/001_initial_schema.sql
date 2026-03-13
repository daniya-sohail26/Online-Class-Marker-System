-- Online Class Marker System - Initial Schema
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ACADEMIC SESSIONS
CREATE TABLE IF NOT EXISTS academic_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TEACHERS (user-course assignment)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- STUDENTS (user-course enrollment)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QUESTIONS (Question Bank)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic TEXT,
  image_url TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TEST TEMPLATES
CREATE TABLE IF NOT EXISTS test_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER,
  total_questions INTEGER,
  negative_marking NUMERIC DEFAULT 0,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  allow_review BOOLEAN DEFAULT true,
  time_per_question INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TESTS
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  template_id UUID REFERENCES test_templates(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_marks INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TEST QUESTIONS
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  marks NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ATTEMPTS
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score NUMERIC,
  violations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ANSWERS
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  marks_awarded NUMERIC,
  answered_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_course ON teachers(course_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_course ON questions(course_id);
CREATE INDEX IF NOT EXISTS idx_tests_course ON tests(course_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id);

-- Row Level Security (RLS) - enable for production
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Users: Admin needs full access to create teachers/students, activate/deactivate.
-- Allow all for now (Login may not use Supabase Auth yet). Tighten when auth is implemented.
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for departments" ON departments FOR ALL USING (true);
CREATE POLICY "Allow all for courses" ON courses FOR ALL USING (true);
CREATE POLICY "Allow all for teachers" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all for students" ON students FOR ALL USING (true);
