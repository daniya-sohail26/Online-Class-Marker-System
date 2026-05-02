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

    if (isOwnAttempt) {
      const { data: scheduleRow } = await supabase
        .from('test_schedules')
        .select('availability_end')
        .eq('test_id', test?.id)
        .eq('is_active', true)
        .order('availability_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      const effectiveEnd = scheduleRow?.availability_end || test?.end_time || null;
      const hasEndedForEveryone = effectiveEnd ? new Date() >= new Date(effectiveEnd) : false;
      if (!hasEndedForEveryone) {
        return res.status(403).json({
          error: 'Detailed report is available only after the test end time for all students.',
        });
      }
    }

    const audience = isOwnAttempt ? 'student' : 'teacher';
    const report = await assembleReport(audience, rows, supabase);
    res.json({ report });
  } catch (error) {
    console.error('Report fetch error:', error);
    const msg = error?.message || 'Report not found';
    const code = error?.code === 'PGRST116' || msg.includes('not found') ? 404 : 500;
    res.status(code).json({ error: msg });
  }
});

// Debug: return computed effective end time used by the server for an attempt
router.get('/:attemptId/effective-end', authenticateToken, async (req, res) => {
  const { attemptId } = req.params;
  if (!isUuid(attemptId)) {
    return res.status(400).json({ error: 'attemptId must be a UUID' });
  }

  try {
    const rows = await loadAttemptReportData(supabase, attemptId);
    const attempt = rows.attempt;
    const test = rows.test;

    const isOwnAttempt = attempt.student_id === req.user.id;
    const isTeacherOwner = req.user.role === 'teacher' && test?.created_by === req.user.id;

    if (!isOwnAttempt && !isTeacherOwner) {
      return res.status(403).json({ error: 'You are not allowed to view this debug info' });
    }

    const { data: scheduleRow } = await supabase
      .from('test_schedules')
      .select('id, availability_start, availability_end, is_active')
      .eq('test_id', test?.id)
      .eq('is_active', true)
      .order('availability_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    const effectiveEnd = scheduleRow?.availability_end || test?.end_time || null;
    const serverNow = new Date();
    const hasEndedForEveryone = effectiveEnd ? serverNow >= new Date(effectiveEnd) : false;

    return res.json({
      attemptId,
      effectiveEndRaw: effectiveEnd,
      effectiveEndIso: effectiveEnd ? new Date(effectiveEnd).toISOString() : null,
      testEndTime: test?.end_time ?? null,
      serverNowIso: serverNow.toISOString(),
      hasEndedForEveryone,
      scheduleRow,
    });
  } catch (error) {
    console.error('Effective-end debug error:', error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
});

export default router;
