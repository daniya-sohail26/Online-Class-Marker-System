import { buildExamReport } from './ExamReportPrototype.js';

/**
 * Load attempt, test, template, student user, enrollment, and answers (with questions)
 * for building the shared exam report.
 */
export async function loadAttemptReportData(supabase, attemptId) {
  const { data: attempt, error: attErr } = await supabase
    .from('attempts')
    .select(
      `
      id,
      test_id,
      student_id,
      score,
      score_percent,
      passed,
      started_at,
      submitted_at,
      violations,
      tests (
        id,
        name,
        course_id,
        end_time,
        total_marks,
        template_id,
        created_by,
        templates (*)
      )
    `
    )
    .eq('id', attemptId)
    .single();

  if (attErr) throw attErr;
  if (!attempt) throw new Error('Attempt not found');

  const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
  const template = test?.templates ?? null;

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', attempt.student_id)
    .maybeSingle();

  if (userErr) throw userErr;

  let enrollmentNumber = null;
  if (test?.course_id && attempt.student_id) {
    const { data: stud } = await supabase
      .from('students')
      .select('enrollment_number')
      .eq('user_id', attempt.student_id)
      .eq('course_id', test.course_id)
      .maybeSingle();
    enrollmentNumber = stud?.enrollment_number ?? null;
  }

  const { data: answersRaw, error: ansErr } = await supabase
    .from('answers')
    .select(
      `
      id,
      question_id,
      selected_option,
      is_correct,
      marks_awarded,
      answered_at,
      questions (
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        explanation
      )
    `
    )
    .eq('attempt_id', attemptId);

  if (ansErr) throw ansErr;

  const answers = (answersRaw || []).sort((a, b) => {
    const ta = a.answered_at ? new Date(a.answered_at).getTime() : 0;
    const tb = b.answered_at ? new Date(b.answered_at).getTime() : 0;
    return ta - tb;
  });

  return { attempt, test, template, user, enrollmentNumber, answers };
}

export function assembleReport(audience, rows) {
  const { attempt, test, template, user, enrollmentNumber, answers } = rows;
  return buildExamReport(audience, {
    attempt,
    test,
    template,
    user,
    enrollmentNumber,
    answerRows: answers,
  });
}
