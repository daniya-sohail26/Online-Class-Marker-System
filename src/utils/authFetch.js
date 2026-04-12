import { supabase } from "../../server/config/supabaseClient";

/**
 * Browser fetch with Supabase access token — use for Express routes protected by `authenticateToken`.
 * React Native / Expo: call the same URL with `Authorization: Bearer <session.access_token>`.
 */
export async function authFetch(input, init = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
