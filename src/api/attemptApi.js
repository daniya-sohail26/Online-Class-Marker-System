import apiClient from "./apiClient.js";
import { supabase } from "../../server/config/supabaseClient";

/**
 * Recompute and persist answers + attempts (score, score_percent, passed).
 * Uses the Express API (same logic as the Edge Function).
 */
export async function scoreAttempt(attemptId) {
  const { data } = await apiClient.post(`/api/attempts/${attemptId}/score`);
  return data;
}

/**
 * Same scoring via Supabase Edge Function `score-attempt` (deploy with CLI).
 * Body: { attempt_id }. Updates score, score_percent, passed, and answer rows.
 */
export async function scoreAttemptEdge(attemptId) {
  const { data, error } = await supabase.functions.invoke("score-attempt", {
    body: { attempt_id: attemptId },
  });
  if (error) throw error;
  return data;
}
