import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/students
 * Fetch all students with their user name and course name
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch students with their linked user
    const { data: students, error: studentsErr } = await supabase
      .from('students')
      .select('id, enrollment_number, course_id, user_id, users(name, email)');

    if (studentsErr) throw studentsErr;

    // 2. Fetch all courses in one query to avoid N+1
    const courseIds = [...new Set(students.map((s) => s.course_id).filter(Boolean))];
    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select('id, name')
      .in('id', courseIds);

    if (coursesErr) throw coursesErr;

    const courseMap = {};
    for (const c of courses ?? []) courseMap[c.id] = c.name;

    const mapped = students.map((s) => ({
      id:               s.id,
      userId:           s.user_id,
      name:             s.users?.name ?? 'Unknown Student',
      email:            s.users?.email ?? '',
      enrollmentNumber: s.enrollment_number,
      courseId:         s.course_id,
      courseName:       courseMap[s.course_id] ?? 'N/A',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('[GET /students] error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/students/results/:attemptId
 * Fetch attempt results — attempt summary + answers with question details
 */
router.get('/results/:attemptId', authenticateToken, async (req, res) => {
  const { attemptId } = req.params;

  if (!attemptId) {
    return res.status(400).json({ error: 'Attempt ID is required' });
  }

  try {
    // 1. Fetch attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('attempts')
      .select('id, test_id, score, submitted_at, started_at, violations, student_id')
      .eq('id', attemptId)
      .single();

    if (attemptErr) {
      if (attemptErr.code === 'PGRST116') {
        return res.status(404).json({ error: 'Attempt not found' });
      }
      throw attemptErr;
    }

    // 2. Fetch test name + template_id
    const { data: test, error: testErr } = await supabase
      .from('tests')
      .select('id, name, template_id')
      .eq('id', attempt.test_id)
      .single();

    if (testErr) throw testErr;

    // 3. Fetch show_results_immediately from template
    let showResultsImmediately = false;
    if (test?.template_id) {
      const { data: template } = await supabase
        .from('templates')
        .select('show_results_immediately')
        .eq('id', test.template_id)
        .single();
      showResultsImmediately = template?.show_results_immediately ?? false;
    }

    // 4. Fetch answers with joined question details (only if results visible)
    let answers = [];
    if (showResultsImmediately) {
      const { data: answerRows, error: answersErr } = await supabase
        .from('answers')
        .select(`
          id,
          attempt_id,
          question_id,
          selected_option,
          answered_at,
          is_correct,
          marks_awarded,
          questions (
            id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation
          )
        `)
        .eq('attempt_id', attemptId);

      if (answersErr) throw answersErr;

      // Map selected_option letter to full text for convenience
      answers = (answerRows ?? []).map((a) => {
        const q = a.questions;
        const optionMap = {
          A: q?.option_a,
          B: q?.option_b,
          C: q?.option_c,
          D: q?.option_d,
        };
        return {
          id:              a.id,
          question_id:     a.question_id,
          selected_option: a.selected_option,
          selected_text:   optionMap[a.selected_option?.toUpperCase()] ?? a.selected_option,
          correct_option:  q?.correct_option,
          correct_text:    optionMap[q?.correct_option?.toUpperCase()] ?? '',
          is_correct:      a.is_correct,
          marks_awarded:   a.marks_awarded,
          answered_at:     a.answered_at,
          question: q ? {
            id:            q.id,
            question_text: q.question_text,
            option_a:      q.option_a,
            option_b:      q.option_b,
            option_c:      q.option_c,
            option_d:      q.option_d,
            correct_option: q.correct_option,
            explanation:   q.explanation,
          } : null,
        };
      });
    }

    // 5. Compute derived stats
    const correctCount  = answers.filter((a) => a.is_correct === true).length;
    const totalMarks    = answers.reduce((sum, a) => sum + (Number(a.marks_awarded) || 0), 0);

    res.json({
      attempt: {
        id:           attempt.id,
        test_id:      attempt.test_id,
        test_name:    test?.name ?? 'Unknown Test',
        score:        attempt.score ?? totalMarks,
        submitted_at: attempt.submitted_at,
        started_at:   attempt.started_at,
        violations:   attempt.violations,
      },
      stats: {
        correct_count:  correctCount,
        wrong_count:    answers.length - correctCount,
        total_answered: answers.length,
      },
      show_results_immediately: showResultsImmediately,
      answers,
    });
  } catch (error) {
    console.error('[GET /students/results/:attemptId] error:', error);
    res.status(500).json({ error: error.message ?? 'Failed to fetch results' });
  }
});

export default router;