import { createClient } from '@supabase/supabase-js';

/**
 * Verifies the Supabase access token and loads `public.users` (authoritative app profile).
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server (never expose this to the client).
 *
 * Reads env inside the handler so values from server/.env are visible after index.js runs
 * dotenv.config (route modules load before those lines run).
 */
export async function authenticateToken(req, res, next) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({
      error: 'Server auth is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env',
    });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization required: Bearer <access_token>' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let authUser = null;
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    authUser = user;
  } catch (err) {
    console.error('Supabase auth request failed:', err);
    return res.status(503).json({ error: 'Auth service unreachable. Try again later.' });
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('users')
    .select('id, role, name, email')
    .eq('auth_id', authUser.id)
    .maybeSingle();

  if (profErr) {
    console.error('Profile load error:', profErr);
    return res.status(500).json({ error: 'Could not load user profile' });
  }

  if (!profile) {
    return res.status(403).json({
      error: 'No application profile found. Ask an admin to create your users row for this login.',
    });
  }

  req.user = {
    id: profile.id,
    authId: authUser.id,
    role: profile.role,
    email: profile.email,
    name: profile.name,
  };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
