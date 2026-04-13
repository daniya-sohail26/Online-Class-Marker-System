import TestEvaluator from './TestEvaluator.js';
import { computePassResult } from './passFail.js';

/**
 * Loads an attempt, scores all answers (strategy from template), and persists:
 * - `answers.is_correct`, `answers.marks_awarded`
 * - `attempts.score`, `attempts.score_percent`, `attempts.passed`
 *
 * @returns {{ totalScore: number, evaluatedCount: number, passed: boolean, scorePercent: number } | { error: string }}
 */
export async function scoreAttemptById(supabase, attemptId) {
  const { data: attempt, error: attErr } = await supabase
    .from('attempts')
    .select('*, tests(created_by, template_id, templates(*))')
    .eq('id', attemptId)
    .single();

  if (attErr || !attempt) {
    return { error: attErr?.message || 'Attempt not found' };
  }

  const testRow = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;

  const { data: answers, error: ansErr } = await supabase
    .from('answers')
    .select('*, questions(correct_option)')
    .eq('attempt_id', attemptId);

  if (ansErr) {
    return { error: ansErr.message };
  }

  const { data: tqRows } = await supabase
    .from('test_questions')
    .select('question_id, marks')
    .eq('test_id', attempt.test_id);

  const marksByQ = Object.fromEntries((tqRows || []).map((r) => [r.question_id, r.marks]));

  const enriched = (answers || []).map((a) => ({
    ...a,
    test_questions: { marks: marksByQ[a.question_id] },
  }));

  const templateConfig = testRow?.templates || {};
  TestEvaluator.setStrategyByTemplate(templateConfig);
  const { totalScore, evaluatedAnswers } = TestEvaluator.evaluate(enriched, templateConfig);

  const { scorePercent, passed } = computePassResult(totalScore, testRow, templateConfig, marksByQ);

  await supabase
    .from('attempts')
    .update({
      score: totalScore,
      score_percent: scorePercent,
      passed,
    })
    .eq('id', attemptId);

  for (const ans of evaluatedAnswers) {
    await supabase
      .from('answers')
      .update({ is_correct: ans.is_correct, marks_awarded: ans.marks_awarded })
      .eq('id', ans.id);
  }

  return { totalScore, evaluatedCount: evaluatedAnswers.length, passed, scorePercent };
}
