import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { loadAttemptReportData, assembleReport } from '../services/attemptReportService.js';
import { scoreAttemptById } from '../services/scoreAttemptService.js';

const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}

/**
 * GET /api/teacher/evaluation
 * All attempts for tests created by this teacher — scores update as attempts are saved (poll or refresh).
 */
router.get('/evaluation', authenticateToken, requireRole('teacher'), async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select(
        `
        id,
        score,
        score_percent,
        passed,
        violations,
        submitted_at,
        started_at,
        student_id,
        tests!inner (
          id,
          name,
          course_id,
          created_by,
          total_marks
        )
      `
      )
      .eq('tests.created_by', userId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(400).json({ error: error.message });
    }

    const list = attempts || [];
    const userIds = [...new Set(list.map((a) => a.student_id).filter(Boolean))];
    const courseIds = [...new Set(list.map((a) => a.tests?.course_id).filter(Boolean))];

    let userMap = {};
    if (userIds.length) {
      const { data: users } = await supabase.from('users').select('id, name, email').in('id', userIds);
      userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
    }

    let enrollMap = {};
    if (courseIds.length && userIds.length) {
      const { data: studs } = await supabase
        .from('students')
        .select('user_id, course_id, enrollment_number')
        .in('course_id', courseIds)
        .in('user_id', userIds);
      enrollMap = Object.fromEntries(
        (studs || []).map((s) => [`${s.user_id}|${s.course_id}`, s.enrollment_number])
      );
    }

    const attemptIds = list.map((a) => a.id).filter(Boolean);
    let ipStatsMap = {};
    if (attemptIds.length) {
      const { data: ipLogs } = await supabase
        .from('ip_logs')
        .select('attempt_id, ip_address, action, is_vpn, created_at')
        .in('attempt_id', attemptIds)
        .order('created_at', { ascending: true });

      ipStatsMap = (ipLogs || []).reduce((acc, log) => {
        if (!acc[log.attempt_id]) {
          acc[log.attempt_id] = {
            ipChangeCount: 0,
            vpnDetected: false,
            lastIp: null,
          };
        }
        if (log.action === 'ip_change') {
          acc[log.attempt_id].ipChangeCount += 1;
        }
        if (log.is_vpn) {
          acc[log.attempt_id].vpnDetected = true;
        }
        if (log.ip_address) {
          acc[log.attempt_id].lastIp = log.ip_address;
        }
        return acc;
      }, {});
    }

    const formatted = list.map((att) => {
      const t = Array.isArray(att.tests) ? att.tests[0] : att.tests;
      const cid = t?.course_id;
      const su = userMap[att.student_id];
      const en = cid ? enrollMap[`${att.student_id}|${cid}`] : null;
      const ipStats = ipStatsMap[att.id] || { ipChangeCount: 0, vpnDetected: false, lastIp: null };
      return {
        attempt_id: att.id,
        test_name: t?.name || 'Untitled Test',
        student_name: su?.name || 'Student',
        enrollment_number: en ?? '—',
        total_score: att.score,
        score_percent: att.score_percent,
        passed: att.passed,
        submitted_at: att.submitted_at,
        started_at: att.started_at,
        violations: att.violations,
        in_progress: !att.submitted_at,
        initial_ip: ipStats.lastIp || null,
        last_ip: ipStats.lastIp,
        ip_change_count: ipStats.ipChangeCount,
        vpn_detected: ipStats.vpnDetected,
        ip_locked: ipStats.ipChangeCount > 0,
      };
    });

    res.json({ attempts: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/teacher/evaluation/:attemptId
 * Full report for drill-down (same prototype shape as student report, audience=teacher).
 */
router.get('/evaluation/:attemptId', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id;

  if (!isUuid(attemptId)) {
    return res.status(400).json({ error: 'attemptId must be a valid UUID' });
  }

  try {
    const rows = await loadAttemptReportData(supabase, attemptId);
    if (rows.test?.created_by !== userId) {
      return res.status(403).json({ error: 'Not allowed to view this attempt' });
    }
    const report = await assembleReport('teacher', rows, supabase);
    res.json({ report });
  } catch (error) {
    if (error?.code === 'PGRST116') {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    console.error('Fetch attempt details error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/evaluate-attempt', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { attemptId } = req.body;

  try {
    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('id, tests(created_by)')
      .eq('id', attemptId)
      .single();

    if (attErr) throw attErr;

    const testRow = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
    if (testRow?.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only evaluate attempts for your own tests' });
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
    res.status(500).json({ error: error.message });
  }
});

export default router;
