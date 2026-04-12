import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { scoreAttemptById } from '../services/scoreAttemptService.js';

const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}

/**
 * POST /api/attempts/:attemptId/score
 * Recomputes and saves `is_correct` + `marks_awarded` on every answer row, and `attempts.score`.
 * Call when the student submits the test (or to re-score). Student must own the attempt, or teacher must own the test.
 */
router.post('/:attemptId/score', authenticateToken, async (req, res) => {
  const { attemptId } = req.params;
  if (!isUuid(attemptId)) {
    return res.status(400).json({ error: 'attemptId must be a valid UUID' });
  }

  try {
    const { data: attempt, error: aErr } = await supabase
      .from('attempts')
      .select('id, student_id, tests(created_by)')
      .eq('id', attemptId)
      .single();

    if (aErr || !attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
    const isOwner = attempt.student_id === req.user.id;
    const isTeacher = req.user.role === 'teacher' && test?.created_by === req.user.id;

    if (!isOwner && !isTeacher) {
      return res.status(403).json({ error: 'Not allowed to score this attempt' });
    }

    const result = await scoreAttemptById(supabase, attemptId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      score: result.totalScore,
      answersUpdated: result.evaluatedCount,
      passed: result.passed,
      scorePercent: result.scorePercent,
    });
  } catch (error) {
    console.error('score attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
