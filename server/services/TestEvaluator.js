// server/services/TestEvaluator.js
import {
  selectScoringStrategyForAttempt,
  createScoringStrategyByName,
  ScoringStrategy,
} from './ScoringStrategies.js';

/**
 * Context that holds the active ScoringStrategy (Strategy Pattern).
 * - setStrategyByTemplate(config) — picks Standard / Negative / WeightedSection from DB template
 * - setScoringStrategy(name | instance) — explicit strategy for tests or overrides
 */
class TestEvaluator {
  constructor() {
    this.strategy = null;
  }

  /** Runtime selection from template row (teachers configure marking rules in UI → DB). */
  setStrategyByTemplate(templateConfig) {
    this.strategy = selectScoringStrategyForAttempt(templateConfig || {});
    return this;
  }

  /**
   * Explicit strategy: 'standard' | 'negative' | 'weighted' | 'weighted_section'
   * Or pass a ScoringStrategy subclass instance.
   */
  setScoringStrategy(selection) {
    if (selection instanceof ScoringStrategy) {
      this.strategy = selection;
      return this;
    }
    if (typeof selection === 'string') {
      this.strategy = createScoringStrategyByName(selection);
      return this;
    }
    throw new Error('setScoringStrategy: expected strategy name string or ScoringStrategy instance');
  }

  evaluate(answers, templateConfig) {
    if (!this.strategy) {
      throw new Error('Scoring strategy not set — call setStrategyByTemplate() or setScoringStrategy()');
    }
    return this.strategy.calculate(answers, templateConfig);
  }
}

export default new TestEvaluator();
