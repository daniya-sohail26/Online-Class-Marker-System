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
      .select('id, test_id, score, score_percent, passed, submitted_at, started_at, violations, student_id')
      .eq('id', attemptId)
      .single();

    if (attemptErr) {
      if (attemptErr.code === 'PGRST116') {
        return res.status(404).json({ error: 'Attempt not found' });
      }
      throw attemptErr;
    }

    // 2. Fetch test context
    const { data: test, error: testErr } = await supabase
      .from('tests')
      .select('id, name, template_id, end_time, total_marks')
      .eq('id', attempt.test_id)
      .single();

    if (testErr) throw testErr;

    // 2b. Load passing criteria for robust pass/fail fallback when legacy attempts have null `passed`.
    let passingPercentage = 40;
    if (test?.template_id) {
      const { data: templateCfg } = await supabase
        .from('templates')
        .select('passing_percentage')
        .eq('id', test.template_id)
        .maybeSingle();
      if (templateCfg?.passing_percentage != null && templateCfg.passing_percentage !== '') {
        passingPercentage = Number(templateCfg.passing_percentage);
      }
    }

    // 3. Derive authoritative max marks from linked questions (fallback to tests.total_marks)
    let maxScore = Number(test?.total_marks ?? 0);
    const { data: tqRows } = await supabase
      .from('test_questions')
      .select('marks')
      .eq('test_id', attempt.test_id);
    const summedMarks = (tqRows ?? []).reduce((sum, row) => sum + Number(row?.marks ?? 0), 0);
    if (Number.isFinite(summedMarks) && summedMarks > 0) {
      maxScore = summedMarks;
    }

    // 4. Resolve authoritative test end time from active schedule, fallback to tests.end_time.
    const { data: activeSchedule } = await supabase
      .from('test_schedules')
      .select('availability_start, availability_end')
      .eq('test_id', attempt.test_id)
      .eq('is_active', true)
      .order('availability_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    const scheduleEnd = activeSchedule?.availability_end || null;
    const effectiveEndRaw = scheduleEnd || test?.end_time || null;
    const effectiveEnd = effectiveEndRaw ? new Date(effectiveEndRaw) : null;
    const hasValidEnd = Boolean(effectiveEnd && !Number.isNaN(effectiveEnd.getTime()));

    // 5. Release full details only after effective end. Early submit remains score-only.
    const now = new Date();
    const detailsReleased = Boolean(hasValidEnd && now >= effectiveEnd);

    // 6. Fetch answers with joined question details only when details are released
    let answers = [];
    if (detailsReleased) {
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

    // 7. Compute derived stats
    const correctCount  = answers.filter((a) => a.is_correct === true).length;
    const totalMarks    = answers.reduce((sum, a) => sum + (Number(a.marks_awarded) || 0), 0);

    const scoreValue = Number(attempt.score ?? totalMarks ?? 0);
    const persistedPercent = Number(attempt.score_percent);
    const derivedPercent = maxScore > 0 ? (scoreValue / maxScore) * 100 : 0;
    const effectivePercent = Number.isFinite(persistedPercent) ? persistedPercent : derivedPercent;

    const resolvedPassed =
      typeof attempt.passed === 'boolean'
        ? attempt.passed
        : Number.isFinite(effectivePercent) && effectivePercent >= passingPercentage;

    res.json({
      attempt: {
        id:           attempt.id,
        test_id:      attempt.test_id,
        test_name:    test?.name ?? 'Unknown Test',
        score:        scoreValue,
        score_percent: Number.isFinite(effectivePercent) ? Math.round(effectivePercent * 100) / 100 : null,
        passed:       resolvedPassed,
        max_score:    maxScore,
        submitted_at: attempt.submitted_at,
        started_at:   attempt.started_at,
        violations:   attempt.violations,
      },
      stats: {
        correct_count:  correctCount,
        wrong_count:    answers.length - correctCount,
        total_answered: answers.length,
      },
      detailed_results_released: detailsReleased,
      results_release_at: hasValidEnd ? effectiveEnd.toISOString() : null,
      answers,
    });
  } catch (error) {
    console.error('[GET /students/results/:attemptId] error:', error);
    res.status(500).json({ error: error.message ?? 'Failed to fetch results' });
  }
});

export default router;