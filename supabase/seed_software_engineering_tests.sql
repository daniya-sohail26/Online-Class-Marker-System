-- Seed script for a Software Engineering course test set.
-- Run in the Supabase SQL editor.
--
-- What this creates:
-- - A Software Engineering course under Computer Science (if missing)
-- - One teacher assignment and one student enrollment (if matching users exist)
-- - Three published tests with different template behaviors:
--   1) Teacher review results
--   2) Immediate results
--   3) Timed + proctored behavior that can auto-advance/submit
--
-- Notes:
-- - If your database already has a teacher/student user, the script reuses the first row it finds.
-- - If you want a specific student to see these tests, make sure that student's students.course_id points to this course.

DO $$
DECLARE
  v_department_id uuid;
  v_course_id uuid;
  v_teacher_id uuid;
  v_student_id uuid;

  v_template_id uuid;
  v_test_id uuid;

  v_q1 uuid;
  v_q2 uuid;
  v_q3 uuid;

  v_seed_prefix text := 'SE-Seed';
BEGIN
  SELECT id INTO v_department_id
  FROM public.departments
  WHERE name = 'Computer Science'
  LIMIT 1;

  IF v_department_id IS NULL THEN
    INSERT INTO public.departments (name)
    VALUES ('Computer Science')
    RETURNING id INTO v_department_id;
  END IF;

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE name = 'Software Engineering'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (department_id, name, description)
    VALUES (v_department_id, 'Software Engineering', 'Seed course for exam portal testing')
    RETURNING id INTO v_course_id;
  END IF;

  SELECT id INTO v_teacher_id
  FROM public.users
  WHERE role = 'teacher'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'No teacher user found in public.users. Create a teacher first, then re-run this seed.';
  END IF;

  SELECT id INTO v_student_id
  FROM public.users
  WHERE role = 'student'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'No student user found in public.users. Create a student first, then re-run this seed.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.teachers
    WHERE user_id = v_teacher_id AND course_id = v_course_id
  ) THEN
    INSERT INTO public.teachers (user_id, course_id)
    VALUES (v_teacher_id, v_course_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.students
    WHERE user_id = v_student_id AND course_id = v_course_id
  ) THEN
    INSERT INTO public.students (user_id, course_id, enrollment_number)
    VALUES (
      v_student_id,
      v_course_id,
      'SE-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8)
    );
  END IF;

  -- Test 1: teacher-reviewed results
  SELECT id INTO v_template_id
  FROM public.templates
  WHERE course_id = v_course_id AND name = 'Software Engineering - Review Mode'
  LIMIT 1;

  IF v_template_id IS NULL THEN
    INSERT INTO public.templates (
      course_id, created_by, name, template_type, duration_minutes, total_questions,
      passing_percentage, marks_per_question, negative_marking_enabled, negative_marking_penalty,
      shuffle_questions, shuffle_options, allow_review, show_results_immediately,
      lock_section_navigation, max_attempts, strict_proctoring, prevent_tab_switch,
      has_sections, sections_config, is_active, created_at
    ) VALUES (
      v_course_id, v_teacher_id, 'Software Engineering - Review Mode', 'quiz', 20, 3,
      50, 1, false, 0,
      true, true, true, false,
      false, 2, false, false,
      false, '[]'::jsonb, true, now()
    ) RETURNING id INTO v_template_id;
  ELSE
    UPDATE public.templates
    SET duration_minutes = 20,
        total_questions = 3,
        passing_percentage = 50,
        marks_per_question = 1,
        negative_marking_enabled = false,
        negative_marking_penalty = 0,
        shuffle_questions = true,
        shuffle_options = true,
        allow_review = true,
        show_results_immediately = false,
        lock_section_navigation = false,
        max_attempts = 2,
        strict_proctoring = false,
        prevent_tab_switch = false,
        has_sections = false,
        sections_config = '[]'::jsonb,
        is_active = true
    WHERE id = v_template_id;
  END IF;

  SELECT id INTO v_test_id
  FROM public.tests
  WHERE course_id = v_course_id AND name = 'SE-Seed Test 1 - Requirements Review'
  LIMIT 1;

  IF v_test_id IS NULL THEN
    INSERT INTO public.tests (course_id, template_id, created_by, name, total_marks, is_published)
    VALUES (v_course_id, v_template_id, v_teacher_id, 'SE-Seed Test 1 - Requirements Review', 3, true)
    RETURNING id INTO v_test_id;
  ELSE
    UPDATE public.tests
    SET template_id = v_template_id,
        created_by = v_teacher_id,
        total_marks = 3,
        is_published = true
    WHERE id = v_test_id;
    DELETE FROM public.test_questions WHERE test_id = v_test_id;
  END IF;

  SELECT id INTO v_q1 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: A functional requirement is best described as:' LIMIT 1;
  IF v_q1 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: A functional requirement is best described as:',
      'How the system should behave',
      'How fast the system runs',
      'How many developers are assigned',
      'The budget for the project',
      'A', 'easy',
      'Functional requirements describe what the system must do.'
    ) RETURNING id INTO v_q1;
  END IF;

  SELECT id INTO v_q2 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: Which model is commonly used to visualize classes and relationships?' LIMIT 1;
  IF v_q2 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: Which model is commonly used to visualize classes and relationships?',
      'ER diagram',
      'UML class diagram',
      'Gantt chart',
      'Flowchart',
      'B', 'easy',
      'A UML class diagram shows classes and relationships in software design.'
    ) RETURNING id INTO v_q2;
  END IF;

  SELECT id INTO v_q3 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: Feasibility study mainly checks whether the project is:' LIMIT 1;
  IF v_q3 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: Feasibility study mainly checks whether the project is:',
      'Readable',
      'Possible and practical',
      'Fully tested',
      'Open source',
      'B', 'medium',
      'Feasibility analysis checks technical, operational, and economic practicality.'
    ) RETURNING id INTO v_q3;
  END IF;

  INSERT INTO public.test_questions (test_id, question_id, marks)
  VALUES
    (v_test_id, v_q1, 1),
    (v_test_id, v_q2, 1),
    (v_test_id, v_q3, 1)
  ON CONFLICT DO NOTHING;

  -- Test 2: immediate results
  SELECT id INTO v_template_id
  FROM public.templates
  WHERE course_id = v_course_id AND name = 'Software Engineering - Immediate Results'
  LIMIT 1;

  IF v_template_id IS NULL THEN
    INSERT INTO public.templates (
      course_id, created_by, name, template_type, duration_minutes, total_questions,
      passing_percentage, marks_per_question, negative_marking_enabled, negative_marking_penalty,
      shuffle_questions, shuffle_options, allow_review, show_results_immediately,
      lock_section_navigation, max_attempts, strict_proctoring, prevent_tab_switch,
      has_sections, sections_config, is_active, created_at
    ) VALUES (
      v_course_id, v_teacher_id, 'Software Engineering - Immediate Results', 'quiz', 20, 3,
      50, 1, false, 0,
      true, true, true, true,
      false, 2, false, false,
      false, '[]'::jsonb, true, now()
    ) RETURNING id INTO v_template_id;
  ELSE
    UPDATE public.templates
    SET duration_minutes = 20,
        total_questions = 3,
        passing_percentage = 50,
        marks_per_question = 1,
        negative_marking_enabled = false,
        negative_marking_penalty = 0,
        shuffle_questions = true,
        shuffle_options = true,
        allow_review = true,
        show_results_immediately = true,
        lock_section_navigation = false,
        max_attempts = 2,
        strict_proctoring = false,
        prevent_tab_switch = false,
        has_sections = false,
        sections_config = '[]'::jsonb,
        is_active = true
    WHERE id = v_template_id;
  END IF;

  SELECT id INTO v_test_id
  FROM public.tests
  WHERE course_id = v_course_id AND name = 'SE-Seed Test 2 - Design Immediate'
  LIMIT 1;

  IF v_test_id IS NULL THEN
    INSERT INTO public.tests (course_id, template_id, created_by, name, total_marks, is_published)
    VALUES (v_course_id, v_template_id, v_teacher_id, 'SE-Seed Test 2 - Design Immediate', 3, true)
    RETURNING id INTO v_test_id;
  ELSE
    UPDATE public.tests
    SET template_id = v_template_id,
        created_by = v_teacher_id,
        total_marks = 3,
        is_published = true
    WHERE id = v_test_id;
    DELETE FROM public.test_questions WHERE test_id = v_test_id;
  END IF;

  SELECT id INTO v_q1 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: In software design, cohesion should generally be:' LIMIT 1;
  IF v_q1 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: In software design, cohesion should generally be:',
      'Low',
      'High',
      'Unchanged',
      'Random',
      'B', 'easy',
      'High cohesion is preferred because related responsibilities stay together.'
    ) RETURNING id INTO v_q1;
  END IF;

  SELECT id INTO v_q2 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: Which principle helps reduce dependencies between modules?' LIMIT 1;
  IF v_q2 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: Which principle helps reduce dependencies between modules?',
      'Loose coupling',
      'Tight coupling',
      'Repeated code',
      'Hidden variables',
      'A', 'easy',
      'Loose coupling reduces ripple effects when a module changes.'
    ) RETURNING id INTO v_q2;
  END IF;

  SELECT id INTO v_q3 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: A UML sequence diagram primarily shows:' LIMIT 1;
  IF v_q3 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: A UML sequence diagram primarily shows:',
      'Database schema',
      'Message flow between objects over time',
      'Deployment servers',
      'Source code style',
      'B', 'medium',
      'Sequence diagrams show interactions and the order of messages over time.'
    ) RETURNING id INTO v_q3;
  END IF;

  INSERT INTO public.test_questions (test_id, question_id, marks)
  VALUES
    (v_test_id, v_q1, 1),
    (v_test_id, v_q2, 1),
    (v_test_id, v_q3, 1)
  ON CONFLICT DO NOTHING;

  -- Test 3: timed + proctored behavior
  SELECT id INTO v_template_id
  FROM public.templates
  WHERE course_id = v_course_id AND name = 'Software Engineering - Timed Proctoring'
  LIMIT 1;

  IF v_template_id IS NULL THEN
    INSERT INTO public.templates (
      course_id, created_by, name, template_type, duration_minutes, total_questions,
      passing_percentage, marks_per_question, negative_marking_enabled, negative_marking_penalty,
      shuffle_questions, shuffle_options, allow_review, show_results_immediately,
      lock_section_navigation, max_attempts, strict_proctoring, prevent_tab_switch,
      has_sections, sections_config, is_active, created_at, time_per_question
    ) VALUES (
      v_course_id, v_teacher_id, 'Software Engineering - Timed Proctoring', 'quiz', 15, 3,
      50, 1, false, 0,
      true, true, false, false,
      true, 1, true, true,
      false, '[]'::jsonb, true, now(), 1
    ) RETURNING id INTO v_template_id;
  ELSE
    UPDATE public.templates
    SET duration_minutes = 15,
        total_questions = 3,
        passing_percentage = 50,
        marks_per_question = 1,
        negative_marking_enabled = false,
        negative_marking_penalty = 0,
        shuffle_questions = true,
        shuffle_options = true,
        allow_review = false,
        show_results_immediately = false,
        lock_section_navigation = true,
        max_attempts = 1,
        strict_proctoring = true,
        prevent_tab_switch = true,
        has_sections = false,
        sections_config = '[]'::jsonb,
        is_active = true,
        time_per_question = 1
    WHERE id = v_template_id;
  END IF;

  SELECT id INTO v_test_id
  FROM public.tests
  WHERE course_id = v_course_id AND name = 'SE-Seed Test 3 - QA Timed'
  LIMIT 1;

  IF v_test_id IS NULL THEN
    INSERT INTO public.tests (course_id, template_id, created_by, name, total_marks, is_published)
    VALUES (v_course_id, v_template_id, v_teacher_id, 'SE-Seed Test 3 - QA Timed', 3, true)
    RETURNING id INTO v_test_id;
  ELSE
    UPDATE public.tests
    SET template_id = v_template_id,
        created_by = v_teacher_id,
        total_marks = 3,
        is_published = true
    WHERE id = v_test_id;
    DELETE FROM public.test_questions WHERE test_id = v_test_id;
  END IF;

  SELECT id INTO v_q1 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: Unit testing usually focuses on:' LIMIT 1;
  IF v_q1 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: Unit testing usually focuses on:',
      'One small piece of code at a time',
      'The entire production system only',
      'Only the database server',
      'User documentation formatting',
      'A', 'easy',
      'Unit tests validate the behavior of the smallest testable unit.'
    ) RETURNING id INTO v_q1;
  END IF;

  SELECT id INTO v_q2 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: Regression testing is performed to:' LIMIT 1;
  IF v_q2 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: Regression testing is performed to:',
      'Check if older features still work after changes',
      'Measure code style',
      'Create user accounts',
      'Rename files',
      'A', 'medium',
      'Regression testing ensures new changes did not break existing functionality.'
    ) RETURNING id INTO v_q2;
  END IF;

  SELECT id INTO v_q3 FROM public.questions WHERE course_id = v_course_id AND question_text = 'SE-Seed: Black-box testing evaluates the system from the perspective of:' LIMIT 1;
  IF v_q3 IS NULL THEN
    INSERT INTO public.questions (course_id, created_by, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
    VALUES (
      v_course_id, v_teacher_id,
      'SE-Seed: Black-box testing evaluates the system from the perspective of:',
      'The implementation code only',
      'The user and external behavior',
      'The compiler internals',
      'The database engine only',
      'B', 'easy',
      'Black-box testing focuses on inputs and outputs, not internal code structure.'
    ) RETURNING id INTO v_q3;
  END IF;

  INSERT INTO public.test_questions (test_id, question_id, marks)
  VALUES
    (v_test_id, v_q1, 1),
    (v_test_id, v_q2, 1),
    (v_test_id, v_q3, 1)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Software Engineering seed complete. Course ID = %, Teacher ID = %, Student ID = %', v_course_id, v_teacher_id, v_student_id;
END $$;
