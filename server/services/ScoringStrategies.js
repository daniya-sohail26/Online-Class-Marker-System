/**
 * Strategy Pattern — scoring & evaluation (backend).
 * Implementations: StandardScoringStrategy, NegativeMarkingStrategy, WeightedSectionScoringStrategy
 * Runtime: TestEvaluator.setStrategyByTemplate(config) or setScoringStrategy(name)
 */

export function normLetter(val) {
  if (val == null || val === '') return null;
  return String(val).trim().toUpperCase().charAt(0);
}

/**
 * Build question_id → marks for that question from section config (order-based or explicit ids).
 * @param {Array<object>} answers
 * @param {object} templateConfig
 * @returns {Record<string, number>|null} null = do not use section overrides
 */
export function buildSectionMarksMap(answers, templateConfig) {
  const raw = templateConfig?.sections_config ?? templateConfig?.sections;
  const sections = Array.isArray(raw?.sections) ? raw.sections : Array.isArray(raw) ? raw : null;

  if (!templateConfig?.has_sections || !sections?.length) {
    return null;
  }

  const map = {};
  const hasExplicitIds = sections.some((s) => (s.question_ids || s.questionIds)?.length);

  if (hasExplicitIds) {
    for (const sec of sections) {
      const m = Number(
        sec.marks ?? sec.marks_per_question ?? templateConfig.marks_per_question ?? 1,
      );
      for (const qid of sec.question_ids || sec.questionIds || []) {
        map[qid] = m;
      }
    }
    return Object.keys(map).length ? map : null;
  }

  const sorted = [...answers].sort((a, b) => {
    const ta = a.answered_at ? new Date(a.answered_at).getTime() : 0;
    const tb = b.answered_at ? new Date(b.answered_at).getTime() : 0;
    return ta - tb;
  });

  let idx = 0;
  for (const sec of sections) {
    const count = Number(sec.questionCount ?? sec.question_count ?? 0);
    const m = Number(
      sec.marks ?? sec.marks_per_question ?? templateConfig.marks_per_question ?? 1,
    );
    for (let k = 0; k < count && idx < sorted.length; k++, idx++) {
      map[sorted[idx].question_id] = m;
    }
  }

  return Object.keys(map).length ? map : null;
}

/**
 * Core MCQ evaluation: optional per-question marks (section map), optional negative penalty.
 */
export function computeEvaluatedAnswers(answers, templateConfig, sectionMarksMap, negative) {
  const penalty = Number(templateConfig?.negative_marking_penalty ?? 0);
  let totalScore = 0;

  const evaluatedAnswers = (answers || []).map((ans) => {
    const correct =
      normLetter(ans.selected_option) != null &&
      normLetter(ans.selected_option) === normLetter(ans.questions?.correct_option);

    let marksAvailable = sectionMarksMap?.[ans.question_id];
    if (marksAvailable == null || marksAvailable === undefined) {
      marksAvailable = ans.test_questions?.marks ?? templateConfig?.marks_per_question ?? 1;
    }
    marksAvailable = Number(marksAvailable);

    let marksAwarded = 0;
    if (negative) {
      if (correct) {
        marksAwarded = marksAvailable;
      } else if (ans.selected_option != null && String(ans.selected_option).trim() !== '') {
        marksAwarded = -Math.abs(penalty);
      }
    } else {
      marksAwarded = correct ? marksAvailable : 0;
    }

    totalScore += marksAwarded;
    return { ...ans, is_correct: correct, marks_awarded: marksAwarded };
  });

  if (negative) {
    totalScore = Math.max(0, totalScore);
  }

  return { totalScore, evaluatedAnswers };
}

export class ScoringStrategy {
  calculate(_answers, _templateConfig) {
    throw new Error('calculate() must be implemented by subclass');
  }
}

/** Full marks for correct, zero for wrong; uses test_questions / template marks_per_question. */
export class StandardScoringStrategy extends ScoringStrategy {
  calculate(answers, templateConfig) {
    return computeEvaluatedAnswers(answers, templateConfig, null, false);
  }
}

/** Correct → full marks; wrong non-empty selection → custom penalty (template.negative_marking_penalty). */
export class NegativeMarkingStrategy extends ScoringStrategy {
  calculate(answers, templateConfig) {
    return computeEvaluatedAnswers(answers, templateConfig, null, true);
  }
}

/**
 * Section-based marks: sections_config + has_sections.
 * Each section can set marks per question (explicit question_ids OR order + questionCount).
 * If negative_marking_enabled, applies the same penalty as NegativeMarkingStrategy for wrong answers.
 */
export class WeightedSectionScoringStrategy extends ScoringStrategy {
  calculate(answers, templateConfig) {
    const sectionMap = buildSectionMarksMap(answers, templateConfig);
    const negative = !!templateConfig?.negative_marking_enabled;
    return computeEvaluatedAnswers(answers, templateConfig, sectionMap, negative);
  }
}

/**
 * Pick strategy from DB template at runtime (no if (negative) scattered in routes).
 * - has_sections → WeightedSectionScoringStrategy (section marks + optional negative penalty)
 * - else negative_marking_enabled → NegativeMarkingStrategy
 * - else → StandardScoringStrategy
 *
 * @param {object} templateConfig — row from `templates` (snake_case fields)
 */
export function selectScoringStrategyForAttempt(templateConfig) {
  const tpl = templateConfig || {};
  if (tpl.has_sections) {
    return new WeightedSectionScoringStrategy();
  }
  if (tpl.negative_marking_enabled) {
    return new NegativeMarkingStrategy();
  }
  return new StandardScoringStrategy();
}

const NAMED = {
  standard: () => new StandardScoringStrategy(),
  negative: () => new NegativeMarkingStrategy(),
  weighted: () => new WeightedSectionScoringStrategy(),
  weighted_section: () => new WeightedSectionScoringStrategy(),
};

/**
 * Explicit runtime selection: testEvaluator.setScoringStrategy('negative')
 * For weighted sections, prefer setStrategyByTemplate (needs has_sections + sections_config).
 */
export function createScoringStrategyByName(name) {
  const key = String(name || '')
    .toLowerCase()
    .replace(/-/g, '_');
  const factory = NAMED[key];
  if (!factory) {
    throw new Error(`Unknown scoring strategy: ${name}. Use: standard, negative, weighted`);
  }
  return factory();
}
