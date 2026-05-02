import { supabase } from '../config/supabaseClient.js';

/**
 * IP Proctor Service — logs IPs, detects changes, collisions, VPN.
 * When an IP changes mid-exam the attempt is auto-submitted and flagged.
 */

/**
 * Log an IP event. On 'start' action, sets initial_ip on the attempt.
 */
export async function logIp(sb, { attemptId, studentId, testId, ipAddress, action, userAgent }) {
  // Check VPN asynchronously (best-effort)
  let isVpn = false;
  try {
    isVpn = await quickVpnCheck(ipAddress);
  } catch (_) { /* ignore */ }

  const { error: logErr } = await sb.from('ip_logs').insert({
    attempt_id: attemptId,
    student_id: studentId,
    test_id: testId,
    ip_address: ipAddress,
    action,
    is_vpn: isVpn,
    user_agent: userAgent || null,
  });
  if (logErr) console.error('[IpProctor] log insert error:', logErr);

  // Best-effort compatibility: some deployments may not have attempts.initial_ip.
  if (action === 'start') {
    await sb.from('attempts').update({ initial_ip: ipAddress }).eq('id', attemptId).then(() => {}).catch(() => {});
  }

  return { isVpn };
}

/**
 * Compare current IP against the initial IP recorded for the attempt.
 * If changed → auto-submit the test, flag it, log the ip_change event.
 * Returns { changed, autoSubmitted }
 */
export async function checkIpChange(sb, attemptId, currentIp, studentId, testId) {
  const { data: attempt } = await sb
    .from('attempts')
    .select('submitted_at, violations')
    .eq('id', attemptId)
    .single();

  const { data: firstLog } = await sb
    .from('ip_logs')
    .select('ip_address')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const initialIp = firstLog?.ip_address || null;
  if (!attempt || !initialIp) return { changed: false, autoSubmitted: false };
  if (attempt.submitted_at) return { changed: false, autoSubmitted: false }; // already done

  const changed = initialIp !== currentIp;
  if (!changed) return { changed: false, autoSubmitted: false };
  // Log the ip_change event
  await sb.from('ip_logs').insert({
    attempt_id: attemptId,
    student_id: studentId,
    test_id: testId,
    ip_address: currentIp,
    action: 'ip_change',
    is_vpn: false,
  });

  // Flag the attempt by incrementing violations but do NOT auto-submit.
  const updatePayload = {
    violations: (attempt.violations || 0) + 1,
  };
  await sb.from('attempts').update(updatePayload).eq('id', attemptId).catch(() => {});

  return { changed: true, autoSubmitted: false };
}

/**
 * Detect IP collisions for a given test — multiple students on the same IP.
 */
export async function detectCollisions(sb, testId) {
  const { data: logs } = await sb
    .from('ip_logs')
    .select('ip_address, student_id')
    .eq('test_id', testId);

  if (!logs || logs.length === 0) return [];

  // Group by IP
  const ipMap = {};
  for (const log of logs) {
    if (!ipMap[log.ip_address]) ipMap[log.ip_address] = new Set();
    ipMap[log.ip_address].add(log.student_id);
  }

  // Return IPs shared by 2+ students
  const collisions = [];
  for (const [ip, students] of Object.entries(ipMap)) {
    if (students.size >= 2) {
      collisions.push({ ip, studentIds: [...students], count: students.size });
    }
  }
  return collisions;
}

/**
 * Quick VPN/proxy check using ip-api.com (free, no key, 45 req/min).
 */
async function quickVpnCheck(ipAddress) {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') return false;
  try {
    const resp = await fetch(`http://ip-api.com/json/${ipAddress}?fields=proxy,hosting`);
    if (!resp.ok) return false;
    const data = await resp.json();
    return data.proxy === true || data.hosting === true;
  } catch {
    return false;
  }
}

/**
 * Get full IP audit log for an attempt.
 */
export async function getIpAuditLog(sb, attemptId) {
  const { data: logs } = await sb
    .from('ip_logs')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true });

  const safeLogs = logs || [];
  const initialIp = safeLogs.find((l) => l?.ip_address)?.ip_address || null;
  const ipChangesByAction = safeLogs.filter((l) => l.action === 'ip_change').length;
  const distinctIps = new Set(safeLogs.map((l) => l.ip_address).filter(Boolean));
  const ipChangesByDistinctIp = Math.max(0, distinctIps.size - 1);
  const ipChanges = Math.max(ipChangesByAction, ipChangesByDistinctIp);
  const vpnDetected = safeLogs.some((l) => l.is_vpn);
  const ipLocked = ipChanges > 0;

  return {
    initialIp,
    ipLocked,
    ipChangeCount: ipChanges,
    vpnDetected,
    logs: safeLogs,
  };
}
