import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { loadAttemptReportData, assembleReport } from '../services/attemptReportService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}

/**
 * GET /api/reports/:attemptId
 * Exam report JSON for mobile apps and web — requires Supabase session token.
 * Students may only load their own attempt; teachers may load attempts for tests they created.
 */
router.get('/:attemptId', authenticateToken, async (req, res) => {
  const { attemptId } = req.params;
  if (!isUuid(attemptId)) {
    return res.status(400).json({
      error: 'attemptId must be a UUID (use the attempt id from the database, not a test slug).',
    });
  }
  try {
    const rows = await loadAttemptReportData(supabase, attemptId);
    const attempt = rows.attempt;
    const test = rows.test;

    const isOwnAttempt = attempt.student_id === req.user.id;
    const isTeacherOwner = req.user.role === 'teacher' && test?.created_by === req.user.id;

    if (!isOwnAttempt && !isTeacherOwner) {
      return res.status(403).json({ error: 'You are not allowed to view this report' });
    }

    const audience = isOwnAttempt ? 'student' : 'teacher';
    const report = assembleReport(audience, rows);

    if (audience === 'student') {
      const now = new Date();
      const testEnd = test?.end_time ? new Date(test.end_time) : null;
      const detailVisible = Boolean(testEnd && now >= testEnd);

      if (!detailVisible) {
        report.questions = [];
        report.meta = {
          ...(report.meta || {}),
          detailedResultsReleased: false,
          releaseAt: testEnd ? testEnd.toISOString() : null,
          message: 'Detailed report unlocks after the scheduled test end time.',
        };
      } else {
        report.meta = {
          ...(report.meta || {}),
          detailedResultsReleased: true,
          releaseAt: testEnd ? testEnd.toISOString() : null,
        };
      }
    }

    res.json({ report });
  } catch (error) {
    console.error('Report fetch error:', error);
    const msg = error?.message || 'Report not found';
    const code = error?.code === 'PGRST116' || msg.includes('not found') ? 404 : 500;
    res.status(code).json({ error: msg });
  }
});

export default router;
