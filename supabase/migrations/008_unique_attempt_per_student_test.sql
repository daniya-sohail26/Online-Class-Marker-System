-- Prevent duplicate attempts for the same student on the same test.
-- This makes the existing upsert(student_id, test_id) logic actually enforce one row.

ALTER TABLE attempts
  ADD CONSTRAINT attempts_student_test_unique UNIQUE (student_id, test_id);