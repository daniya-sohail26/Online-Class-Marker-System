import { createClient } from '@supabase/supabase-js';

function trimEnv(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Verifies the Supabase access token and loads `public.users` (authoritative app profile).
 * Prefers SUPABASE_SERVICE_ROLE_KEY (server only). If unset, falls back to the anon key + the
 * caller's JWT so routes still work when only VITE_SUPABASE_* exists in server/.env (requires RLS
 * to allow the signed-in user to read their users row).
 */
export async function authenticateToken(req, res, next) {
  const supabaseUrl = trimEnv(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  );
  const serviceKey = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const anonKey = trimEnv(
    process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
  );

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization required: Bearer <access_token>' });
  }

  if (!supabaseUrl) {
    return res.status(503).json({
      error:
        'Server auth is not configured. Set VITE_SUPABASE_URL or SUPABASE_URL in server/.env',
    });
  }

  if (!serviceKey && !anonKey) {
    return res.status(503).json({
      error:
        'Server auth is not configured. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in server/.env',
    });
  }

  let authUser;
  let authErr;

  if (serviceKey) {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const got = await supabaseAdmin.auth.getUser(token);
    authUser = got.data?.user;
    authErr = got.error;
  } else {
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const got = await supabaseAnon.auth.getUser(token);
    authUser = got.data?.user;
    authErr = got.error;
  }

  if (authErr || !authUser) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  let profile;
  let profErr;

  if (serviceKey) {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const got = await supabaseAdmin
      .from('users')
      .select('id, role, name, email')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    profile = got.data;
    profErr = got.error;
  } else {
    const supabaseAsUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const got = await supabaseAsUser
      .from('users')
      .select('id, role, name, email')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    profile = got.data;
    profErr = got.error;
  }

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
