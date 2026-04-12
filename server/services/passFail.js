/**
 * Derive pass/fail from template passing_percentage and test max marks.
 * @param {number} totalScore
 * @param {object|null} testRow — `tests` row
 * @param {object|null} templateConfig — `templates` row
 * @param {Record<string, number>} marksByQ — question_id -> marks from test_questions
 */
export function computePassResult(totalScore, testRow, templateConfig, marksByQ) {
  const sumQuestionMarks = Object.values(marksByQ || {}).reduce((s, m) => s + Number(m ?? 0), 0);
  let maxMarks = Number(testRow?.total_marks);
  if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
    maxMarks = sumQuestionMarks;
  }
  if (!maxMarks || maxMarks <= 0) {
    maxMarks = 1;
  }

  const rawPct = (Number(totalScore) / maxMarks) * 100;
  const scorePercent = Math.min(100, Math.max(0, Math.round(rawPct * 100) / 100));

  const passingPct =
    templateConfig?.passing_percentage != null && templateConfig.passing_percentage !== ''
      ? Number(templateConfig.passing_percentage)
      : 40;

  const passed = scorePercent >= passingPct;

  return { scorePercent, passed, maxMarks };
}
