/**
 * Prototype pattern: a single canonical "exam report" shape is defined once,
 * cloned, and filled with attempt data for both teacher dashboards and student result views.
 */

/** @typedef {'teacher' | 'student'} ReportAudience */

/** @returns {Record<string, unknown>} Canonical empty report (prototype). */
export function createEmptyExamReport() {
  return {
    version: 1,
    audience: 'teacher',
    test: {
      id: null,
      name: '',
      totalMarks: null,
      templateName: null,
    },
    student: {
      userId: null,
      displayName: '',
      email: '',
      enrollmentNumber: null,
    },
    attempt: {
      id: null,
      score: null,
      scorePercent: null,
      passed: null,
      passingPercentage: null,
      submittedAt: null,
      startedAt: null,
      violations: 0,
      inProgress: false,
    },
    stats: {
      totalQuestions: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracyPct: 0,
    },
    questions: [],
  };
}

/**
 * Deep-clone the empty structure (prototype) before filling with live data.
 * @param {ReturnType<typeof createEmptyExamReport>} [base]
 */
export function cloneExamReport(base = createEmptyExamReport()) {
  return JSON.parse(JSON.stringify(base));
}

function normLetter(opt) {
  if (opt == null || opt === '') return null;
  return String(opt).trim().toUpperCase().charAt(0);
}

/**
 * Build options list with letter + text for UI templates.
 */
function buildOptionRows(q) {
  const letters = ['A', 'B', 'C', 'D'];
  return letters
    .map((letter) => {
      const key = `option_${letter.toLowerCase()}`;
      const text = q?.[key];
      if (!text || String(text).trim() === '') return null;
      return { letter, text };
    })
    .filter(Boolean);
}

/**
 * @param {ReportAudience} audience
 * @param {object} params
 * @param {object} params.attempt — row from `attempts`
 * @param {object} params.test — row from `tests` (nested)
 * @param {object|null} params.template — row from `templates` (nested under test)
 * @param {object|null} params.user — row from `users` (student)
 * @param {string|null} params.enrollmentNumber
 * @param {Array<object>} params.answerRows — `answers` with nested `questions`
 */
export function buildExamReport(audience, { attempt, test, template, user, enrollmentNumber, answerRows }) {
  const report = cloneExamReport(createEmptyExamReport());
  report.audience = audience;

  report.test.id = test?.id ?? null;
  report.test.name = test?.name || template?.name || 'Assessment';
  report.test.totalMarks = test?.total_marks ?? null;
  report.test.templateName = template?.name ?? null;

  report.student.userId = user?.id ?? attempt?.student_id ?? null;
  report.student.displayName = user?.name || 'Student';
  report.student.email = user?.email || '';
  report.student.enrollmentNumber = enrollmentNumber ?? null;

  report.attempt.id = attempt?.id ?? null;
  report.attempt.score = attempt?.score ?? null;
  report.attempt.scorePercent =
    attempt?.score_percent != null ? Number(attempt.score_percent) : null;
  report.attempt.passed = typeof attempt?.passed === 'boolean' ? attempt.passed : null;
  report.attempt.passingPercentage =
    template?.passing_percentage != null ? Number(template.passing_percentage) : null;
  report.attempt.submittedAt = attempt?.submitted_at ?? null;
  report.attempt.startedAt = attempt?.started_at ?? null;
  report.attempt.violations = attempt?.violations ?? 0;
  report.attempt.inProgress = !attempt?.submitted_at;

  const sorted = [...(answerRows || [])].sort((a, b) => {
    const ta = a.answered_at ? new Date(a.answered_at).getTime() : 0;
    const tb = b.answered_at ? new Date(b.answered_at).getTime() : 0;
    return ta - tb;
  });

  let correct = 0;
  sorted.forEach((ans, index) => {
    const q = ans.questions;
    const correctLetter = normLetter(q?.correct_option);
    const selectedLetter = normLetter(ans.selected_option);
    const isCorrect =
      typeof ans.is_correct === 'boolean'
        ? ans.is_correct
        : selectedLetter != null && correctLetter != null && selectedLetter === correctLetter;

    if (isCorrect) correct += 1;

    report.questions.push({
      index: index + 1,
      answerId: ans.id,
      questionId: ans.question_id,
      questionText: q?.question_text || '',
      explanation: q?.explanation ?? null,
      options: buildOptionRows(q),
      correctOption: correctLetter,
      selectedOption: selectedLetter,
      isCorrect,
      marksAwarded: ans.marks_awarded ?? null,
      answeredAt: ans.answered_at ?? null,
    });
  });

  const n = report.questions.length;
  report.stats.totalQuestions = n;
  report.stats.correctCount = correct;
  report.stats.wrongCount = Math.max(0, n - correct);
  report.stats.accuracyPct = n > 0 ? Math.round((correct / n) * 100) : 0;

  return report;
}
