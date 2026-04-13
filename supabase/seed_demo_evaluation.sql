-- Demo: one submitted attempt with answers so the owning teacher sees it on /evaluation
-- and both teacher and student can load the report API for that attempt UUID.
--
-- Before running:
--   1) Replace YOUR_TEACHER_EMAIL and YOUR_STUDENT_EMAIL with real public.users emails (with auth login).
--   2) Teacher must have a row in teachers for some course; student should be in students for that same course (recommended).
--   3) Backend: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in server/.env for JWT verification on /api/reports.
--
-- After seeding you should see the attempt on the teacher Evaluation dashboard (tests.created_by = teacher).
-- Student opens: /exam-results/<attempt_id_from_notice> (UUID from RAISE NOTICE or query attempts).

DO $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_course_id uuid;
  v_test_id uuid;
  v_q1 uuid;
  v_attempt_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_teacher_id FROM public.users WHERE email = 'YOUR_TEACHER_EMAIL' LIMIT 1;
  SELECT id INTO v_student_id FROM public.users WHERE email = 'YOUR_STUDENT_EMAIL' LIMIT 1;
  IF v_teacher_id IS NULL OR v_student_id IS NULL THEN
    RAISE EXCEPTION 'Replace YOUR_TEACHER_EMAIL and YOUR_STUDENT_EMAIL with real emails from public.users.';
  END IF;

  SELECT t.course_id INTO v_course_id
  FROM public.teachers t
  WHERE t.user_id = v_teacher_id
  LIMIT 1;
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Teacher has no teachers.course_id row; assign the teacher to a course first.';
  END IF;

  INSERT INTO public.questions (
    course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty
  ) VALUES (
    v_course_id, v_teacher_id,
    'Demo MCQ (seed)', 'Wrong A', 'Correct B', 'Wrong C', 'Wrong D',
    'B', 'easy'
  ) RETURNING id INTO v_q1;

  INSERT INTO public.tests (course_id, created_by, name, total_marks, is_published)
  VALUES (v_course_id, v_teacher_id, 'Demo seeded test', 10, true)
  RETURNING id INTO v_test_id;

  INSERT INTO public.test_questions (test_id, question_id, marks)
  VALUES (v_test_id, v_q1, 10);

  INSERT INTO public.attempts (
    id, test_id, student_id, started_at, submitted_at, score, score_percent, passed, violations
  ) VALUES (
    v_attempt_id, v_test_id, v_student_id,
    now() - interval '30 minutes',
    now(),
    10, 100, true, 0
  );

  INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct, marks_awarded, answered_at)
  VALUES (
    v_attempt_id, v_q1, 'B', true, 10, now()
  );

  RAISE NOTICE 'Seeded attempt_id = %', v_attempt_id;
END $$;
