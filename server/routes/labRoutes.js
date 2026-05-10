import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

function parseIps(value) {
  if (Array.isArray(value)) return value.map((ip) => String(ip).trim()).filter(Boolean);
  return String(value || '')
    .split(/[\n,]+/)
    .map((ip) => ip.trim())
    .filter(Boolean);
}

router.get('/', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    let query = supabase
      .from('computer_labs')
      .select('*, computer_lab_ips(ip_address, sort_order)')
      .order('name', { ascending: true });

    if (req.user.role === 'teacher') {
      query = query.or(`created_by.eq.${req.user.id},created_by.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map((lab) => ({
      ...lab,
      ips: (lab.computer_lab_ips || [])
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((ip) => ip.ip_address),
    })));
  } catch (error) {
    console.error('[Labs] list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { name, description, ips } = req.body;
    const ipList = [...new Set(parseIps(ips))];
    if (!name?.trim()) return res.status(400).json({ error: 'Lab name is required.' });
    if (!ipList.length) return res.status(400).json({ error: 'At least one lab IP address is required.' });

    const { data: lab, error: labError } = await supabase
      .from('computer_labs')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (labError) throw labError;

    const rows = ipList.map((ip, index) => ({
      lab_id: lab.id,
      ip_address: ip,
      sort_order: index + 1,
    }));
    const { error: ipError } = await supabase.from('computer_lab_ips').insert(rows);
    if (ipError) throw ipError;

    res.status(201).json({ ...lab, ips: ipList });
  } catch (error) {
    console.error('[Labs] create error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/test/:testId/assignments', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('test_ip_assignments')
      .select('assigned_ip, student_id, users(name, email)')
      .eq('test_id', req.params.testId)
      .order('assigned_ip', { ascending: true });

    if (error) throw error;
    res.json({ assignments: data || [] });
  } catch (error) {
    console.error('[Labs] assignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
