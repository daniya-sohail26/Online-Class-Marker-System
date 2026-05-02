import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logIp, checkIpChange, detectCollisions, getIpAuditLog } from '../services/IpProctorService.js';

const router = express.Router();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '0.0.0.0';
}

/**
 * POST /api/proctor/log-ip
 * Called by the client on each test action (start, answer, submit, heartbeat).
 */
router.post('/log-ip', authenticateToken, async (req, res) => {
  try {
    const { attemptId, testId, action, clientIp } = req.body;
    if (!attemptId || !testId || !action) {
      return res.status(400).json({ error: 'attemptId, testId, and action are required' });
    }

    const requestIp = getClientIp(req);
    const ipAddress = (typeof clientIp === 'string' && clientIp.trim()) ? clientIp.trim() : requestIp;
    const userAgent = req.headers['user-agent'] || '';

    // Log the IP
    const { isVpn } = await logIp(supabase, {
      attemptId,
      studentId: req.user.id,
      testId,
      ipAddress,
      action,
      userAgent,
    });

    // Check for IP change (skip on 'start' — that sets the initial IP)
    let ipChangeResult = { changed: false, autoSubmitted: false };
    if (action !== 'start') {
      ipChangeResult = await checkIpChange(supabase, attemptId, ipAddress, req.user.id, testId);
    }

    res.json({
      success: true,
      ip: ipAddress,
      requestIp,
      isVpn,
      ipChanged: ipChangeResult.changed,
      autoSubmitted: ipChangeResult.autoSubmitted,
    });
  } catch (error) {
    console.error('[Proctor] log-ip error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/proctor/audit/:attemptId
 * Returns the IP audit trail for a given attempt (teacher-only).
 */
router.get('/audit/:attemptId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const audit = await getIpAuditLog(supabase, req.params.attemptId);
    res.json(audit);
  } catch (error) {
    console.error('[Proctor] audit error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/proctor/collisions/:testId
 * Returns collision report for a test (teacher-only).
 */
router.get('/collisions/:testId', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const collisions = await detectCollisions(supabase, req.params.testId);
    res.json({ collisions });
  } catch (error) {
    console.error('[Proctor] collisions error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
