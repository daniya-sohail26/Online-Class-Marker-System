/**
 * Supabase Edge Function: score an attempt, update answers (is_correct, marks_awarded),
 * attempts (score, score_percent, passed), using the same rules as the Node API.
 *
 * Deploy: `supabase functions deploy score-attempt`
 * Invoke: POST with JSON { "attempt_id": "<uuid>" } and Authorization: Bearer <user_jwt>
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normLetter(val: string | null | undefined): string | null {
  if (val == null || val === "") return null;
  return String(val).trim().toUpperCase().charAt(0);
}

function computePassResult(
  totalScore: number,
  testRow: Record<string, unknown> | null,
  templateConfig: Record<string, unknown> | null,
  marksByQ: Record<string, number>,
): { scorePercent: number; passed: boolean; maxMarks: number } {
  const sumQuestionMarks = Object.values(marksByQ).reduce((s, m) => s + Number(m ?? 0), 0);
  let maxMarks = Number(testRow?.total_marks);
  if (!Number.isFinite(maxMarks) || maxMarks <= 0) maxMarks = sumQuestionMarks;
  if (!maxMarks || maxMarks <= 0) maxMarks = 1;
  const rawPct = (Number(totalScore) / maxMarks) * 100;
  const scorePercent = Math.min(100, Math.max(0, Math.round(rawPct * 100) / 100));
  const passingPct =
    templateConfig?.passing_percentage != null && templateConfig.passing_percentage !== ""
      ? Number(templateConfig.passing_percentage)
      : 40;
  const passed = scorePercent >= passingPct;
  return { scorePercent, passed, maxMarks };
}

function sortAnswersForNegative(
  answers: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return [...answers].sort((a, b) => {
    const ta = a.answered_at ? new Date(String(a.answered_at)).getTime() : 0;
    const tb = b.answered_at ? new Date(String(b.answered_at)).getTime() : 0;
    if (ta !== tb) return ta - tb;
    const qa = String(a.question_id ?? "");
    const qb = String(b.question_id ?? "");
    return qa.localeCompare(qb);
  });
}

function evaluateAnswers(
  answers: Array<Record<string, unknown>>,
  templateConfig: Record<string, unknown>,
  marksByQ: Record<string, number>,
): { totalScore: number; evaluated: Array<{ id: string; is_correct: boolean; marks_awarded: number }> } {
  const neg = !!templateConfig.negative_marking_enabled;
  const penalty = Number(templateConfig.negative_marking_penalty || 0);
  const wrongThreshold = Math.max(
    1,
    Math.floor(Number(templateConfig.negative_marking_wrong_threshold ?? 3)) || 3,
  );
  const defaultMarks = Number(templateConfig.marks_per_question || 1);
  let totalScore = 0;
  const evaluated: Array<{ id: string; is_correct: boolean; marks_awarded: number }> = [];

  const list = neg ? sortAnswersForNegative(answers) : answers;
  let wrongOrdinal = 0;

  for (const ans of list) {
    const q = ans.questions as { correct_option?: string } | undefined;
    const attempted = ans.selected_option != null && String(ans.selected_option).trim() !== "";
    const correct = attempted &&
      normLetter(ans.selected_option as string) === normLetter(q?.correct_option);
    const marksAvail = Number(marksByQ[ans.question_id as string] ?? defaultMarks);
    let marks_awarded = 0;
    if (neg) {
      if (correct) marks_awarded = marksAvail;
      else if (!attempted) marks_awarded = -Math.abs(penalty);
      else {
        wrongOrdinal += 1;
        marks_awarded = wrongOrdinal >= wrongThreshold ? -Math.abs(penalty) : 0;
      }
    } else {
      marks_awarded = correct ? marksAvail : 0;
    }
    totalScore += marks_awarded;
    evaluated.push({
      id: ans.id as string,
      is_correct: correct,
      marks_awarded,
    });
  }
  if (neg) totalScore = Math.max(0, totalScore);
  return { totalScore, evaluated };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profErr } = await admin
      .from("users")
      .select("id, role")
      .eq("auth_id", authData.user.id)
      .maybeSingle();

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const attemptId = body.attempt_id as string;
    if (!attemptId || typeof attemptId !== "string") {
      return new Response(JSON.stringify({ error: "attempt_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: attempt, error: attErr } = await admin
      .from("attempts")
      .select("id, student_id, test_id, tests(created_by, total_marks, template_id, templates(*))")
      .eq("id", attemptId)
      .single();

    if (attErr || !attempt) {
      return new Response(JSON.stringify({ error: "Attempt not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const testRow = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
    const rawTpl = testRow?.templates;
    const templateConfig = (Array.isArray(rawTpl) ? rawTpl[0] : rawTpl) ?? {};

    const isOwner = attempt.student_id === profile.id;
    const isTeacher = profile.role === "teacher" && testRow?.created_by === profile.id;
    if (!isOwner && !isTeacher) {
      return new Response(JSON.stringify({ error: "Not allowed to score this attempt" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: answers, error: ansErr } = await admin
      .from("answers")
      .select("id, question_id, selected_option, answered_at, questions(correct_option)")
      .eq("attempt_id", attemptId);

    if (ansErr) {
      return new Response(JSON.stringify({ error: ansErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tqRows } = await admin
      .from("test_questions")
      .select("question_id, marks")
      .eq("test_id", attempt.test_id);

    const marksByQ = Object.fromEntries((tqRows ?? []).map((r: { question_id: string; marks: number }) => [
      r.question_id,
      r.marks,
    ]));

    const { totalScore, evaluated } = evaluateAnswers(answers ?? [], templateConfig, marksByQ);
    const { scorePercent, passed } = computePassResult(totalScore, testRow as Record<string, unknown>, templateConfig, marksByQ);

    await admin
      .from("attempts")
      .update({
        score: totalScore,
        score_percent: scorePercent,
        passed,
      })
      .eq("id", attemptId);

    for (const row of evaluated) {
      await admin
        .from("answers")
        .update({ is_correct: row.is_correct, marks_awarded: row.marks_awarded })
        .eq("id", row.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: totalScore,
        score_percent: scorePercent,
        passed,
        answers_updated: evaluated.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
